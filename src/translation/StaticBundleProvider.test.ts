import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { StaticBundleProvider } from './StaticBundleProvider';
import type { LocaleBundle } from './StaticBundleProvider';

describe('StaticBundleProvider', () => {
  const deBundle: LocaleBundle = {
    'Add to basket': 'In den Warenkorb',
    'Save {{fee}} on delivery': 'Sparen Sie {{fee}} bei der Lieferung',
    'Your order': 'Ihre Bestellung',
  };

  const esBundle: LocaleBundle = {
    'Add to basket': 'Añadir a la cesta',
  };

  let provider: StaticBundleProvider;

  beforeEach(() => {
    provider = new StaticBundleProvider({ de: deBundle, es: esBundle });
  });

  it('returns translations for present keys', async () => {
    const result = await provider.translate(
      ['Add to basket', 'Your order'],
      'de',
    );
    expect(result).toEqual(['In den Warenkorb', 'Ihre Bestellung']);
  });

  it('returns null for missing keys', async () => {
    const result = await provider.translate(
      ['Add to basket', 'Unknown string'],
      'de',
    );
    expect(result).toEqual(['In den Warenkorb', null]);
  });

  it('returns null for all strings when locale has no bundle', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await provider.translate(
      ['Add to basket', 'Your order'],
      'fr',
    );
    expect(result).toEqual([null, null]);
    expect(warnSpy).toHaveBeenCalledWith(
      '[StaticBundleProvider] No bundle loaded for locale',
      expect.objectContaining({ targetLocale: 'fr' }),
    );
    warnSpy.mockRestore();
  });

  it('handles empty input array', async () => {
    const result = await provider.translate([], 'de');
    expect(result).toEqual([]);
  });

  it('handles empty bundle', async () => {
    const emptyProvider = new StaticBundleProvider({ de: {} });
    const result = await emptyProvider.translate(['Add to basket'], 'de');
    expect(result).toEqual([null]);
  });

  it('preserves placeholders in translated values', async () => {
    const result = await provider.translate(
      ['Save {{fee}} on delivery'],
      'de',
    );
    expect(result).toEqual(['Sparen Sie {{fee}} bei der Lieferung']);
  });

  it('has the correct provider name', () => {
    expect(provider.name).toBe('StaticBundle');
  });

  // ── Property-Based Test ──────────────────────────────────────────
  // Feature: translation-fallback-layer, Property 2: Static bundle lookup correctness
  // **Validates: Requirements 2.2, 2.4**
  describe('Property 2: Static bundle lookup correctness', () => {
    it('present keys return their value and absent keys return null', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a random locale bundle (non-empty keys and values)
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.string({ minLength: 1, maxLength: 100 }),
          ),
          // Generate an array of source texts (mix of present and absent keys)
          fc.array(fc.string({ minLength: 0, maxLength: 50 }), { minLength: 0, maxLength: 20 }),
          async (bundle, sourceTexts) => {
            const testProvider = new StaticBundleProvider({ testLocale: bundle });
            const result = await testProvider.translate(sourceTexts, 'testLocale');

            // Output length must equal input length
            expect(result.length).toBe(sourceTexts.length);

            // Each result must be the bundle value if key exists, null otherwise
            for (let i = 0; i < sourceTexts.length; i++) {
              const key = sourceTexts[i];
              if (key in bundle) {
                expect(result[i]).toBe(bundle[key]);
              } else {
                expect(result[i]).toBeNull();
              }
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('missing locale returns null for all strings', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await fc.assert(
        fc.asyncProperty(
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.string({ minLength: 1, maxLength: 100 }),
          ),
          fc.array(fc.string({ minLength: 0, maxLength: 50 }), { minLength: 1, maxLength: 20 }),
          async (bundle, sourceTexts) => {
            const testProvider = new StaticBundleProvider({ existingLocale: bundle });
            const result = await testProvider.translate(sourceTexts, 'nonExistentLocale');

            expect(result.length).toBe(sourceTexts.length);
            expect(result.every((r) => r === null)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );

      warnSpy.mockRestore();
    });
  });
});
