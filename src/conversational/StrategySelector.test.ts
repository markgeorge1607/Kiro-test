import { describe, it, expect } from 'vitest';
import { StrategySelector } from './StrategySelector';
import type { Archetype, UserContext } from '../types/index';
import { SQUEEZED_SAVER_ARCHETYPE } from './ArchetypeRegistry';

describe('StrategySelector', () => {
  const selector = new StrategySelector();

  const nonMemberContext: UserContext = {
    membershipStatus: 'non-member',
    deliveryFee: 399,
    monthlyAccumulatedFees: 0,
    basketTotal: 0,
    minimumOrderValue: 1500,
    archetype: SQUEEZED_SAVER_ARCHETYPE,
  };

  const memberContext: UserContext = {
    membershipStatus: 'member',
    deliveryFee: 0,
    monthlyAccumulatedFees: 0,
    basketTotal: 0,
    minimumOrderValue: 1500,
    archetype: SQUEEZED_SAVER_ARCHETYPE,
  };

  it('returns loss-aversion for Squeezed Saver archetype (Req 2.2)', () => {
    const result = selector.select(SQUEEZED_SAVER_ARCHETYPE, nonMemberContext);
    expect(result).toBe('loss-aversion');
  });

  it('returns the first preferred strategy from the archetype list (Req 2.3)', () => {
    const archetype: Archetype = {
      name: 'test-archetype',
      traits: ['trait-a'],
      preferredStrategies: ['peak-end-rule', 'identity-reinforcement'],
    };
    const ctx: UserContext = {
      membershipStatus: 'non-member',
      deliveryFee: 250,
      monthlyAccumulatedFees: 0,
      basketTotal: 0,
      minimumOrderValue: 1500,
      archetype,
    };

    expect(selector.select(archetype, ctx)).toBe('peak-end-rule');
  });

  it('returns undefined when preferredStrategies is empty', () => {
    const archetype: Archetype = {
      name: 'empty-archetype',
      traits: [],
      preferredStrategies: [],
    };
    const ctx: UserContext = {
      membershipStatus: 'non-member',
      deliveryFee: 100,
      monthlyAccumulatedFees: 0,
      basketTotal: 0,
      minimumOrderValue: 1500,
      archetype,
    };

    expect(selector.select(archetype, ctx)).toBeUndefined();
  });

  it('returns a strategy that is contained in the archetype preferredStrategies (Req 1.2)', () => {
    const archetype: Archetype = {
      name: 'identity-first',
      traits: ['loyal'],
      preferredStrategies: ['identity-reinforcement', 'loss-aversion'],
    };
    const ctx: UserContext = {
      membershipStatus: 'member',
      deliveryFee: 0,
      monthlyAccumulatedFees: 0,
      basketTotal: 0,
      minimumOrderValue: 1500,
      archetype,
    };

    const result = selector.select(archetype, ctx);
    expect(archetype.preferredStrategies).toContain(result);
  });

  it('works with member context', () => {
    const result = selector.select(SQUEEZED_SAVER_ARCHETYPE, memberContext);
    expect(result).toBe('loss-aversion');
  });
});
