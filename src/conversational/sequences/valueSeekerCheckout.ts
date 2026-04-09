import { NudgeSequence } from '../../types/index';

/**
 * Value Seeker checkout nudge sequence.
 *
 * A 4-step conversational flow for the "value-seeker" archetype:
 *   1. savings-alert   — identity-reinforcement savings alert at checkout
 *   2. trial-offer     — identity-reinforcement trial toggle on nudge tap
 *   3. payment-capture — payment details collection before trial activation
 *   4. delight-confirm — peak-end-rule confetti on trial activation
 *
 * Requirements: 1.1, 1.8, 10.3
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
    // Step 3 — Payment Capture (Req 1.1, 1.8)
    {
      stepId: 'payment-capture',
      trigger: { type: 'payment-capture-requested' },
      messageTemplate:
        'Add your payment details to start your free {{trialDuration}} trial.',
      uiDirective: {
        componentType: 'payment-capture-sheet',
        props: {
          savedCards: [
            { id: 'card-1', brand: 'mastercard', lastFour: '6374', expiryMonth: 12, expiryYear: 2027 },
            { id: 'card-2', brand: 'amex', lastFour: '6374', expiryMonth: 6, expiryYear: 2028 },
          ],
          trialDuration: '{{trialDuration}}',
          savingsAmount: '{{currentOrderSavings}}',
        },
      },
    },
    // Step 4 — Delight Confirm (peak-end-rule)
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
