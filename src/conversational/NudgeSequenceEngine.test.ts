import { describe, it, expect, beforeEach } from 'vitest';
import { NudgeSequenceEngine, NudgeSequenceEngineConfig } from './NudgeSequenceEngine';
import { NudgeSequence, NudgeStep } from '../types/index';

const defaultConfig: NudgeSequenceEngineConfig = {
  archetypeName: 'squeezed-saver',
  strategyName: 'loss-aversion',
  templateContext: { fee: '£3.99', trialDuration: '30 days', savings: '£3.99' },
};

const step1: NudgeStep = {
  stepId: 'savings-alert',
  trigger: { type: 'checkout-reached', feeGreaterThan: 0 },
  messageTemplate: 'You are about to pay {{fee}} in delivery fees!',
  uiDirective: {
    componentType: 'savings-badge',
    props: { position: 'checkout-button', animationType: 'vibrate' },
  },
};

const step2: NudgeStep = {
  stepId: 'trial-offer',
  trigger: { type: 'nudge-tapped', stepId: 'savings-alert' },
  messageTemplate: 'Protect your {{savings}} — try free for {{trialDuration}}.',
  uiDirective: {
    componentType: 'quick-toggle',
    props: { label: 'Start free trial', savingsAmount: 399, trialDuration: '30 days' },
  },
};

const step3: NudgeStep = {
  stepId: 'delight-confirm',
  trigger: { type: 'trial-activated' },
  messageTemplate: 'You just saved {{savings}}!',
  uiDirective: {
    componentType: 'celebration-sheet',
    props: {
      welcomeTitle: 'Welcome to Just Eat+',
      bodyMessage: 'You just saved {{savings}} on delivery.',
      autoDismissDuration: 4000,
      archetypeName: 'squeezed-saver',
    },
  },
  strategyOverride: 'peak-end-rule',
};

const threeStepSequence: NudgeSequence = {
  id: 'squeezed-saver-checkout',
  steps: [step1, step2, step3],
};

