import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type {
  Archetype,
  UserContext,
  TriggerCondition,
  NudgeEvent,
  BasketState,
} from '../types';

describe('Core types', () => {
  it('should allow creating a valid Archetype', () => {
    const archetype: Archetype = {
      name: 'squeezed-saver',
      traits: ['cost-conscious', 'deal-seeking', 'fee-averse'],
      preferredStrategies: ['loss-aversion', 'peak-end-rule', 'identity-reinforcement'],
    };
    expect(archetype.name).toBe('squeezed-saver');
    expect(archetype.traits).toHaveLength(3);
    expect(archetype.preferredStrategies).toHaveLength(3);
  });

  it('should allow creating a valid UserContext', () => {
    const ctx: UserContext = {
      membershipStatus: 'non-member',
      deliveryFee: 399,
      monthlyAccumulatedFees: 0,
      basketTotal: 0,
      minimumOrderValue: 1500,
      archetype: null,
    };
    expect(ctx.membershipStatus).toBe('non-member');
    expect(ctx.deliveryFee).toBe(399);
    expect(ctx.archetype).toBeNull();
  });

  it('should allow creating all TriggerCondition variants', () => {
    const triggers: TriggerCondition[] = [
      { type: 'checkout-reached', feeGreaterThan: 0 },
      { type: 'nudge-tapped', stepId: 'savings-alert' },
      { type: 'trial-activated' },
    ];
    expect(triggers).toHaveLength(3);
  });

  it('should allow creating a valid NudgeEvent', () => {
    const event: NudgeEvent = {
      stepId: 'savings-alert',
      message: 'You could save £3.99!',
      uiDirective: {
        componentType: 'savings-badge',
        props: { position: 'top-right', animationType: 'vibrate' },
      },
      timestamp: new Date().toISOString(),
      metadata: {
        archetypeName: 'squeezed-saver',
        strategyName: 'loss-aversion',
      },
    };
    expect(event.stepId).toBe('savings-alert');
    expect(event.timestamp).toBeTruthy();
  });

  it('should allow creating a valid BasketState', () => {
    const basket: BasketState = {
      items: [{ id: '1', name: 'Pizza', price: 1299, quantity: 1 }],
      deliveryFee: 399,
      membershipStatus: 'non-member',
      trialActive: false,
    };
    expect(basket.items).toHaveLength(1);
    expect(basket.deliveryFee).toBe(399);
  });

  it('fast-check smoke test', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer(), (name, fee) => {
        const ctx: UserContext = {
          membershipStatus: 'non-member',
          deliveryFee: Math.abs(fee),
          monthlyAccumulatedFees: 0,
          basketTotal: 0,
          minimumOrderValue: 1500,
          archetype: { name, traits: [], preferredStrategies: ['loss-aversion'] },
        };
        return ctx.deliveryFee >= 0;
      }),
      { numRuns: 100 },
    );
  });
});
