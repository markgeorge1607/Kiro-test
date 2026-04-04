import { describe, it, expect, beforeEach } from 'vitest';
import { CheckoutNudgeController } from './CheckoutNudgeController';
import { UserContextEvaluator, UserData } from '../conversational/UserContextEvaluator';
import { StrategySelector } from '../conversational/StrategySelector';
import {
  ArchetypeRegistry,
  createDefaultRegistry,
} from '../conversational/ArchetypeRegistry';

function createController(userData: UserData | undefined) {
  const registry = createDefaultRegistry();
  const provider = () => userData;
  const evaluator = new UserContextEvaluator(provider, registry);
  const selector = new StrategySelector();
  return new CheckoutNudgeController(evaluator, selector, registry);
}

describe('CheckoutNudgeController', () => {
  describe('initialize', () => {
    it('returns InitResult for a squeezed-saver user', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 2000,
      });

      const result = ctrl.initialize('user-1');

      expect(result).toEqual({
        archetypeName: 'squeezed-saver',
        strategyName: 'loss-aversion',
      });
    });

    it('returns null when user has no archetype', () => {
      const ctrl = createController(undefined);

      const result = ctrl.initialize('unknown-user');

      expect(result).toBeNull();
    });

    it('returns null when archetype has no preferred strategies', () => {
      const registry = new ArchetypeRegistry();
      registry.register({ name: 'empty', traits: [], preferredStrategies: [] });
      const provider = () => ({
        membershipStatus: 'non-member' as const,
        deliveryFee: 200,
        archetypeName: 'empty',
        basketTotal: 2000,
      });
      const evaluator = new UserContextEvaluator(provider, registry);
      const selector = new StrategySelector();
      const ctrl = new CheckoutNudgeController(evaluator, selector, registry);

      const result = ctrl.initialize('user-1');

      expect(result).toBeNull();
    });
  });

  describe('handleItemAdded', () => {
    it('returns null when not initialized', () => {
      const ctrl = createController(undefined);
      expect(ctrl.handleItemAdded(399)).toBeNull();
    });

    it('emits savings-alert nudge event when item added with fee', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      const event = ctrl.handleItemAdded(399);

      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('savings-alert');
      expect(event!.uiDirective.componentType).toBe('savings-badge');
      expect(event!.metadata.strategyName).toBe('loss-aversion');
      expect(event!.message).toContain('£3.99');
    });
  });

  describe('handleInteraction', () => {
    let ctrl: CheckoutNudgeController;

    beforeEach(() => {
      ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');
      ctrl.handleItemAdded(399); // advance past step 1
    });

    it('maps savings-badge tapped to nudge-tapped trigger', () => {
      const event = ctrl.handleInteraction({
        componentType: 'savings-badge',
        action: 'tapped',
      });

      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('trial-offer');
      expect(event!.uiDirective.componentType).toBe('quick-toggle');
    });

    it('maps quick-toggle toggled-on to trial-activated trigger', () => {
      // Advance past step 2 first
      ctrl.handleInteraction({ componentType: 'savings-badge', action: 'tapped' });

      const event = ctrl.handleInteraction({
        componentType: 'quick-toggle',
        action: 'toggled-on',
      });

      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('delight-confirm');
      expect(event!.uiDirective.componentType).toBe('celebration-sheet');
      expect(event!.metadata.strategyName).toBe('peak-end-rule');
    });

    it('returns null for unrecognized interaction', () => {
      const event = ctrl.handleInteraction({
        componentType: 'unknown',
        action: 'clicked',
      });

      expect(event).toBeNull();
    });

    it('returns null when not initialized', () => {
      const uninitCtrl = createController(undefined);
      const event = uninitCtrl.handleInteraction({
        componentType: 'savings-badge',
        action: 'tapped',
      });

      expect(event).toBeNull();
    });
  });

  describe('reset', () => {
    it('resets sequence to step 0 on checkout abandonment', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');
      ctrl.handleItemAdded(399); // advance to step 2

      ctrl.reset();

      // After reset, the first step should be current again
      const step = ctrl.getCurrentStep();
      expect(step).not.toBeNull();
      expect(step!.stepId).toBe('savings-alert');
    });

    it('is safe to call when not initialized', () => {
      const ctrl = createController(undefined);
      expect(() => ctrl.reset()).not.toThrow();
    });
  });

  describe('getCurrentStep', () => {
    it('returns null when not initialized', () => {
      const ctrl = createController(undefined);
      expect(ctrl.getCurrentStep()).toBeNull();
    });

    it('returns the current step after initialization', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      const step = ctrl.getCurrentStep();
      expect(step).not.toBeNull();
      expect(step!.stepId).toBe('savings-alert');
    });
  });

  describe('isComplete', () => {
    it('returns true when not initialized', () => {
      const ctrl = createController(undefined);
      expect(ctrl.isComplete()).toBe(true);
    });

    it('returns false after initialization', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');
      expect(ctrl.isComplete()).toBe(false);
    });

    it('returns true after all 3 steps complete', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      ctrl.handleItemAdded(399);
      ctrl.handleInteraction({ componentType: 'savings-badge', action: 'tapped' });
      ctrl.handleInteraction({ componentType: 'quick-toggle', action: 'toggled-on' });

      expect(ctrl.isComplete()).toBe(true);
    });
  });

  describe('full 3-step flow', () => {
    it('completes the squeezed saver checkout sequence end-to-end', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 499,
        archetypeName: 'squeezed-saver',
        basketTotal: 2000,
      });

      const initResult = ctrl.initialize('user-1');
      expect(initResult).toEqual({
        archetypeName: 'squeezed-saver',
        strategyName: 'loss-aversion',
      });

      // Step 1: item added to basket
      const step1 = ctrl.handleItemAdded(499);
      expect(step1).not.toBeNull();
      expect(step1!.stepId).toBe('savings-alert');
      expect(step1!.message).toContain('£4.99');
      expect(step1!.uiDirective.componentType).toBe('savings-badge');

      // Step 2: savings badge tapped
      const step2 = ctrl.handleInteraction({
        componentType: 'savings-badge',
        action: 'tapped',
      });
      expect(step2).not.toBeNull();
      expect(step2!.stepId).toBe('trial-offer');
      expect(step2!.uiDirective.componentType).toBe('quick-toggle');

      // Step 3: trial activated
      const step3 = ctrl.handleInteraction({
        componentType: 'quick-toggle',
        action: 'toggled-on',
      });
      expect(step3).not.toBeNull();
      expect(step3!.stepId).toBe('delight-confirm');
      expect(step3!.uiDirective.componentType).toBe('celebration-sheet');
      expect(step3!.metadata.strategyName).toBe('peak-end-rule');

      expect(ctrl.isComplete()).toBe(true);
    });
  });

  // ── Value Seeker initialization and checkout flow (Req 10.3) ──────

  describe('Value Seeker initialization', () => {
    it('returns InitResult with archetypeName value-seeker and strategyName identity-reinforcement', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'value-seeker',
        basketTotal: 2000,
      });

      const result = ctrl.initialize('user-1');

      expect(result).toEqual({
        archetypeName: 'value-seeker',
        strategyName: 'identity-reinforcement',
      });
    });

    it('completes the 3-step value seeker checkout flow', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 350,
        archetypeName: 'value-seeker',
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      // Step 1: item-added → savings-alert with identity-reinforcement
      const step1 = ctrl.handleItemAdded(350);
      expect(step1).not.toBeNull();
      expect(step1!.stepId).toBe('savings-alert');
      expect(step1!.metadata.strategyName).toBe('identity-reinforcement');
      expect(step1!.uiDirective.componentType).toBe('savings-badge');
      expect(step1!.message).toContain('£3.50');

      // Step 2: nudge-tapped → trial-offer
      const step2 = ctrl.handleInteraction({
        componentType: 'savings-badge',
        action: 'tapped',
      });
      expect(step2).not.toBeNull();
      expect(step2!.stepId).toBe('trial-offer');
      expect(step2!.uiDirective.componentType).toBe('quick-toggle');

      // Step 3: trial-activated → delight-confirm
      const step3 = ctrl.handleInteraction({
        componentType: 'quick-toggle',
        action: 'toggled-on',
      });
      expect(step3).not.toBeNull();
      expect(step3!.stepId).toBe('delight-confirm');
      expect(step3!.uiDirective.componentType).toBe('celebration-sheet');
      expect(step3!.metadata.strategyName).toBe('peak-end-rule');

      expect(ctrl.isComplete()).toBe(true);
    });
  });

  // ── Subscription Upsell sequence selection (Req 11.1, 11.3, 12.1, 12.2) ──

  describe('Subscription Upsell sequence selection', () => {
    it('loads upsell sequence when monthlyAccumulatedFees > 1000 and non-member', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        monthlyAccumulatedFees: 1500,
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      // First step of upsell sequence is triggered via subscription-upsell
      const event = ctrl.handleSubscriptionUpsell(1500);

      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('upsell-alert');
      expect(event!.uiDirective.componentType).toBe('savings-badge');
    });

    it('upsell message contains expected template variables for squeezed-saver', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        monthlyAccumulatedFees: 1500,
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      const event = ctrl.handleSubscriptionUpsell(1500);

      expect(event).not.toBeNull();
      // Squeezed Saver persona name is "Sam"
      expect(event!.message).toContain('Sam');
      // accumulatedFees = £15.00
      expect(event!.message).toContain('£15.00');
      // currentOrderSavings = £3.99
      expect(event!.message).toContain('£3.99');
    });

    it('upsell message contains expected template variables for value-seeker', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 250,
        archetypeName: 'value-seeker',
        monthlyAccumulatedFees: 2000,
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      const event = ctrl.handleSubscriptionUpsell(2000);

      expect(event).not.toBeNull();
      // Value Seeker persona name is "Alex"
      expect(event!.message).toContain('Alex');
      // identity-reinforcement framing
      expect(event!.metadata.strategyName).toBe('identity-reinforcement');
    });
  });

  // ── Upsell NOT triggering (Req 11.1, 11.3) ───────────────────────

  describe('Upsell not triggering', () => {
    it('uses standard checkout sequence when monthlyAccumulatedFees <= 1000', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        monthlyAccumulatedFees: 800,
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      // Standard checkout sequence starts with item-added trigger, not subscription-upsell
      const event = ctrl.handleItemAdded(399);
      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('savings-alert');

      // subscription-upsell trigger should not match the standard checkout sequence
      const upsellEvent = ctrl.handleSubscriptionUpsell(800);
      expect(upsellEvent).toBeNull();
    });

    it('uses standard checkout sequence when user is a member even with high fees', () => {
      const ctrl = createController({
        membershipStatus: 'member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        monthlyAccumulatedFees: 5000,
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      // Member gets standard checkout sequence, not upsell
      const event = ctrl.handleItemAdded(399);
      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('savings-alert');
    });

    it('boundary case: fees exactly at 1000 pence (£10.00) should NOT trigger upsell', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        monthlyAccumulatedFees: 1000,
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      // At exactly 1000, threshold is NOT met (> 1000, not >=)
      // Standard checkout sequence is loaded, so item-added works
      const event = ctrl.handleItemAdded(399);
      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('savings-alert');

      // subscription-upsell trigger should not match standard checkout
      const upsellEvent = ctrl.handleSubscriptionUpsell(1000);
      expect(upsellEvent).toBeNull();
    });
  });

  // ── Squeezed Saver upsell flow (Req 12.1) ────────────────────────

  describe('Squeezed Saver upsell flow', () => {
    it('completes the full 3-step upsell flow with loss-aversion framing', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        monthlyAccumulatedFees: 1500,
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      // Step 1: subscription-upsell → upsell-alert
      const step1 = ctrl.handleSubscriptionUpsell(1500);
      expect(step1).not.toBeNull();
      expect(step1!.stepId).toBe('upsell-alert');
      expect(step1!.metadata.strategyName).toBe('loss-aversion');
      // Loss-aversion "convenience tax" framing
      expect(step1!.message).toContain('convenience tax');

      // Step 2: nudge-tapped on upsell-alert → upsell-offer
      const step2 = ctrl.handleInteraction({
        componentType: 'savings-badge',
        action: 'tapped',
      });
      expect(step2).not.toBeNull();
      expect(step2!.stepId).toBe('upsell-offer');
      expect(step2!.uiDirective.componentType).toBe('quick-toggle');

      // Step 3: trial-activated → upsell-confirm
      const step3 = ctrl.handleInteraction({
        componentType: 'quick-toggle',
        action: 'toggled-on',
      });
      expect(step3).not.toBeNull();
      expect(step3!.stepId).toBe('upsell-confirm');
      expect(step3!.uiDirective.componentType).toBe('celebration-sheet');
      expect(step3!.metadata.strategyName).toBe('peak-end-rule');

      expect(ctrl.isComplete()).toBe(true);
    });
  });

  // ── Value Seeker upsell flow (Req 12.2) ───────────────────────────

  describe('Value Seeker upsell flow', () => {
    it('completes the full 3-step upsell flow with identity-reinforcement framing', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 299,
        archetypeName: 'value-seeker',
        monthlyAccumulatedFees: 2500,
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      // Step 1: subscription-upsell → upsell-alert with identity-reinforcement
      const step1 = ctrl.handleSubscriptionUpsell(2500);
      expect(step1).not.toBeNull();
      expect(step1!.stepId).toBe('upsell-alert');
      expect(step1!.metadata.strategyName).toBe('identity-reinforcement');
      // Identity-reinforcement framing — optimization messaging
      expect(step1!.message).toContain('optimize');

      // Step 2: nudge-tapped on upsell-alert → upsell-offer
      const step2 = ctrl.handleInteraction({
        componentType: 'savings-badge',
        action: 'tapped',
      });
      expect(step2).not.toBeNull();
      expect(step2!.stepId).toBe('upsell-offer');
      expect(step2!.uiDirective.componentType).toBe('quick-toggle');

      // Step 3: trial-activated → upsell-confirm
      const step3 = ctrl.handleInteraction({
        componentType: 'quick-toggle',
        action: 'toggled-on',
      });
      expect(step3).not.toBeNull();
      expect(step3!.stepId).toBe('upsell-confirm');
      expect(step3!.uiDirective.componentType).toBe('celebration-sheet');
      expect(step3!.metadata.strategyName).toBe('peak-end-rule');

      expect(ctrl.isComplete()).toBe(true);
    });
  });

  // ── MOV gate (Req 14.1, 14.2, 14.3, 14.5) ───────────────────────

  describe('MOV gate', () => {
    it('suppresses nudges when basketTotal < minimumOrderValue (Req 14.1)', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 1000, // below default MOV of 1500
      });
      ctrl.initialize('user-1');

      const event = ctrl.handleItemAdded(399);
      expect(event).toBeNull();
    });

    it('allows nudges when basketTotal >= minimumOrderValue (Req 14.2)', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 1500, // exactly at default MOV
      });
      ctrl.initialize('user-1');

      const event = ctrl.handleItemAdded(399);
      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('savings-alert');
    });

    it('boundary: basketTotal exactly at default MOV (1500) allows nudges (Req 14.2)', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 1500,
      });
      ctrl.initialize('user-1');

      const event = ctrl.handleItemAdded(399);
      expect(event).not.toBeNull();
      expect(event!.stepId).toBe('savings-alert');
    });

    it('suppresses handleSubscriptionUpsell when basketTotal < MOV — MOV checked before upsell threshold (Req 14.5)', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        monthlyAccumulatedFees: 1500,
        basketTotal: 1000, // below MOV
      });
      ctrl.initialize('user-1');

      // Even though upsell threshold is met (1500 > 1000), MOV gate blocks it
      const event = ctrl.handleSubscriptionUpsell(1500);
      expect(event).toBeNull();
    });

    it('defaults MOV to 1500 pence when minimumOrderValue is not provided (Req 14.3)', () => {
      // No minimumOrderValue specified — should default to 1500
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 1499, // just below default 1500
      });
      ctrl.initialize('user-1');

      const suppressed = ctrl.handleItemAdded(399);
      expect(suppressed).toBeNull();

      // Now create with basketTotal at exactly 1500 (default MOV)
      const ctrl2 = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 1500,
      });
      ctrl2.initialize('user-1');

      const allowed = ctrl2.handleItemAdded(399);
      expect(allowed).not.toBeNull();
    });

    it('mid-sequence suppression: dropping basket below MOV suppresses further steps (Req 14.4)', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      // Advance past step 1
      const step1 = ctrl.handleItemAdded(399);
      expect(step1).not.toBeNull();

      // Drop basket below MOV
      ctrl.updateBasketTotal(500);

      // Step 2 interaction should be suppressed
      const step2 = ctrl.handleInteraction({
        componentType: 'savings-badge',
        action: 'tapped',
      });
      expect(step2).toBeNull();
    });

    it('mid-sequence resume: restoring basket above MOV allows sequence to continue (Req 14.4)', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      // Advance past step 1
      ctrl.handleItemAdded(399);

      // Drop basket below MOV
      ctrl.updateBasketTotal(500);

      // Suppressed
      expect(ctrl.handleInteraction({
        componentType: 'savings-badge',
        action: 'tapped',
      })).toBeNull();

      // Restore basket above MOV
      ctrl.updateBasketTotal(2000);

      // Step 2 should now succeed
      const step2 = ctrl.handleInteraction({
        componentType: 'savings-badge',
        action: 'tapped',
      });
      expect(step2).not.toBeNull();
      expect(step2!.stepId).toBe('trial-offer');
    });

    it('sequence position is preserved during MOV suppression — not reset (Req 14.4)', () => {
      const ctrl = createController({
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        basketTotal: 2000,
      });
      ctrl.initialize('user-1');

      // Advance past step 1
      ctrl.handleItemAdded(399);

      // Drop basket below MOV
      ctrl.updateBasketTotal(500);

      // Restore basket above MOV
      ctrl.updateBasketTotal(2000);

      // The engine should still be at step 2 (trial-offer), not reset to step 1
      const step = ctrl.getCurrentStep();
      expect(step).not.toBeNull();
      expect(step!.stepId).toBe('trial-offer');
    });
  });
});