describe('NudgeSequenceEngine', () => {
  let engine: NudgeSequenceEngine;

  beforeEach(() => {
    engine = new NudgeSequenceEngine(defaultConfig);
  });

  describe('load()', () => {
    it('loads a sequence and sets current step to step 0', () => {
      engine.load(threeStepSequence);
      expect(engine.getCurrentStep()).toEqual(step1);
      expect(engine.isComplete()).toBe(false);
    });

    it('resets to step 0 when loading a new sequence', () => {
      engine.load(threeStepSequence);
      engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      engine.load(threeStepSequence);
      expect(engine.getCurrentStep()).toEqual(step1);
    });
  });

  describe('getCurrentStep()', () => {
    it('returns null when no sequence is loaded', () => {
      expect(engine.getCurrentStep()).toBeNull();
    });

    it('returns the current step after loading', () => {
      engine.load(threeStepSequence);
      expect(engine.getCurrentStep()?.stepId).toBe('savings-alert');
    });

    it('returns null when sequence is complete', () => {
      engine.load(threeStepSequence);
      engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      engine.advance({ type: 'nudge-tapped', stepId: 'savings-alert' });
      engine.advance({ type: 'trial-activated' });
      expect(engine.getCurrentStep()).toBeNull();
    });
  });

  describe('advance() — trigger matching', () => {
    beforeEach(() => {
      engine.load(threeStepSequence);
    });

    it('emits NudgeEvent when checkout-reached trigger matches (fee > threshold)', () => {
      const event = engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('savings-alert');
    });

    it('returns null when checkout-reached fee does not exceed threshold', () => {
      const event = engine.advance({ type: 'checkout-reached', feeGreaterThan: 0 });
      expect(event).toBeNull();
      expect(engine.getCurrentStep()?.stepId).toBe('savings-alert');
    });

    it('returns null when trigger type does not match current step', () => {
      const event = engine.advance({ type: 'trial-activated' });
      expect(event).toBeNull();
      expect(engine.getCurrentStep()?.stepId).toBe('savings-alert');
    });

    it('emits NudgeEvent when nudge-tapped trigger matches stepId', () => {
      engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      const event = engine.advance({ type: 'nudge-tapped', stepId: 'savings-alert' });
      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('trial-offer');
    });

    it('returns null when nudge-tapped stepId does not match', () => {
      engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      const event = engine.advance({ type: 'nudge-tapped', stepId: 'wrong-id' });
      expect(event).toBeNull();
    });

    it('emits NudgeEvent when trial-activated trigger matches', () => {
      engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      engine.advance({ type: 'nudge-tapped', stepId: 'savings-alert' });
      const event = engine.advance({ type: 'trial-activated' });
      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('delight-confirm');
    });

    it('emits NudgeEvent when payment-capture-requested trigger matches', () => {
      const paymentCaptureStep: NudgeStep = {
        stepId: 'payment-capture',
        trigger: { type: 'payment-capture-requested' },
        messageTemplate: 'Add your payment details to start your free {{trialDuration}} trial.',
        uiDirective: {
          componentType: 'payment-capture-sheet',
          props: { savedCards: [], trialDuration: '{{trialDuration}}', savingsAmount: '{{savings}}' },
        },
      };
      const sequenceWithPayment: NudgeSequence = {
        id: 'with-payment-capture',
        steps: [paymentCaptureStep],
      };
      engine.load(sequenceWithPayment);
      const event = engine.advance({ type: 'payment-capture-requested' });
      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('payment-capture');
    });

    it('returns null when payment-capture-requested step receives a different trigger', () => {
      const paymentCaptureStep: NudgeStep = {
        stepId: 'payment-capture',
        trigger: { type: 'payment-capture-requested' },
        messageTemplate: 'Add payment details.',
        uiDirective: { componentType: 'payment-capture-sheet', props: {} },
      };
      engine.load({ id: 'pc-only', steps: [paymentCaptureStep] });
      const event = engine.advance({ type: 'trial-activated' });
      expect(event).toBeNull();
      expect(engine.getCurrentStep()?.stepId).toBe('payment-capture');
    });
  });

  describe('advance() — NudgeEvent structure (Req 9.1, 9.3)', () => {
    it('includes resolved message with template placeholders filled', () => {
      engine.load(threeStepSequence);
      const event = engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      expect(event!.message).toBe('You are about to pay £3.99 in delivery fees!');
    });

    it('includes ISO 8601 timestamp', () => {
      engine.load(threeStepSequence);
      const event = engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      expect(event!.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('includes metadata with archetypeName and strategyName', () => {
      engine.load(threeStepSequence);
      const event = engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      expect(event!.metadata.archetypeName).toBe('squeezed-saver');
      expect(event!.metadata.strategyName).toBe('loss-aversion');
    });

    it('includes the uiDirective from the step', () => {
      engine.load(threeStepSequence);
      const event = engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      expect(event!.uiDirective).toEqual(step1.uiDirective);
    });

    it('uses strategyOverride when present on the step', () => {
      engine.load(threeStepSequence);
      engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      engine.advance({ type: 'nudge-tapped', stepId: 'savings-alert' });
      const event = engine.advance({ type: 'trial-activated' });
      expect(event!.metadata.strategyName).toBe('peak-end-rule');
    });
  });

  describe('advance() — state transitions (Req 3.3)', () => {
    it('advances to the next step after a successful match', () => {
      engine.load(threeStepSequence);
      engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      expect(engine.getCurrentStep()?.stepId).toBe('trial-offer');
    });

    it('does not change state on a mismatched trigger', () => {
      engine.load(threeStepSequence);
      engine.advance({ type: 'trial-activated' });
      expect(engine.getCurrentStep()?.stepId).toBe('savings-alert');
    });

    it('returns null when sequence is already complete', () => {
      engine.load(threeStepSequence);
      engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      engine.advance({ type: 'nudge-tapped', stepId: 'savings-alert' });
      engine.advance({ type: 'trial-activated' });
      const event = engine.advance({ type: 'trial-activated' });
      expect(event).toBeNull();
    });
  });

  describe('reset() (Req 3.4)', () => {
    it('returns engine to step 0', () => {
      engine.load(threeStepSequence);
      engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      engine.advance({ type: 'nudge-tapped', stepId: 'savings-alert' });
      engine.reset();
      expect(engine.getCurrentStep()?.stepId).toBe('savings-alert');
      expect(engine.isComplete()).toBe(false);
    });

    it('allows replaying the sequence after reset', () => {
      engine.load(threeStepSequence);
      engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      engine.reset();
      const event = engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('savings-alert');
    });
  });

  describe('isComplete()', () => {
    it('returns true when no sequence is loaded', () => {
      expect(engine.isComplete()).toBe(true);
    });

    it('returns false after loading a sequence', () => {
      engine.load(threeStepSequence);
      expect(engine.isComplete()).toBe(false);
    });

    it('returns true after all steps are advanced', () => {
      engine.load(threeStepSequence);
      engine.advance({ type: 'checkout-reached', feeGreaterThan: 399 });
      engine.advance({ type: 'nudge-tapped', stepId: 'savings-alert' });
      engine.advance({ type: 'trial-activated' });
      expect(engine.isComplete()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('returns null from advance() when no sequence is loaded', () => {
      expect(engine.advance({ type: 'trial-activated' })).toBeNull();
    });

    it('handles empty sequence (0 steps)', () => {
      engine.load({ id: 'empty', steps: [] });
      expect(engine.isComplete()).toBe(true);
      expect(engine.getCurrentStep()).toBeNull();
      expect(engine.advance({ type: 'trial-activated' })).toBeNull();
    });

    it('handles single-step sequence', () => {
      engine.load({ id: 'single', steps: [step1] });
      const event = engine.advance({ type: 'checkout-reached', feeGreaterThan: 100 });
      expect(event).not.toBeNull();
      expect(engine.isComplete()).toBe(true);
    });
  });
});
