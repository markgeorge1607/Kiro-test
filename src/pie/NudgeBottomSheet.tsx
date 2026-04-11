import React, { useState } from 'react';
import { useTranslation } from '../translation/TranslationContext';

// ── Local images from /images folder ─────────────────────────────────
import imgJetLogo from '../../images/JET+ - read description.png';
import imgCreditImg from '../../images/light-jetplus-account-credit.png';
import imgOffersImg from '../../images/light-jetplus-exclusive-offers-1.png';
import imgDeliveryImg from '../../images/light-jetplus-free-delivery.png';

// ── PIE icon SVGs (@justeattakeaway/pie-icons) ──────────────────────
const pieIcon = (svgPath: string, color = '#242e30') =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" role="presentation" focusable="false" fill="${color}" viewBox="0 0 16 16">${svgPath}</svg>`)}`;

const imgClose = pieIcon('<path d="M11.868 3.205 8 7.073 4.133 3.205l-.928.928L7.073 8l-3.868 3.868.928.927L8 8.928l3.868 3.867.927-.927L8.928 8l3.867-3.867-.927-.928Z"/>');

// Inline decorative assets (no PIE equivalent)
const headerGradient = 'linear-gradient(to bottom, rgba(243,104,5,0.12) 0%, rgba(243,104,5,0.06) 50%, rgba(243,104,5,0) 100%)';

// Benefit row icons — use local images from /images folder
const imgCredit = imgCreditImg;
const imgOffers = imgOffersImg;
const imgDelivery = imgDeliveryImg;

// ── Style constants (PIE Design System) ──────────────────────────────
const font = "'JET Sans Digital', Arial, sans-serif";
const colorDefault = '#242e30';
const colorSubdued = '#3c4c4f';
const colorBrandTonal = '#fddfc3';
const colorBrand = '#f36805';
const colorDivider = 'rgba(0,0,0,0.08)';

const bodyFont = "'Takeaway Sans', 'JET Sans Digital', Arial, sans-serif";

interface BenefitRowProps {
  icon: string;
  title: string;
  subtitle: string;
}

const BenefitRow: React.FC<BenefitRowProps> = ({ icon, title, subtitle }) => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '12px 16px 11px' }}>
    <div style={{
      width: 50, height: 50, flexShrink: 0, background: colorBrandTonal,
      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4,
    }}>
      <img alt="" src={icon} style={{ width: 43, height: 43, objectFit: 'cover' }} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 400, lineHeight: '24px', color: colorDefault, fontFamily: bodyFont }}>{title}</p>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 400, lineHeight: '24px', color: colorSubdued, fontFamily: bodyFont }}>{subtitle}</p>
    </div>
  </div>
);

// ── Chevron SVG icon (PIE chevron-down) ──────────────────────────────
const ChevronDown: React.FC<{ rotated?: boolean }> = ({ rotated }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    role="presentation"
    focusable={false}
    width="24" height="24" viewBox="0 0 16 16"
    fill={colorDefault}
    aria-hidden="true"
    style={{
      transition: 'transform 0.2s ease',
      transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)',
      flexShrink: 0,
    }}
  >
    <path d="M2.82 5.044 8 10.399 13.197 5l.963.875-5.364 5.565a1.164 1.164 0 0 1-1.636 0L1.875 5.945l.945-.901Z" />
  </svg>
);

// ── FAQ Accordion item ───────────────────────────────────────────────
interface AccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  showDivider: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ question, answer, isOpen, onToggle, showDivider }) => (
  <div>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      style={{
        display: 'flex', gap: 16, alignItems: 'flex-start', width: '100%',
        padding: '16px 16px 15px', background: 'transparent', border: 'none',
        cursor: 'pointer', textAlign: 'left', fontFamily: font,
      }}
    >
      <span style={{
        flex: 1, fontSize: 16, fontWeight: 400, lineHeight: '24px', color: colorDefault, fontFamily: bodyFont,
      }}>
        {question}
      </span>
      <ChevronDown rotated={isOpen} />
    </button>
    {isOpen && (
      <div style={{ padding: '0 16px 16px', fontSize: 16, lineHeight: '24px', color: colorSubdued, fontFamily: bodyFont }}>
        {answer}
      </div>
    )}
    {showDivider && (
      <div style={{ height: 1, background: colorDivider, margin: '0 16px' }} />
    )}
  </div>
);


// ── FAQ data ─────────────────────────────────────────────────────────
const faqItems = [
  {
    question: 'What payment methods can I use?',
    answer: 'You can use any debit or credit card (Visa, Mastercard, Amex) saved to your account or enter a new one.',
  },
  {
    question: 'Where can I use my credit?',
    answer: 'Your JET+ credit can be used on any order from participating restaurants, up to £5 per day.',
  },
  {
    question: 'Can I cancel my Just Eat+ membership?',
    answer: 'Yes, you can cancel anytime from your account settings. If you cancel during the free trial, you won\'t be charged.',
  },
];

export interface NudgeBottomSheetProps {
  /** The archetype name: 'squeezed-saver' or 'value-seeker' */
  archetype: string;
  /** The nudge headline message */
  headline: string;
  /** The nudge body message (supports rich text via React nodes) */
  body: React.ReactNode;
  /** The CTA banner text (supports rich text via React nodes) */
  bannerText: React.ReactNode;
  /** Called when the user taps "Unlock benefits" */
  onStartTrial: () => void;
  /** Called when the user closes the bottom sheet */
  onClose: () => void;
}

