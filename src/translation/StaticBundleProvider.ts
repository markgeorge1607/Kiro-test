/**
 * StaticBundleProvider — resolves translations from pre-built JSON locale files.
 *
 * Zero network, zero latency. Bundles are loaded via Vite static imports
 * at the call site that constructs the provider.
 *
 * Framework-agnostic — no React or DOM dependencies.
 */
import type { TranslationProvider } from './TranslationProvider';

/** A plain object mapping English source text → translated string. */
export type LocaleBundle = Record<string, string>;

export class StaticBundleProvider implements TranslationProvider {
  readonly name = 'StaticBundle';

  /** Bundles keyed by locale code, loaded at construction time. */
  private bundles: Map<string, LocaleBundle>;

  constructor(bundles: Record<string, LocaleBundle>) {
    this.bundles = new Map(Object.entries(bundles));
  }

  async translate(
    sourceTexts: string[],
    targetLocale: string,
  ): Promise<(string | null)[]> {
    const bundle = this.bundles.get(targetLocale);

    if (!bundle) {
      console.warn('[StaticBundleProvider] No bundle loaded for locale', {
        targetLocale,
        requestedStrings: sourceTexts.length,
      });
      return sourceTexts.map(() => null);
    }

    return sourceTexts.map((text) => bundle[text] ?? null);
  }
}
