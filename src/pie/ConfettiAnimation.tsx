import React, { useEffect, useRef, useState } from 'react';
import type { PIEComponentProps } from '../types';

/**
 * ConfettiAnimation PIE component.
 *
 * Renders a fire-and-forget confetti animation targeting a specified element.
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
        @keyframes pie-confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
        }

        .pie-confetti {
          pointer-events: none;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          gap: var(--dt-spacing-a);
        }

        .pie-confetti__particle {
          width: var(--dt-spacing-b);
          height: var(--dt-spacing-b);
          border-radius: 2px;
          animation: pie-confetti-fall linear forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .pie-confetti__particle {
            animation: none;
            opacity: 0.6;
          }
        }
      `}</style>
      <div
        className="pie-confetti"
        style={positionStyle}
        data-testid="confetti-animation"
        aria-hidden="true"
        role="presentation"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="pie-confetti__particle"
            style={{
              backgroundColor: PARTICLE_COLOURS[i % PARTICLE_COLOURS.length],
              animationDuration: `${duration}ms`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>
    </>
  );
};

const PARTICLE_COLOURS = [
  '#f36805', // product orange (--dt-color-orange)
  '#f5a623',
  '#4caf50',
  '#2196f3',
  '#e91e63',
  '#9c27b0',
];

export default ConfettiAnimation;
