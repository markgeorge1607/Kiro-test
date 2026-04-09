import React from 'react';
import type { PIEComponentProps } from '../types';

/**
 * ArchetypeToggle PIE component.
 *
 * Renders a row of toggle buttons listing all registered archetype names.
 * The active archetype is visually highlighted with product orange.
 * Fires an `archetype-switched` interaction event when a different archetype is selected.
 *
 * Requirements 13.1, 13.4 — Archetype toggle with active display and selection.
 */
const ArchetypeToggle: React.FC<PIEComponentProps> = ({
  directive,
  onInteraction,
}) => {
  const { archetypes, activeArchetype } = directive.props as {
    archetypes?: string[];
    activeArchetype?: string;
  };

  const items = archetypes ?? [];

  const handleSelect = (archetype: string) => {
    if (archetype !== activeArchetype) {
      onInteraction?.({
        componentType: 'archetype-toggle',
        action: 'archetype-switched',
        payload: { archetype },
      });
    }
  };

  return (
    <>
      <style>{`
        .pie-archetype-toggle {
          display: inline-flex;
          align-items: center;
          gap: var(--dt-spacing-b);
          padding: var(--dt-spacing-a);
          border-radius: var(--dt-radius-rounded-b);
          background: var(--dt-color-background-subtle);
          font-family: var(--dt-font-family-primary), Arial, sans-serif;
          font-size: 14px;
          line-height: 1.4;
        }

        .pie-archetype-toggle__btn {
          padding: var(--dt-spacing-b) var(--dt-spacing-d);
          border: none;
          border-radius: var(--dt-radius-rounded-a);
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          font-weight: 600;
          line-height: 1.4;
          color: var(--dt-color-content-default);
          background: transparent;
          transition: background-color var(--dt-motion-timing-200) var(--dt-motion-easing-out),
                      color var(--dt-motion-timing-200) var(--dt-motion-easing-out);
        }

        .pie-archetype-toggle__btn:hover {
          background: var(--dt-color-container-strong);
        }

        .pie-archetype-toggle__btn--active {
          background-color: var(--dt-color-interactive-brand);
          color: var(--dt-color-content-light);
        }

        .pie-archetype-toggle__btn--active:hover {
          background-color: var(--dt-color-interactive-brand);
        }

        @media (prefers-reduced-motion: reduce) {
          .pie-archetype-toggle__btn {
            transition: none;
          }
        }
      `}</style>
      <div
        className="pie-archetype-toggle"
        data-testid="archetype-toggle"
        role="radiogroup"
        aria-label="Select archetype"
      >
        {items.map((archetype) => {
          const isActive = archetype === activeArchetype;
          return (
            <button
              key={archetype}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={[
                'pie-archetype-toggle__btn',
                isActive ? 'pie-archetype-toggle__btn--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleSelect(archetype)}
            >
              {archetype}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default ArchetypeToggle;
