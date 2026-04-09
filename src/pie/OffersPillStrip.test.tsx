import { render, screen, fireEvent } from '@testing-library/react';
import { render as pieRender, registerComponent, clearRegistry } from './PIERenderer';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import OffersPillStrip from './OffersPillStrip';
import type { UIDirective } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

function makeDirective(props: Record<string, unknown> = {}): UIDirective {
  return { componentType: 'offers-pill-strip', props };
}

// ── Unit Tests ───────────────────────────────────────────────────────

describe('OffersPillStrip', () => {
  it('renders 2 known offers with correct text content', () => {
    const offers = [
      { id: 'offer-1', text: 'Get £10 Monthly Credit', subtitle: 'through Just Eat+ savings', variant: 'jetplus' as const },
      { id: 'offer-2', text: 'Buy 1 get 1 free', subtitle: 'When you spend £15', variant: 'standard' as const },
    ];
    render(<OffersPillStrip directive={makeDirective({ offers })} />);
    expect(screen.getByText('Get £10 Monthly Credit')).toBeInTheDocument();
    expect(screen.getByText('Buy 1 get 1 free')).toBeInTheDocument();
    expect(screen.getByText('through Just Eat+ savings')).toBeInTheDocument();
    expect(screen.getByText('When you spend £15')).toBeInTheDocument();
  });

  it('single offer renders without errors', () => {
    const offers = [{ id: 'offer-1', text: 'Free delivery', variant: 'standard' as const }];
    render(<OffersPillStrip directive={makeDirective({ offers })} />);
    expect(screen.getByText('Free delivery')).toBeInTheDocument();
  });

  it('empty offers array returns null', () => {
    const { container } = render(
      <OffersPillStrip directive={makeDirective({ offers: [] })} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('missing offers prop returns null', () => {
    const { container } = render(
      <OffersPillStrip directive={makeDirective()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('arrow icons have aria-hidden="true"', () => {
    const offers = [
      { id: 'offer-1', text: 'Deal A', variant: 'jetplus' as const },
      { id: 'offer-2', text: 'Deal B', variant: 'standard' as const },
    ];
    const { container } = render(
      <OffersPillStrip directive={makeDirective({ offers })} />,
    );
    const arrows = container.querySelectorAll('.pie-offer-card__arrow');
    expect(arrows).toHaveLength(2);
    arrows.forEach((arrow) => {
      expect(arrow).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('jetplus variant renders with orange border', () => {
    const offers = [{ id: 'jp-1', text: 'JET+ Deal', variant: 'jetplus' as const }];
    const { container } = render(
      <OffersPillStrip directive={makeDirective({ offers })} />,
    );
    const card = container.querySelector('.pie-offer-card--jetplus');
    expect(card).not.toBeNull();
  });

  it('standard variant renders with tonal background class', () => {
    const offers = [{ id: 'std-1', text: 'Standard Deal', variant: 'standard' as const }];
    const { container } = render(
      <OffersPillStrip directive={makeDirective({ offers })} />,
    );
    const card = container.querySelector('.pie-offer-card--standard');
    expect(card).not.toBeNull();
  });

  it('card tap fires onInteraction with correct payload', () => {
    const onInteraction = vi.fn();
    const offers = [{ id: 'tap-1', text: 'Tap me', variant: 'standard' as const }];
    render(
      <OffersPillStrip
        directive={makeDirective({ offers })}
        onInteraction={onInteraction}
      />,
    );
    fireEvent.click(screen.getByText('Tap me'));
    expect(onInteraction).toHaveBeenCalledWith({
      componentType: 'offers-pill-strip',
      action: 'offer-tapped',
      payload: { offerId: 'tap-1' },
    });
  });

  describe('PIE_Renderer registration', () => {
    beforeEach(() => {
      clearRegistry();
    });

    it('registers with PIE_Renderer and renders via render() function', () => {
      registerComponent('offers-pill-strip', OffersPillStrip);
      const directive = makeDirective({
        offers: [{ id: 'o1', text: 'Half price', variant: 'standard' }],
      });
      const element = pieRender(directive);
      expect(element).not.toBeNull();
      render(element!);
      expect(screen.getByText('Half price')).toBeInTheDocument();
    });
  });

  it('container has role="list" and aria-label, cards are buttons in listitems', () => {
    const offers = [
      { id: 'a1', text: 'Offer A', variant: 'standard' as const },
      { id: 'a2', text: 'Offer B', variant: 'jetplus' as const },
    ];
    const { container } = render(
      <OffersPillStrip directive={makeDirective({ offers })} />,
    );
    const list = container.querySelector('[role="list"]');
    expect(list).not.toBeNull();
    expect(list!.getAttribute('aria-label')).toBe('Available offers');

    const listItems = container.querySelectorAll('[role="listitem"]');
    expect(listItems).toHaveLength(2);

    const buttons = container.querySelectorAll('.pie-offer-card');
    expect(buttons).toHaveLength(2);
    buttons.forEach((b) => expect(b.tagName).toBe('BUTTON'));
  });
});
