import { describe, it, expect } from 'vitest';
import {
  shield,
  unshield,
  extractPlaceholders,
  validatePlaceholders,
} from './PlaceholderShielder';

describe('PlaceholderShielder', () => {
  describe('shield', () => {
    it('replaces {{key}} tokens with numbered XML tags', () => {
      const result = shield('Save {{fee}} on delivery');
      expect(result.shieldedText).toBe('Save <x1> on delivery');
      expect(result.tokens.get('<x1>')).toBe('{{fee}}');
    });

    it('replaces currency values with numbered XML tags', () => {
      const result = shield('Only £3.99 for delivery');
      expect(result.shieldedText).toBe('Only <x1> for delivery');
      expect(result.tokens.get('<x1>')).toBe('£3.99');
    });

    it('handles multiple placeholders and currencies', () => {
      const result = shield('Save {{fee}} — was €5.00, now $2.99 with {{plan}}');
      expect(result.shieldedText).toBe(
        'Save <x1> — was <x2>, now <x3> with <x4>',
      );
      expect(result.tokens.get('<x1>')).toBe('{{fee}}');
      expect(result.tokens.get('<x2>')).toBe('€5.00');
      expect(result.tokens.get('<x3>')).toBe('$2.99');
      expect(result.tokens.get('<x4>')).toBe('{{plan}}');
    });

    it('returns original text when no placeholders or currencies exist', () => {
      const result = shield('No special tokens here');
      expect(result.shieldedText).toBe('No special tokens here');
      expect(result.tokens.size).toBe(0);
    });

    it('handles empty string', () => {
      const result = shield('');
      expect(result.shieldedText).toBe('');
      expect(result.tokens.size).toBe(0);
    });

    it('handles various currency symbols', () => {
      const result = shield('¥1000 or ₹500.50');
      expect(result.tokens.get('<x1>')).toBe('¥1000');
      expect(result.tokens.get('<x2>')).toBe('₹500.50');
    });
  });

  describe('unshield', () => {
    it('restores original tokens from XML tags', () => {
      const tokens = new Map([
        ['<x1>', '{{fee}}'],
        ['<x2>', '£3.99'],
      ]);
      const result = unshield('Sparen Sie <x1> — nur <x2>', tokens);
      expect(result).toBe('Sparen Sie {{fee}} — nur £3.99');
    });

    it('returns text unchanged when tokens map is empty', () => {
      const result = unshield('No tokens here', new Map());
      expect(result).toBe('No tokens here');
    });
  });

  describe('shield → unshield round-trip', () => {
    it('preserves original text through shield/unshield cycle', () => {
      const original = 'Save {{fee}} on delivery — was £3.99';
      const { shieldedText, tokens } = shield(original);
      const restored = unshield(shieldedText, tokens);
      expect(restored).toBe(original);
    });
  });

  describe('extractPlaceholders', () => {
    it('extracts all {{key}} tokens', () => {
      expect(extractPlaceholders('Hello {{name}}, your {{item}} is ready')).toEqual([
        '{{name}}',
        '{{item}}',
      ]);
    });

    it('returns empty array when no placeholders exist', () => {
      expect(extractPlaceholders('No placeholders')).toEqual([]);
    });

    it('does not extract currency values', () => {
      expect(extractPlaceholders('Price is £3.99')).toEqual([]);
    });
  });

  describe('validatePlaceholders', () => {
    it('returns true when all placeholders are preserved', () => {
      expect(
        validatePlaceholders(
          'Save {{fee}} with {{plan}}',
          'Sparen Sie {{fee}} mit {{plan}}',
        ),
      ).toBe(true);
    });

    it('returns false when a placeholder is missing', () => {
      expect(
        validatePlaceholders(
          'Save {{fee}} with {{plan}}',
          'Sparen Sie {{fee}} mit dem Plan',
        ),
      ).toBe(false);
    });

    it('returns true when source has no placeholders', () => {
      expect(validatePlaceholders('Hello world', 'Hallo Welt')).toBe(true);
    });
  });
});
