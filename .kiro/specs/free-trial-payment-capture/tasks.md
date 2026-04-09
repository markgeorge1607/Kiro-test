# Implementation Plan: Free Trial Payment Capture

## Overview

Insert a payment capture step into the JET+ free trial activation flow. The CTA on NudgeBottomSheet now opens a PaymentCaptureSheet (saved card selection or new card entry) before activating the trial. Also wire the JET+ tile tap in OffersPillStrip to open the NudgeBottomSheet.

## Tasks

- [x] 1. Add new types and update TriggerCondition union
  - [x] 1.1 Add `payment-capture-requested` to `TriggerCondition` union in `src/types/index.ts`
    - Add `| { type: 'payment-capture-requested' }` to the `TriggerCondition` type
    - _Requirements: 1.1, 1.8_
  - [x] 1.2 Add `SavedCard`, `CardEntryData`, and `PaymentMethod` types to `src/types/index.ts`
    - Define `SavedCard` interface with `id`, `brand`, `lastFour`, `expiryMonth`, `expiryYear`
    - Define `CardEntryData` interface with `cardNumber`, `expiryMonth`, `expiryYear`, `cvv`, `cardholderName`
    - Define `PaymentMethod` discriminated union (`saved-card` | `new-card`)
    - _Requirements: 1.2, 1.3, 1.4_

- [x] 2. Update nudge sequences with payment-capture step
  - [x] 2.1 Insert `payment-capture` step into `squeezedSaverCheckout` sequence
    - Add new step between `trial-offer` and `delight-confirm` with trigger `{ type: 'payment-capture-requested' }` and `componentType: 'payment-capture-sheet'`
    - File: `src/conversational/sequences/squeezedSaverCheckout.ts`
    - _Requirements: 1.1, 1.8_
  - [x] 2.2 Insert `payment-capture` step into `valueSeekerCheckout` sequence
    - Same pattern as 2.1 in `src/conversational/sequences/valueSeekerCheckout.ts`
    - _Requirements: 1.1, 1.8_
  - [x] 2.3 Insert `payment-capture` step into `squeezedSaverUpsell` sequence
    - Add new step between `upsell-offer` and `upsell-confirm` in `src/conversational/sequences/squeezedSaverUpsell.ts`
    - _Requirements: 1.1, 1.8_
  - [x] 2.4 Insert `payment-capture` step into `valueSeekerUpsell` sequence
    - Same pattern as 2.3 in `src/conversational/sequences/valueSeekerUpsell.ts`
    - _Requirements: 1.1, 1.8_

- [x] 3. Update NudgeSequenceEngine trigger matching
  - [x] 3.1 Add `payment-capture-requested` trigger matching to `NudgeSequenceEngine.triggersMatch`
    - The engine must recognize and match the new trigger type in `src/conversational/NudgeSequenceEngine.ts`
    - _Requirements: 1.8_
  - [ ]* 3.2 Write property test: Engine trigger matching for payment-capture-requested
    - **Property 3: Engine trigger matching for payment-capture-requested**
    - **Validates: Requirements 1.8**
    - File: `src/conversational/NudgeSequenceEngine.test.ts`

- [x] 4. Update CheckoutNudgeController interaction mapping
  - [x] 4.1 Change `quick-toggle toggled-on` mapping from `trial-activated` to `payment-capture-requested`
    - In `mapInteractionToTrigger`, `quick-toggle toggled-on` now returns `{ type: 'payment-capture-requested' }` instead of `{ type: 'trial-activated' }`
    - File: `src/checkout/CheckoutNudgeController.ts`
    - _Requirements: 1.1_
  - [x] 4.2 Add `payment-capture-sheet payment-confirmed` to `trial-activated` mapping
    - New mapping in `mapInteractionToTrigger` for `componentType: 'payment-capture-sheet'` and `action: 'payment-confirmed'`
    - File: `src/checkout/CheckoutNudgeController.ts`
    - _Requirements: 1.5_
  - [x] 4.3 Add `payment-capture-sheet dismissed` to null mapping (no advance)
    - Dismissed interaction returns null so the sequence stays on the payment-capture step
    - File: `src/checkout/CheckoutNudgeController.ts`
    - _Requirements: 1.6_
  - [ ]* 4.4 Write property test: Controller maps quick-toggle to payment-capture-requested
    - **Property 1: Controller maps quick-toggle to payment-capture-requested**
    - **Validates: Requirements 1.1**
    - File: `src/checkout/CheckoutNudgeController.test.ts`
  - [ ]* 4.5 Write property test: Payment-confirmed maps to trial-activated
    - **Property 2: Payment-confirmed maps to trial-activated**
    - **Validates: Requirements 1.5**
    - File: `src/checkout/CheckoutNudgeController.test.ts`
  - [x] 4.6 Update existing controller tests that expect `quick-toggle toggled-on` to produce `trial-activated`
    - The existing tests in `src/checkout/CheckoutNudgeController.test.ts` assert that `quick-toggle toggled-on` produces `delight-confirm`; these must be updated to expect `payment-capture` step instead, and add a subsequent `payment-confirmed` interaction to reach `delight-confirm`/`upsell-confirm`
    - _Requirements: 1.1, 1.5_

