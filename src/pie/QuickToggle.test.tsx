import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuickToggle from './QuickToggle';
import type { UIDirective, PIEInteractionEvent } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

function makeDirective(
  props: Record<string, unknown> = {},
): UIDirective {
  return { componentType: 'quick-toggle', props };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('QuickToggle', () => {
  // ── Rendering ─────────────────────────────────────────────────────

  it('renders a toggle switch element', () => {
    render(<QuickToggle directive={makeDirective()} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('displays the label text', () => {
    render(
      <QuickToggle
        directive={makeDirective({ label: 'Start free trial' })}
      />,
    );
    expect(screen.getByText('Start free trial')).toBeInTheDocument();
  });

  it('defaults label to "Activate trial" when not provided', () => {
    render(<QuickToggle directive={makeDirective()} />);
    expect(screen.getByText('Activate trial')).toBeInTheDocument();
  });

  it('displays savings amount', () => {
    render(
      <QuickToggle
        directive={makeDirective({ savingsAmount: '£3.99' })}
      />,
    );
    expect(screen.getByText('Save £3.99')).toBeInTheDocument();
  });

  it('displays trial duration', () => {
    render(
      <QuickToggle
        directive={makeDirective({ trialDuration: '14 days' })}
      />,
    );
    expect(screen.getByText('14 days free')).toBeInTheDocument();
  });

  it('displays both savings and trial duration', () => {
    render(
      <QuickToggle
        directive={makeDirective({
          savingsAmount: '£3.99',
          trialDuration: '14 days',
        })}
      />,
    );
    expect(screen.getByText('Save £3.99 · 14 days free')).toBeInTheDocument();
  });

  it('does not render detail line when no savings or trial props', () => {
    render(<QuickToggle directive={makeDirective()} />);
    const detail = screen.queryByText(/Save|free/);
    expect(detail).not.toBeInTheDocument();
  });

  // ── Toggle state ──────────────────────────────────────────────────

  it('starts in the off state', () => {
    render(<QuickToggle directive={makeDirective()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('switches to on state when clicked', () => {
    render(<QuickToggle directive={makeDirective()} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('applies active class when toggled on', () => {
    render(<QuickToggle directive={makeDirective()} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch').className).toContain(
      'pie-quick-toggle__switch--active',
    );
  });

  it('stays on after being toggled on (no toggle off)', () => {
    render(<QuickToggle directive={makeDirective()} />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  // ── Interaction ───────────────────────────────────────────────────

  it('fires toggled-on interaction event on activation', () => {
    const handler = vi.fn<(event: PIEInteractionEvent) => void>();

    render(
      <QuickToggle
        directive={makeDirective()}
        onInteraction={handler}
      />,
    );

    fireEvent.click(screen.getByRole('switch'));

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({
      componentType: 'quick-toggle',
      action: 'toggled-on',
    });
  });

  it('does not fire interaction event on subsequent clicks', () => {
    const handler = vi.fn<(event: PIEInteractionEvent) => void>();

    render(
      <QuickToggle
        directive={makeDirective()}
        onInteraction={handler}
      />,
    );

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not throw when clicked without onInteraction callback', () => {
    render(<QuickToggle directive={makeDirective()} />);
    expect(() => fireEvent.click(screen.getByRole('switch'))).not.toThrow();
  });

  // ── Accessibility ─────────────────────────────────────────────────

  it('has an accessible label', () => {
    render(
      <QuickToggle
        directive={makeDirective({ label: 'Start free trial' })}
      />,
    );
    expect(screen.getByRole('switch')).toHaveAttribute(
      'aria-label',
      'Start free trial',
    );
  });

  it('renders the switch as a button with type="button"', () => {
    render(<QuickToggle directive={makeDirective()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('type', 'button');
  });

  it('uses role="switch" for the toggle element', () => {
    render(<QuickToggle directive={makeDirective()} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });
});
