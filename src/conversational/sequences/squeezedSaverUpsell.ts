import { NudgeSequence } from '../../types/index';

/**
 * Squeezed Saver Subscription Upsell nudge sequence.
 *
 * A 4-step conversational flow for the "squeezed-saver" archetype,
 * triggered when monthly accumulated delivery fees exceed £10.00 (1000 pence).
 * Uses loss-aversion framing with "convenience tax" messaging.
 *
 *   1. upsell-alert    — loss-aversion fee accumulation alert
 *   2. upsell-offer    — loss-aversion trial toggle on nudge tap
 *   3. payment-capture — payment details collection before trial activation
 *   4. upsell-confirm  — peak-end-rule confetti on trial activation
 *
 * Requirements: 1.1, 1.8, 12.1, 12.4
 */
export const squeezedSaverUpsellSequence: NudgeSequence = {
  id: 'squeezed-saver-upsell',
  steps: [
    // Step 1 — Upsell Alert (Req 12.1: loss-aversion "convenience tax" framing)
    {
      stepId: 'upsell-alert',
      trigger: { type: 'subscription-upsell', monthlyFeesExceed: 1000 },
      messageTemplate:
        "Hey {{userName}}, I noticed you've spent {{accumulatedFees}} on delivery fees lately. That's a massive 'convenience tax.' Let's wipe that out—join JET+ for free for 14 days and save {{currentOrderSavings}} on this order right now",
      uiDirective: {
        componentType: 'savings-badge',
        props: {
          position: 'over-checkout-button',
          animationType: 'vibrate',
        },
      },
    },
    // Step 2 — Upsell Offer (loss-aversion toggle)
    {
      stepId: 'upsell-offer',
      trigger: { type: 'nudge-tapped', stepId: 'upsell-alert' },
      messageTemplate:
        "Let's eliminate that fee right now. Start your free 14-day JET+ trial and save {{currentOrderSavings}} on this order.",
      uiDirective: {
        componentType: 'quick-toggle',
        props: {
          label: 'Start free trial',
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
        "Boom! Fee deleted. You're officially a member. I'll keep an eye on your savings from here.",
      uiDirective: {
        componentType: 'celebration-sheet',
        props: {
          welcomeTitle: 'Welcome to Just Eat+',
          bodyMessage: 'You just saved {{currentOrderSavings}} on delivery. Your fee is gone — enjoy free delivery on this order.',
          autoDismissDuration: 4000,
          archetypeName: 'squeezed-saver',
        },
      },
    },
  ],
};
