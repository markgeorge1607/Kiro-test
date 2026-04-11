import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CheckoutPage from './CheckoutPage';
import { CheckoutNudgeController } from './CheckoutNudgeController';
import { UserContextEvaluator, UserData } from '../conversational/UserContextEvaluator';
import { StrategySelector } from '../conversational/StrategySelector';
import { createDefaultRegistry } from '../conversational/ArchetypeRegistry';
import { BasketProvider } from '../state/BasketContext';
import { TranslationProvider } from '../translation/TranslationContext';
import { clearRegistry } from '../pie/PIERenderer';
import type { BasketState } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────

function createController(userData: UserData | undefined) {
  const registry = createDefaultRegistry();
  const provider = () => userData;
  const evaluator = new UserContextEvaluator(provider, registry);
  const selector = new StrategySelector();
  return new CheckoutNudgeController(evaluator, selector, registry);
}

const DEFAULT_BASKET: BasketState = {
  items: [
    { id: '1', name: 'Margherita Pizza', price: 899, quantity: 1 },
    { id: '2', name: 'Garlic Bread', price: 349, quantity: 2 },
  ],
  deliveryFee: 399,
  membershipStatus: 'non-member',
  trialActive: false,
};

interface RenderOptions {
  basketState?: BasketState;
  userId?: string;
  archetypeNames?: string[];
  onArchetypeSwitch?: (archetype: string) => void;
}

