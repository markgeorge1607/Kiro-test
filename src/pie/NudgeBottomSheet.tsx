import React from 'react';

// ── Figma asset URLs ─────────────────────────────────────────────────
const imgBackground = 'https://www.figma.com/api/mcp/asset/c4116312-5c7e-49ac-93af-56bb24ea0a98';
const imgConfetti = 'https://www.figma.com/api/mcp/asset/af42269a-2a8f-4275-8f6c-7533b3fc26b0';
const imgJetLogo = 'https://www.figma.com/api/mcp/asset/a20b3e7f-0620-4306-893a-472bc2b6d085';
const imgCredit = 'https://www.figma.com/api/mcp/asset/e2804c89-9e3d-4011-a2f4-8c87e00198f8';
const imgOffers = 'https://www.figma.com/api/mcp/asset/86ce7640-4263-4d8f-aaba-d92614eef5bf';
const imgDelivery = 'https://www.figma.com/api/mcp/asset/7dcd8eac-22ad-46aa-a4ea-b192bd260238';
const imgClose = 'https://www.figma.com/api/mcp/asset/0ab425f7-6bef-47f4-a5ce-a1801bbc86cd';

// ── Style constants (PIE Design System) ──────────────────────────────
const font = "'JET Sans Digital', Arial, sans-serif";
const colorDefault = '#242e30';
const colorSubdued = '#3c4c4f';
const colorBrandTonal = '#fddfc3';
const colorBrand = '#f36805';

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
      <p style={{ margin: 0, fontSize: 16, fontWeight: 400, lineHeight: '24px', color: colorDefault }}>{title}</p>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 400, lineHeight: '20px', color: colorSubdued }}>{subtitle}</p>
    </div>
  </div>
);

export interface NudgeBottomSheetProps {
  /** The archetype name: 'squeezed-saver' or 'value-seeker' */
  archetype: string;
  /** The nudge headline message */
  headline: string;
  /** The nudge body message (supports rich text via React nodes) */
  body: React.ReactNode;
  /** The CTA banner text (supports rich text via React nodes) */
  bannerText: React.ReactNode;
  /** Called when the user taps "Start your free trial" */
  onStartTrial: () => void;
  /** Called when the user closes the bottom sheet */
  onClose: () => void;
}

const NudgeBottomSheet: React.FC<NudgeBottomSheetProps> = ({
  body, bannerText, onStartTrial, onClose,
}) => {
  return (
    <>
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
        role="dialog"
        aria-modal="true"
        aria-label="JET+ trial offer"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
          background: 'white', borderRadius: '16px 16px 0 0',
          fontFamily: font, maxWidth: 480, margin: '0 auto',
          maxHeight: '95vh', display: 'flex', flexDirection: 'column',
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
        <div style={{ position: 'relative', height: 236, overflow: 'hidden', flexShrink: 0 }}>
          <img alt="" src={imgBackground} style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          }} />
          {/* Confetti decorations */}
          <img alt="" src={imgConfetti} style={{
            position: 'absolute', top: -63, left: 80, width: 379, height: 237, opacity: 0.3, pointerEvents: 'none',
          }} />
          <img alt="" src={imgConfetti} style={{
            position: 'absolute', top: 53, left: -100, width: 379, height: 237, opacity: 0.3,
            pointerEvents: 'none', transform: 'rotate(180deg)',
          }} />
          {/* "Seriously, Sam?" title */}
          <div style={{
            position: 'absolute', top: 145, left: 0, right: 0, padding: '0 16px 8px',
            textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 32, lineHeight: '36px', fontWeight: 1000, fontStyle: 'italic', color: colorDefault }}>
              Seriously, Sam?
            </p>
          </div>
          {/* JET+ logo */}
          <div style={{
            position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
            width: 119, height: 119,
          }}>
            <img alt="JET+" src={imgJetLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* ── White content card ──────────────────────────────────── */}
        <div style={{
          background: 'white', borderRadius: '24px 24px 0 0', marginTop: -24,
          position: 'relative', zIndex: 1,
          boxShadow: '0px 4px 6px 0px rgba(0,0,0,0.02), 0px 2px 12px 2px rgba(0,0,0,0.04), 0px 3px 4px 0px rgba(0,0,0,0.04)',
        }}>
          {/* Body */}
          <div style={{ padding: '24px 21px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 400, lineHeight: '24px', color: colorDefault }}>
              {body}
            </div>
          </div>

          {/* Benefit rows */}
          <div style={{ padding: '16px 8px 0', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <BenefitRow icon={imgCredit} title="£10 credit" subtitle="use up to £5 credit daily." />
            <BenefitRow icon={imgOffers} title="Exclusive offers" subtitle="from best-loved brands." />
            <BenefitRow icon={imgDelivery} title="5 free deliveries" subtitle="Refreshes each month" />
          </div>

        </div>
        </div>{/* end scrollable content */}

          {/* CTA banner + button — sticky at bottom */}
          <div style={{ padding: '0 16px 32px', background: 'white', flexShrink: 0 }}>
            {/* CTA banner */}
            <div style={{
              margin: '0 0 12px', padding: 8, borderRadius: 8,
              border: `1px solid ${colorBrand}`, overflow: 'hidden',
              backgroundImage: 'linear-gradient(126deg, rgb(255,242,229) 11%, rgb(253,223,195) 42%, rgb(255,211,191) 87%)',
              textAlign: 'center', fontSize: 14, lineHeight: '20px', color: colorDefault,
            }}>
              {bannerText}
            </div>
            <button
              type="button"
              onClick={onStartTrial}
              style={{
                width: '100%', background: colorBrand, color: 'white', border: 'none',
                borderRadius: 5000, padding: '14px 24px', fontSize: 20, fontWeight: 700,
                lineHeight: '28px', cursor: 'pointer', fontFamily: font, textAlign: 'center',
              }}
            >
              Start your free trial
            </button>
          </div>
      </div>
    </>
  );
};

export default NudgeBottomSheet;
