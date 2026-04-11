import React, { useEffect, useRef, useCallback } from 'react';
import Lottie from 'lottie-react';
import type { PIEComponentProps } from '../types';
import { useTranslation } from '../translation/TranslationContext';

// ── Local images from /images folder ─────────────────────────────────
import imgJetLogo from '../../images/JET+ - read description.png';

// ── Lottie confetti animation ────────────────────────────────────────
import confettiAnimationData from '../../Animation/_03 Jet + Confetti (1).json';

// ── PIE icon SVGs (@justeattakeaway/pie-icons) ──────────────────────
const pieIcon = (svgPath: string, color = '#242e30') =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" role="presentation" focusable="false" fill="${color}" viewBox="0 0 16 16">${svgPath}</svg>`)}`;

const imgCheckCircle = pieIcon('<path d="M8 1.478A6.524 6.524 0 0 0 1.478 8c0 3.6 2.922 6.522 6.522 6.522S14.52 11.6 14.52 8 11.6 1.478 8 1.478Zm-.27 8.844a1.006 1.006 0 0 1-1.47.009L4.696 8.616l.966-.878L6.99 9.2l3.34-3.626.956.887-3.565 3.87.008-.01Z"/>', '#4caf50');

// Header gradient — soft peach-orange fading smoothly to white (PIE product orange tonal)
const headerGradient = 'linear-gradient(to bottom, rgba(243,104,5,0.12) 0%, rgba(243,104,5,0.06) 50%, rgba(243,104,5,0) 100%)';

// ── Style constants (PIE Design System) ──────────────────────────────
const font = "'JET Sans Digital', Arial, sans-serif";
const colorDefault = '#242e30';
const colorSubdued = 'rgba(0,0,0,0.64)';
const colorContentDefault = 'rgba(0,0,0,0.76)';
const tealBg = '#E7F4F6';

const bodyFont = "'Takeaway Sans', 'JET Sans Digital', Arial, sans-serif";

/**
 * CelebrationBottomSheet PIE component.
 *
 * Renders a rich confirmation bottom sheet when a user activates a free trial.
 * Auto-dismisses after a configurable duration. Fires a "dismissed" interaction
 * event on close (auto-dismiss, backdrop tap, or Escape key).
 *
 * Registered as componentType: "celebration-sheet"
 */
