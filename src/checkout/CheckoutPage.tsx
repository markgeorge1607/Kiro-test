import React, { useEffect, useState, useCallback } from 'react';
import type { NudgeEvent, PIEInteractionEvent } from '../types';
import { CheckoutNudgeController } from './CheckoutNudgeController';
import {
  registerComponent,
  render as pieRender,
  clearRegistry,
} from '../pie/PIERenderer';
import SavingsBadge from '../pie/SavingsBadge';
import QuickToggle from '../pie/QuickToggle';
import ConfettiAnimation from '../pie/ConfettiAnimation';
import ArchetypeToggle from '../pie/ArchetypeToggle';
import CelebrationBottomSheet from '../pie/CelebrationBottomSheet';
import { useBasket } from '../state/BasketContext';

// ── Props ────────────────────────────────────────────────────────────

export interface CheckoutPageProps {
  controller: CheckoutNudgeController;
  userId: string;
  /** List of registered archetype names for the ArchetypeToggle. */
  archetypeNames?: string[];
  /**
   * Callback fired when the user switches archetype via the toggle.
   * The parent should create a new controller with the new archetype
   * and pass it back via the controller prop.
   */
  onArchetypeSwitch?: (archetype: string) => void;
}

// ── Component ────────────────────────────────────────────────────────

/**
 * CheckoutPage integrates the CheckoutNudgeController with the PIE
 * rendering layer and BasketContext.
 *
 * - Req 4.1, 4.2: Displays loss-aversion savings nudge at checkout.
 * - Req 5.1, 5.2: Shows trial offer toggle on nudge tap.
 * - Req 6.1, 6.2, 6.3: Confirms trial with delight animation, zeroes fee.
 * - Req 7.1: Communicates via structured NudgeEvent JSON.
 * - Req 13.2, 13.3: ArchetypeToggle re-evaluates nudge sequence on switch.
 * - Req 14.1, 14.4: Passes basket total to controller for MOV gate.
 */
const CheckoutPage: React.FC<CheckoutPageProps> = ({
  controller,
  userId,
  archetypeNames = [],
  onArchetypeSwitch,
}) => {
  const { state: basket, activateTrial } = useBasket();
  const [nudgeEvent, setNudgeEvent] = useState<NudgeEvent | null>(null);
  const [activeArchetype, setActiveArchetype] = useState<string | null>(null);

    registerComponent('savings-badge', SavingsBadge);
    registerComponent('quick-toggle', QuickToggle);
    registerComponent('confetti', ConfettiAnimation);
    registerComponent('archetype-toggle', ArchetypeToggle);
    registerComponent('celebration-sheet', CelebrationBottomSheet);
    registerComponent('confetti', ConfettiAnimation);
    registerComponent('archetype-toggle', ArchetypeToggle);

    return () => {
      clearRegistry();
    };
  }, []);
  // Initialize controller and trigger nudge on item added
  useEffect(() => {
    const result = controller.initialize(userId);

    if (result) {
      setActiveArchetype(result.archetypeName);

      // Sync basket total from React state so the MOV gate uses the real value (Req 14.1)
      const basketTotal = basket.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      controller.updateBasketTotal(basketTotal);

      if (basket.deliveryFee > 0) {
  // Handle PIE interaction events
  const handleInteraction = useCallback(
    (event: PIEInteractionEvent) => {
      // When quick-toggle is toggled on, activate the trial via BasketContext
      if (
        event.componentType === 'quick-toggle' &&
        event.action === 'toggled-on'
      ) {
        activateTrial();
      }

      // When celebration-sheet is dismissed, clear the nudge event (Req 3.4, 4.4)
      if (
        event.componentType === 'celebration-sheet' &&
        event.action === 'dismissed'
      ) {
        setNudgeEvent(null);
        return;
      }

      // Pass all interactions to the controller to advance the sequence
      const nextEvent = controller.handleInteraction(event);
      setNudgeEvent(nextEvent);
    },
    [controller, activateTrial],
  );}
  }, [controller, userId, basket.deliveryFee]);

  // Handle PIE interaction events
  const handleInteraction = useCallback(
    (event: PIEInteractionEvent) => {
      // When quick-toggle is toggled on, activate the trial via BasketContext
      if (
        event.componentType === 'quick-toggle' &&
        event.action === 'toggled-on'
      ) {
        activateTrial();
      }

      // Pass all interactions to the controller to advance the sequence
      const nextEvent = controller.handleInteraction(event);
      setNudgeEvent(nextEvent);
    },
    [controller, activateTrial],
  );

  // Handle archetype switch from the ArchetypeToggle (Req 13.2, 13.3)
  const handleArchetypeSwitch = useCallback(
    (event: PIEInteractionEvent) => {
      if (
        event.componentType === 'archetype-toggle' &&
        event.action === 'archetype-switched' &&
        event.payload?.archetype
      ) {
        const newArchetype = event.payload.archetype as string;
        setActiveArchetype(newArchetype);
        onArchetypeSwitch?.(newArchetype);
      }
    },
    [onArchetypeSwitch],
  );

  // Handle checkout abandonment
  const handleAbandon = useCallback(() => {
    controller.reset();
    setNudgeEvent(null);
  }, [controller]);

  // Render the PIE component from the current nudge event's UIDirective
  const renderPIEComponent = () => {
    if (!nudgeEvent) return null;

    const element = pieRender(nudgeEvent.uiDirective);
    if (!element) return null;

    // Clone the element to inject the onInteraction handler
    return React.cloneElement(element, { onInteraction: handleInteraction });
  };

  return (
    <div
      className="checkout-page"
      style={{
        fontFamily: "'JET Sans Digital', Arial, sans-serif",
        padding: '16px',
        textAlign: 'left',
      }}
    >
      <h2 style={{ margin: '0 0 16px' }}>Checkout</h2>

      {/* Archetype Toggle — persistent UI control (Req 13.1, 13.3) */}
      {archetypeNames.length > 0 && activeArchetype && (
        <div data-testid="archetype-toggle-container" style={{ marginBottom: '16px' }}>
          <ArchetypeToggle
            directive={{
              componentType: 'archetype-toggle',
              props: {
                archetypes: archetypeNames,
                activeArchetype,
              },
            }}
            onInteraction={handleArchetypeSwitch}
          />
        </div>
      )}

      {/* Basket items */}
      <div data-testid="basket-items">
        {basket.items.map((item) => (
          <div key={item.id} style={{ padding: '4px 0' }}>
            {item.name} × {item.quantity} — £
            {((item.price * item.quantity) / 100).toFixed(2)}
          </div>
        ))}
      </div>

      {/* Delivery fee */}
      <div data-testid="delivery-fee" style={{ padding: '8px 0' }}>
        Delivery fee: £{(basket.deliveryFee / 100).toFixed(2)}
      </div>

      {/* Trial status */}
      {basket.trialActive && (
        <div data-testid="trial-status" style={{ padding: '4px 0', color: '#4caf50' }}>
          ✓ Free trial active
        </div>
      )}

      {/* Nudge message */}
      {nudgeEvent && (
        <div data-testid="nudge-message" style={{ padding: '12px 0' }}>
          {nudgeEvent.message}
        </div>
      )}

      {/* PIE component */}
      <div data-testid="pie-container">{renderPIEComponent()}</div>

      {/* Abandon checkout */}
      <button
        type="button"
        data-testid="abandon-button"
        onClick={handleAbandon}
        style={{ marginTop: '16px' }}
      >
        Cancel order
      </button>
    </div>
  );
};

export default CheckoutPage;
