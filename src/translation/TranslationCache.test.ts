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
