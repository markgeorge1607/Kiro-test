# Requirements Document

## Introduction

This feature adds a new nudge sequence and activation flow for the "£10 monthly credit" offer tile in the OffersPillStrip. When a user taps the JET+ monthly credit tile, a conversational nudge bottom sheet opens presenting the credit benefit, followed by a payment capture step and a celebration confirmation — mirroring the existing checkout nudge architecture. The Conversational Layer produces a new `monthlyCreditNudge` sequence as a framework-agnostic JSON data structure, and the PIE Component Layer renders the activation flow using the existing NudgeBottomSheet, PaymentCaptureSheet, and CelebrationBottomSheet components.

## Glossary

- **Conversational_Layer**: The framework-agnostic logic engine (`src/conversational/`) that evaluates user context, selects behavioral strategies, and emits structured NudgeEvent JSON objects. No React or DOM dependencies.
- **PIE_Layer**: The React rendering layer (`src/pie/`) that consumes UIDirective objects from NudgeEvents and renders dynamic PIE Design System components.
- **NudgeEvent**: A serializable JSON object emitted by the Conversational_Layer containing a stepId, resolved message, UIDirective, ISO 8601 timestamp, and metadata (archetypeName, strategyName).
- **NudgeSequence**: A declarative data structure defining an ordered list of NudgeSteps, each with a trigger condition, message template, and UIDirective.
- **NudgeSequenceEngine**: The state machine that tracks the current step in a NudgeSequence, checks trigger conditions, and emits NudgeEvents with resolved templates.
- **OffersPillStrip**: The PIE component that renders a horizontally scrollable strip of offer banner cards on the restaurant menu page.
- **Monthly_Credit_Tile**: The JET+ variant offer card in the OffersPillStrip with id `offer-1`, displaying "Get £10 Monthly Credit".
- **NudgeBottomSheet**: The PIE component that renders a modal bottom sheet presenting JET+ trial benefits, FAQs, and an "Unlock benefits" CTA.
- **PaymentCaptureSheet**: The PIE component that renders a payment method selection bottom sheet for trial activation.
- **CelebrationBottomSheet**: The PIE component that renders a confirmation bottom sheet with confetti animation after trial activation.
- **TriggerCondition**: A discriminated union type describing the event that advances the NudgeSequenceEngine to the next step.
- **Template_Resolver**: The utility (`src/utils/templateResolver.ts`) that replaces `{{placeholder}}` tokens in message templates with context values.
- **MOV**: Minimum Order Value — the restaurant's minimum basket total required before nudges are shown (default 1500 pence = £15.00).
- **Integer_Pence**: The currency representation used throughout the project where 100 = £1.00, avoiding floating-point rounding.
- **Archetype**: A user persona definition (e.g. squeezed-saver, value-seeker) with traits and preferred behavioral strategies.
- **OfferNudgeController**: A new framework-agnostic controller (analogous to CheckoutNudgeController) that orchestrates the monthly credit nudge flow from tile tap through to trial activation.

## Requirements

### Requirement 1: Monthly Credit Nudge Sequence Definition

**User Story:** As a developer, I want a declarative nudge sequence for the monthly credit offer, so that the Conversational_Layer can drive the activation flow without framework dependencies.

#### Acceptance Criteria

1. THE Conversational_Layer SHALL define a `monthlyCreditNudge` NudgeSequence as a plain TypeScript constant in `src/conversational/sequences/monthlyCreditNudge.ts` with no React or DOM imports.
2. THE `monthlyCreditNudge` NudgeSequence SHALL contain exactly three ordered steps: `credit-offer` (presentation), `payment-capture` (payment collection), and `credit-confirm` (celebration).
3. THE `credit-offer` step SHALL use a new TriggerCondition type `offer-tile-tapped` with a required `offerId` string field.
4. THE `payment-capture` step SHALL use the existing `payment-capture-requested` TriggerCondition type.
5. THE `credit-confirm` step SHALL use the existing `trial-activated` TriggerCondition type.
6. WHEN the `credit-offer` step is triggered, THE NudgeSequenceEngine SHALL emit a NudgeEvent with componentType `nudge-bottom-sheet` and props containing the monthly credit value in Integer_Pence (1000), benefit descriptions, and FAQ content.
7. WHEN the `payment-capture` step is triggered, THE NudgeSequenceEngine SHALL emit a NudgeEvent with componentType `payment-capture-sheet`.
8. WHEN the `credit-confirm` step is triggered, THE NudgeSequenceEngine SHALL emit a NudgeEvent with componentType `celebration-sheet` with a `strategyOverride` of `peak-end-rule`.
9. THE `monthlyCreditNudge` NudgeSequence SHALL use `{{creditAmount}}`, `{{trialDuration}}`, and `{{userName}}` template placeholders in its message templates, resolved by the Template_Resolver at runtime.