function renderCheckoutPage(
  controller: CheckoutNudgeController,
  options: RenderOptions = {},
) {
  const {
    basketState = DEFAULT_BASKET,
    userId = 'user-1',
    archetypeNames,
    onArchetypeSwitch,
  } = options;

  return render(
    <TranslationProvider>
      <BasketProvider initialState={basketState}>
        <CheckoutPage
          controller={controller}
          userId={userId}
          archetypeNames={archetypeNames}
          onArchetypeSwitch={onArchetypeSwitch}
        />
      </BasketProvider>
    </TranslationProvider>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────

describe('CheckoutPage', () => {
  beforeEach(() => {
    clearRegistry();
  });

  // ── Basket display ────────────────────────────────────────────────

  it('displays basket items', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
    });

    renderCheckoutPage(ctrl);

    expect(screen.getByTestId('basket-items')).toHaveTextContent('Margherita Pizza');
    expect(screen.getByTestId('basket-items')).toHaveTextContent('Garlic Bread');
  });

  it('displays the delivery fee', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
    });

    renderCheckoutPage(ctrl);

    expect(screen.getByTestId('delivery-fee')).toHaveTextContent('£3.99');
  });

  // ── Nudge flow ────────────────────────────────────────────────────

  it('shows savings-alert nudge message on mount for squeezed-saver', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
      basketTotal: 2000,
    });

    renderCheckoutPage(ctrl);

    const nudgeMessage = screen.getByTestId('nudge-message');
    expect(nudgeMessage).toBeInTheDocument();
    expect(nudgeMessage.textContent).toContain('£3.99');
  });

  it('renders SavingsBadge PIE component for step 1', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
      basketTotal: 2000,
    });

    renderCheckoutPage(ctrl);

    expect(screen.getByLabelText('Savings badge')).toBeInTheDocument();
  });

  it('advances to trial-offer on savings badge tap', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
      basketTotal: 2000,
    });

    renderCheckoutPage(ctrl);

    // Tap the savings badge
    fireEvent.click(screen.getByLabelText('Savings badge'));

    // Should now show the quick-toggle
    expect(screen.getByTestId('quick-toggle')).toBeInTheDocument();
  });

  it('advances to payment-capture on quick-toggle activation', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
      basketTotal: 2000,
    });

    renderCheckoutPage(ctrl);

    // Step 1 → Step 2: tap savings badge
    fireEvent.click(screen.getByLabelText('Savings badge'));

    // Step 2 → Step 3: toggle on → payment-capture
    fireEvent.click(screen.getByRole('switch'));

    // Trial should be active (activateTrial called on toggle-on), delivery fee zeroed (Req 6.3)
    expect(screen.getByTestId('trial-status')).toHaveTextContent('Free trial active');
    expect(screen.getByTestId('delivery-fee')).toHaveTextContent('£0.00');

    // The payment-capture nudge message should be displayed (Req 1.1)
    expect(screen.getByTestId('nudge-message')).toBeInTheDocument();
  });

  // ── No nudges fallback ────────────────────────────────────────────

  it('shows no nudge when user has no archetype', () => {
    const ctrl = createController(undefined);

    renderCheckoutPage(ctrl);

    expect(screen.queryByTestId('nudge-message')).not.toBeInTheDocument();
  });

  // ── Checkout abandonment ──────────────────────────────────────────

  it('resets nudge state on abandon', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
      basketTotal: 2000,
    });

    renderCheckoutPage(ctrl);

    // Nudge should be visible
    expect(screen.getByTestId('nudge-message')).toBeInTheDocument();

    // Abandon checkout
    fireEvent.click(screen.getByTestId('abandon-button'));

    // Nudge should be cleared
    expect(screen.queryByTestId('nudge-message')).not.toBeInTheDocument();
  });

  // ── Trial status display ──────────────────────────────────────────

  it('does not show trial status when trial is not active', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
    });

    renderCheckoutPage(ctrl);

    expect(screen.queryByTestId('trial-status')).not.toBeInTheDocument();
  });

  it('shows trial status when basket has trial active', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 0,
      archetypeName: 'squeezed-saver',
    });

    renderCheckoutPage(ctrl, {
      basketState: {
        ...DEFAULT_BASKET,
        trialActive: true,
        deliveryFee: 0,
      },
    });

    expect(screen.getByTestId('trial-status')).toHaveTextContent('Free trial active');
  });

  // ── PIE container empty when no directive ─────────────────────────

  it('renders empty PIE container when no nudge event', () => {
    const ctrl = createController(undefined);

    renderCheckoutPage(ctrl);

    expect(screen.getByTestId('pie-container')).toBeEmptyDOMElement();
  });

  // ── ArchetypeToggle rendering (Req 13.2, 13.3) ───────────────────

  it('renders archetype toggle when archetypeNames is provided', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
    });

    renderCheckoutPage(ctrl, {
      archetypeNames: ['squeezed-saver', 'value-seeker'],
    });

    expect(screen.getByTestId('archetype-toggle-container')).toBeInTheDocument();
    expect(screen.getByTestId('archetype-toggle')).toBeInTheDocument();
  });

  it('displays all archetype names in the toggle', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
    });

    renderCheckoutPage(ctrl, {
      archetypeNames: ['squeezed-saver', 'value-seeker'],
    });

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios[0]).toHaveTextContent('squeezed-saver');
    expect(radios[1]).toHaveTextContent('value-seeker');
  });

  it('highlights the active archetype in the toggle', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
    });

    renderCheckoutPage(ctrl, {
      archetypeNames: ['squeezed-saver', 'value-seeker'],
    });

    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');
  });

  // ── Archetype switching (Req 13.2, 13.3) ──────────────────────────

  it('calls onArchetypeSwitch when a different archetype is clicked', () => {
    const onSwitch = vi.fn();
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
    });

    renderCheckoutPage(ctrl, {
      archetypeNames: ['squeezed-saver', 'value-seeker'],
      onArchetypeSwitch: onSwitch,
    });

    // Click the value-seeker radio button
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);

    expect(onSwitch).toHaveBeenCalledWith('value-seeker');
  });

  it('re-renders nudge with new archetype messaging after switch', () => {
    const userData: UserData = {
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
      basketTotal: 2000,
    };

    const ctrl = createController(userData);

    const { unmount } = renderCheckoutPage(ctrl, {
      archetypeNames: ['squeezed-saver', 'value-seeker'],
    });

    // Verify initial squeezed-saver nudge message is displayed
    const initialMessage = screen.getByTestId('nudge-message').textContent;
    expect(initialMessage).toContain('£3.99');

    unmount();

    // Create a new controller with value-seeker archetype (simulating the switch)
    const valueSeekerCtrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'value-seeker',
      basketTotal: 2000,
    });

    renderCheckoutPage(valueSeekerCtrl, {
      archetypeNames: ['squeezed-saver', 'value-seeker'],
    });

    // The nudge message should now reflect value-seeker messaging
    const newMessage = screen.getByTestId('nudge-message').textContent;
    expect(newMessage).toContain('£3.99');
    // Value seeker uses identity-reinforcement, so the message should differ
    expect(newMessage).not.toEqual(initialMessage);
  });

  // ── No toggle when archetypeNames is empty or not provided ────────

  it('does not render toggle container when archetypeNames is not provided', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
    });

    renderCheckoutPage(ctrl);

    expect(screen.queryByTestId('archetype-toggle-container')).not.toBeInTheDocument();
  });

  it('does not render toggle container when archetypeNames is empty', () => {
    const ctrl = createController({
      membershipStatus: 'non-member',
      deliveryFee: 399,
      archetypeName: 'squeezed-saver',
    });

    renderCheckoutPage(ctrl, {
      archetypeNames: [],
    });

    expect(screen.queryByTestId('archetype-toggle-container')).not.toBeInTheDocument();
  });
});
