import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SavingsBadge from './SavingsBadge';
import type { UIDirective, PIEInteractionEvent } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

function makeDirective(
  props: Record<string, unknown> = {},
): UIDirective {
  return { componentType: 'savings-badge', props };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('SavingsBadge', () => {
  // ── Rendering ─────────────────────────────────────────────────────

  it('renders a button element', () => {
    render(<SavingsBadge directive={makeDirective()} />);
    expect(screen.getByRole('button', { name: /savings badge/i })).toBeInTheDocument();
  });

  it('applies the position as a data attribute', () => {
    render(
      <SavingsBadge
        directive={makeDirective({ position: 'checkout-button' })}
      />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-position', 'checkout-button');
  });

  it('defaults position to "default" when not provided', () => {
    render(<SavingsBadge directive={makeDirective()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-position', 'default');
  });

  // ── Animation ─────────────────────────────────────────────────────

  it('applies vibrate animation class when animationType is "vibrate"', () => {
    render(
      <SavingsBadge
        directive={makeDirective({ animationType: 'vibrate' })}
      />,
    );
    const button = screen.getByRole('button');
    expect(button.className).toContain('pie-savings-badge--vibrate');
  });

  it('does not apply vibrate class when animationType is absent', () => {
    render(<SavingsBadge directive={makeDirective()} />);
    const button = screen.getByRole('button');
    expect(button.className).not.toContain('pie-savings-badge--vibrate');
  });

  it('does not apply vibrate class for other animation types', () => {
    render(
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

    render(
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
    render(<SavingsBadge directive={makeDirective()} />);
    expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
  });

  // ── Accessibility ─────────────────────────────────────────────────

  it('has an accessible label', () => {
    render(<SavingsBadge directive={makeDirective()} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Savings badge');
  });

  it('renders as a button with type="button"', () => {
    render(<SavingsBadge directive={makeDirective()} />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
