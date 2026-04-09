import { NudgeSequence } from '../../types/index';

/**
 * Squeezed Saver Monthly Credit nudge sequence.
 *
 * A 3-step conversational flow for the "squeezed-saver" archetype,
 * triggered when the user taps the JET+ monthly credit offer tile.
 * Uses loss-aversion framing with "convenience tax" messaging.
 *
 *   1. credit-offer     — loss-aversion monthly credit presentation
 *   2. payment-capture  — payment details collection before trial activation
 *   3. credit-confirm   — peak-end-rule confetti on trial activation
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 7.1, 11.3
 */
export const squeezedSaverMonthlyCreditSequence: NudgeSequence = {
  id: 'squeezed-saver-monthly-credit',
  steps: [
    // Step 1 — Credit Offer (Req 1.3, 1.6, 7.1: loss-aversion framing)
    {
      stepId: 'credit-offer',
      trigger: { type: 'offer-tile-tapped', offerId: 'offer-1' },
      messageTemplate:
        "Stop paying the convenience tax. {{userName}}, you're losing out — unlock {{creditAmount}} monthly credit free for {{trialDuration}} and start saving today.",
      uiDirective: {
        componentType: 'nudge-bottom-sheet',
        props: {
          creditValuePence: 1000,
          benefits: [
            { title: '£10 credit', subtitle: 'use up to £5 credit daily.' },
            { title: 'Exclusive offers', subtitle: 'from best-loved brands.' },
            { title: '5 free deliveries', subtitle: 'Refreshes each month' },
          ],
          faqItems: [
            { question: 'What payment methods can I use?', answer: 'All major credit and debit cards are accepted.' },
            { question: 'Where can I use my credit?', answer: 'Your credit can be used at any participating restaurant.' },
            { question: 'Can I cancel my Just Eat+ membership?', answer: 'Yes, you can cancel anytime before your trial ends.' },
          ],
        },
      },
    },
    // Step 2 — Payment Capture (Req 1.4, 1.7)
    {
      stepId: 'payment-capture',
      trigger: { type: 'payment-capture-requested' },
      messageTemplate:
        'Add your payment details to start your free {{trialDuration}} trial and claim your {{creditAmount}} monthly credit.',
      uiDirective: {
        componentType: 'payment-capture-sheet',
        props: {
          savedCards: [
            { id: 'card-1', brand: 'mastercard', lastFour: '6374', expiryMonth: 12, expiryYear: 2027 },
            { id: 'card-2', brand: 'amex', lastFour: '6374', expiryMonth: 6, expiryYear: 2028 },
          ],
          trialDuration: '{{trialDuration}}',
          creditAmount: '{{creditAmount}}',
        },
      },
    },
    // Step 3 — Credit Confirm (Req 1.5, 1.8: peak-end-rule celebration)
    {
      stepId: 'credit-confirm',
      trigger: { type: 'trial-activated' },
      strategyOverride: 'peak-end-rule',
      messageTemplate:
        "You did it, {{userName}}! Your {{creditAmount}} monthly credit is ready. No more convenience tax — enjoy your savings.",
      uiDirective: {
        componentType: 'celebration-sheet',
        props: {
          welcomeTitle: 'Welcome to Just Eat+',
          bodyMessage: 'Your {{creditAmount}} monthly credit is now active. Use up to £5 daily across your favourite restaurants.',
          autoDismissDuration: 4000,
          archetypeName: 'squeezed-saver',
        },
      },
    },
  ],
};
