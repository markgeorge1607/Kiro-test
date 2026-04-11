import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { TranslationService } from './TranslationService';
import type { TranslationProvider } from './TranslationProvider';

/** Arbitrary for non-empty locale strings (excluding "en") */
const nonEnLocaleArb = fc.constantFrom('de', 'es', 'fr', 'nl');

/** Arbitrary for source text arrays (1–20 non-empty strings) */
const sourceTextsArb = fc.array(
  fc.string({ minLength: 1, maxLength: 100 }),
  { minLength: 1, maxLength: 20 },
);

/** Helper: create a mock TranslationProvider */
function mockProvider(
  name: string,
  translateFn: (texts: string[], locale: string) => Promise<(string | null)[]>,
): TranslationProvider {
  return { name, translate: vi.fn(translateFn) };
}

describe('TranslationService — Property-Based Tests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // Feature: translation-fallback-layer, Property 1: Output length invariant
  // **Validates: Requirements 1.3, 4.5, 9.4**
  it('Property 1: output length equals input length for any source texts and locale', async () => {
    await fc.assert(
      fc.asyncProperty(
        sourceTextsArb,
        fc.constantFrom('en', 'de', 'es', 'fr', 'nl'),
        async (sourceTexts, locale) => {
          // Provider that randomly resolves or returns null
          const provider = mockProvider('Random', async (texts) =>
            texts.map((_, i) => (i % 2 === 0 ? `translated-${i}` : null)),
          );
          const service = new TranslationService({ providers: [provider] });

          const result = await service.translateBatch({
            sourceTexts,
            targetLocale: locale,
          });

          expect(result.translations).toHaveLength(sourceTexts.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: translation-fallback-layer, Property 3: Provider chain cascading
  // **Validates: Requirements 4.3**
  it('Property 3: second provider receives exactly the null strings from first provider', async () => {
    await fc.assert(
      fc.asyncProperty(
        sourceTextsArb,
        nonEnLocaleArb,
        // Generate a boolean mask: true = first provider resolves, false = null
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        async (sourceTexts, locale, resolveMask) => {
          // Align mask length with sourceTexts
          const mask = sourceTexts.map((_, i) =>
            i < resolveMask.length ? resolveMask[i] : false,
          );

          const p1 = mockProvider('P1', async (texts) =>
            texts.map((t, i) => (mask[i] ? `p1:${t}` : null)),
          );

          const p2ReceivedTexts: string[] = [];
          const p2 = mockProvider('P2', async (texts) => {
            p2ReceivedTexts.push(...texts);
            return texts.map((t) => `p2:${t}`);
          });

          const service = new TranslationService({ providers: [p1, p2] });

          await service.translateBatch({ sourceTexts, targetLocale: locale });

          // P2 should receive exactly the strings where mask[i] === false
          const expectedP2Texts = sourceTexts.filter((_, i) => !mask[i]);

          // If all resolved by P1, P2 should not be called
          if (expectedP2Texts.length === 0) {
            expect(p2.translate).not.toHaveBeenCalled();
          } else {
            expect(p2ReceivedTexts).toEqual(expectedP2Texts);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: translation-fallback-layer, Property 4: Unresolved strings fall back to source text
  // **Validates: Requirements 4.4**
  it('Property 4: when all providers return null, output equals source texts', async () => {
    await fc.assert(
      fc.asyncProperty(
        sourceTextsArb,
        nonEnLocaleArb,
        async (sourceTexts, locale) => {
          const p1 = mockProvider('NullP1', async (texts) => texts.map(() => null));
          const p2 = mockProvider('NullP2', async (texts) => texts.map(() => null));
          const service = new TranslationService({ providers: [p1, p2] });

          const result = await service.translateBatch({
            sourceTexts,
            targetLocale: locale,
          });

          expect(result.translations).toEqual(sourceTexts);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: translation-fallback-layer, Property 6: Cache integration with provider chain
  // **Validates: Requirements 5.2, 5.4**
  it('Property 6: partially cached strings skip providers; newly resolved strings are cached', async () => {
    await fc.assert(
      fc.asyncProperty(
        sourceTextsArb,
        nonEnLocaleArb,
        async (sourceTexts, locale) => {
          // Deduplicate to avoid confusing cache behavior
          const uniqueTexts = [...new Set(sourceTexts)];
          if (uniqueTexts.length < 2) return; // Need at least 2 unique strings

          const provider = mockProvider('P1', async (texts) =>
            texts.map((t) => `translated:${t}`),
          );
          const service = new TranslationService({ providers: [provider] });

          // First call: translate first half to populate cache
          const firstHalf = uniqueTexts.slice(0, Math.ceil(uniqueTexts.length / 2));
          await service.translateBatch({
            sourceTexts: firstHalf,
            targetLocale: locale,
          });

          (provider.translate as ReturnType<typeof vi.fn>).mockClear();

          // Second call: translate all — first half should be cached
          const result = await service.translateBatch({
            sourceTexts: uniqueTexts,
            targetLocale: locale,
          });

          // All strings should be translated
          expect(result.translations).toHaveLength(uniqueTexts.length);
          for (let i = 0; i < uniqueTexts.length; i++) {
            expect(result.translations[i]).toBe(`translated:${uniqueTexts[i]}`);
          }

          // Provider should only receive the second half (uncached)
          const secondHalf = uniqueTexts.slice(Math.ceil(uniqueTexts.length / 2));
          if (secondHalf.length > 0) {
            expect(provider.translate).toHaveBeenCalledWith(secondHalf, locale);
          } else {
            expect(provider.translate).not.toHaveBeenCalled();
          }

          // Third call: everything should be cached now
          (provider.translate as ReturnType<typeof vi.fn>).mockClear();
          await service.translateBatch({
            sourceTexts: uniqueTexts,
            targetLocale: locale,
          });
          expect(provider.translate).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: translation-fallback-layer, Property 8: English locale pass-through
  // **Validates: Requirements 8.1, 8.2, 8.3**
  it('Property 8: for locale "en", output equals input, zero provider calls, zero cache writes', async () => {
    await fc.assert(
      fc.asyncProperty(sourceTextsArb, async (sourceTexts) => {
        const provider = mockProvider('P1', async (texts) =>
          texts.map((t) => `translated:${t}`),
        );
        const service = new TranslationService({ providers: [provider] });

        const result = await service.translateBatch({
          sourceTexts,
          targetLocale: 'en',
        });

        // Output equals input
        expect(result.translations).toEqual(sourceTexts);

        // Zero provider calls
        expect(provider.translate).not.toHaveBeenCalled();

        // Verify no cache writes by calling again with a non-en locale
        // and checking that provider IS called (nothing was cached from the en call)
        if (sourceTexts.length > 0) {
          await service.translateBatch({
            sourceTexts,
            targetLocale: 'de',
          });
          expect(provider.translate).toHaveBeenCalled();
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: translation-fallback-layer, Property 10: Provider error resilience
  // **Validates: Requirements 10.4**
  it('Property 10: when a provider throws, chain continues to next provider', async () => {
    await fc.assert(
      fc.asyncProperty(
        sourceTextsArb,
        nonEnLocaleArb,
        async (sourceTexts, locale) => {
          const brokenProvider = mockProvider('Broken', async () => {
            throw new Error('Provider failure');
          });
          const fallbackProvider = mockProvider('Fallback', async (texts) =>
            texts.map((t) => `fallback:${t}`),
          );
          const service = new TranslationService({
            providers: [brokenProvider, fallbackProvider],
          });

          // Should not throw
          const result = await service.translateBatch({
            sourceTexts,
            targetLocale: locale,
          });

          // Output length matches input
          expect(result.translations).toHaveLength(sourceTexts.length);

          // All strings resolved by fallback provider
          for (let i = 0; i < sourceTexts.length; i++) {
            expect(result.translations[i]).toBe(`fallback:${sourceTexts[i]}`);
          }

          // Fallback provider was called with all texts
          expect(fallbackProvider.translate).toHaveBeenCalledWith(sourceTexts, locale);
        },
      ),
      { numRuns: 100 },
    );
  });
});
