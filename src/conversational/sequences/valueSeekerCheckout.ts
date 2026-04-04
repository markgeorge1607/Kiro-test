import { NudgeSequence } from '../../types/index';

/**
 * Value Seeker checkout nudge sequence.
 *
 * A 3-step conversational flow for the "value-seeker" archetype:
 *   1. savings-alert  — identity-reinforcement savings alert at checkout
 *   2. trial-offer    — identity-reinforcement trial toggle on nudge tap
 *   3. delight-confirm — peak-end-rule confetti on trial activation
 *
 * Requirements: 10.3
 */
export const valueSeekerCheckoutSequence: NudgeSequence = {
  id: 'value-seeker-checkout',
  steps: [
    // Step 1 — Savings Alert (identity-reinforcement framing)
    {
      stepId: 'savings-alert',
      trigger: { type: 'item-added-to-basket', feeGreaterThan: 0 },
      strategyOverride: 'identity-reinforcement',
      messageTemplate:
        "Smart move, Alex. JET+ members save an average of £20/month on delivery. You could save {{fee}} on this order alone — unlock your exclusive member rate now.",
      uiDirective: {
        componentType: 'savings-badge',
        props: {
          position: 'over-checkout-button',
          animationType: 'vibrate',
        },
      },
    },
    // Step 2 — Trial Offer (identity-reinforcement framing)
    {
      stepId: 'trial-offer',
      trigger: { type: 'nudge-tapped', stepId: 'savings-alert' },
      strategyOverride: 'identity-reinforcement',
      messageTemplate:
        "Join the savvy crowd. Start your free {{trialDuration}} JET+ trial and save {{savings}} on this order — plus unlock exclusive member-only offers.",
      uiDirective: {
        componentType: 'quick-toggle',
        props: {
          label: 'Unlock free trial',
          savingsAmount: '{{savings}}',
          trialDuration: '{{trialDuration}}',
        },
      },
    },
    // Step 3 — Delight Confirm (peak-end-rule)
    {
      stepId: 'delight-confirm',
      trigger: { type: 'trial-activated' },
      strategyOverride: 'peak-end-rule',
      messageTemplate:
        "You're in! £0.00 delivery unlocked. Welcome to the club — I'll track your savings so you always know your edge.",
      uiDirective: {
        componentType: 'celebration-sheet',
        props: {
          welcomeTitle: 'Welcome to Just Eat+',
          bodyMessage: "You're officially a JET+ member. Exclusive savings and £0.00 delivery start now.",
          autoDismissDuration: 4000,
          archetypeName: 'value-seeker',
        },
      },
    },
  ],
};
