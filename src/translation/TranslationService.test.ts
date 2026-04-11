import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TranslationService } from './TranslationService';
import type { TranslationProvider } from './TranslationProvider';

/** Helper: create a mock TranslationProvider with vi.fn() translate */
function mockProvider(
  name: string,
  translateFn: (texts: string[], locale: string) => Promise<(string | null)[]>,
): TranslationProvider {
  return { name, translate: vi.fn(translateFn) };
}

describe('TranslationService', () => {
  let consoleSpy: {
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  describe('cache checked before providers', () => {
    it('returns cached translations without calling providers', async () => {
      const provider = mockProvider('P1', async (texts) =>
        texts.map((t) => `translated:${t}`),
      );
      const service = new TranslationService({ providers: [provider] });

      // First call — populates cache
      await service.translateBatch({
        sourceTexts: ['Hello', 'World'],
        targetLocale: 'de',
      });

      // Reset mock call count
      (provider.translate as ReturnType<typeof vi.fn>).mockClear();

      // Second call — should use cache
      const result = await service.translateBatch({
        sourceTexts: ['Hello', 'World'],
        targetLocale: 'de',
      });

      expect(result.translations).toEqual(['translated:Hello', 'translated:World']);
      expect(provider.translate).not.toHaveBeenCalled();
    });

    it('calls providers only for uncached strings', async () => {
      const provider = mockProvider('P1', async (texts) =>
        texts.map((t) => `translated:${t}`),
      );
      const service = new TranslationService({ providers: [provider] });

      // First call — caches "Hello"
      await service.translateBatch({
        sourceTexts: ['Hello'],
        targetLocale: 'de',
      });

      (provider.translate as ReturnType<typeof vi.fn>).mockClear();

      // Second call — "Hello" cached, "World" not
      const result = await service.translateBatch({
        sourceTexts: ['Hello', 'World'],
        targetLocale: 'de',
      });

      expect(result.translations).toEqual(['translated:Hello', 'translated:World']);
      // Provider should only receive "World"
      expect(provider.translate).toHaveBeenCalledWith(['World'], 'de');
    });
  });

  describe('chain cascading', () => {
    it('forwards unresolved strings from first provider to second', async () => {
      const p1 = mockProvider('Static', async (texts) =>
        texts.map((t) => (t === 'Hello' ? 'Hallo' : null)),
      );
      const p2 = mockProvider('Runtime', async (texts) =>
        texts.map((t) => `runtime:${t}`),
      );
      const service = new TranslationService({ providers: [p1, p2] });

      const result = await service.translateBatch({
        sourceTexts: ['Hello', 'World'],
        targetLocale: 'de',
      });

      expect(result.translations).toEqual(['Hallo', 'runtime:World']);
      // P2 should only receive "World" (the unresolved string)
      expect(p2.translate).toHaveBeenCalledWith(['World'], 'de');
    });

    it('does not call second provider when first resolves everything', async () => {
      const p1 = mockProvider('Static', async (texts) =>
        texts.map((t) => `static:${t}`),
      );
      const p2 = mockProvider('Runtime', async (texts) =>
        texts.map((t) => `runtime:${t}`),
      );
      const service = new TranslationService({ providers: [p1, p2] });

      await service.translateBatch({
        sourceTexts: ['Hello'],
        targetLocale: 'de',
      });

      expect(p2.translate).not.toHaveBeenCalled();
    });
  });

  describe('fallback to source text', () => {
    it('returns source text when all providers return null', async () => {
      const p1 = mockProvider('P1', async (texts) => texts.map(() => null));
      const p2 = mockProvider('P2', async (texts) => texts.map(() => null));
      const service = new TranslationService({ providers: [p1, p2] });

      const result = await service.translateBatch({
        sourceTexts: ['Hello', 'World'],
        targetLocale: 'de',
      });

      expect(result.translations).toEqual(['Hello', 'World']);
    });

    it('returns source text when no providers are configured', async () => {
      const service = new TranslationService({ providers: [] });

      const result = await service.translateBatch({
        sourceTexts: ['Hello'],
        targetLocale: 'de',
      });

      expect(result.translations).toEqual(['Hello']);
    });
  });

  describe('English locale pass-through', () => {
    it('returns source texts unchanged for locale "en"', async () => {
      const provider = mockProvider('P1', async (texts) =>
        texts.map((t) => `translated:${t}`),
      );
      const service = new TranslationService({ providers: [provider] });

      const result = await service.translateBatch({
        sourceTexts: ['Hello', 'World'],
        targetLocale: 'en',
      });

      expect(result.translations).toEqual(['Hello', 'World']);
      expect(provider.translate).not.toHaveBeenCalled();
    });
  });

  describe('provider error caught and chain continues', () => {
    it('catches provider error and continues to next provider', async () => {
      const p1 = mockProvider('Broken', async () => {
        throw new Error('Provider exploded');
      });
      const p2 = mockProvider('Fallback', async (texts) =>
        texts.map((t) => `fallback:${t}`),
      );
      const service = new TranslationService({ providers: [p1, p2] });

      const result = await service.translateBatch({
        sourceTexts: ['Hello'],
        targetLocale: 'de',
      });

      expect(result.translations).toEqual(['fallback:Hello']);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[TranslationService] Provider threw an error — skipping',
        expect.objectContaining({ provider: 'Broken' }),
      );
    });

    it('falls back to source text when all providers throw', async () => {
      const p1 = mockProvider('Broken1', async () => {
        throw new Error('fail1');
      });
      const p2 = mockProvider('Broken2', async () => {
        throw new Error('fail2');
      });
      const service = new TranslationService({ providers: [p1, p2] });

      const result = await service.translateBatch({
        sourceTexts: ['Hello'],
        targetLocale: 'de',
      });

      expect(result.translations).toEqual(['Hello']);
    });
  });

  describe('clearCache', () => {
    it('clears cached translations so providers are called again', async () => {
      const provider = mockProvider('P1', async (texts) =>
        texts.map((t) => `translated:${t}`),
      );
      const service = new TranslationService({ providers: [provider] });

      await service.translateBatch({
        sourceTexts: ['Hello'],
        targetLocale: 'de',
      });

      (provider.translate as ReturnType<typeof vi.fn>).mockClear();

      service.clearCache();

      await service.translateBatch({
        sourceTexts: ['Hello'],
        targetLocale: 'de',
      });

      // Provider should be called again after cache clear
      expect(provider.translate).toHaveBeenCalledWith(['Hello'], 'de');
    });
  });

  describe('logging output', () => {
    it('logs summary after translateBatch with cache hits and provider results', async () => {
      const provider = mockProvider('Static', async (texts) =>
        texts.map((t) => `s:${t}`),
      );
      const service = new TranslationService({ providers: [provider] });

      await service.translateBatch({
        sourceTexts: ['Hello', 'World'],
        targetLocale: 'de',
      });

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[TranslationService] translateBatch summary',
        expect.objectContaining({
          targetLocale: 'de',
          totalRequested: 2,
          cacheHits: 0,
          providerResults: { Static: 2 },
          fallbacks: 0,
        }),
      );
    });

    it('logs summary with cache hits on second call', async () => {
      const provider = mockProvider('P1', async (texts) =>
        texts.map((t) => `t:${t}`),
      );
      const service = new TranslationService({ providers: [provider] });

      await service.translateBatch({
        sourceTexts: ['Hello'],
        targetLocale: 'de',
      });

      consoleSpy.info.mockClear();

      await service.translateBatch({
        sourceTexts: ['Hello'],
        targetLocale: 'de',
      });

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[TranslationService] translateBatch summary',
        expect.objectContaining({
          cacheHits: 1,
          providerResults: {},
          fallbacks: 0,
        }),
      );
    });

    it('logs warning when providers return nulls', async () => {
      const provider = mockProvider('P1', async (texts) => texts.map(() => null));
      const service = new TranslationService({ providers: [provider] });

      await service.translateBatch({
        sourceTexts: ['Hello'],
        targetLocale: 'de',
      });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[TranslationService] Some strings fell back to source text',
        expect.objectContaining({ fallbackCount: 1 }),
      );
    });

    it('logs error when provider throws', async () => {
      const provider = mockProvider('Broken', async () => {
        throw new Error('boom');
      });
      const service = new TranslationService({ providers: [provider] });

      await service.translateBatch({
        sourceTexts: ['Hello'],
        targetLocale: 'de',
      });

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[TranslationService] Provider threw an error — skipping',
        expect.objectContaining({
          provider: 'Broken',
          error: 'boom',
        }),
      );
    });
  });

  describe('output length', () => {
    it('always returns same length as input', async () => {
      const provider = mockProvider('P1', async (texts) =>
        texts.map((_, i) => (i % 2 === 0 ? 'translated' : null)),
      );
      const service = new TranslationService({ providers: [provider] });

      const result = await service.translateBatch({
        sourceTexts: ['a', 'b', 'c', 'd', 'e'],
        targetLocale: 'de',
      });

      expect(result.translations).toHaveLength(5);
    });

    it('returns empty array for empty input', async () => {
      const service = new TranslationService({ providers: [] });

      const result = await service.translateBatch({
        sourceTexts: [],
        targetLocale: 'de',
      });

      expect(result.translations).toEqual([]);
    });
  });
});