### Requirement 2: Offer Tile Tapped Trigger Condition

**User Story:** As a developer, I want a new trigger condition type for offer tile taps, so that the NudgeSequenceEngine can distinguish offer-driven nudges from checkout-driven nudges.

#### Acceptance Criteria

1. THE TriggerCondition union type in `src/types/index.ts` SHALL include a new variant `{ type: 'offer-tile-tapped'; offerId: string }`.
2. THE NudgeSequenceEngine SHALL match an `offer-tile-tapped` trigger when the provided `offerId` equals the step trigger's `offerId`.
3. WHEN an `offer-tile-tapped` trigger is provided with a non-matching `offerId`, THE NudgeSequenceEngine SHALL return null and remain on the current step.

### Requirement 3: Offer Nudge Controller

**User Story:** As a developer, I want a controller that orchestrates the monthly credit nudge flow, so that the PIE_Layer can drive the activation sequence from tile tap to trial confirmation.

#### Acceptance Criteria

1. THE OfferNudgeController SHALL be a framework-agnostic TypeScript class in `src/checkout/OfferNudgeController.ts` with no React or DOM imports.
2. THE OfferNudgeController SHALL accept a UserContextEvaluator, StrategySelector, and ArchetypeRegistry in its constructor, following the same dependency injection pattern as CheckoutNudgeController.
3. WHEN `initialize(userId)` is called, THE OfferNudgeController SHALL evaluate user context, select a behavioral strategy, and load the `monthlyCreditNudge` sequence into a NudgeSequenceEngine.
4. WHEN `initialize(userId)` is called for a user with no archetype, THE OfferNudgeController SHALL return null.
5. WHEN `handleOfferTileTapped(offerId)` is called, THE OfferNudgeController SHALL advance the NudgeSequenceEngine with an `offer-tile-tapped` trigger containing the provided offerId.
6. WHEN `handleInteraction(event)` is called with a PIEInteractionEvent, THE OfferNudgeController SHALL map the interaction to the appropriate TriggerCondition and advance the sequence.
7. THE OfferNudgeController SHALL map `nudge-bottom-sheet` + `start-trial` interaction to a `payment-capture-requested` trigger.
8. THE OfferNudgeController SHALL map `payment-capture-sheet` + `payment-confirmed` interaction to a `trial-activated` trigger.
9. WHEN `reset()` is called, THE OfferNudgeController SHALL reset the NudgeSequenceEngine to step 0.
10. THE OfferNudgeController SHALL populate the template context with `creditAmount` as `£10.00`, `trialDuration` from configuration, and `userName` from the archetype persona mapping.

### Requirement 4: OffersPillStrip Integration

**User Story:** As a user, I want to tap the "£10 monthly credit" tile in the offers strip, so that I can see the JET+ benefits and activate a trial.

#### Acceptance Criteria

1. WHEN the Monthly_Credit_Tile is tapped in the OffersPillStrip, THE PIE_Layer SHALL emit a PIEInteractionEvent with componentType `offers-pill-strip`, action `offer-tapped`, and payload `{ offerId: 'offer-1' }`.
2. WHEN the PIE_Layer receives an `offer-tapped` interaction for a JET+ variant offer, THE MenuPage SHALL call `handleOfferTileTapped(offerId)` on the OfferNudgeController.
3. WHEN the OfferNudgeController returns a NudgeEvent with componentType `nudge-bottom-sheet`, THE MenuPage SHALL render the NudgeBottomSheet component.
4. WHEN the user taps "No thanks" or the backdrop on the NudgeBottomSheet, THE MenuPage SHALL close the bottom sheet and call `reset()` on the OfferNudgeController.

### Requirement 5: NudgeBottomSheet Activation Flow

**User Story:** As a user, I want to tap "Unlock benefits" on the nudge bottom sheet, so that I can proceed to enter payment details and activate my trial.

#### Acceptance Criteria

1. WHEN the user taps "Unlock benefits" on the NudgeBottomSheet, THE PIE_Layer SHALL emit a PIEInteractionEvent with componentType `nudge-bottom-sheet` and action `start-trial`.
2. WHEN the OfferNudgeController receives a `start-trial` interaction, THE OfferNudgeController SHALL advance the sequence to the `payment-capture` step and return a NudgeEvent with componentType `payment-capture-sheet`.
3. WHEN the MenuPage receives a `payment-capture-sheet` NudgeEvent, THE MenuPage SHALL close the NudgeBottomSheet and render the PaymentCaptureSheet component.

### Requirement 6: Payment Capture and Trial Activation

**User Story:** As a user, I want to confirm my payment method, so that my JET+ trial is activated and I receive a celebration confirmation.

#### Acceptance Criteria

