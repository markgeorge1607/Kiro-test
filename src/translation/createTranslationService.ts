/**
 * Factory function that creates a TranslationService with the standard provider chain:
 * 1. StaticBundleProvider (always)
 * 2. RuntimeTranslationProvider (only if VITE_TRANSLATION_API_KEY is set)
 *
 * Reads from environment variables:
 * - VITE_TRANSLATION_API_ENDPOINT (optional, for runtime provider)
 * - VITE_TRANSLATION_API_KEY (optional, enables runtime provider)
 */
import { TranslationService } from './TranslationService';
import { StaticBundleProvider } from './StaticBundleProvider';
import { RuntimeTranslationProvider } from './RuntimeTranslationProvider';
import type { TranslationProvider } from './TranslationProvider';

import deBundle from './locales/de.json';
import esBundle from './locales/es.json';
import frBundle from './locales/fr.json';
import nlBundle from './locales/nl.json';

export function createTranslationService(): TranslationService {
  const providers: TranslationProvider[] = [];

  // 1. StaticBundleProvider — always present
  const staticProvider = new StaticBundleProvider({
    de: deBundle,
    es: esBundle,
    fr: frBundle,
    nl: nlBundle,
  });
  providers.push(staticProvider);

  // 2. RuntimeTranslationProvider — only if API key is configured
  const apiKey = import.meta.env.VITE_TRANSLATION_API_KEY as string | undefined;
  const apiEndpoint = import.meta.env.VITE_TRANSLATION_API_ENDPOINT as string | undefined;

  if (apiKey) {
    const runtimeProvider = new RuntimeTranslationProvider({
      apiEndpoint: apiEndpoint || 'https://api-free.deepl.com/v2/translate',
      apiKey,
    });
    providers.push(runtimeProvider);
  }

  return new TranslationService({ providers });
}
