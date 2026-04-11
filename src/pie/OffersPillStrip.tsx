import React from 'react';
import type { PIEComponentProps } from '../types';
import { useTranslation } from '../translation/TranslationContext';

// ── Local images from /images folder ─────────────────────────────────
import imgJetPlusLogo from '../../images/JET+ - read description.png';

interface Offer {
  id: string;
  text: string;
  subtitle?: string;
  variant?: 'jetplus' | 'standard';
}

/**
 * OffersPillStrip PIE component.
 *
 * Renders a horizontally scrollable strip of offer banner cards matching the
 * Figma Partner-Offers design (node 8273:109127). Two card variants:
 * - jetplus: gradient background, orange border, JET+ logo overlay, elevation shadow
 * - standard: tonal yellow background, circular offer tag icon
 *
 * Requirements 1.1–1.7, 2.1–2.5, 3.1–3.5, 4.1–4.5, 6.1–6.5, 7.1–7.2
 */
const OffersPillStrip: React.FC<PIEComponentProps> = ({
  directive,
  onInteraction,
}) => {
  const { t } = useTranslation();
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

  // Track whether we've seen the first jetplus card (for logo overlay)
  let firstJetPlusSeen = false;

  return (
    <>
      <style>{`
        .pie-offers-strip {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: var(--dt-spacing-b);
          overflow-x: auto;
          scrollbar-width: none;
          padding: var(--dt-spacing-c) 10px;
          scroll-behavior: smooth;
        }
        .pie-offers-strip::-webkit-scrollbar {
          display: none;
        }
        .pie-offer-card {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--dt-spacing-c);
          height: 66px;
          box-sizing: border-box;
          border: none;
          cursor: pointer;
          font-family: 'JET Sans Digital', Arial, sans-serif;
          flex-shrink: 0;
          overflow: hidden;
          text-align: left;
        }
        .pie-offer-card--jetplus {
          width: 287px;
          background: linear-gradient(125deg, var(--dt-color-orange-0) 11%, var(--dt-color-orange-10) 42%, #ffd3bf 87%);
          border: 1px solid var(--dt-color-orange);
          border-radius: var(--dt-radius-rounded-c);
          box-shadow: var(--dt-elevation-below-10);
        }
        .pie-offer-card--standard {
          width: 220px;
          background: #fceac0;
          border: none;
          border-radius: var(--dt-radius-rounded-d);
          box-shadow: none;
        }
        .pie-offer-card__content {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          height: 100%;
          position: relative;
        }
        .pie-offer-card__text-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 2px 0;
          min-width: 0;
          flex: 1;
        }
        .pie-offer-card__text-block--jetplus {
          margin-left: 48px;
        }
        .pie-offer-card__text-block--standard {
          margin-left: var(--dt-spacing-f);
        }
        .pie-offer-card__title {
          font-size: 16px;
          font-weight: 900;
          line-height: 20px;
          color: rgba(0,0,0,0.76);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-feature-settings: 'lnum' 1, 'tnum' 1;
          margin: 0;
        }
        .pie-offer-card__subtitle {
          font-size: 12px;
          font-weight: 400;
          line-height: 16px;
          color: var(--dt-color-content-subdued);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-feature-settings: 'lnum' 1, 'tnum' 1;
          margin: 0;
        }
        .pie-offer-card__logo {
          position: absolute;
          left: 10px;
          top: 13px;
          width: 38px;
          height: 38px;
          pointer-events: none;
          z-index: 1;
        }
        .pie-offer-card__tag-icon {
          position: absolute;
          left: 0;
          top: 0;
          width: var(--dt-spacing-e);
          height: var(--dt-spacing-e);
          background: var(--dt-color-support-brand-05);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pie-offer-card__arrow {
          flex-shrink: 0;
          margin-left: var(--dt-spacing-b);
        }
        @media (prefers-reduced-motion: reduce) {
          .pie-offers-strip {
            scroll-behavior: auto;
          }
        }
      `}</style>
      <div className="pie-offers-strip" role="list" aria-label={t("Available offers")}>
        {offers.map((offer) => {
          const isJetPlus = offer.variant === 'jetplus';
          const showLogo = isJetPlus && !firstJetPlusSeen;
          if (isJetPlus) firstJetPlusSeen = true;

          return (
            <div role="listitem" key={offer.id}>
              <button
                type="button"
                className={`pie-offer-card ${isJetPlus ? 'pie-offer-card--jetplus' : 'pie-offer-card--standard'}`}
                onClick={() => handleCardTap(offer.id)}
              >
                {/* JET+ logo overlay on first jetplus card */}
                {showLogo && (
                  <img
                    className="pie-offer-card__logo"
                    src={imgJetPlusLogo}
                    alt=""
                    width={38}
                    height={38}
                  />
                )}

                <div className="pie-offer-card__content">
                  {/* Standard offer tag icon (PIE offer icon) */}
                  {!isJetPlus && (
                    <div className="pie-offer-card__tag-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" role="presentation" focusable={false} width="14" height="14" viewBox="0 0 16 16" fill="#242E30" aria-hidden="true">
                        <path d="M7.676 14.939 1.087 8.35l6.38-6.387a1.409 1.409 0 0 1 1.12-.403l5.337.534.533 5.346a1.373 1.373 0 0 1-.393 1.111L7.676 14.94ZM2.942 8.35l4.734 4.734 5.46-5.46-.411-4.331-4.27-.42L2.942 8.35Zm7.683-3.85a.875.875 0 1 0 0 1.75.875.875 0 0 0 0-1.75Z" />
                      </svg>
                    </div>
                  )}

                  <div className={`pie-offer-card__text-block ${isJetPlus ? 'pie-offer-card__text-block--jetplus' : 'pie-offer-card__text-block--standard'}`}>
                    <p className="pie-offer-card__title">{t(offer.text)}</p>
                    {offer.subtitle && (
                      <p className="pie-offer-card__subtitle">{t(offer.subtitle)}</p>
                    )}
                  </div>
                </div>

                {/* Arrow Right chevron (PIE chevron-right) */}
                <svg className="pie-offer-card__arrow" xmlns="http://www.w3.org/2000/svg" role="presentation" focusable={false} width="16" height="16" viewBox="0 0 16 16" fill="rgba(0,0,0,0.76)" aria-hidden="true">
                  <path d="M5.044 13.18 10.399 8 5 2.82l.875-.962 5.539 5.346a1.164 1.164 0 0 1 0 1.636l-5.469 5.285-.901-.945Z" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default OffersPillStrip;
