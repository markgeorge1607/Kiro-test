import { NudgeSequence } from '../../types/index';

/**
 * Squeezed Saver checkout nudge sequence.
 *
 * A 3-step conversational flow for the "squeezed-saver" archetype:
 *   1. savings-alert  — loss-aversion fee alert at checkout
 *   2. trial-offer    — loss-aversion trial toggle on nudge tap
 *   3. delight-confirm — peak-end-rule confetti on trial activation
 *
 * Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2
 */
export const squeezedSaverCheckoutSequence: NudgeSequence = {
  id: 'squeezed-saver-checkout',
  steps: [
    // Step 1 — Savings Alert (Req 4.1, 4.2, 4.3)
    {
      stepId: 'savings-alert',
      trigger: { type: 'item-added-to-basket', feeGreaterThan: 0 },
      messageTemplate:
        "Hey Sam, I noticed you've spent £12 on delivery fees lately. That's a massive 'convenience tax.' Let's wipe that out—join JET+ for free for {{trialDuration}} and save {{fee}} on this order right now.",
      uiDirective: {
        componentType: 'savings-badge',
        props: {
          position: 'over-checkout-button',
          animationType: 'vibrate',
        },
      },
    },
    // Step 2 — Trial Offer (Req 5.1, 5.2, 5.3)
    {
      stepId: 'trial-offer',
      trigger: { type: 'nudge-tapped', stepId: 'savings-alert' },
      messageTemplate:
        'I can wipe that fee out right now. Join JET+ for free for {{trialDuration}} and save {{savings}} on this order alone.',
      uiDirective: {
        componentType: 'quick-toggle',
        props: {
          label: 'Start free trial',
          savingsAmount: '{{savings}}',
          trialDuration: '{{trialDuration}}',
        },
      },
    },
    // Step 3 — Delight Confirm (Req 6.1, 6.2)
    {
      stepId: 'delight-confirm',
      trigger: { type: 'trial-activated' },
      strategyOverride: 'peak-end-rule',
      messageTemplate:
        "Boom! Fee deleted. You're officially a member. I'll keep an eye on your savings from here.",
      uiDirective: {
        componentType: 'celebration-sheet',
        props: {
          welcomeTitle: 'Welcome to Just Eat+',
          bodyMessage: 'You just saved {{savings}} on delivery. Your fee is gone — enjoy free delivery on this order.',
          autoDismissDuration: 4000,
          archetypeName: 'squeezed-saver',
        },
      },
    },
  ],
};
