import { Archetype, UserContext } from '../types/index';
import { ArchetypeRegistry } from './ArchetypeRegistry';

/**
 * Backing data for a single user, used by the evaluator
 * to build a UserContext.
 */
export interface UserData {
  membershipStatus: 'member' | 'non-member';
  deliveryFee: number; // integer pence
  archetypeName: string;
  monthlyAccumulatedFees?: number; // integer pence, total delivery fees this calendar month
  basketTotal?: number; // integer pence, current basket total
  minimumOrderValue?: number; // integer pence, restaurant's MOV (default 1500)
}

/**
 * A lookup function that returns user data or undefined
 * when the user is unknown.
 */
export type UserDataProvider = (userId: string) => UserData | undefined;

/**
 * Default fallback context returned when user data is unavailable.
 * Non-member, zero fee, no archetype → generic checkout, no nudges (Req 1.3).
 */
const FALLBACK_CONTEXT: UserContext = {
  membershipStatus: 'non-member',
  deliveryFee: 0,
  monthlyAccumulatedFees: 0,
  basketTotal: 0,
  minimumOrderValue: 1500,
  archetype: null,
};

/**
 * Evaluates user context for nudge decisions.
 *
 * Retrieves membership status, delivery fee, and archetype for a given
 * user ID. Falls back to a generic context (archetype: null) when user
 * data or archetype lookup fails (Req 1.3).
 *
 * The Conversational Layer never throws — this class always returns a
 * valid UserContext.
 */
export class UserContextEvaluator {
  private readonly provider: UserDataProvider;
  private readonly registry: ArchetypeRegistry;

  constructor(provider: UserDataProvider, registry: ArchetypeRegistry) {
    this.provider = provider;
    this.registry = registry;
  }

  evaluate(userId: string): UserContext {
    let data: UserData | undefined;

    try {
      data = this.provider(userId);
    } catch {
      // Provider threw — fall back to generic context (Req 1.3)
      return { ...FALLBACK_CONTEXT };
    }

    if (!data) {
      return { ...FALLBACK_CONTEXT };
    }

    const archetype: Archetype | null =
      this.registry.get(data.archetypeName) ?? null;

    return {
      membershipStatus: data.membershipStatus,
      deliveryFee: Math.max(0, Math.floor(data.deliveryFee)),
      monthlyAccumulatedFees: Math.max(0, Math.floor(data.monthlyAccumulatedFees ?? 0)),
      basketTotal: Math.max(0, Math.floor(data.basketTotal ?? 0)),
      minimumOrderValue: Math.max(0, Math.floor(data.minimumOrderValue ?? 1500)),
      archetype,
    };
  }
}
