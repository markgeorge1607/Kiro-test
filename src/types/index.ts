// ── Behavioral Strategy ──────────────────────────────────────────────

export type BehavioralStrategyName =
  | 'loss-aversion'
  | 'peak-end-rule'
  | 'identity-reinforcement';

// ── Archetype ────────────────────────────────────────────────────────

export interface Archetype {
  name: string;
  traits: string[];
  preferredStrategies: BehavioralStrategyName[];
}

// ── User Context ─────────────────────────────────────────────────────

export interface UserContext {
  membershipStatus: 'member' | 'non-member';
  deliveryFee: number; // integer pence (e.g. 399 = £3.99)
  monthlyAccumulatedFees: number; // integer pence, total delivery fees this calendar month
  basketTotal: number; // integer pence, current basket total
  minimumOrderValue: number; // integer pence, restaurant's minimum order value (default 1500 = £15.00)
  archetype: Archetype | null;
}

// ── Trigger Conditions ───────────────────────────────────────────────

export type TriggerCondition =
  | { type: 'item-added-to-basket'; feeGreaterThan: number }
  | { type: 'checkout-reached'; feeGreaterThan: number }
  | { type: 'nudge-tapped'; stepId: string }
  | { type: 'trial-activated' }
  | { type: 'subscription-upsell'; monthlyFeesExceed: number };

// ── UI Directive ─────────────────────────────────────────────────────

export interface UIDirective {
  componentType: string;
  targetSelector?: string;
  props: Record<string, unknown>;
}

// ── Nudge Step & Sequence ────────────────────────────────────────────

export interface NudgeStep {
  stepId: string;
  trigger: TriggerCondition;
  messageTemplate: string;
  uiDirective: UIDirective;
  strategyOverride?: BehavioralStrategyName;
}

export interface NudgeSequence {
  id: string;
  steps: NudgeStep[];
}

// ── Nudge Event (emitted output) ────────────────────────────────────

export interface NudgeEvent {
  stepId: string;
  message: string;
  uiDirective: UIDirective;
  timestamp: string; // ISO 8601
  metadata: {
    archetypeName: string;
    strategyName: BehavioralStrategyName;
  };
}

// ── Basket ───────────────────────────────────────────────────────────

export interface BasketItem {
  id: string;
  name: string;
  price: number; // integer pence
  quantity: number;
}

export interface BasketState {
  items: BasketItem[];
  deliveryFee: number; // integer pence
  membershipStatus: 'member' | 'non-member';
  trialActive: boolean;
}

// ── PIE Component Layer ──────────────────────────────────────────────

export interface PIEInteractionEvent {
  componentType: string;
  action: string;
  payload?: Record<string, unknown>;
}

export interface PIEComponentProps {
  directive: UIDirective;
  onInteraction?: (event: PIEInteractionEvent) => void;
}