const NudgeBottomSheet: React.FC<NudgeBottomSheetProps> = ({
  archetype, body, onStartTrial, onClose,
}) => {
  const { t } = useTranslation();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const heroTitle = archetype === 'value-seeker'
    ? t('Alex, did you know?')
    : t('Stop paying the convenience tax, Sam!');

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(prev => (prev === index ? null : index));
  };

  return (
    <>
      <style>{`
        @keyframes nudge-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .nudge-bottom-sheet { animation: none !important; }
          .nudge-bottom-sheet .chevron-icon { transition: none !important; }
        }
      `}</style>

      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        role="presentation"
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999,
        }}
      />

      {/* Bottom sheet */}
      <div
        className="nudge-bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t("JET+ trial offer")}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
          background: 'white', borderRadius: '16px 16px 0 0',
          fontFamily: font, maxWidth: 480, margin: '0 auto',
          maxHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column',
          animation: 'nudge-slide-up 0.35s ease-out',
        }}
      >
        {/* Scrollable content area */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>

          {/* Close button — pinned in position */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, height: 0, textAlign: 'right' }}>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              style={{
                marginTop: 16, marginRight: 16,
                width: 40, height: 40,
                background: 'white', border: 'none', borderRadius: 5000, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              }}
            >
              <img alt="" src={imgClose} style={{ width: 24, height: 24 }} />
            </button>
          </div>

          {/* ── Hero section with background + confetti + JET+ logo ── */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* Background gradient area */}
            <div style={{ position: 'relative', height: 160, overflow: 'hidden', background: headerGradient }}>
              {/* JET+ logo */}
              <div style={{
                position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
                width: 119, height: 119,
              }}>
                <img alt="JET+" src={imgJetLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            {/* Hero title — flows naturally below the background */}
            <div style={{ padding: '16px 16px 8px', textAlign: 'center' }}>
              <p style={{
                margin: 0, fontSize: 28, lineHeight: '32px', fontWeight: 1000,
                color: colorDefault, fontFamily: font,
              }}>
                {heroTitle}
              </p>
            </div>
          </div>

          {/* ── White content card ──────────────────────────────────── */}
          <div style={{
            background: 'white', borderRadius: '24px 24px 0 0',
            position: 'relative', zIndex: 1,
          }}>
            {/* Body text */}
            <div style={{ padding: '24px 21px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 400, lineHeight: '24px', color: colorDefault, fontFamily: bodyFont }}>
                {body}
              </div>
            </div>

            {/* Benefit rows */}
            <div style={{ padding: '16px 8px 0', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <BenefitRow icon={imgCredit} title={t("£10 credit")} subtitle={t("use up to £5 credit daily.")} />
              <BenefitRow icon={imgOffers} title={t("Exclusive offers")} subtitle={t("from best-loved brands.")} />
              <BenefitRow icon={imgDelivery} title={t("5 free deliveries")} subtitle={t("Refreshes each month")} />
            </div>
          </div>

          {/* ── Divider ───────────────────────────────────────────── */}
          <div style={{ padding: '16px 0' }}>
            <div style={{ height: 1, background: colorDivider }} />
          </div>

          {/* ── FAQ Section ───────────────────────────────────────── */}
          <div style={{ paddingTop: 8, paddingBottom: 24 }}>
            <p style={{
              margin: 0, padding: '0 16px', fontSize: 16, fontWeight: 700,
              lineHeight: '24px', color: colorDefault, fontFamily: bodyFont,
            }}>
              {t('FAQs')}
            </p>
            <div>
              {faqItems.map((faq, index) => (
                <AccordionItem
                  key={index}
                  question={t(faq.question)}
                  answer={t(faq.answer)}
                  isOpen={openFaqIndex === index}
                  onToggle={() => toggleFaq(index)}
                  showDivider={index < faqItems.length - 1}
                />
              ))}
            </div>
          </div>

        </div>{/* end scrollable content */}

        {/* ── Button group — sticky at bottom ─────────────────────── */}
        <div style={{
          padding: '24px 16px', background: 'white', flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 10,
          boxShadow: '0px -3px 6px 0px rgba(0,0,0,0.02), 0px -2px 12px 0px rgba(0,0,0,0.03), 0px -4px 6px 0px rgba(0,0,0,0.01)',
        }}>
          <button
            type="button"
            onClick={onStartTrial}
            style={{
              width: '100%', background: colorBrand, color: 'white', border: 'none',
              borderRadius: 5000, padding: '14px 24px', fontSize: 20, fontWeight: 700,
              lineHeight: '28px', cursor: 'pointer', fontFamily: font, textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            {t('Unlock benefits')}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%', background: 'transparent', color: colorDefault,
              border: 'none', borderRadius: 5000,
              padding: '10px 24px', fontSize: 16, fontWeight: 700,
              lineHeight: '24px', cursor: 'pointer', fontFamily: font, textAlign: 'center',
            }}
          >
            {t('No thanks')}
          </button>
        </div>
      </div>
    </>
  );
};

export default NudgeBottomSheet;
