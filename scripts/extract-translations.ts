/**
 * Scans all .ts/.tsx files under src/ for t('...') and t("...") calls.
 * For each non-English locale, outputs src/translation/locales/{locale}.json
 * with source text keys. Preserves existing translated values; adds new keys
 * with empty string values.
 *
 * Usage: npx tsx scripts/extract-translations.ts
 * Or via npm script: npm run extract-translations
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename_esm = fileURLToPath(import.meta.url);
const __dirname_esm = path.dirname(__filename_esm);

const LOCALES = ['de', 'es', 'fr', 'nl'];
const SRC_DIR = path.resolve(__dirname_esm, '..', 'src');
const LOCALES_DIR = path.join(SRC_DIR, 'translation', 'locales');

/**
 * Recursively collects all .ts and .tsx files under a directory.
 */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(fullPath));
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Extracts all source text keys from t('...') and t("...") call patterns
 * found in the given source code string.
 */
export function extractKeys(source: string): string[] {
  const keys: Set<string> = new Set();

  // Match t('...') with single quotes — handles escaped single quotes inside
  const singleQuoteRegex = /\bt\(\s*'((?:[^'\\]|\\.)*)'\s*\)/g;
  // Match t("...") with double quotes — handles escaped double quotes inside
  const doubleQuoteRegex = /\bt\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g;

  let match: RegExpExecArray | null;

  while ((match = singleQuoteRegex.exec(source)) !== null) {
    // Unescape single quotes: \' → '
    const key = match[1].replace(/\\'/g, "'");
    keys.add(key);
  }

  while ((match = doubleQuoteRegex.exec(source)) !== null) {
    // Unescape double quotes: \" → "
    const key = match[1].replace(/\\"/g, '"');
    keys.add(key);
  }

  return Array.from(keys);
}

/**
 * Merges a set of extracted keys into an existing locale bundle.
 * - Preserves all existing key-value pairs unchanged.
 * - Adds new keys with empty string values.
 * - Returns a new object with keys sorted alphabetically.
 */
export function mergeBundle(
  existingBundle: Record<string, string>,
  extractedKeys: string[],
): Record<string, string> {
  const merged: Record<string, string> = { ...existingBundle };

  for (const key of extractedKeys) {
    if (!(key in merged)) {
      merged[key] = '';
    }
  }

  // Sort keys alphabetically for clean diffs
  const sorted: Record<string, string> = {};
  const sortedKeys = Object.keys(merged).sort();
  for (const k of sortedKeys) {
    sorted[k] = merged[k];
  }
  return sorted;
}

function main(): void {
  // 1. Collect all source files
  const files = collectSourceFiles(SRC_DIR);

  // 2. Extract keys from all files
  const allKeys: Set<string> = new Set();
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const keys = extractKeys(content);
    for (const key of keys) {
      allKeys.add(key);
    }
  }

  const extractedKeys = Array.from(allKeys);
  console.log(`Found ${extractedKeys.length} translatable string(s).`);

  // 3. Ensure locales directory exists
  if (!fs.existsSync(LOCALES_DIR)) {
    fs.mkdirSync(LOCALES_DIR, { recursive: true });
  }

  // 4. For each locale, read existing file, merge, and write
  for (const locale of LOCALES) {
    const filePath = path.join(LOCALES_DIR, `${locale}.json`);

    let existingBundle: Record<string, string> = {};
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        existingBundle = JSON.parse(raw);
      } catch {
        console.warn(`Warning: Could not parse ${filePath}, starting fresh.`);
      }
    }

    const merged = mergeBundle(existingBundle, extractedKeys);
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
    console.log(`Updated ${locale}.json — ${Object.keys(merged).length} key(s).`);
  }
}

// Only run main when executed directly (not imported for testing)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename_esm)) {
  main();
}