const CelebrationBottomSheet: React.FC<PIEComponentProps> = ({ directive, onInteraction }) => {
  const { t } = useTranslation();
  const bodyMessage = (directive.props.bodyMessage as string) ?? '';
  const autoDismissDuration =
    typeof directive.props.autoDismissDuration === 'number' && directive.props.autoDismissDuration > 0
      ? directive.props.autoDismissDuration
      : 4000;

  const dismissedRef = useRef(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    onInteraction?.({
      componentType: 'celebration-sheet',
      action: 'dismissed',
    });

    // Return focus to previously focused element (Req 6.4)
    try {
      previousFocusRef.current?.focus();
    } catch {
      // Element may no longer be in the DOM
    }
  }, [onInteraction]);

  // Capture previous focus, move focus to sheet, start auto-dismiss timer
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Move focus to sheet container (Req 6.3)
    try {
      sheetRef.current?.focus();
    } catch {
      // Ignore
    }

    timerRef.current = setTimeout(() => {
      dismiss();
    }, autoDismissDuration);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [autoDismissDuration, dismiss]);

  // Escape key handler (Req 6.5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dismiss]);

  if (dismissedRef.current) return null;

  return (
    <>
      <style>{`
        @keyframes celebration-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes celebration-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .celebration-sheet { animation: none !important; }
          .celebration-confetti { animation: none !important; }
          .celebration-confetti svg { animation-play-state: paused !important; }
        }
      `}</style>

      {/* Backdrop overlay (Req 7.1, 7.2, 7.3) */}
      <div
        data-testid="celebration-backdrop"
        onClick={dismiss}
        role="presentation"
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
        }}
      />

      {/* Bottom sheet (Req 1.1, 6.1, 6.2) */}
      <div
        ref={sheetRef}
        className="celebration-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t("JET+ trial activation confirmed")}
        tabIndex={-1}
        data-testid="celebration-sheet"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 1000,
          background: 'white',
          borderRadius: '12px 12px 0 0',
          overflow: 'visible',
          fontFamily: font,
          maxWidth: 480, margin: '0 auto',
          boxShadow: '0px -3px 6px 0px rgba(0,0,0,0.06), 0px -2px 12px -2px rgba(0,0,0,0.08), 0px -4px 6px 0px rgba(0,0,0,0.02)',
          animation: 'celebration-slide-up 0.3s ease-out',
        }}
      >
        {/* Confetti Lottie overlay — sits just above the modal top (Req 5.1, 5.3, 5.4) */}
        <div
          aria-hidden="true"
          className="celebration-confetti"
          data-testid="celebration-confetti"
          style={{
            position: 'absolute',
            bottom: 'calc(100% - 60px)',
            left: 0,
            right: 0,
            height: 'auto',
            pointerEvents: 'none',
            animation: 'celebration-fade-in 0.5s ease-out',
          }}
        >
          <Lottie
            animationData={confettiAnimationData}
            loop={false}
            autoplay={true}
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
        {/* Inner content wrapper with clipped corners */}
        <div style={{ borderRadius: '12px 12px 0 0', overflow: 'hidden', background: 'white' }}>
        {/* Header section (Req 1.2) */}
        <div style={{ position: 'relative', overflow: 'hidden', background: headerGradient }}>

          {/* Pull tab overlaid on header */}
          <div style={{ position: 'absolute', top: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 2 }}>
            <div
              data-testid="celebration-pull-tab"
              style={{
                width: 32, height: 4,
                borderRadius: 2.5,
                background: 'rgba(60,60,67,0.3)',
                opacity: 0.5,
              }}
            />
          </div>

          {/* Title + Logo row */}
          <div style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '24px 16px 12px',
          }}>
            {/* Welcome title (Req 1.3) */}
            <div style={{ flex: 1 }}>
              <p
                data-testid="celebration-title"
                style={{
                  margin: 0, fontSize: 32, lineHeight: '36px',
                  fontWeight: 1000,
                  color: colorDefault, fontFamily: font,
                }}
              >
                {t('Welcome to')}<br />
                <span style={{ paddingLeft: 24 }}>{t('Just Eat+')}</span>
              </p>
            </div>

            {/* JET+ logo (Req 1.2) */}
            <div style={{ width: 84, height: 84, flexShrink: 0 }}>
              <img
                alt="JET+"
                src={imgJetLogo}
                data-testid="celebration-jet-logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>

        {/* Body message (Req 1.4, 2.1, 2.2) */}
        <div style={{ padding: '8px 16px 8px' }}>
          <p
            data-testid="celebration-body"
            style={{
              margin: 0, fontSize: 16, fontWeight: 400,
              lineHeight: '24px', color: colorDefault,
              fontFamily: bodyFont,
            }}
          >
            {t(bodyMessage)}
          </p>
        </div>

        {/* Trial Active Indicator (Req 1.5) */}
        <div style={{ padding: '0 12px 16px' }}>
          <div
            data-testid="celebration-trial-indicator"
            style={{
              background: tealBg,
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}
          >
            <div style={{ width: 24, height: 24, flexShrink: 0 }}>
              <img
                alt=""
                src={imgCheckCircle}
                data-testid="celebration-check-icon"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <div>
              <p style={{
                margin: 0, fontSize: 16, fontWeight: 700,
                lineHeight: '24px', color: colorContentDefault,
                fontFamily: bodyFont,
              }}>
                {t('JET+ trial active')}
              </p>
              <p style={{
                margin: 0, fontSize: 16, fontWeight: 400,
                lineHeight: '24px', color: colorSubdued,
                fontFamily: bodyFont,
              }}>
                {t('Delivery fee removed')}
              </p>
            </div>
          </div>
        </div>
        </div>{/* end inner content wrapper */}
      </div>
    </>
  );
};

export default CelebrationBottomSheet;
