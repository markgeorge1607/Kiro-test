import React from 'react';
import type { PIEComponentProps } from '../types';

// ── Figma asset URLs (expire after 7 days) ───────────────────────────
const imgJetLogo = 'https://www.figma.com/api/mcp/asset/2aca0e6f-16ed-4b43-8054-953991712abc';
const imgOffer = 'https://www.figma.com/api/mcp/asset/47310c6b-4861-4715-b5c0-8fdb625a1780';

// ── Style constants (PIE Design System) ──────────────────────────────
const font = "'JET Sans Digital', Arial, sans-serif";
const colorDefault = 'rgba(0,0,0,0.76)';
const colorSubdued = 'rgba(0,0,0,0.64)';
const colorBrand05 = '#f6c243';
const colorBrand05Tonal = '#fceac0';
const colorBrandInteractive = '#f36805';

interface Offer {
  id: string;
  text: string;
  subtitle?: string;
  variant?: 'jetplus' | 'standard';
}

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
    aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M5.5 3L10.5 8L5.5 13" stroke="rgba(0,0,0,0.76)"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * OffersPillStrip PIE component.
 *
 * Renders a horizontally scrollable strip of offer banner cards
 * matching the Figma Partner-Offers design (node 8267:109063).
 *
 * Two card variants:
 *  - "jetplus": gradient bg, orange border, JET+ logo overlay
 *  - "standard": yellow tonal bg, offer tag icon
 */
const OffersPillStrip: React.FC<PIEComponentProps> = ({
  directive,
  onInteraction,
}) => {
  const offers = directive.props.offers as Offer[] | undefined;

  if (!offers || offers.length === 0) {
    return null;
  }

  const handleCardTap = (offerId: string) => {
    onInteraction?.({
      componentType: 'offers-pill-strip',
      action: 'offer-tapped',
      payload: { offerId },
    });
  };

  return (
    <>
      <style>{`
        .pie-offers-strip {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 12px 10px;
          position: relative;
        }
        .pie-offers-strip::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .pie-offers-strip { scroll-behavior: auto; }
        }
      `}</style>
      <div className="pie-offers-strip" role="list" aria-label="Available offers">
        {offers.map((offer, index) => {
          const isJetPlus = offer.variant === 'jetplus';
          return (
            <div role="listitem" key={offer.id}
              style={{ flexShrink: 0, position: 'relative' }}>
              <button
                type="button"
                className="pie-offers-pill"
                onClick={() => handleCardTap(offer.id)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  width: isJetPlus ? 287 : 220,
                  height: 66,
                  padding: 0,
                  borderRadius: isJetPlus ? 12 : 16,
                  border: isJetPlus
                    ? `1px solid ${colorBrandInteractive}`
                    : 'none',
                  background: isJetPlus
                    ? 'linear-gradient(125deg, #fff2e5 11%, #fddfc3 42%, #ffd3bf 87%)'
                    : colorBrand05Tonal,
                  boxShadow: isJetPlus
                    ? '0px 2px 6px 2px rgba(0,0,0,0.02), 0px 2px 12px 0px rgba(0,0,0,0.03), 0px 2px 6px 0px rgba(0,0,0,0.01)'
                    : 'none',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  fontFamily: font,
                  textAlign: 'left',
                  boxSizing: 'border-box',
                }}
              >
                {/* Inner content with 12px padding */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flex: 1,
                  height: '100%',
                  padding: 12,
                  position: 'relative',
                  minWidth: 0,
                }}>
                  <div style={{
                    position: 'relative', height: 42, width: 260,
                  }}>
                    {/* Offer tag icon — standard variant, circle shape */}
                    {!isJetPlus && (
                      <div style={{
                        position: 'absolute', left: 0, top: 0,
                        width: 24, height: 24,
                        background: colorBrand05,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <img alt="" src={imgOffer}
                          style={{ width: 14, height: 14 }} />
                      </div>
                    )}
                    {/* Text block — offset further right on jetplus to clear the logo */}
                    <div style={{
                      position: 'absolute', left: isJetPlus ? 48 : 32, top: 0,
                      width: isJetPlus ? 212 : 228,
                      display: 'flex', flexDirection: 'column',
                      gap: 2, padding: '2px 0',
                    }}>
                      <span style={{
                        fontSize: 16, fontWeight: 900,
                        fontStyle: 'italic', lineHeight: '20px',
                        color: colorDefault,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', width: '100%',
                        display: 'block',
                        fontFeatureSettings: "'lnum' 1, 'tnum' 1",
                      }}>
                        {offer.text}
                      </span>
                      {offer.subtitle && (
                        <span style={{
                          fontSize: 12, fontWeight: 400,
                          lineHeight: '16px', color: colorSubdued,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', width: '100%',
                          display: 'block',
                          fontFeatureSettings: "'lnum' 1, 'tnum' 1",
                        }}>
                          {offer.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight />
                </div>
              </button>
              {/* JET+ logo overlay — positioned per Figma at x=10 y=13 relative to card */}
              {isJetPlus && index === 0 && (
                <div style={{
                  position: 'absolute', left: 10, top: 13,
                  width: 38, height: 38,
                  zIndex: 1, pointerEvents: 'none',
                }}>
                  <img alt="JET+" src={imgJetLogo} style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default OffersPillStrip;
