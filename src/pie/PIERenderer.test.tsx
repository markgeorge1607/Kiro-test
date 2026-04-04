import React from 'react';
import { render as rtlRender, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerComponent,
  render,
  clearRegistry,
} from './PIERenderer';
import type { UIDirective, PIEComponentProps } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

/** A trivial PIE component used in tests. */
const FakeComponent: React.FC<PIEComponentProps> = ({ directive }) => (
  <div data-testid="fake">{directive.componentType}</div>
);

function makeDirective(componentType: string): UIDirective {
  return { componentType, props: {} };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('PIERenderer', () => {
  beforeEach(() => {
    clearRegistry();
  });

  // ── registerComponent + render ────────────────────────────────────

  it('renders a registered component for a known type', () => {
    registerComponent('savings-badge', FakeComponent);

    const element = render(makeDirective('savings-badge'));
    expect(element).not.toBeNull();

    // Mount it to verify it actually renders
    rtlRender(element!);
    expect(screen.getByTestId('fake')).toHaveTextContent('savings-badge');
  });

  it('passes the directive through to the component', () => {
    const Spy: React.FC<PIEComponentProps> = ({ directive }) => (
      <span data-testid="spy">{JSON.stringify(directive.props)}</span>
    );
    registerComponent('quick-toggle', Spy);

    const directive: UIDirective = {
      componentType: 'quick-toggle',
      props: { label: 'Try free', savingsAmount: 399 },
    };

    const element = render(directive);
    rtlRender(element!);
    expect(screen.getByTestId('spy')).toHaveTextContent('"label":"Try free"');
  });

  it('supports registering multiple component types', () => {
    const A: React.FC<PIEComponentProps> = () => <div data-testid="a" />;
    const B: React.FC<PIEComponentProps> = () => <div data-testid="b" />;

    registerComponent('type-a', A);
    registerComponent('type-b', B);

    const elA = render(makeDirective('type-a'));
    const elB = render(makeDirective('type-b'));

    expect(elA).not.toBeNull();
    expect(elB).not.toBeNull();
  });

  it('overwrites a previously registered component for the same type', () => {
    const Old: React.FC<PIEComponentProps> = () => <div data-testid="old" />;
    const New: React.FC<PIEComponentProps> = () => <div data-testid="new" />;

    registerComponent('badge', Old);
    registerComponent('badge', New);

    const element = render(makeDirective('badge'));
    rtlRender(element!);
    expect(screen.getByTestId('new')).toBeInTheDocument();
  });

  // ── Unknown component type (Req 8.4) ─────────────────────────────

  it('returns null for an unknown component type', () => {
    const element = render(makeDirective('does-not-exist'));
    expect(element).toBeNull();
  });

  it('logs a warning for an unknown component type', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(makeDirective('unknown-widget'));

    expect(warnSpy).toHaveBeenCalledWith(
      '[PIERenderer] Unknown component type: "unknown-widget"',
    );
    warnSpy.mockRestore();
  });

  it('does not throw for an unknown component type', () => {
    expect(() => render(makeDirective('nope'))).not.toThrow();
  });

  // ── Decoupling (Req 7.3) ─────────────────────────────────────────

  it('renders without knowledge of strategy or archetype', () => {
    // The directive carries no strategy/archetype info — PIERenderer
    // should render purely from componentType + props.
    const Component: React.FC<PIEComponentProps> = ({ directive }) => (
      <div data-testid="decoupled">{String(directive.props.amount)}</div>
    );
    registerComponent('savings-badge', Component);

    const directive: UIDirective = {
      componentType: 'savings-badge',
      props: { amount: 399 },
    };

    const element = render(directive);
    rtlRender(element!);
    expect(screen.getByTestId('decoupled')).toHaveTextContent('399');
  });

  // ── clearRegistry ─────────────────────────────────────────────────

  it('clearRegistry removes all registered components', () => {
    registerComponent('x', FakeComponent);
    clearRegistry();

    expect(render(makeDirective('x'))).toBeNull();
  });
});
