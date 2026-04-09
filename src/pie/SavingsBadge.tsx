import React from 'react';
import type { PIEComponentProps } from '../types';

/**
 * SavingsBadge PIE component.
 *
 * Renders a savings badge with configurable position and vibrate animation.
 * Fires a `tapped` interaction event on click.
 *
 * Requirement 8.1 — Savings Badge with configurable position and animation type.
 */
const SavingsBadge: React.FC<PIEComponentProps> = ({
  directive,
  onInteraction,
}) => {
  const { position, animationType } = directive.props as {
    position?: string;
    animationType?: string;
  };

  const handleClick = () => {
    onInteraction?.({
      componentType: 'savings-badge',
      action: 'tapped',
    });
  };

  const isVibrate = animationType === 'vibrate';

  return (
    <>
      <style>{`
        @keyframes pie-vibrate {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
        }

        .pie-savings-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: var(--dt-spacing-b) var(--dt-spacing-d);
          border-radius: var(--dt-radius-rounded-b);
          background-color: var(--dt-color-interactive-brand);
          color: var(--dt-color-content-light);
          font-family: var(--dt-font-family-primary), Arial, sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          line-height: 1;
        }

        .pie-savings-badge--vibrate {
          animation: pie-vibrate 0.4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .pie-savings-badge--vibrate {
            animation: none;
          }
        }
      `}</style>
      <button
        className={[
          'pie-savings-badge',
          isVibrate ? 'pie-savings-badge--vibrate' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-position={position ?? 'default'}
        onClick={handleClick}
        type="button"
        aria-label="Savings badge"
      >
        💰 Savings
      </button>
    </>
  );
};

export default SavingsBadge;
