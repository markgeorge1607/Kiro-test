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
import { squeezedSaverMonthlyCreditSequence } from '../conversational/sequences/squeezedSaverMonthlyCredit';
import { valueSeekerMonthlyCreditSequence } from '../conversational/sequences/valueSeekerMonthlyCredit';

/**
 * Result of initializing the offer nudge controller for a user.
 * Contains the selected archetype and strategy names.
 */
export interface OfferInitResult {
  archetypeName: string;
  strategyName: BehavioralStrategyName;
}

/** Maps archetype name → monthly credit nudge sequence. */
const MONTHLY_CREDIT_SEQUENCES: Record<string, NudgeSequence> = {
  'squeezed-saver': squeezedSaverMonthlyCreditSequence,
  'value-seeker': valueSeekerMonthlyCreditSequence,
};

/** Persona display names per archetype. */
const ARCHETYPE_PERSONA_MAP: Record<string, string> = {
  'squeezed-saver': 'Sam',
  'value-seeker': 'Alex',
};

/**
 * Framework-agnostic controller that orchestrates the monthly credit
 * nudge flow from offer tile tap through to trial activation.
 *
 * Flow: UserContextEvaluator → StrategySelector → NudgeSequenceEngine
 *
 * Key differences from CheckoutNudgeController:
 * - No MOV gate (Req 11.4)
 * - Entry point is handleOfferTileTapped(), not handleItemAdded()/handleCheckout()
 * - Uses MONTHLY_CREDIT_SEQUENCES instead of CHECKOUT_SEQUENCES
 * - Template context includes creditAmount and trialDuration
 *
 * The Conversational Layer never throws — all error paths return null.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 10.1, 10.4, 11.1, 11.4
 */
export class OfferNudgeController {
  private readonly evaluator: UserContextEvaluator;
  private readonly selector: StrategySelector;
  private engine: NudgeSequenceEngine | null = null;

  constructor(
    evaluator: UserContextEvaluator,
    selector: StrategySelector,
    _registry: ArchetypeRegistry,
  ) {
    this.evaluator = evaluator;
    this.selector = selector;
  }

  /**
   * Evaluate user context, select strategy, and load the archetype-specific
   * monthly credit sequence into a NudgeSequenceEngine.
   *
   * Returns null if the user has no archetype or no matching sequence.
   * Never throws (Req 10.4).
   */
  initialize(userId: string): OfferInitResult | null {
    const context = this.evaluator.evaluate(userId);

    if (!context.archetype) {
      return null;
    }

    const strategyName = this.selector.select(context.archetype, context);
    if (!strategyName) {
      return null;
    }

    const sequence = MONTHLY_CREDIT_SEQUENCES[context.archetype.name];
    if (!sequence) {
      return null;
    }

    const userName = ARCHETYPE_PERSONA_MAP[context.archetype.name] ?? context.archetype.name;

    this.engine = new NudgeSequenceEngine({
      archetypeName: context.archetype.name,
      strategyName,
      templateContext: {
        creditAmount: '£10.00',
        trialDuration: '30-day',
        userName,
      },
    });

    this.engine.load(sequence);

    return {
      archetypeName: context.archetype.name,
      strategyName,
    };
  }

  /**
   * Advance the sequence with an offer-tile-tapped trigger.
   * Returns the NudgeEvent or null if no engine or trigger mismatch.
   */
  handleOfferTileTapped(offerId: string): NudgeEvent | null {
    if (!this.engine) {
      return null;
    }

    return this.engine.advance({ type: 'offer-tile-tapped', offerId });
  }

  /**
   * Map a PIE interaction event to a trigger condition and advance the sequence.
   *
   * Mappings:
   * - nudge-bottom-sheet + start-trial → payment-capture-requested
   * - payment-capture-sheet + payment-confirmed → trial-activated
   * - All other combinations → null (no advance)
   */
  handleInteraction(event: PIEInteractionEvent): NudgeEvent | null {
    if (!this.engine) {
      return null;
    }

    const trigger = this.mapInteractionToTrigger(event);
    if (!trigger) {
      return null;
    }

    return this.engine.advance(trigger);
  }

  /** Reset the sequence to step 0. No-op if no engine loaded. */
  reset(): void {
    if (this.engine) {
      this.engine.reset();
    }
  }

  /**
   * Maps PIE interaction events to trigger conditions.
   * Returns null for unrecognized or dismissed interactions.
   */
  private mapInteractionToTrigger(event: PIEInteractionEvent): TriggerCondition | null {
    if (event.componentType === 'nudge-bottom-sheet' && event.action === 'start-trial') {
      return { type: 'payment-capture-requested' };
    }

    if (event.componentType === 'payment-capture-sheet' && event.action === 'payment-confirmed') {
      return { type: 'trial-activated' };
    }

    return null;
  }
}
