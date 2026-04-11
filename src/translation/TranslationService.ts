/**
 * TranslationService — orchestrates translation via an ordered provider chain
 * with caching and graceful fallback to source text.
 *
 * Framework-agnostic — no React or DOM dependencies.
 */

import { TranslationCache } from './TranslationCache';
import type { TranslationProvider } from './TranslationProvider';
import type { TranslationRequest, TranslationResponse } from '../types';

export interface TranslationServiceConfig {
  providers: TranslationProvider[];
}

export class TranslationService {
  private readonly providers: TranslationProvider[];
  private readonly cache: TranslationCache;

  constructor(config: TranslationServiceConfig) {
    this.providers = config.providers;
    this.cache = new TranslationCache();
  }

  /**
   * Translates a batch of source texts to the target locale.
   *
   * 1. English locale → return source texts unchanged (no cache, no providers)
   * 2. Check cache; separate hits from misses
   * 3. Pass uncached texts through the provider chain in order
   * 4. Fallback to source text for any still-unresolved strings
   * 5. Cache newly resolved translations
   * 6. Log structured summary
   */
  async translateBatch(request: TranslationRequest): Promise<TranslationResponse> {
    const { sourceTexts, targetLocale } = request;

    // 1. English pass-through — zero provider calls, zero cache writes
    if (targetLocale === 'en') {
      return { translations: [...sourceTexts] };
    }

    // 2. Check cache for each source text
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

    const cacheHits = sourceTexts.length - uncachedIndices.length;

    // 3. If all cached, return immediately
    if (uncachedIndices.length === 0) {
      console.info('[TranslationService] translateBatch summary', {
        targetLocale,
        totalRequested: sourceTexts.length,
        cacheHits,
        providerResults: {},
        fallbacks: 0,
      });
      return { translations };
    }

    // 4. Provider chain — iterate providers, narrowing unresolved set each time
    // Track which uncached indices are still unresolved
    let unresolvedIndices = [...uncachedIndices];
    const providerResults: Record<string, number> = {};

    for (const provider of this.providers) {
      if (unresolvedIndices.length === 0) break;

      const unresolvedTexts = unresolvedIndices.map(i => sourceTexts[i]);

      let results: (string | null)[];
      try {
        results = await provider.translate(unresolvedTexts, targetLocale);
      } catch (error) {
        console.error('[TranslationService] Provider threw an error — skipping', {
          provider: provider.name,
          targetLocale,
          error: error instanceof Error ? error.message : String(error),
          unresolvedCount: unresolvedTexts.length,
        });
        continue;
      }

      // Collect resolved strings from this provider
      let resolvedCount = 0;
      const stillUnresolved: number[] = [];

      for (let j = 0; j < unresolvedIndices.length; j++) {
        const idx = unresolvedIndices[j];
        const result = results[j];

        if (result !== null && result !== undefined) {
          translations[idx] = result;
          resolvedCount++;
        } else {
          stillUnresolved.push(idx);
        }
      }

      if (resolvedCount > 0) {
        providerResults[provider.name] = resolvedCount;
      }

      // Log warning if provider returned nulls
      if (stillUnresolved.length > 0 && resolvedCount < unresolvedIndices.length) {
        console.warn('[TranslationService] Provider returned nulls for some strings', {
          provider: provider.name,
          targetLocale,
          unresolvedCount: stillUnresolved.length,
        });
      }

      unresolvedIndices = stillUnresolved;
    }

    // 5. Fallback to source text for any still-unresolved strings
    const fallbackCount = unresolvedIndices.length;
    for (const idx of unresolvedIndices) {
      translations[idx] = sourceTexts[idx];
    }

    if (fallbackCount > 0) {
      console.warn('[TranslationService] Some strings fell back to source text', {
        targetLocale,
        fallbackCount,
        sourceTexts: unresolvedIndices.map(i => sourceTexts[i]),
      });
    }

    // 6. Store newly resolved translations in cache
    for (const idx of uncachedIndices) {
      // Only cache if the translation differs from source (i.e. was actually resolved)
      // Also cache fallbacks so we don't re-query providers for strings they can't translate
      this.cache.set(targetLocale, sourceTexts[idx], translations[idx]);
    }

    // 7. Log structured summary
    console.info('[TranslationService] translateBatch summary', {
      targetLocale,
      totalRequested: sourceTexts.length,
      cacheHits,
      providerResults,
      fallbacks: fallbackCount,
    });

    return { translations };
  }

  /** Clear all cached translations. */
  clearCache(): void {
    this.cache.clear();
  }
}
