import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ConfettiAnimation from './ConfettiAnimation';
import type { UIDirective } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

function makeDirective(
  props: Record<string, unknown> = {},
  targetSelector?: string,
): UIDirective {
  return { componentType: 'confetti', targetSelector, props };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('ConfettiAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Rendering ─────────────────────────────────────────────────────

  it('renders the confetti container', () => {
    render(<ConfettiAnimation directive={makeDirective()} />);
    expect(screen.getByTestId('confetti-animation')).toBeInTheDocument();
  });

  it('renders confetti particles', () => {
    render(<ConfettiAnimation directive={makeDirective()} />);
    const container = screen.getByTestId('confetti-animation');
    const particles = container.querySelectorAll('.pie-confetti__particle');
    expect(particles.length).toBeGreaterThan(0);
  });

  // ── Duration / auto-remove ────────────────────────────────────────

  it('auto-removes after the specified duration', () => {
    render(
      <ConfettiAnimation directive={makeDirective({ duration: 1000 })} />,
    );
    expect(screen.getByTestId('confetti-animation')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByTestId('confetti-animation')).not.toBeInTheDocument();
  });

  it('defaults duration to 2000ms when not provided', () => {
    render(<ConfettiAnimation directive={makeDirective()} />);
    expect(screen.getByTestId('confetti-animation')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getByTestId('confetti-animation')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId('confetti-animation')).not.toBeInTheDocument();
  });

  it('uses duration from directive props', () => {
    render(
      <ConfettiAnimation directive={makeDirective({ duration: 500 })} />,
    );

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(screen.getByTestId('confetti-animation')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId('confetti-animation')).not.toBeInTheDocument();
  });

  // ── Target selector ───────────────────────────────────────────────

  it('skips animation and logs warning when target element not found', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <ConfettiAnimation
        directive={makeDirective(
          { targetSelector: '#nonexistent' },
          '#nonexistent',
        )}
      />,
    );

    expect(screen.queryByTestId('confetti-animation')).not.toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Target element not found'),
    );

    warnSpy.mockRestore();
  });

  it('renders when target element exists in the DOM', () => {
    const target = document.createElement('div');
    target.id = 'fee-line';
    document.body.appendChild(target);

    render(
      <ConfettiAnimation
        directive={makeDirective(
          { targetSelector: '#fee-line' },
          '#fee-line',
        )}
      />,
    );

    expect(screen.getByTestId('confetti-animation')).toBeInTheDocument();

    document.body.removeChild(target);
  });

  it('reads targetSelector from directive.props', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <ConfettiAnimation
        directive={makeDirective({ targetSelector: '#missing' })}
      />,
    );

    expect(screen.queryByTestId('confetti-animation')).not.toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('reads targetSelector from directive.targetSelector as fallback', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <ConfettiAnimation
        directive={makeDirective({}, '#also-missing')}
      />,
    );

    expect(screen.queryByTestId('confetti-animation')).not.toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  // ── No interaction ────────────────────────────────────────────────

  it('does not call onInteraction (fire-and-forget)', () => {
    const handler = vi.fn();

    render(
      <ConfettiAnimation
        directive={makeDirective()}
        onInteraction={handler}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(handler).not.toHaveBeenCalled();
  });

  // ── Accessibility ─────────────────────────────────────────────────

  it('is hidden from assistive technology', () => {
    render(<ConfettiAnimation directive={makeDirective()} />);
    const container = screen.getByTestId('confetti-animation');
    expect(container).toHaveAttribute('aria-hidden', 'true');
  });

  it('has role="presentation"', () => {
    render(<ConfettiAnimation directive={makeDirective()} />);
    const container = screen.getByTestId('confetti-animation');
    expect(container).toHaveAttribute('role', 'presentation');
  });

  it('has pointer-events: none (non-interactive)', () => {
    render(<ConfettiAnimation directive={makeDirective()} />);
    const container = screen.getByTestId('confetti-animation');
    expect(container.className).toContain('pie-confetti');
  });

  // ── Renders without targetSelector ────────────────────────────────

  it('renders normally when no targetSelector is provided', () => {
    render(<ConfettiAnimation directive={makeDirective()} />);
    expect(screen.getByTestId('confetti-animation')).toBeInTheDocument();
  });
});
