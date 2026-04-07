import { render, screen } from '@testing-library/react';
import { render as pieRender, registerComponent, clearRegistry } from './PIERenderer';
import { describe, it, expect, beforeEach } from 'vitest';
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
      { id: 'offer-1', text: '20% off when you spend £15' },
      { id: 'offer-2', text: 'Free delivery on orders over £20' },
    ];
    render(<OffersPillStrip directive={makeDirective({ offers })} />);
    expect(screen.getByText('20% off when you spend £15')).toBeInTheDocument();
    expect(screen.getByText('Free delivery on orders over £20')).toBeInTheDocument();
  });

  it('single offer renders no separator', () => {
    const offers = [{ id: 'offer-1', text: 'Buy one get one free' }];
    const { container } = render(
      <OffersPillStrip directive={makeDirective({ offers })} />,
    );
    expect(screen.getByText('Buy one get one free')).toBeInTheDocument();
    expect(container.querySelectorAll('.pie-offers-diamond')).toHaveLength(0);
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

  it('renders arrow icons with aria-hidden="true"', () => {
    const offers = [
      { id: 'offer-1', text: 'Deal A' },
      { id: 'offer-2', text: 'Deal B' },
      { id: 'offer-3', text: 'Deal C' },
    ];
    const { container } = render(
      <OffersPillStrip directive={makeDirective({ offers })} />,
    );
    const arrows = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(arrows).toHaveLength(3);
    arrows.forEach((arrow) => {
      expect(arrow).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('PIE_Renderer registration', () => {
    beforeEach(() => {
      clearRegistry();
    });

    it('registers with PIE_Renderer and renders via render() function', () => {
      registerComponent('offers-pill-strip', OffersPillStrip);
      const directive = makeDirective({
        offers: [{ id: 'o1', text: 'Half price' }],
      });
      const element = pieRender(directive);
      expect(element).not.toBeNull();
      render(element!);
      expect(screen.getByText('Half price')).toBeInTheDocument();
    });
  });
});
