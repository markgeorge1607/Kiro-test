import { describe, it, expect, beforeEach } from 'vitest';
import { TranslationCache } from './TranslationCache';

describe('TranslationCache', () => {
  let cache: TranslationCache;

  beforeEach(() => {
    cache = new TranslationCache();
  });

  it('stores and retrieves a translation', () => {
    cache.set('de', 'Hello', 'Hallo');
    expect(cache.get('de', 'Hello')).toBe('Hallo');
  });

  it('returns undefined for uncached entries', () => {
    expect(cache.get('de', 'Hello')).toBeUndefined();
  });

  it('reports has correctly for cached and uncached entries', () => {
    expect(cache.has('de', 'Hello')).toBe(false);
    cache.set('de', 'Hello', 'Hallo');
    expect(cache.has('de', 'Hello')).toBe(true);
  });

  it('isolates entries by locale', () => {
    cache.set('de', 'Hello', 'Hallo');
    cache.set('fr', 'Hello', 'Bonjour');
    expect(cache.get('de', 'Hello')).toBe('Hallo');
    expect(cache.get('fr', 'Hello')).toBe('Bonjour');
    expect(cache.get('es', 'Hello')).toBeUndefined();
  });

  it('isolates entries by source text', () => {
    cache.set('de', 'Hello', 'Hallo');
    cache.set('de', 'Goodbye', 'Tschüss');
    expect(cache.get('de', 'Hello')).toBe('Hallo');
    expect(cache.get('de', 'Goodbye')).toBe('Tschüss');
  });

  it('overwrites existing entries', () => {
    cache.set('de', 'Hello', 'Hallo');
    cache.set('de', 'Hello', 'Hallo!');
    expect(cache.get('de', 'Hello')).toBe('Hallo!');
  });

  it('clears all entries', () => {
    cache.set('de', 'Hello', 'Hallo');
    cache.set('fr', 'Hello', 'Bonjour');
    cache.clear();
    expect(cache.has('de', 'Hello')).toBe(false);
    expect(cache.has('fr', 'Hello')).toBe(false);
  });

  it('handles source text containing the delimiter', () => {
    cache.set('de', 'a::b', 'translated');
    expect(cache.get('de', 'a::b')).toBe('translated');
    expect(cache.get('de', 'a')).toBeUndefined();
  });

  it('handles empty strings', () => {
    cache.set('de', '', 'empty-translation');
    expect(cache.get('de', '')).toBe('empty-translation');
  });
});

// Feature: translation-fallback-layer, Property 5: Cache round-trip
import * as fc from 'fast-check';

describe('TranslationCache — Property-Based Tests', () => {
  /**
   * Property 5: Cache round-trip
   * For any locale, source text, and translation string, storing a translation
   * in the TranslationCache and then retrieving it with the same (locale, sourceText)
   * key SHALL return the identical translation string.
   *
   * **Validates: Requirements 5.5**
   */
  it('cache round-trip: set then get returns the identical translation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),  // locale
        fc.string(),                   // sourceText
        fc.string(),                   // translation
        (locale, sourceText, translation) => {
          const cache = new TranslationCache();
          cache.set(locale, sourceText, translation);
          expect(cache.get(locale, sourceText)).toBe(translation);
          expect(cache.has(locale, sourceText)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
