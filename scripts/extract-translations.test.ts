import { describe, it, expect } from 'vitest';
import { extractKeys, mergeBundle } from './extract-translations';

describe('extractKeys', () => {
  it('extracts single-quoted t() calls', () => {
    const source = `const label = t('Add to basket');`;
    expect(extractKeys(source)).toEqual(['Add to basket']);
  });

  it('extracts double-quoted t() calls', () => {
    const source = `const label = t("Your order");`;
    expect(extractKeys(source)).toEqual(['Your order']);
  });

  it('extracts multiple t() calls from the same source', () => {
    const source = `
      const a = t('Hello');
      const b = t("World");
      const c = t('Goodbye');
    `;
    const keys = extractKeys(source);
    expect(keys).toContain('Hello');
    expect(keys).toContain('World');
    expect(keys).toContain('Goodbye');
    expect(keys).toHaveLength(3);
  });

  it('deduplicates identical keys', () => {
    const source = `
      t('Add');
      t('Add');
      t("Add");
    `;
    expect(extractKeys(source)).toEqual(['Add']);
  });

  it('handles escaped single quotes inside single-quoted strings', () => {
    const source = `t('Stop paying the \\'convenience tax.\\'')`;
    expect(extractKeys(source)).toEqual(["Stop paying the 'convenience tax.'"]);
  });

  it('handles escaped double quotes inside double-quoted strings', () => {
    const source = `t("She said \\"hello\\"")`;
    expect(extractKeys(source)).toEqual(['She said "hello"']);
  });

  it('extracts keys with placeholder tokens', () => {
    const source = `t('Free delivery with {{plan}}')`;
    expect(extractKeys(source)).toEqual(['Free delivery with {{plan}}']);
  });

  it('extracts keys with currency values', () => {
    const source = `t("£10 credit")`;
    expect(extractKeys(source)).toEqual(['£10 credit']);
  });

  it('returns empty array for source with no t() calls', () => {
    const source = `const x = 42; console.log("hello");`;
    expect(extractKeys(source)).toEqual([]);
  });

  it('does not match non-t function calls', () => {
    const source = `const x = foo('bar'); const y = at('baz');`;
    // 'at' should not match because \b requires word boundary before 't'
    expect(extractKeys(source)).toEqual([]);
  });

  it('handles t() calls with whitespace before the string argument', () => {
    const source = `t(  'spaced out'  )`;
    expect(extractKeys(source)).toEqual(['spaced out']);
  });
});

describe('mergeBundle', () => {
  it('preserves existing translated values', () => {
    const existing = { 'Hello': 'Hallo', 'World': 'Welt' };
    const keys = ['Hello', 'World'];
    const result = mergeBundle(existing, keys);
    expect(result['Hello']).toBe('Hallo');
    expect(result['World']).toBe('Welt');
  });

  it('adds new keys with empty string values', () => {
    const existing = { 'Hello': 'Hallo' };
    const keys = ['Hello', 'Goodbye'];
    const result = mergeBundle(existing, keys);
    expect(result['Hello']).toBe('Hallo');
    expect(result['Goodbye']).toBe('');
  });

  it('preserves existing keys not in the extracted set', () => {
    const existing = { 'Old key': 'Alter Schlüssel' };
    const keys = ['New key'];
    const result = mergeBundle(existing, keys);
    expect(result['Old key']).toBe('Alter Schlüssel');
    expect(result['New key']).toBe('');
  });

  it('returns sorted keys', () => {
    const existing = { 'Zebra': 'Z', 'Apple': 'A' };
    const keys = ['Mango'];
    const result = mergeBundle(existing, keys);
    const resultKeys = Object.keys(result);
    expect(resultKeys).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('handles empty existing bundle', () => {
    const result = mergeBundle({}, ['A', 'B']);
    expect(result).toEqual({ 'A': '', 'B': '' });
  });

  it('handles empty extracted keys', () => {
    const existing = { 'Hello': 'Hallo' };
    const result = mergeBundle(existing, []);
    expect(result).toEqual({ 'Hello': 'Hallo' });
  });

  it('handles both empty', () => {
    const result = mergeBundle({}, []);
    expect(result).toEqual({});
  });

  it('does not overwrite existing translations with empty strings', () => {
    const existing = { 'Save {{fee}} on delivery': 'Sparen Sie {{fee}} bei der Lieferung' };
    const keys = ['Save {{fee}} on delivery'];
    const result = mergeBundle(existing, keys);
    expect(result['Save {{fee}} on delivery']).toBe('Sparen Sie {{fee}} bei der Lieferung');
  });
});

import fc from 'fast-check';

// Feature: translation-fallback-layer, Property 9: Bundle merge preserves existing translations
describe('Property 9: Bundle merge preserves existing translations', () => {
  // **Validates: Requirements 7.3**

  // Arbitrary for realistic translation keys: non-empty strings starting with a letter
  // (real t() keys are English phrases, never pure integers — JS objects enumerate
  // integer-indexed keys before string keys regardless of insertion order)
  const keyArb = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 {}_.,!?'"-]{0,49}$/);
  const valueArb = fc.string({ minLength: 1, maxLength: 100 });

  const bundleArb = fc.dictionary(keyArb, valueArb, { minKeys: 0, maxKeys: 20 });
  const keysArb = fc.array(keyArb, { minLength: 0, maxLength: 20 });

  it('preserves all existing key-value pairs unchanged after merge', () => {
    fc.assert(
      fc.property(bundleArb, keysArb, (existingBundle, newKeys) => {
        const result = mergeBundle(existingBundle, newKeys);

        // Every existing key-value pair must be preserved exactly
        for (const [key, value] of Object.entries(existingBundle)) {
          expect(result[key]).toBe(value);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('adds new keys with empty string values', () => {
    fc.assert(
      fc.property(bundleArb, keysArb, (existingBundle, newKeys) => {
        const result = mergeBundle(existingBundle, newKeys);

        // Every new key not in the existing bundle must have an empty string value
        for (const key of newKeys) {
          if (!(key in existingBundle)) {
            expect(result[key]).toBe('');
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('result contains all existing keys and all new keys', () => {
    fc.assert(
      fc.property(bundleArb, keysArb, (existingBundle, newKeys) => {
        const result = mergeBundle(existingBundle, newKeys);
        const resultKeys = new Set(Object.keys(result));

        // All existing keys present
        for (const key of Object.keys(existingBundle)) {
          expect(resultKeys.has(key)).toBe(true);
        }

        // All new keys present
        for (const key of newKeys) {
          expect(resultKeys.has(key)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('result keys are sorted alphabetically', () => {
    fc.assert(
      fc.property(bundleArb, keysArb, (existingBundle, newKeys) => {
        const result = mergeBundle(existingBundle, newKeys);
        const keys = Object.keys(result);
        const sorted = [...keys].sort();
        expect(keys).toEqual(sorted);
      }),
      { numRuns: 100 },
    );
  });
});
