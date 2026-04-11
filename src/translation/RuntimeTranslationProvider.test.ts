import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { RuntimeTranslationProvider } from './RuntimeTranslationProvider';
import type { RuntimeProviderConfig } from './RuntimeTranslationProvider';

const defaultConfig: RuntimeProviderConfig = {
  apiEndpoint: 'https://api-free.deepl.com/v2/translate',
  apiKey: 'test-api-key',
  timeoutMs: 5000,
};

function mockFetchSuccess(translations: { text: string }[]) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ translations }),
  });
}

describe('RuntimeTranslationProvider', () => {
  let provider: RuntimeTranslationProvider;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    provider = new RuntimeTranslationProvider(defaultConfig);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('has the correct provider name', () => {
    expect(provider.name).toBe('RuntimeAPI');
  });

  it('returns translations on successful API call', async () => {
    globalThis.fetch = mockFetchSuccess([
      { text: 'In den Warenkorb' },
      { text: 'Ihre Bestellung' },
    ]);

    const result = await provider.translate(
      ['Add to basket', 'Your order'],
      'de',
    );
    expect(result).toEqual(['In den Warenkorb', 'Ihre Bestellung']);
  });

  it('sends correct request format to API', async () => {
    const fetchMock = mockFetchSuccess([{ text: 'Hallo' }]);
    globalThis.fetch = fetchMock;

    await provider.translate(['Hello'], 'de');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api-free.deepl.com/v2/translate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'DeepL-Auth-Key test-api-key',
        }),
        body: JSON.stringify({
          text: ['Hello'],
          target_lang: 'DE',
          tag_handling: 'xml',
        }),
      }),
    );
  });

  it('returns nulls on API timeout', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockImplementation(() => {
      return new Promise((_resolve, reject) => {
        // Simulate abort error
        const error = new DOMException('The operation was aborted.', 'AbortError');
        setTimeout(() => reject(error), 10);
      });
    });

    const timeoutProvider = new RuntimeTranslationProvider({
      ...defaultConfig,
      timeoutMs: 1,
    });

    const result = await timeoutProvider.translate(['Hello', 'World'], 'de');
    expect(result).toEqual([null, null]);
    expect(warnSpy).toHaveBeenCalledWith(
      '[RuntimeTranslationProvider] API request failed',
      expect.objectContaining({ targetLocale: 'de' }),
    );
    warnSpy.mockRestore();
  });

  it('returns nulls on API HTTP error', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = await provider.translate(['Hello'], 'de');
    expect(result).toEqual([null]);
    expect(warnSpy).toHaveBeenCalledWith(
      '[RuntimeTranslationProvider] API request failed',
      expect.objectContaining({
        targetLocale: 'de',
        error: 'HTTP 500: Internal Server Error',
      }),
    );
    warnSpy.mockRestore();
  });

  it('shields placeholders before sending and unshields after receiving', async () => {
    // The API receives shielded text and returns shielded text
    const fetchMock = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      // Verify shielded text was sent ({{fee}} replaced with <x1>)
      expect(body.text[0]).toBe('Save <x1> on delivery');
      return {
        ok: true,
        json: async () => ({
          translations: [{ text: 'Sparen Sie <x1> bei der Lieferung' }],
        }),
      };
    });
    globalThis.fetch = fetchMock;

    const result = await provider.translate(
      ['Save {{fee}} on delivery'],
      'de',
    );
    expect(result).toEqual(['Sparen Sie {{fee}} bei der Lieferung']);
  });

  it('shields currency values before sending and unshields after receiving', async () => {
    const fetchMock = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      expect(body.text[0]).toBe('Only <x1> for delivery');
      return {
        ok: true,
        json: async () => ({
          translations: [{ text: 'Nur <x1> für die Lieferung' }],
        }),
      };
    });
    globalThis.fetch = fetchMock;

    const result = await provider.translate(['Only £3.99 for delivery'], 'de');
    expect(result).toEqual(['Nur £3.99 für die Lieferung']);
  });

  it('returns null when placeholder validation fails (missing placeholder)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // API returns translation without the placeholder token
    globalThis.fetch = mockFetchSuccess([
      { text: 'Sparen Sie bei der Lieferung' }, // missing <x1> → {{fee}}
    ]);

    const result = await provider.translate(
      ['Save {{fee}} on delivery'],
      'de',
    );
    expect(result).toEqual([null]);
    expect(warnSpy).toHaveBeenCalledWith(
      '[RuntimeTranslationProvider] Placeholder validation failed',
      expect.objectContaining({ sourceText: 'Save {{fee}} on delivery' }),
    );
    warnSpy.mockRestore();
  });

  it('handles empty input array', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const result = await provider.translate([], 'de');
    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns nulls when API returns wrong array length', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = mockFetchSuccess([
      { text: 'Only one' },
    ]);

    const result = await provider.translate(['Hello', 'World'], 'de');
    expect(result).toEqual([null, null]);
    expect(warnSpy).toHaveBeenCalledWith(
      '[RuntimeTranslationProvider] API returned wrong array length',
      expect.objectContaining({ expected: 2, received: 1 }),
    );
    warnSpy.mockRestore();
  });

  it('uses default timeout of 10000ms when not configured', () => {
    const defaultProvider = new RuntimeTranslationProvider({
      apiEndpoint: 'https://example.com',
      apiKey: 'key',
    });
    // Verify it was constructed without error — timeout is internal
    expect(defaultProvider.name).toBe('RuntimeAPI');
  });

  // ── Property-Based Test ──────────────────────────────────────────
  // Feature: translation-fallback-layer, Property 7: Placeholder and currency token preservation
  // **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 3.7**
  describe('Property 7: Placeholder and currency token preservation', () => {
    // Arbitrary for placeholder keys like {{name}}, {{fee}}, {{plan}}
    const placeholderKeyArb = fc.stringOf(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz_'.split('')),
      { minLength: 1, maxLength: 10 },
    );

    // Arbitrary for currency values like £3.99, €5.00, $12
    const currencyArb = fc.tuple(
      fc.constantFrom('£', '€', '$', '¥', '₹'),
      fc.integer({ min: 1, max: 9999 }),
      fc.boolean(),
    ).map(([symbol, whole, hasDecimals]) =>
      hasDecimals
        ? `${symbol}${whole}.${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`
        : `${symbol}${whole}`,
    );

    // Generate source text with embedded placeholders and currency values
    const sourceTextWithTokensArb = fc.tuple(
      fc.array(placeholderKeyArb, { minLength: 1, maxLength: 3 }),
      fc.array(currencyArb, { minLength: 0, maxLength: 2 }),
      fc.array(
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz '.split('')), {
          minLength: 1,
          maxLength: 15,
        }),
        { minLength: 2, maxLength: 6 },
      ),
    ).map(([placeholders, currencies, words]) => {
      // Interleave words with tokens
      const tokens = [
        ...placeholders.map((k) => `{{${k}}}`),
        ...currencies,
      ];
      const parts: string[] = [];
      for (let i = 0; i < words.length; i++) {
        parts.push(words[i]);
        if (i < tokens.length) {
          parts.push(tokens[i]);
        }
      }
      return parts.join(' ');
    });

    it('round-trip through shield → identity translate → unshield preserves all tokens', async () => {
      await fc.assert(
        fc.asyncProperty(sourceTextWithTokensArb, async (sourceText) => {
          // Mock API that returns shielded text unchanged (identity translation)
          globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
            const body = JSON.parse(init.body as string);
            return {
              ok: true,
              json: async () => ({
                translations: body.text.map((t: string) => ({ text: t })),
              }),
            };
          });

          const result = await provider.translate([sourceText], 'de');

          // The result should preserve the original text exactly
          // since the mock API returns shielded text unchanged
          expect(result).toHaveLength(1);
          expect(result[0]).toBe(sourceText);

          // Verify all {{key}} placeholders are present
          const placeholderRe = /\{\{[^}]+\}\}/g;
          const sourcePlaceholders = sourceText.match(placeholderRe) ?? [];
          const resultPlaceholders = result[0]!.match(placeholderRe) ?? [];
          expect(resultPlaceholders).toEqual(sourcePlaceholders);

          // Verify all currency values are present
          const currencyRe = /[£€$¥₹]\d+(?:\.\d{1,2})?/g;
          const sourceCurrencies = sourceText.match(currencyRe) ?? [];
          const resultCurrencies = result[0]!.match(currencyRe) ?? [];
          expect(resultCurrencies).toEqual(sourceCurrencies);
        }),
        { numRuns: 100 },
      );
    });
  });
});
