import { describe, it, expect } from 'vitest';
import { translateDirectiveProps } from './translateDirectiveProps';

describe('translateDirectiveProps', () => {
  const mockT = (s: string) => `[translated] ${s}`;

  it('translates all string values through t()', () => {
    const props = { headline: 'Hello', bannerText: 'Save now' };
    const result = translateDirectiveProps(props, mockT);

    expect(result.headline).toBe('[translated] Hello');
    expect(result.bannerText).toBe('[translated] Save now');
  });

  it('passes non-string values through unchanged', () => {
    const props = { count: 42, active: true, items: [1, 2], nested: { a: 1 } };
    const result = translateDirectiveProps(props, mockT);

    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
    expect(result.items).toEqual([1, 2]);
    expect(result.nested).toEqual({ a: 1 });
  });

  it('handles mixed string and non-string values', () => {
    const props = { label: 'Free delivery', amount: 399, visible: false };
    const result = translateDirectiveProps(props, mockT);

    expect(result.label).toBe('[translated] Free delivery');
    expect(result.amount).toBe(399);
    expect(result.visible).toBe(false);
  });

  it('returns empty object for empty props', () => {
    const result = translateDirectiveProps({}, mockT);
    expect(result).toEqual({});
  });

  it('does not mutate the original props object', () => {
    const props = { title: 'Original' };
    const result = translateDirectiveProps(props, mockT);

    expect(props.title).toBe('Original');
    expect(result.title).toBe('[translated] Original');
    expect(result).not.toBe(props);
  });
});
