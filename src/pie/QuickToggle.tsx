import React, { useState } from 'react';
import type { PIEComponentProps } from '../types';

/**
 * QuickToggle PIE component.
 *
 * Renders a toggle switch with label, savings amount, and trial duration info.
 * Fires a `toggled-on` interaction event on activation.
 *
 * Requirement 8.2 — Quick-Toggle switch with activation callback.
 */
const QuickToggle: React.FC<PIEComponentProps> = ({
  directive,
  onInteraction,
}) => {
  const { label, savingsAmount, trialDuration } = directive.props as {
    label?: string;
    savingsAmount?: string;
    trialDuration?: string;
  };

  const [active, setActive] = useState(false);

  const handleToggle = () => {
    if (!active) {
      setActive(true);
      onInteraction?.({
        componentType: 'quick-toggle',
        action: 'toggled-on',
      });
    }
  };

  return (
    <>
      <style>{`
        .pie-quick-toggle {
          display: inline-flex;
          align-items: center;
          gap: var(--dt-spacing-c);
          padding: var(--dt-spacing-c) var(--dt-spacing-d);
          border-radius: var(--dt-radius-rounded-b);
          font-family: var(--dt-font-family-primary), Arial, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          color: var(--dt-color-content-default);
          background: var(--dt-color-background-subtle);
        }

        .pie-quick-toggle__content {
          display: flex;
          flex-direction: column;
          gap: var(--dt-spacing-a);
        }

        .pie-quick-toggle__label {
          font-weight: 600;
        }

        .pie-quick-toggle__detail {
          font-size: 12px;
          color: var(--dt-color-content-subdued);
        }

        .pie-quick-toggle__switch {
          position: relative;
          width: 44px;
          height: 24px;
          border-radius: var(--dt-radius-rounded-e);
          border: none;
          cursor: pointer;
          padding: 0;
          background-color: var(--dt-color-border-default);
          transition: background-color var(--dt-motion-timing-200) var(--dt-motion-easing-out);
          flex-shrink: 0;
        }

        .pie-quick-toggle__switch--active {
          background-color: var(--dt-color-interactive-brand);
        }

        .pie-quick-toggle__switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--dt-color-container-default);
          transition: transform var(--dt-motion-timing-200) var(--dt-motion-easing-out);
        }

        .pie-quick-toggle__switch--active::after {
          transform: translateX(20px);
        }

        @media (prefers-reduced-motion: reduce) {
          .pie-quick-toggle__switch,
          .pie-quick-toggle__switch::after {
            transition: none;
          }
        }
      `}</style>
      <div className="pie-quick-toggle" data-testid="quick-toggle">
        <div className="pie-quick-toggle__content">
          <span className="pie-quick-toggle__label">
            {label ?? 'Activate trial'}
          </span>
          {(savingsAmount || trialDuration) && (
            <span className="pie-quick-toggle__detail">
              {savingsAmount && `Save ${savingsAmount}`}
              {savingsAmount && trialDuration && ' · '}
              {trialDuration && `${trialDuration} free`}
            </span>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label={label ?? 'Activate trial'}
          className={[
            'pie-quick-toggle__switch',
            active ? 'pie-quick-toggle__switch--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={handleToggle}
        />
      </div>
    </>
  );
};

export default QuickToggle;
