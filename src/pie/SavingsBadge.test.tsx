import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SavingsBadge from './SavingsBadge';
import { TranslationProvider } from '../translation/TranslationContext';
import type { UIDirective, PIEInteractionEvent } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

function makeDirective(
  props: Record<string, unknown> = {},
): UIDirective {
  return { componentType: 'savings-badge', props };
}

function renderWithTranslation(ui: React.ReactElement) {
  return render(<TranslationProvider>{ui}</TranslationProvider>);
}

// ── Tests ────────────────────────────────────────────────────────────

describe('SavingsBadge', () => {
  // ── Rendering ─────────────────────────────────────────────────────

  it('renders a button element', () => {
    renderWithTranslation(<SavingsBadge directive={makeDirective()} />);
    expect(screen.getByRole('button', { name: /savings badge/i })).toBeInTheDocument();
  });

  it('applies the position as a data attribute', () => {
    renderWithTranslation(
      <SavingsBadge
        directive={makeDirective({ position: 'checkout-button' })}
      />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-position', 'checkout-button');
  });

  it('defaults position to "default" when not provided', () => {
    renderWithTranslation(<SavingsBadge directive={makeDirective()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-position', 'default');
  });

  // ── Animation ─────────────────────────────────────────────────────

  it('applies vibrate animation class when animationType is "vibrate"', () => {
    renderWithTranslation(
      <SavingsBadge
        directive={makeDirective({ animationType: 'vibrate' })}
      />,
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('pie-savings-badge--vibrate');
  });

  it('does not apply vibrate class when animationType is absent', () => {
    renderWithTranslation(<SavingsBadge directive={makeDirective()} />);
    const button = screen.getByRole('button');
    expect(button.className).not.toContain('pie-savings-badge--vibrate');
  });

  it('does not apply vibrate class for other animation types', () => {
    renderWithTranslation(
      <SavingsBadge
        directive={makeDirective({ animationType: 'bounce' })}
      />,
    );
    const button = screen.getByRole('button');
    expect(button.className).not.toContain('pie-savings-badge--vibrate');
  });

  // ── Interaction ───────────────────────────────────────────────────

  it('fires tapped interaction event on click', () => {
    const handler = vi.fn<(event: PIEInteractionEvent) => void>();

    renderWithTranslation(
      <SavingsBadge
        directive={makeDirective()}
        onInteraction={handler}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({
      componentType: 'savings-badge',
      action: 'tapped',
    });
  });

  it('does not throw when clicked without onInteraction callback', () => {
    renderWithTranslation(<SavingsBadge directive={makeDirective()} />);
    expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
  });

  // ── Accessibility ─────────────────────────────────────────────────

  it('has an accessible label', () => {
    renderWithTranslation(<SavingsBadge directive={makeDirective()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Savings badge');
  });

  it('renders as a button with type="button"', () => {
    renderWithTranslation(<SavingsBadge directive={makeDirective()} />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
