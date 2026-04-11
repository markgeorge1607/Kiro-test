/**
 * In-memory translation cache keyed by (locale, sourceText).
 * Framework-agnostic — no React or DOM dependencies.
 */
export class TranslationCache {
  private cache = new Map<string, string>();

  private key(locale: string, sourceText: string): string {
    return `${locale}::${sourceText}`;
  }

  /** Store a translation. */
  set(locale: string, sourceText: string, translation: string): void {
    this.cache.set(this.key(locale, sourceText), translation);
  }

  /** Retrieve a cached translation, or undefined if not cached. */
  get(locale: string, sourceText: string): string | undefined {
    return this.cache.get(this.key(locale, sourceText));
  }

  /** Check if a translation exists in cache. */
  has(locale: string, sourceText: string): boolean {
    return this.cache.has(this.key(locale, sourceText));
  }

  /** Clear all entries. */
  clear(): void {
    this.cache.clear();
  }
}
