import { describe, it, expect } from 'vitest';
import {
  UserContextEvaluator,
  UserData,
  UserDataProvider,
} from './UserContextEvaluator';
import { ArchetypeRegistry, SQUEEZED_SAVER_ARCHETYPE } from './ArchetypeRegistry';

function makeRegistry(): ArchetypeRegistry {
  const registry = new ArchetypeRegistry();
  registry.register(SQUEEZED_SAVER_ARCHETYPE);
  return registry;
}

function makeProvider(store: Record<string, UserData>): UserDataProvider {
  return (userId: string) => store[userId];
}

describe('UserContextEvaluator', () => {
  it('returns full context for a known user with a registered archetype', () => {
    const store: Record<string, UserData> = {
      'user-1': {
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
      },
    };
    const evaluator = new UserContextEvaluator(makeProvider(store), makeRegistry());
    const ctx = evaluator.evaluate('user-1');

    expect(ctx.membershipStatus).toBe('non-member');
    expect(ctx.deliveryFee).toBe(399);
    expect(ctx.archetype).toEqual(SQUEEZED_SAVER_ARCHETYPE);
  });

  it('returns archetype: null for an unknown user (fallback)', () => {
    const evaluator = new UserContextEvaluator(() => undefined, makeRegistry());
    const ctx = evaluator.evaluate('unknown');

    expect(ctx.membershipStatus).toBe('non-member');
    expect(ctx.deliveryFee).toBe(0);
    expect(ctx.archetype).toBeNull();
  });

  it('returns archetype: null when the archetype name is not registered', () => {
    const store: Record<string, UserData> = {
      'user-2': {
        membershipStatus: 'member',
        deliveryFee: 0,
        archetypeName: 'unknown-archetype',
      },
    };
    const evaluator = new UserContextEvaluator(makeProvider(store), makeRegistry());
    const ctx = evaluator.evaluate('user-2');

    expect(ctx.membershipStatus).toBe('member');
    expect(ctx.deliveryFee).toBe(0);
    expect(ctx.archetype).toBeNull();
  });

  it('returns fallback context when the provider throws', () => {
    const throwingProvider: UserDataProvider = () => {
      throw new Error('service unavailable');
    };
    const evaluator = new UserContextEvaluator(throwingProvider, makeRegistry());
    const ctx = evaluator.evaluate('user-3');

    expect(ctx.membershipStatus).toBe('non-member');
    expect(ctx.deliveryFee).toBe(0);
    expect(ctx.archetype).toBeNull();
  });

  it('clamps negative delivery fees to zero', () => {
    const store: Record<string, UserData> = {
      'user-4': {
        membershipStatus: 'non-member',
        deliveryFee: -100,
        archetypeName: 'squeezed-saver',
      },
    };
    const evaluator = new UserContextEvaluator(makeProvider(store), makeRegistry());
    const ctx = evaluator.evaluate('user-4');

    expect(ctx.deliveryFee).toBe(0);
  });

  it('floors fractional delivery fees to an integer', () => {
    const store: Record<string, UserData> = {
      'user-5': {
        membershipStatus: 'member',
        deliveryFee: 399.7,
        archetypeName: 'squeezed-saver',
      },
    };
    const evaluator = new UserContextEvaluator(makeProvider(store), makeRegistry());
    const ctx = evaluator.evaluate('user-5');

    expect(ctx.deliveryFee).toBe(399);
  });

  it('returns a member context correctly', () => {
    const store: Record<string, UserData> = {
      'user-6': {
        membershipStatus: 'member',
        deliveryFee: 0,
        archetypeName: 'squeezed-saver',
      },
    };
    const evaluator = new UserContextEvaluator(makeProvider(store), makeRegistry());
    const ctx = evaluator.evaluate('user-6');

    expect(ctx.membershipStatus).toBe('member');
    expect(ctx.deliveryFee).toBe(0);
    expect(ctx.archetype).toEqual(SQUEEZED_SAVER_ARCHETYPE);
  });

  it('includes monthlyAccumulatedFees when provided in UserData', () => {
    const store: Record<string, UserData> = {
      'user-7': {
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        monthlyAccumulatedFees: 1500,
      },
    };
    const evaluator = new UserContextEvaluator(makeProvider(store), makeRegistry());
    const ctx = evaluator.evaluate('user-7');

    expect(ctx.monthlyAccumulatedFees).toBe(1500);
  });

  it('defaults monthlyAccumulatedFees to 0 when not provided in UserData', () => {
    const store: Record<string, UserData> = {
      'user-8': {
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
      },
    };
    const evaluator = new UserContextEvaluator(makeProvider(store), makeRegistry());
    const ctx = evaluator.evaluate('user-8');

    expect(ctx.monthlyAccumulatedFees).toBe(0);
  });

  it('returns monthlyAccumulatedFees as 0 in fallback context', () => {
    const evaluator = new UserContextEvaluator(() => undefined, makeRegistry());
    const ctx = evaluator.evaluate('unknown-user');

    expect(ctx.monthlyAccumulatedFees).toBe(0);
  });

  it('clamps negative monthlyAccumulatedFees to 0', () => {
    const store: Record<string, UserData> = {
      'user-9': {
        membershipStatus: 'non-member',
        deliveryFee: 399,
        archetypeName: 'squeezed-saver',
        monthlyAccumulatedFees: -500,
      },
    };
    const evaluator = new UserContextEvaluator(makeProvider(store), makeRegistry());
    const ctx = evaluator.evaluate('user-9');

    expect(ctx.monthlyAccumulatedFees).toBe(0);
  });

  describe('MOV fields', () => {
    it('defaults minimumOrderValue to 1500 when not provided in UserData', () => {
      const store: Record<string, UserData> = {
        'mov-1': {
          membershipStatus: 'non-member',
          deliveryFee: 399,
          archetypeName: 'squeezed-saver',
        },
      };
      const evaluator = new UserContextEvaluator(makeProvider(store), makeRegistry());
      const ctx = evaluator.evaluate('mov-1');

      expect(ctx.minimumOrderValue).toBe(1500);
    });

    it('defaults basketTotal to 0 when not provided in UserData', () => {
      const store: Record<string, UserData> = {
        'mov-2': {
          membershipStatus: 'non-member',
          deliveryFee: 399,
          archetypeName: 'squeezed-saver',
        },
      };
      const evaluator = new UserContextEvaluator(makeProvider(store), makeRegistry());
      const ctx = evaluator.evaluate('mov-2');

      expect(ctx.basketTotal).toBe(0);
    });

    it('passes through provided basketTotal value correctly', () => {
      const store: Record<string, UserData> = {
        'mov-3': {
          membershipStatus: 'non-member',
          deliveryFee: 399,
          archetypeName: 'squeezed-saver',
          basketTotal: 2500,
        },
      };
      const evaluator = new UserContextEvaluator(makeProvider(store), makeRegistry());
      const ctx = evaluator.evaluate('mov-3');

      expect(ctx.basketTotal).toBe(2500);
    });

    it('passes through provided minimumOrderValue correctly', () => {
      const store: Record<string, UserData> = {
        'mov-4': {
          membershipStatus: 'non-member',
          deliveryFee: 399,
          archetypeName: 'squeezed-saver',
          minimumOrderValue: 2000,
        },
      };
      const evaluator = new UserContextEvaluator(makeProvider(store), makeRegistry());
      const ctx = evaluator.evaluate('mov-4');

      expect(ctx.minimumOrderValue).toBe(2000);
    });

    it('includes both basketTotal and minimumOrderValue in fallback context', () => {
      const evaluator = new UserContextEvaluator(() => undefined, makeRegistry());
      const ctx = evaluator.evaluate('unknown-mov');

      expect(ctx.basketTotal).toBe(0);
      expect(ctx.minimumOrderValue).toBe(1500);
    });
  });
});
