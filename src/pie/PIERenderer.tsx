import React from 'react';
import type { UIDirective, PIEComponentProps } from '../types';

const registry = new Map<string, React.ComponentType<PIEComponentProps>>();

/**
 * Register a PIE component for a given directive componentType.
 */
export function registerComponent(
  type: string,
  component: React.ComponentType<PIEComponentProps>,
): void {
  registry.set(type, component);
}

/**
 * Render a UIDirective by looking up the registered component for its
 * componentType. Returns null and logs a warning when the type is unknown.
 *
 * Requirement 7.3 — renders directives without knowledge of the strategy/archetype.
 * Requirement 8.4 — unknown types produce null + warning.
 */
export function render(directive: UIDirective): React.ReactElement | null {
  const Component = registry.get(directive.componentType);

  if (!Component) {
    console.warn(
      `[PIERenderer] Unknown component type: "${directive.componentType}"`,
    );
    return null;
  }

  return <Component directive={directive} />;
}

/**
 * Clear all registered components. Useful for test isolation.
 */
export function clearRegistry(): void {
  registry.clear();
}
