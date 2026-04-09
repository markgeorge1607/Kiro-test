# Implementation Plan: Monthly Credit Nudge Layer

## Overview

Implement a new nudge sequence and controller for the "£10 monthly credit" offer tile in the OffersPillStrip. The flow is driven by a new `OfferNudgeController` that orchestrates a 3-step sequence (credit-offer → payment-capture → credit-confirm) via the existing `NudgeSequenceEngine`. A new `offer-tile-tapped` trigger condition type is added to distinguish offer-driven nudges from checkout-driven ones. Two archetype-specific sequence variants provide loss-aversion (squeezed-saver) and identity-reinforcement (value-seeker) messaging. The flow operates independently from the existing checkout nudge flow.

## Tasks

- [x] 1. Add `offer-tile-tapped` trigger condition and engine support
  - [x] 1.1 Add `{ type: 'offer-tile-tapped'; offerId: string }` variant to the `TriggerCondition` union in `src/types/index.ts`
    - _Requirements: 2.1_
  - [x] 1.2 Add `offer-tile-tapped` case to `triggersMatch()` in `src/conversational/NudgeSequenceEngine.ts` — match when `provided.offerId === stepTrigger.offerId`
    - _Requirements: 2.2, 2.3_
  - [ ]* 1.3 Write property test for offer-tile-tapped trigger matching (Property 1)
    - **Property 1: Offer-tile-tapped trigger matching**
    - Generate random offerId strings with fast-check. Load a sequence with an `offer-tile-tapped` trigger. Verify matching offerIds advance the engine and non-matching offerIds return null without changing step.
    - **Validates: Requirements 2.2, 2.3**

- [x] 2. Create monthly credit nudge sequences
  - [x] 2.1 Create `src/conversational/sequences/squeezedSaverMonthlyCredit.ts` — define `squeezedSaverMonthlyCreditSequence` as a `NudgeSequence` constant with 3 steps: `credit-offer` (trigger: `offer-tile-tapped`, offerId: `offer-1`, componentType: `nudge-bottom-sheet`, loss-aversion messaging), `payment-capture` (trigger: `payment-capture-requested`, componentType: `payment-capture-sheet`), `credit-confirm` (trigger: `trial-activated`, componentType: `celebration-sheet`, strategyOverride: `peak-end-rule`). Use `{{creditAmount}}`, `{{trialDuration}}`, `{{userName}}` template placeholders. Include `creditValuePence`, `benefits`, and `faqItems` in the credit-offer UIDirective props.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 7.1, 11.3_
  - [x] 2.2 Create `src/conversational/sequences/valueSeekerMonthlyCredit.ts` — define `valueSeekerMonthlyCreditSequence` with the same 3-step structure but identity-reinforcement messaging (e.g. "Ready to optimise").
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 7.2, 11.3_
  - [ ]* 2.3 Write unit tests verifying sequence structure — 3 steps, correct stepIds (`credit-offer`, `payment-capture`, `credit-confirm`), correct trigger types, correct componentTypes, and distinct stepIds from checkout/upsell sequences
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 11.3_

