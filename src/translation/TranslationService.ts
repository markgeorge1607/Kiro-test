/**
 * TranslationService — orchestrates Gemini API translation with caching
 * and placeholder shielding.
 *
 * Framework-agnostic — no React or DOM dependencies.
 */

import { TranslationCache } from './TranslationCache';
import { shield, unshield, validatePlaceholders, extractPlaceholders } from './PlaceholderShielder';
import type { TranslationRequest, TranslationResponse } from '../types';

export interface TranslationServiceConfig {
  apiKey: string;
  timeoutMs?: number;   // default: 10000
  modelName?: string;   // default: 'gemini-2.5-flash'
}

export class TranslationService {
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly modelName: string;
  private readonly cache: TranslationCache;

  constructor(config: TranslationServiceConfig) {
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.modelName = config.modelName ?? 'gemini-2.5-flash';
    this.cache = new TranslationCache();

    if (!this.apiKey) {
      console.error('[TranslationService] API key is empty — all translateBatch calls will return source texts unchanged.', {
        timeoutMs: this.timeoutMs,
        modelName: this.modelName,
      });
    }
  }

  /**
   * Translates a batch of source texts to the target locale.
   *
   * - Returns source texts unchanged when locale is "en" or API key is empty
   * - Checks cache first; only sends uncached strings to Gemini
   * - Shields placeholders and currency values before API call
   * - Validates placeholder preservation on response
   * - Falls back to source text on any failure
   */
  async translateBatch(request: TranslationRequest): Promise<TranslationResponse> {
    const { sourceTexts, targetLocale } = request;

    // 1. If target is English or API key is empty, return source texts unchanged
    if (targetLocale === 'en' || !this.apiKey) {
      return { translations: [...sourceTexts] };
    }

    // 2. Check cache for each source text; separate hits from misses
    const translations: string[] = new Array(sourceTexts.length);
    const uncachedIndices: number[] = [];

    for (let i = 0; i < sourceTexts.length; i++) {
      const cached = this.cache.get(targetLocale, sourceTexts[i]);
      if (cached !== undefined) {
        translations[i] = cached;
      } else {
        uncachedIndices.push(i);
      }
    }

    // 3. If all strings are cached, return immediately
    if (uncachedIndices.length === 0) {
      return { translations };
    }

    // 4. Shield placeholders in uncached strings
    const uncachedTexts = uncachedIndices.map(i => sourceTexts[i]);
    const shieldResults = uncachedTexts.map(text => shield(text));
    const shieldedStrings = shieldResults.map(r => r.shieldedText);

    // 5. Build Gemini prompt and call API
    try {
      const prompt =
        `Translate the following UI strings from English to ${targetLocale}. ` +
        `Return ONLY a JSON array of translated strings in the same order. ` +
        `Preserve all <xN> tags exactly as they appear.\n\n` +
        JSON.stringify(shieldedStrings);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('[TranslationService] Gemini API returned non-OK status', {
          status: response.status,
          targetLocale,
        });
        // Fall back to source texts for uncached entries
        for (const i of uncachedIndices) {
          translations[i] = sourceTexts[i];
        }
        return { translations };
      }

      // 6. Parse response
      const data = await response.json();
      const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const parsed: unknown = JSON.parse(rawText);

      if (!Array.isArray(parsed) || parsed.length !== uncachedTexts.length) {
        console.warn('[TranslationService] Response array length mismatch', {
          expected: uncachedTexts.length,
          actual: Array.isArray(parsed) ? parsed.length : 'not-an-array',
          targetLocale,
        });
        for (const i of uncachedIndices) {
          translations[i] = sourceTexts[i];
        }
        return { translations };
      }

      // 7. Unshield and validate each translation
      for (let j = 0; j < uncachedIndices.length; j++) {
        const idx = uncachedIndices[j];
        const sourceText = sourceTexts[idx];
        const translatedShielded = String(parsed[j]);

        // Unshield placeholders
        const unshielded = unshield(translatedShielded, shieldResults[j].tokens);

        // Validate placeholder preservation
        if (!validatePlaceholders(sourceText, unshielded)) {
          const sourcePlaceholders = extractPlaceholders(sourceText);
          const missing = sourcePlaceholders.filter(t => !unshielded.includes(t));
          console.warn('[TranslationService] Translation missing placeholders — discarding', {
            sourceText,
            targetLocale,
            missingTokens: missing,
          });
          translations[idx] = sourceText;
        } else {
          translations[idx] = unshielded;
          this.cache.set(targetLocale, sourceText, unshielded);
        }
      }

      return { translations };
    } catch (error) {
      console.warn('[TranslationService] Translation failed — returning source texts', {
        targetLocale,
        error: error instanceof Error ? error.message : String(error),
        sourceTextCount: uncachedTexts.length,
      });
      for (const i of uncachedIndices) {
        translations[i] = sourceTexts[i];
      }
      return { translations };
    }
  }

  /** Clear all cached translations. */
  clearCache(): void {
    this.cache.clear();
  }
}
