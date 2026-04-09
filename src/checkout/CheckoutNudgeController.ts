import {
  NudgeEvent,
  NudgeSequence,
  PIEInteractionEvent,
  TriggerCondition,
  BehavioralStrategyName,
} from '../types/index';
import { UserContextEvaluator } from '../conversational/UserContextEvaluator';
import { StrategySelector } from '../conversational/StrategySelector';
import { ArchetypeRegistry } from '../conversational/ArchetypeRegistry';
import { NudgeSequenceEngine } from '../conversational/NudgeSequenceEngine';
import { squeezedSaverCheckoutSequence } from '../conversational/sequences/squeezedSaverCheckout';
import { squeezedSaverUpsellSequence } from '../conversational/sequences/squeezedSaverUpsell';
import { valueSeekerCheckoutSequence } from '../conversational/sequences/valueSeekerCheckout';
import { valueSeekerUpsellSequence } from '../conversational/sequences/valueSeekerUpsell';

/**
 * Result of initializing the controller for a user.
 * Contains the selected strategy and archetype name.
 */
export interface InitResult {
  archetypeName: string;
  strategyName: BehavioralStrategyName;
}

/** Maps archetype name → standard checkout sequence. */
const CHECKOUT_SEQUENCES: Record<string, NudgeSequence> = {
  'squeezed-saver': squeezedSaverCheckoutSequence,
  'value-seeker': valueSeekerCheckoutSequence,
};

/** Maps archetype name → subscription upsell sequence. */
const UPSELL_SEQUENCES: Record<string, NudgeSequence> = {
  'squeezed-saver': squeezedSaverUpsellSequence,
  'value-seeker': valueSeekerUpsellSequence,
};

/** Persona display names per archetype. */
const ARCHETYPE_PERSONA_NAMES: Record<string, string> = {
  'squeezed-saver': 'Sam',
  'value-seeker': 'Alex',
};

/**
 * Framework-agnostic controller that orchestrates the full
 * conversational nudge flow during checkout.
 *
 * Flow: UserContextEvaluator → StrategySelector → NudgeSequenceEngine
 *
 * - Req 1.1: Evaluates user context at checkout.
 * - Req 1.2: Selects behavioral strategy based on archetype.
 * - Req 3.2: Advances sequence on matching triggers.
 * - Req 3.3: Tracks current step, prevents skipping/repeating.
 * - Req 3.4: Resets sequence on checkout abandonment.
 */
export class CheckoutNudgeController {
  private readonly evaluator: UserContextEvaluator;
  private readonly selector: StrategySelector;
  private engine: NudgeSequenceEngine | null = null;
  private basketTotal: number = 0;
  private minimumOrderValue: number = 1500;

  constructor(
    evaluator: UserContextEvaluator,
    selector: StrategySelector,
    _registry: ArchetypeRegistry,
  ) {
    this.evaluator = evaluator;
    this.selector = selector;
  }

  /**
   * Returns true when the basket total meets or exceeds the restaurant's
   * Minimum Order Value. Used as a gate before all nudge triggers.
   * Req 14.1, 14.2
   */
  private isMovMet(): boolean {
    return this.basketTotal >= this.minimumOrderValue;
  }

  /**
   * Update the current basket total. Called by the UI layer when the
   * basket changes so the MOV gate can be re-evaluated.
   * Req 14.4
   */
  updateBasketTotal(newTotal: number): void {
    this.basketTotal = newTotal;
  }

  /**
   * Initialize the controller for a given user.
   * Evaluates context, selects strategy, and loads the nudge sequence.
   * Returns null if the user has no archetype (no nudges).
   *
   * Sequence selection (Req 11.1, 11.3):
   * - If monthlyAccumulatedFees > 1000 and user is non-member → upsell sequence
   * - Otherwise → standard checkout sequence
   */
  initialize(userId: string): InitResult | null {
    const context = this.evaluator.evaluate(userId);

    this.basketTotal = context.basketTotal;
    this.minimumOrderValue = context.minimumOrderValue;

    if (!context.archetype) {
      return null;
    }

    const strategyName = this.selector.select(context.archetype, context);
    if (!strategyName) {
      return null;
    }

    const userName = ARCHETYPE_PERSONA_NAMES[context.archetype.name] ?? context.archetype.name;

    this.engine = new NudgeSequenceEngine({
      archetypeName: context.archetype.name,
      strategyName,
      templateContext: {
        fee: `£${(context.deliveryFee / 100).toFixed(2)}`,
        savings: `£${(context.deliveryFee / 100).toFixed(2)}`,
        trialDuration: '30-day',
        userName,
        accumulatedFees: `£${(context.monthlyAccumulatedFees / 100).toFixed(2)}`,
        currentOrderSavings: `£${(context.deliveryFee / 100).toFixed(2)}`,
      },
    });

    // Select upsell sequence when threshold is met, otherwise standard checkout
    const isUpsellEligible =
      context.monthlyAccumulatedFees > 1000 &&
      context.membershipStatus === 'non-member';

    const sequenceMap = isUpsellEligible ? UPSELL_SEQUENCES : CHECKOUT_SEQUENCES;
    const sequence = sequenceMap[context.archetype.name];

    if (!sequence) {
      this.engine = null;
      return null;
    }

    this.engine.load(sequence);

    return {
      archetypeName: context.archetype.name,
      strategyName,
    };
  }

