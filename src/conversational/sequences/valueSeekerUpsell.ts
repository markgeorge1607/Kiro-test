import { NudgeSequence } from '../../types/index';

/**
 * Value Seeker Subscription Upsell nudge sequence.
 *
 * A 4-step conversational flow for the "value-seeker" archetype,
 * triggered when monthly accumulated delivery fees exceed £10.00 (1000 pence).
 * Uses identity-reinforcement framing with optimization and exclusivity messaging.
 *
 *   1. upsell-alert    — identity-reinforcement optimization prompt
 *   2. upsell-offer    — identity-reinforcement trial toggle on nudge tap
 *   3. payment-capture — payment details collection before trial activation
 *   4. upsell-confirm  — peak-end-rule confetti on trial activation
 *
 * Requirements: 1.1, 1.8, 12.2, 12.4
 */
export const valueSeekerUpsellSequence: NudgeSequence = {
  id: 'value-seeker-upsell',
  steps: [
    // Step 1 — Upsell Alert (Req 12.2: identity-reinforcement optimization/exclusivity framing)
    {
      stepId: 'upsell-alert',
      trigger: { type: 'subscription-upsell', monthlyFeesExceed: 1000 },
      strategyOverride: 'identity-reinforcement',
      messageTemplate:
        "Ready to optimize, {{userName}}? Most JET+ members save over £20 a month. Start your trial now to get this delivery for £0.00 and unlock exclusive member-only offers",
      uiDirective: {
        componentType: 'savings-badge',
        props: {
          position: 'over-checkout-button',
          animationType: 'vibrate',
        },
      },
    },
    // Step 2 — Upsell Offer (identity-reinforcement toggle)
    {
      stepId: 'upsell-offer',
      trigger: { type: 'nudge-tapped', stepId: 'upsell-alert' },
      strategyOverride: 'identity-reinforcement',
      messageTemplate:
        "Unlock your edge now. Start your free 14-day JET+ trial and save {{currentOrderSavings}} on this order — plus get exclusive member-only deals.",
      uiDirective: {
        componentType: 'quick-toggle',
        props: {
          label: 'Unlock free trial',
          savingsAmount: '{{currentOrderSavings}}',
          trialDuration: '14 days',
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
    // Step 4 — Upsell Confirm (peak-end-rule celebration)
    {
      stepId: 'upsell-confirm',
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
