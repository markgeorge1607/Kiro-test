import {
  NudgeSequence,
  NudgeStep,
  TriggerCondition,
  NudgeEvent,
  BehavioralStrategyName,
} from '../types/index';
import { resolveTemplate } from '../utils/templateResolver';

/**
 * Configuration for the NudgeSequenceEngine, providing metadata
 * included in every emitted NudgeEvent.
 */
export interface NudgeSequenceEngineConfig {
  archetypeName: string;
  strategyName: BehavioralStrategyName;
  templateContext: Record<string, string>;
}

/**
 * Tracks and advances through a nudge sequence.
 *
 * The engine is a pure state machine: it holds the current step index,
 * checks trigger conditions, and emits NudgeEvents with resolved
 * message templates and ISO 8601 timestamps.
 *
 * - Req 3.1: Supports ordered nudge sequences with trigger conditions.
 * - Req 3.2: Emits nudge only when trigger matches current step.
 * - Req 3.3: Tracks current step; prevents skipping or repeating.
 * - Req 3.4: Resets sequence state on demand.
 * - Req 9.1: Events include stepId, message, UIDirective, timestamp.
 * - Req 9.3: Events include archetypeName and strategyName metadata.
 *
 * The Conversational Layer never throws — all error paths return null.
 */
export class NudgeSequenceEngine {
  private sequence: NudgeSequence | null = null;
  private currentIndex = 0;
  private config: NudgeSequenceEngineConfig;

  constructor(config: NudgeSequenceEngineConfig) {
    this.config = config;
  }

  /** Loads a sequence and resets to step 0. */
  load(sequence: NudgeSequence): void {
    this.sequence = sequence;
    this.currentIndex = 0;
  }

  /** Returns the current step, or null if no sequence is loaded or all steps are complete. */
  getCurrentStep(): NudgeStep | null {
    if (!this.sequence) {
      return null;
    }
    if (this.currentIndex >= this.sequence.steps.length) {
      return null;
    }
    return this.sequence.steps[this.currentIndex];
  }

  /**
   * If the trigger matches the current step's trigger condition, emits a
   * NudgeEvent and advances to the next step. Returns null on mismatch,
   * when no sequence is loaded, or when the sequence is already complete.
   */
  advance(trigger: TriggerCondition): NudgeEvent | null {
    const step = this.getCurrentStep();
    if (!step) {
      return null;
    }

    if (!this.triggersMatch(step.trigger, trigger)) {
      return null;
    }

    const message = resolveTemplate(step.messageTemplate, this.config.templateContext);

    const strategyName = step.strategyOverride ?? this.config.strategyName;

    // Resolve template placeholders in uiDirective props (e.g. bodyMessage)
    const resolvedProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(step.uiDirective.props)) {
      resolvedProps[key] = typeof value === 'string'
        ? resolveTemplate(value, this.config.templateContext)
        : value;
    }

    const event: NudgeEvent = {
      stepId: step.stepId,
      message,
      uiDirective: {
        ...step.uiDirective,
        props: resolvedProps,
      },
      timestamp: new Date().toISOString(),
      metadata: {
        archetypeName: this.config.archetypeName,
        strategyName,
      },
    };

    this.currentIndex++;
    return event;
  }

  /** Resets the engine to step 0 of the currently loaded sequence. */
  reset(): void {
    this.currentIndex = 0;
  }

  /** Returns true when all steps have been advanced past. */
  isComplete(): boolean {
    if (!this.sequence) {
      return true;
    }
    return this.currentIndex >= this.sequence.steps.length;
  }

  /**
   * Two triggers match when they share the same type and satisfy
   * type-specific conditions:
   * - checkout-reached: provided fee > step's feeGreaterThan threshold
   * - nudge-tapped: stepId matches
   * - trial-activated: always matches (no extra fields)
   * - payment-capture-requested: always matches (no extra fields)
   */
  private triggersMatch(
    stepTrigger: TriggerCondition,
    provided: TriggerCondition,
  ): boolean {
    if (stepTrigger.type !== provided.type) {
      return false;
    }

    switch (stepTrigger.type) {
      case 'item-added-to-basket': {
        const p = provided as { type: 'item-added-to-basket'; feeGreaterThan: number };
        return p.feeGreaterThan > stepTrigger.feeGreaterThan;
      }
      case 'checkout-reached': {
        const p = provided as { type: 'checkout-reached'; feeGreaterThan: number };
        return p.feeGreaterThan > stepTrigger.feeGreaterThan;
      }
      case 'nudge-tapped': {
        const p = provided as { type: 'nudge-tapped'; stepId: string };
        return p.stepId === stepTrigger.stepId;
      }
      case 'trial-activated':
        return true;
      case 'payment-capture-requested':
        return true;
      case 'subscription-upsell': {
        const p = provided as { type: 'subscription-upsell'; monthlyFeesExceed: number };
        return p.monthlyFeesExceed > stepTrigger.monthlyFeesExceed;
      }
      default:
        return false;
    }
  }
}