  /**
   * Trigger the nudge sequence when a user adds an item to the basket
   * from a restaurant menu page and a delivery fee applies.
   */
  handleItemAdded(deliveryFee: number): NudgeEvent | null {
    if (!this.isMovMet()) return null;
    if (!this.engine) {
      return null;
    }

    return this.engine.advance({
      type: 'item-added-to-basket',
      feeGreaterThan: deliveryFee,
    });
  }

  /**
   * Convenience method that tries the appropriate first-step trigger
   * based on the loaded sequence. Tries item-added-to-basket first,
   * then subscription-upsell if that doesn't match.
   */
  triggerFirstStep(deliveryFee: number, monthlyAccumulatedFees: number): NudgeEvent | null {
    if (!this.isMovMet()) return null;
    if (!this.engine) {
      return null;
    }

    // Try item-added-to-basket (standard checkout sequences)
    const itemEvent = this.engine.advance({
      type: 'item-added-to-basket',
      feeGreaterThan: deliveryFee,
    });
    if (itemEvent) return itemEvent;

    // Try subscription-upsell (upsell sequences)
    return this.engine.advance({
      type: 'subscription-upsell',
      monthlyFeesExceed: monthlyAccumulatedFees,
    });
  }

  /**
   * Trigger the first step of the sequence when checkout is reached.
   * The delivery fee is used to build the checkout-reached trigger.
   */
  handleCheckout(deliveryFee: number): NudgeEvent | null {
    if (!this.isMovMet()) return null;
    if (!this.engine) {
      return null;
    }

    return this.engine.advance({
      type: 'checkout-reached',
      feeGreaterThan: deliveryFee,
    });
  }

  /**
   * Trigger the subscription upsell condition.
   * Used when the user's monthly accumulated fees exceed the upsell threshold.
   */
  handleSubscriptionUpsell(monthlyAccumulatedFees: number): NudgeEvent | null {
    if (!this.isMovMet()) return null;
    if (!this.engine) {
      return null;
    }

    return this.engine.advance({
      type: 'subscription-upsell',
      monthlyFeesExceed: monthlyAccumulatedFees,
    });
  }

  /**
   * Map a PIE interaction event to a trigger condition and advance the sequence.
   *
   * Mappings:
   * - savings-badge tapped → nudge-tapped on savings-alert
   * - quick-toggle toggled-on → payment-capture-requested
   * - payment-capture-sheet payment-confirmed → trial-activated
   * - payment-capture-sheet dismissed → null (no advance)
   */
  handleInteraction(event: PIEInteractionEvent): NudgeEvent | null {
    if (!this.isMovMet()) return null;
    if (!this.engine) {
      return null;
    }

    const trigger = this.mapInteractionToTrigger(event);
    if (!trigger) {
      return null;
    }

    return this.engine.advance(trigger);
  }

  /** Reset the sequence on checkout abandonment (Req 3.4). */
  reset(): void {
    if (this.engine) {
      this.engine.reset();
    }
  }

  /** Get the current nudge event from the engine, or null if inactive. */
  getCurrentStep() {
    if (!this.engine) {
      return null;
    }
    return this.engine.getCurrentStep();
  }

  /** Returns true when the sequence has completed all steps. */
  isComplete(): boolean {
    if (!this.engine) {
      return true;
    }
    return this.engine.isComplete();
  }

  /**
   * Maps PIE interaction events to trigger conditions.
   * Returns null for unrecognized interactions.
   *
   * Context-aware mapping for savings-badge tapped:
   * - When current step expects nudge-tapped on upsell-alert → use that stepId
   * - Otherwise → nudge-tapped with stepId savings-alert (default checkout flow)
   */
  private mapInteractionToTrigger(event: PIEInteractionEvent): TriggerCondition | null {
    if (event.componentType === 'savings-badge' && event.action === 'tapped') {
      const currentStep = this.engine?.getCurrentStep();
      const trigger = currentStep?.trigger;
      if (trigger?.type === 'nudge-tapped' && trigger.stepId === 'upsell-alert') {
        return { type: 'nudge-tapped', stepId: 'upsell-alert' };
      }
      return { type: 'nudge-tapped', stepId: 'savings-alert' };
    }

    if (event.componentType === 'quick-toggle' && event.action === 'toggled-on') {
      return { type: 'payment-capture-requested' };
    }

    if (event.componentType === 'payment-capture-sheet' && event.action === 'payment-confirmed') {
      return { type: 'trial-activated' };
    }

    // payment-capture-sheet dismissed — stay on payment-capture step, do not advance
    if (event.componentType === 'payment-capture-sheet' && event.action === 'dismissed') {
      return null;
    }

    // celebration-sheet dismissed — sequence is already complete, no further trigger
    if (event.componentType === 'celebration-sheet' && event.action === 'dismissed') {
      return null;
    }

    return null;
  }
}
