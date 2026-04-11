/**
 * PlaceholderShielder — protects dynamic tokens from LLM translation.
 *
 * Replaces {{key}} placeholders and currency values (£3.99, €5.00, $12.50, etc.)
 * with numbered XML tags (<x1>, <x2>, …) before sending text to Gemini,
 * then restores them after translation.
 *
 * Framework-agnostic — no React or DOM dependencies.
 */

export interface ShieldResult {
  shieldedText: string;
  tokens: Map<string, string>; // e.g. "<x1>" → "{{fee}}", "<x2>" → "£3.99"
}

/** Matches {{key}} placeholder tokens. */
const PLACEHOLDER_RE = /\{\{[^}]+\}\}/g;

/** Matches currency symbol + number patterns (e.g. £3.99, €5.00, $12, ¥1000.50). */
const CURRENCY_RE = /[£€$¥₹]\d+(?:\.\d{1,2})?/g;

/**
 * Replace {{key}} tokens and currency values with numbered <xN> XML shield tags.
 * Returns the shielded text and a map to restore originals.
 */
export function shield(sourceText: string): ShieldResult {
  const tokens = new Map<string, string>();
  let counter = 0;

  // Collect all matches with their positions so we can process left-to-right
  const matches: { index: number; length: number; value: string }[] = [];

  for (const m of sourceText.matchAll(PLACEHOLDER_RE)) {
    matches.push({ index: m.index!, length: m[0].length, value: m[0] });
  }
  for (const m of sourceText.matchAll(CURRENCY_RE)) {
    matches.push({ index: m.index!, length: m[0].length, value: m[0] });
  }

  // Sort by position (left-to-right) for deterministic tag numbering
  matches.sort((a, b) => a.index - b.index);

  // Build shielded text by replacing each match
  let shieldedText = '';
  let cursor = 0;

  for (const match of matches) {
    counter++;
    const tag = `<x${counter}>`;
    tokens.set(tag, match.value);
    shieldedText += sourceText.slice(cursor, match.index) + tag;
    cursor = match.index + match.length;
  }

  shieldedText += sourceText.slice(cursor);

  return { shieldedText, tokens };
}

/**
 * Restore original tokens from <xN> XML shield tags using the tokens map.
 */
export function unshield(
  translatedText: string,
  tokens: Map<string, string>,
): string {
  let result = translatedText;
  for (const [tag, original] of tokens) {
    result = result.replace(tag, original);
  }
  return result;
}

/**
 * Extract all {{key}} placeholder tokens from a string.
 */
export function extractPlaceholders(text: string): string[] {
  return text.match(PLACEHOLDER_RE) ?? [];
}

/**
 * Validate that translated text contains all original {{key}} placeholder tokens.
 */
export function validatePlaceholders(
  sourceText: string,
  translatedText: string,
): boolean {
  const sourcePlaceholders = extractPlaceholders(sourceText);
  return sourcePlaceholders.every((token) => translatedText.includes(token));
}