- [x] 3. Implement OfferNudgeController
  - [x] 3.1 Create `src/checkout/OfferNudgeController.ts` — framework-agnostic controller class accepting `UserContextEvaluator`, `StrategySelector`, and `ArchetypeRegistry` via constructor. Implement `initialize(userId)` to evaluate user context, select strategy, load the archetype-specific monthly credit sequence into a `NudgeSequenceEngine`, and populate template context with `creditAmount` (£10.00), `trialDuration` (30-day), and `userName` (Sam/Alex). Return `OfferInitResult` or null. Implement `handleOfferTileTapped(offerId)` to advance with `offer-tile-tapped` trigger. Implement `handleInteraction(event)` mapping `nudge-bottom-sheet` + `start-trial` → `payment-capture-requested`, `payment-capture-sheet` + `payment-confirmed` → `trial-activated`, and returning null for dismissed/unrecognized events. Implement `reset()`. No MOV gate. Follow the `MONTHLY_CREDIT_SEQUENCES` map pattern from `CheckoutNudgeController`.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 10.1, 10.4, 11.1, 11.4_
  - [ ]* 3.2 Write property test for controller initialization (Property 2)
    - **Property 2: Controller initialization selects correct sequence and context**
    - Generate random archetype selections from `['squeezed-saver', 'value-seeker']` and null-archetype users. Verify correct `OfferInitResult`, template context values, and null returns.
    - **Validates: Requirements 3.3, 3.4, 3.10, 7.3**
  - [ ]* 3.3 Write property test for full offer flow advancement (Property 3)
    - **Property 3: Full offer flow advancement**
    - Initialize with random archetypes, run the full 3-step flow (`handleOfferTileTapped` → `handleInteraction` start-trial → `handleInteraction` payment-confirmed), verify each step produces the correct stepId and componentType.
    - **Validates: Requirements 3.5, 3.6, 3.7, 3.8, 5.2, 6.2**
  - [ ]* 3.4 Write property test for template resolution completeness (Property 4)
    - **Property 4: Template resolution completeness**
    - Generate random strings for creditAmount, trialDuration, userName. Load sequences, advance through all steps, verify no `{{...}}` tokens remain in any emitted message or UIDirective prop.
    - **Validates: Requirements 1.9, 8.1, 8.2, 8.3**
  - [ ]* 3.5 Write property test for NudgeEvent serialization round-trip (Property 5)
    - **Property 5: NudgeEvent serialization round-trip**
    - Advance through all steps with random template contexts, verify `JSON.parse(JSON.stringify(event))` deep-equals the original for every emitted event.
    - **Validates: Requirements 9.1, 9.2, 9.3**
  - [ ]* 3.6 Write property test for reset restoring initial state (Property 6)
    - **Property 6: Reset restores initial state**
    - Initialize and advance to a random step (1, 2, or 3), call `reset()`, verify engine is back at step 0 (`credit-offer`).
    - **Validates: Requirements 3.9**
  - [ ]* 3.7 Write unit tests for OfferNudgeController
    - Test: initialize returns null for unknown user / no archetype / no strategy
    - Test: handleOfferTileTapped returns null before initialize
    - Test: handleOfferTileTapped with non-matching offerId returns null
    - Test: handleInteraction with unrecognized componentType/action returns null
    - Test: handleInteraction with payment-capture-sheet dismissed returns null (stays on step)
    - Test: full 3-step flow for squeezed-saver and value-seeker archetypes
    - Test: reset allows sequence replay from beginning
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 10.1, 10.2, 10.3, 10.4_

- [x] 4. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Integrate OfferNudgeController into MenuPage and App
  - [x] 5.1 Update `src/App.tsx` — instantiate `OfferNudgeController` using the same `UserContextEvaluator`, `StrategySelector`, and `ArchetypeRegistry` instances as `CheckoutNudgeController`. Pass it to `MenuPage` as an `offerController` prop. Recreate on archetype switch (same `useMemo` pattern).
    - _Requirements: 11.1, 11.2_
  - [x] 5.2 Update `src/menu/MenuPage.tsx` — accept `offerController: OfferNudgeController` prop. Add independent state: `offerNudgeEvent`, `showOfferBottomSheet`, `showOfferPaymentCapture`. Call `offerController.initialize(userId)` in the existing init effect. Route JET+ offer-tapped interactions to `offerController.handleOfferTileTapped(offerId)` instead of the hardcoded `setShowBottomSheet(true)`. Wire NudgeBottomSheet `onStartTrial` to `offerController.handleInteraction({componentType: 'nudge-bottom-sheet', action: 'start-trial'})`. Wire PaymentCaptureSheet confirmed/dismissed and CelebrationBottomSheet dismissed through `offerController.handleInteraction()`. On NudgeBottomSheet close/dismiss, call `offerController.reset()`. Render offer flow components from `offerNudgeEvent` state, keeping checkout flow state independent.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.4, 11.1, 11.2_
  - [ ]* 5.3 Write integration tests for MenuPage offer flow
    - Test: tapping JET+ offer tile opens NudgeBottomSheet via OfferNudgeController
    - Test: tapping "Unlock benefits" transitions to PaymentCaptureSheet
    - Test: confirming payment shows CelebrationBottomSheet and activates trial
    - Test: dismissing PaymentCaptureSheet returns to NudgeBottomSheet
    - Test: dismissing NudgeBottomSheet resets the offer controller
    - Test: checkout nudge flow operates independently while offer flow is active
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 11.1, 11.2_

- [x] 6. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation language is TypeScript, matching the existing codebase and design document