- [x] 5. Checkpoint — Conversational layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement PaymentCaptureSheet PIE component
  - [x] 6.1 Create `src/pie/PaymentCaptureSheet.tsx` with saved card list and new card entry form
    - Render saved cards as selectable radio options showing brand icon, last four digits, expiry
    - Render new card entry form with card number, expiry month/year, CVV, cardholder name fields
    - Confirm button disabled until a valid payment method is selected/entered
    - Dismiss via backdrop tap, close button, and Escape key
    - Emit `{ componentType: 'payment-capture-sheet', action: 'payment-confirmed', payload: { paymentMethod } }` on confirm
    - Emit `{ componentType: 'payment-capture-sheet', action: 'dismissed' }` on dismiss
    - Follow PIE Design System foundations (spacing, radius, elevation, typography)
    - Focus trap within the sheet; ARIA labels on form fields; focus returns to trigger on dismiss
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.9, 1.10, 1.11_
  - [x] 6.2 Implement card validation utilities (Luhn check, expiry, CVV, name)
    - Export validation functions from `PaymentCaptureSheet.tsx` or a co-located utils file
    - Luhn algorithm for card number (13-19 digits), expiry not in past, CVV 3 digits (4 for Amex), non-empty cardholder name
    - _Requirements: 1.4, 1.9, 1.10, 1.11_
  - [ ]* 6.3 Write property test: Card entry validation composite
    - **Property 4: Card entry validation composite**
    - **Validates: Requirements 1.4, 1.9, 1.10, 1.11**
    - File: `src/pie/PaymentCaptureSheet.test.ts`
  - [ ]* 6.4 Write property test: Luhn check digit round-trip
    - **Property 5: Luhn check digit round-trip**
    - **Validates: Requirements 1.9**
    - File: `src/pie/PaymentCaptureSheet.test.ts`
  - [ ]* 6.5 Write unit tests for PaymentCaptureSheet rendering and dismissal
    - Saved cards list renders correct count; new card form always present; confirm button disabled when invalid
    - Dismissed event emitted on backdrop tap, close button, Escape key
    - Accessibility: focus trap, ARIA labels, focus return
    - File: `src/pie/PaymentCaptureSheet.test.ts`
    - _Requirements: 1.2, 1.3, 1.5, 1.6_

- [x] 7. Register PaymentCaptureSheet in PIERenderer and wire into MenuPage
  - [x] 7.1 Register `payment-capture-sheet` component in `PIERenderer` within `MenuPage.tsx` and `CheckoutPage.tsx`
    - Add `registerComponent('payment-capture-sheet', PaymentCaptureSheet)` alongside existing registrations
    - _Requirements: 1.1_
  - [x] 7.2 Add `showPaymentCapture` state to `MenuPage` and render `PaymentCaptureSheet` when active
    - When `nudgeEvent.uiDirective.componentType === 'payment-capture-sheet'`, set `showPaymentCapture = true` and render the sheet
    - On `payment-confirmed`: close PaymentCaptureSheet, advance controller with the interaction, call `activateTrial()`, show CelebrationBottomSheet
    - On `dismissed`: close PaymentCaptureSheet, return to NudgeBottomSheet (sequence does not advance)
    - _Requirements: 1.1, 1.5, 1.6_
  - [x] 7.3 Update `handleBottomSheetTrial` in `MenuPage` to trigger `payment-capture-requested` instead of directly activating trial
    - The "Start your free trial" CTA now advances through the controller to the payment-capture step instead of calling `activateTrial()` directly
    - _Requirements: 1.1_

- [x] 8. Wire OffersPillStrip JET+ tile tap to NudgeBottomSheet
  - [x] 8.1 Handle `offer-tapped` interaction for JET+ variant in `MenuPage.handleInteraction`
    - When `componentType === 'offers-pill-strip'` and `action === 'offer-tapped'`, check if the offer variant is `jetplus`; if so, `setShowBottomSheet(true)`
    - Standard variant taps should not open the bottom sheet
    - _Requirements: 1.7_
  - [ ]* 8.2 Write property test: JET+ offer tap triggers bottom sheet, standard does not
    - **Property 7: JET+ offer tap triggers bottom sheet**
    - **Validates: Requirements 1.7**
    - File: `src/menu/MenuPage.test.ts`

- [x] 9. Checkpoint — PIE layer and integration wiring complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. End-to-end sequence validation
  - [ ]* 10.1 Write property test: Nudge sequence advances through payment capture to celebration
    - **Property 6: Nudge sequence advances through payment capture to celebration**
    - **Validates: Requirements 1.5**
    - File: `src/conversational/NudgeSequenceEngine.test.ts`
  - [ ]* 10.2 Write integration tests for full flow
    - OffersPillStrip JET+ tap to NudgeBottomSheet to PaymentCaptureSheet to CelebrationBottomSheet
    - Abandonment flow: dismiss PaymentCaptureSheet, NudgeBottomSheet still available, sequence not advanced
    - _Requirements: 1.1, 1.5, 1.6, 1.7_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The conversational layer changes (tasks 1-5) are independent of React and can be validated first
