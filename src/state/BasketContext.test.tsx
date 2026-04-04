import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BasketProvider, useBasket } from './BasketContext';
import type { BasketState } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

const defaultState: BasketState = {
  items: [{ id: 'item-1', name: 'Pizza', price: 899, quantity: 1 }],
  deliveryFee: 399,
  membershipStatus: 'non-member',
  trialActive: false,
};

/** Renders a test consumer that displays state and exposes activateTrial. */
function TestConsumer() {
  const { state, activateTrial } = useBasket();
  return (
    <div>
      <span data-testid="fee">{state.deliveryFee}</span>
      <span data-testid="trial">{String(state.trialActive)}</span>
      <span data-testid="membership">{state.membershipStatus}</span>
      <span data-testid="items">{state.items.length}</span>
      <button onClick={activateTrial}>Activate</button>
    </div>
  );
}

function renderWithProvider(initialState: BasketState = defaultState) {
  return render(
    <BasketProvider initialState={initialState}>
      <TestConsumer />
    </BasketProvider>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────

describe('BasketContext', () => {
  // ── Initial state ─────────────────────────────────────────────────

  it('provides the initial basket state to consumers', () => {
    renderWithProvider();
    expect(screen.getByTestId('fee').textContent).toBe('399');
    expect(screen.getByTestId('trial').textContent).toBe('false');
    expect(screen.getByTestId('membership').textContent).toBe('non-member');
    expect(screen.getByTestId('items').textContent).toBe('1');
  });

  it('supports member membership status', () => {
    renderWithProvider({ ...defaultState, membershipStatus: 'member' });
    expect(screen.getByTestId('membership').textContent).toBe('member');
  });

  it('supports empty basket items', () => {
    renderWithProvider({ ...defaultState, items: [] });
    expect(screen.getByTestId('items').textContent).toBe('0');
  });

  // ── activateTrial ─────────────────────────────────────────────────

  it('sets trialActive to true when activateTrial is called', () => {
    renderWithProvider();
    fireEvent.click(screen.getByText('Activate'));
    expect(screen.getByTestId('trial').textContent).toBe('true');
  });

  it('sets deliveryFee to 0 when activateTrial is called', () => {
    renderWithProvider();
    fireEvent.click(screen.getByText('Activate'));
    expect(screen.getByTestId('fee').textContent).toBe('0');
  });

  it('preserves other state fields when activateTrial is called', () => {
    renderWithProvider();
    fireEvent.click(screen.getByText('Activate'));
    expect(screen.getByTestId('membership').textContent).toBe('non-member');
    expect(screen.getByTestId('items').textContent).toBe('1');
  });

  it('is idempotent — calling activateTrial twice has the same result', () => {
    renderWithProvider();
    fireEvent.click(screen.getByText('Activate'));
    fireEvent.click(screen.getByText('Activate'));
    expect(screen.getByTestId('fee').textContent).toBe('0');
    expect(screen.getByTestId('trial').textContent).toBe('true');
  });

  it('zeroes a large delivery fee on trial activation', () => {
    renderWithProvider({ ...defaultState, deliveryFee: 1500 });
    fireEvent.click(screen.getByText('Activate'));
    expect(screen.getByTestId('fee').textContent).toBe('0');
  });

  // ── useBasket outside provider ────────────────────────────────────

  it('throws when useBasket is used outside BasketProvider', () => {
    // Suppress React error boundary console noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useBasket must be used within a <BasketProvider>',
    );
    spy.mockRestore();
  });
});
