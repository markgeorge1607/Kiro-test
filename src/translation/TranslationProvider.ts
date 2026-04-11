/**
 * TranslationProvider — common contract for all translation backends.
 *
 * Each provider resolves an array of English source texts to a target locale.
 * Returns `null` for any string it cannot translate, allowing the chain
 * to pass unresolved strings to the next provider.
 *
 * Framework-agnostic — no React or DOM dependencies.
 */
export interface TranslationProvider {
  /** Human-readable name for logging and diagnostics. */
  readonly name: string;

  /**
   * Translate an array of English source texts to the target locale.
   * Returns a same-length array where each entry is either:
   * - a translated string (provider succeeded for that string)
   * - null (provider cannot translate that string)
   */
  translate(
    sourceTexts: string[],
    targetLocale: string,
  ): Promise<(string | null)[]>;
}
