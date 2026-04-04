import { describe, it, expect, vi } from 'vitest';
import { resolveTemplate } from './templateResolver';

describe('resolveTemplate', () => {
  it('replaces a single placeholder with its context value', () => {
    const result = resolveTemplate('You could save {{fee}} on delivery!', {
      fee: '£3.99',
    });
    expect(result).toBe('You could save £3.99 on delivery!');
  });

  it('replaces multiple distinct placeholders', () => {
    const result = resolveTemplate(
      'Save {{savings}} with a {{trialDuration}} free trial!',
      { savings: '£3.99', trialDuration: '30-day' },
    );
    expect(result).toBe('Save £3.99 with a 30-day free trial!');
  });

  it('replaces duplicate placeholders', () => {
    const result = resolveTemplate('{{fee}} is your fee. Pay {{fee}} now.', {
      fee: '£2.50',
    });
    expect(result).toBe('£2.50 is your fee. Pay £2.50 now.');
  });

  it('removes unresolved placeholders and logs a warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = resolveTemplate('Hello {{name}}, your fee is {{fee}}', {
      fee: '£1.99',
    });

    expect(result).toBe('Hello , your fee is £1.99');
    expect(warnSpy).toHaveBeenCalledWith(
      '[templateResolver] Unresolved placeholder: {{name}}',
    );

    warnSpy.mockRestore();
  });

  it('returns the template unchanged when there are no placeholders', () => {
    const result = resolveTemplate('No placeholders here.', { fee: '£3.99' });
    expect(result).toBe('No placeholders here.');
  });

  it('returns an empty string when template is empty', () => {
    const result = resolveTemplate('', { fee: '£3.99' });
    expect(result).toBe('');
  });

  it('handles an empty context map by removing all placeholders', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = resolveTemplate('{{fee}} and {{savings}}', {});

    expect(result).toBe(' and ');
    expect(warnSpy).toHaveBeenCalledTimes(2);

    warnSpy.mockRestore();
  });

  it('only matches {{word}} patterns, not single braces or braces with spaces', () => {
    const result = resolveTemplate('{single} and {{ spaced }}', {});
    // Single braces and braces with spaces are not valid placeholders
    expect(result).toBe('{single} and {{ spaced }}');
  });

  it('resolves the Step 1 nudge message template (Req 4.3)', () => {
    const result = resolveTemplate(
      "You're about to pay {{fee}} in delivery fees — that's money you could keep!",
      { fee: '£3.99' },
    );
    expect(result).toBe(
      "You're about to pay £3.99 in delivery fees — that's money you could keep!",
    );
    expect(result).toContain('£3.99');
  });

  it('resolves the Step 2 nudge message template (Req 5.3)', () => {
    const result = resolveTemplate(
      'Start a {{trialDuration}} free trial and save {{savings}} on this order alone.',
      { trialDuration: '30-day', savings: '£3.99' },
    );
    expect(result).toBe(
      'Start a 30-day free trial and save £3.99 on this order alone.',
    );
    expect(result).toContain('30-day');
    expect(result).toContain('£3.99');
  });

  it('resolves {{userName}} placeholder (Req 12.3)', () => {
    const result = resolveTemplate('Hey {{userName}}, check this out!', {
      userName: 'Sam',
    });
    expect(result).toBe('Hey Sam, check this out!');
  });

  it('resolves {{accumulatedFees}} placeholder (Req 12.3)', () => {
    const result = resolveTemplate(
      "You've spent {{accumulatedFees}} on delivery fees lately.",
      { accumulatedFees: '£12.50' },
    );
    expect(result).toBe("You've spent £12.50 on delivery fees lately.");
  });

  it('resolves {{currentOrderSavings}} placeholder (Req 12.3)', () => {
    const result = resolveTemplate(
      'Save {{currentOrderSavings}} on this order right now.',
      { currentOrderSavings: '£3.99' },
    );
    expect(result).toBe('Save £3.99 on this order right now.');
  });

  it('resolves Squeezed Saver upsell template with all new placeholders (Req 12.3)', () => {
    const template =
      "Hey {{userName}}, I noticed you've spent {{accumulatedFees}} on delivery fees lately. " +
      "That's a massive 'convenience tax.' Let's wipe that out—join JET+ for free for 14 days " +
      'and save {{currentOrderSavings}} on this order right now';
    const result = resolveTemplate(template, {
      userName: 'Sam',
      accumulatedFees: '£14.97',
      currentOrderSavings: '£3.99',
    });
    expect(result).toContain('Sam');
    expect(result).toContain('£14.97');
    expect(result).toContain('£3.99');
    expect(result).not.toMatch(/\{\{.*?\}\}/);
  });

  it('resolves Value Seeker upsell template with all new placeholders (Req 12.3)', () => {
    const template =
      'Ready to optimize, {{userName}}? Most JET+ members save over £20 a month. ' +
      'Start your trial now to get this delivery for £0.00 and unlock exclusive member-only offers';
    const result = resolveTemplate(template, {
      userName: 'Alex',
    });
    expect(result).toContain('Alex');
    expect(result).not.toMatch(/\{\{.*?\}\}/);
  });
});
