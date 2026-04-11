import React, { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import type { PIEComponentProps } from '../types';
import confettiAnimationData from '../../Animation/_03 Jet + Confetti (1).json';

/**
 * ConfettiAnimation PIE component.
 *
 * Renders a fire-and-forget confetti Lottie animation targeting a specified element.
 * Uses the JET confetti Lottie file from the Animation folder.
 * Auto-removes after the configured duration. No interaction events.
 *
 * Requirement 8.3 — Confetti Animation that triggers on a specified target element.
 */
const ConfettiAnimation: React.FC<PIEComponentProps> = ({ directive }) => {
  const targetSelector =
    (directive.props.targetSelector as string | undefined) ??
    directive.targetSelector ??
    null;
  const duration =
    typeof directive.props.duration === 'number'
      ? directive.props.duration
      : 2000;

  const [visible, setVisible] = useState(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    if (targetSelector) {
      const el = document.querySelector(targetSelector);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        console.warn(
          `[ConfettiAnimation] Target element not found for selector "${targetSelector}". Animation skipped.`,
        );
        setVisible(false);
        return;
      }
    }

    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [targetSelector, duration]);

  if (!visible) return null;

  const positionStyle: React.CSSProperties = targetRect
    ? {
        position: 'absolute',
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
      }
    : {};

  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .pie-confetti-lottie svg {
            animation: none !important;
          }
        }
      `}</style>
      <div
        className="pie-confetti"
        style={{
          ...positionStyle,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
        data-testid="confetti-animation"
        aria-hidden="true"
        role="presentation"
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={confettiAnimationData}
          loop={false}
          autoplay={true}
          className="pie-confetti-lottie"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </>
  );
};

export default ConfettiAnimation;
