/**
 * RuntimeTranslationProvider — calls an external translation API for strings
 * not resolved by earlier providers in the chain.
 *
 * Shields placeholders and currency values before sending to the API,
 * unshields after receiving translations, and validates placeholder preservation.
 *
 * Framework-agnostic — no React or DOM dependencies.
 */
import type { TranslationProvider } from './TranslationProvider';
import { shield, unshield, validatePlaceholders } from './PlaceholderShielder';

export interface RuntimeProviderConfig {
  apiEndpoint: string; // e.g., "https://api-free.deepl.com/v2/translate"
  apiKey: string;
  timeoutMs?: number; // default: 10000
}

export class RuntimeTranslationProvider implements TranslationProvider {
  readonly name = 'RuntimeAPI';

  private apiEndpoint: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(config: RuntimeProviderConfig) {
    this.apiEndpoint = config.apiEndpoint;
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 10000;
  }

  async translate(
    sourceTexts: string[],
    targetLocale: string,
  ): Promise<(string | null)[]> {
    if (sourceTexts.length === 0) {
      return [];
    }

    // Shield placeholders and currency values before sending to API
    const shieldResults = sourceTexts.map((text) => shield(text));
    const shieldedTexts = shieldResults.map((r) => r.shieldedText);

    let rawTranslations: string[];
    try {
      rawTranslations = await this.callApi(shieldedTexts, targetLocale);
    } catch (error) {
      console.warn('[RuntimeTranslationProvider] API request failed', {
        targetLocale,
        requestedStrings: sourceTexts.length,
        error: error instanceof Error ? error.message : String(error),
      });
      return sourceTexts.map(() => null);
    }

    // Validate response length
    if (rawTranslations.length !== sourceTexts.length) {
      console.warn('[RuntimeTranslationProvider] API returned wrong array length', {
        targetLocale,
        expected: sourceTexts.length,
        received: rawTranslations.length,
      });
      return sourceTexts.map(() => null);
    }

    // Unshield and validate each translation
    return sourceTexts.map((sourceText, i) => {
      const unshielded = unshield(rawTranslations[i], shieldResults[i].tokens);

      if (!validatePlaceholders(sourceText, unshielded)) {
        console.warn('[RuntimeTranslationProvider] Placeholder validation failed', {
          sourceText,
          translatedText: unshielded,
          targetLocale,
        });
        return null;
      }

      return unshielded;
    });
  }

  private async callApi(
    shieldedTexts: string[],
    targetLocale: string,
  ): Promise<string[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `DeepL-Auth-Key ${this.apiKey}`,
        },
        body: JSON.stringify({
          text: shieldedTexts,
          target_lang: targetLocale.toUpperCase(),
          tag_handling: 'xml',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.translations as { text: string }[]).map((t) => t.text);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