1. WHEN the user confirms payment on the PaymentCaptureSheet, THE PIE_Layer SHALL emit a PIEInteractionEvent with componentType `payment-capture-sheet` and action `payment-confirmed`.
2. WHEN the OfferNudgeController receives a `payment-confirmed` interaction, THE OfferNudgeController SHALL advance the sequence to the `credit-confirm` step and return a NudgeEvent with componentType `celebration-sheet`.
3. WHEN the MenuPage receives a `celebration-sheet` NudgeEvent, THE MenuPage SHALL activate the trial via BasketContext and render the CelebrationBottomSheet component.
4. WHEN the user dismisses the PaymentCaptureSheet without confirming, THE MenuPage SHALL return to the NudgeBottomSheet and the OfferNudgeController SHALL remain on the `payment-capture` step.

### Requirement 7: Archetype-Aware Messaging

**User Story:** As a user, I want the nudge messaging to match my persona, so that the offer feels personally relevant.

#### Acceptance Criteria

1. WHEN the active archetype is `squeezed-saver`, THE `monthlyCreditNudge` sequence SHALL use loss-aversion framing in its message templates (e.g. "Stop paying the convenience tax").
2. WHEN the active archetype is `value-seeker`, THE `monthlyCreditNudge` sequence SHALL use identity-reinforcement framing in its message templates (e.g. "Ready to optimise").
3. THE Conversational_Layer SHALL select the appropriate `monthlyCreditNudge` sequence variant based on the user's archetype, using the same archetype-to-sequence mapping pattern as CHECKOUT_SEQUENCES in CheckoutNudgeController.
4. THE NudgeBottomSheet SHALL display the archetype-specific hero title, body copy, and benefit descriptions resolved from the NudgeEvent's UIDirective props.

### Requirement 8: Template Resolution for Monthly Credit Messages

**User Story:** As a developer, I want all message templates in the monthly credit sequence to use the existing template resolver, so that placeholder values are consistently resolved at runtime.

#### Acceptance Criteria

1. THE Template_Resolver SHALL resolve `{{creditAmount}}` to the formatted monthly credit value (e.g. "£10.00") in all monthly credit nudge message templates.
2. THE Template_Resolver SHALL resolve `{{trialDuration}}` to the trial period string (e.g. "30-day") in all monthly credit nudge message templates.
3. THE Template_Resolver SHALL resolve `{{userName}}` to the archetype persona name (e.g. "Sam" or "Alex") in all monthly credit nudge message templates.
4. IF a message template contains an unresolved placeholder, THEN THE Template_Resolver SHALL replace the placeholder with an empty string and log a warning.

### Requirement 9: NudgeEvent Serialization Compliance

**User Story:** As a developer, I want all monthly credit NudgeEvents to follow the existing serialization contract, so that the PIE_Layer can consume them without special handling.

#### Acceptance Criteria

1. THE Conversational_Layer SHALL emit monthly credit NudgeEvents containing stepId, message, uiDirective, timestamp (ISO 8601), and metadata (archetypeName, strategyName).
2. THE monthly credit NudgeEvents SHALL be serializable to JSON without loss of information (no functions, no React elements, no class instances in the event payload).
3. FOR ALL valid monthly credit NudgeEvents, serializing to JSON then deserializing SHALL produce an equivalent object (round-trip property).

### Requirement 10: Error Handling and Fallback Behaviour

**User Story:** As a user, I want the app to handle errors gracefully during the monthly credit activation flow, so that I am never shown a broken or stuck UI.

#### Acceptance Criteria

1. IF the OfferNudgeController fails to initialize (no archetype or no strategy), THEN THE OfferNudgeController SHALL return null and the Monthly_Credit_Tile tap SHALL be a no-op.
2. IF the NudgeSequenceEngine receives an `offer-tile-tapped` trigger that does not match the current step, THEN THE NudgeSequenceEngine SHALL return null and remain on the current step.
3. IF the PIE_Layer receives a UIDirective with an unknown componentType, THEN THE PIE_Layer SHALL render null and log a warning via PIERenderer.
4. THE OfferNudgeController SHALL handle all errors internally and return null rather than throwing exceptions to the PIE_Layer.

### Requirement 11: Sequence Independence from Checkout Flow

**User Story:** As a developer, I want the monthly credit nudge sequence to operate independently from the checkout nudge sequence, so that both flows can run without interfering with each other.

#### Acceptance Criteria

1. THE OfferNudgeController SHALL maintain its own NudgeSequenceEngine instance, separate from the CheckoutNudgeController's engine.
2. WHEN the monthly credit nudge sequence is active, THE CheckoutNudgeController SHALL continue to operate independently on its own sequence.
3. THE monthly credit nudge sequence SHALL use distinct stepIds (`credit-offer`, `payment-capture`, `credit-confirm`) that do not collide with existing checkout or upsell sequence stepIds.
4. THE OfferNudgeController SHALL not require the MOV gate, as the offer tile tap is not gated by basket total.
