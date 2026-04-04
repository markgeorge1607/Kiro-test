import React, { useEffect, useRef, useCallback } from 'react';
import type { PIEComponentProps } from '../types';

// ── Figma asset URLs ─────────────────────────────────────────────────
const imgBackground = 'https://www.figma.com/api/mcp/asset/4acbe990-de34-471f-ae50-75be44c945be';
const imgJetLogo = 'https://www.figma.com/api/mcp/asset/60adb290-bbcf-4188-8e1b-51f7979e8581';
const imgConfetti = 'https://www.figma.com/api/mcp/asset/013604d7-432a-4f19-9f51-0426314fe283';
const imgCheckCircle = 'https://www.figma.com/api/mcp/asset/b404a157-9d9a-496b-adb3-d99563c05cc2';

// ── Style constants (PIE Design System) ──────────────────────────────
const font = "'JET Sans Digital', Arial, sans-serif";
const colorDefault = '#242e30';
const colorSubdued = 'rgba(0,0,0,0.64)';
const colorContentDefault = 'rgba(0,0,0,0.76)';
const tealBg = '#E7F4F6';

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
        aria-label="JET+ trial activation confirmed"
        tabIndex={-1}
        data-testid="celebration-sheet"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 1000,
          background: 'white',
          borderRadius: '12px 12px 0 0',
          overflow: 'visible',
          fontFamily: font,
          maxWidth: 375, margin: '0 auto',
          boxShadow: '0px -3px 6px 0px rgba(0,0,0,0.06), 0px -2px 12px -2px rgba(0,0,0,0.08), 0px -4px 6px 0px rgba(0,0,0,0.02)',
          animation: 'celebration-slide-up 0.3s ease-out',
        }}
      >
        {/* Confetti overlay — sits just above the modal top (Req 5.1, 5.3, 5.4) */}
        <img
          alt=""
          src={imgConfetti}
          aria-hidden="true"
          className="celebration-confetti"
          data-testid="celebration-confetti"
          style={{
            position: 'absolute', bottom: 'calc(100% - 60px)', left: 12,
            width: '90%', maxWidth: 334, height: 'auto', aspectRatio: '334/245',
            objectFit: 'cover',
            pointerEvents: 'none',
            animation: 'celebration-fade-in 0.5s ease-out',
          }}
        />
        {/* Inner content wrapper with clipped corners */}
        <div style={{ borderRadius: '12px 12px 0 0', overflow: 'hidden', background: 'white' }}>
        {/* Header section (Req 1.2) */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>

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
          <img
            alt=""
            src={imgBackground}
            data-testid="celebration-background"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />

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
                  fontWeight: 1000, fontStyle: 'italic',
                  color: colorDefault, fontFamily: font,
                }}
              >
                Welcome to<br />
                <span style={{ paddingLeft: 24 }}>Just Eat+</span>
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
              fontFamily: font,
            }}
          >
            {bodyMessage}
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
                fontFamily: font,
              }}>
                JET+ trial active
              </p>
              <p style={{
                margin: 0, fontSize: 14, fontWeight: 400,
                lineHeight: '20px', color: colorSubdued,
                fontFamily: font,
              }}>
                Delivery fee removed
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
