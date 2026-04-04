# Implementation Plan: Conversational Nudge Layer

## Overview

Incremental implementation of the Conversational Nudge Layer, starting with core data models and the framework-agnostic Conversational Layer, then building the PIE Component Layer, and finally wiring everything together in a checkout integration. Each task builds on the previous, with property-based tests placed close to the code they validate.

## Tasks

- [x] 1. Set up project structure and core types
  - Create directory structure: `src/conversational/`, `src/pie/`, `src/types/`, `src/utils/`, `src/__tests__/`
  - Define all shared TypeScript interfaces and types in `src/types/index.ts`: `Archetype`, `BehavioralStrategyName`, `UserContext`, `TriggerCondition`, `NudgeStep`, `NudgeSequence`, `UIDirective`, `NudgeEvent`, `BasketState`, `BasketItem`, `PIEComponentProps`, `PIEInteractionEvent`
  - Configure Vitest and fast-check in `vitest.config.ts`
  - _Requirements: 7.1, 9.1_

- [x] 2. Implement ArchetypeRegistry
  - [x] 2.1 Create `src/conversational/ArchetypeRegistry.ts`
    - Implement `register(archetype)` and `get(name)` methods
    - Register the default "squeezed-saver" archetype definition
    - _Requirements: 2.1, 2.4_

  - [ ]* 2.2 Write property test: Archetype registry round-trip
    - **Property 1: Archetype registry round-trip**
    - Generate random archetype names, trait arrays, and strategy lists; verify register then get returns equivalent object
    - **Validates: Requirements 2.1**

- [x] 3. Implement UserContextEvaluator
  - [x] 3.1 Create `src/conversational/UserContextEvaluator.ts`
    - Implement `evaluate(userId)` that returns `UserContext` with membership status, delivery fee, and archetype
    - Return `archetype: null` when user data is unavailable (fallback behavior)
    - _Requirements: 1.1, 1.3_

  - [ ]* 3.2 Write property test: Context evaluator returns complete context
    - **Property 3: Context evaluator returns complete context**
    - Generate random user IDs with random backing data; verify membershipStatus is valid, deliveryFee is non-negative integer, archetype is valid or null
    - **Validates: Requirements 1.1**

- [x] 4. Implement StrategySelector
  - [x] 4.1 Create `src/conversational/StrategySelector.ts`
    - Implement `select(archetype, context)` that returns a `BehavioralStrategyName` from the archetype's preferred strategies
    - Prioritize loss-aversion for Squeezed Saver archetype
    - _Requirements: 1.2, 2.2, 2.3_

  - [ ]* 4.2 Write property test: Strategy selection stays within archetype preferences
    - **Property 2: Strategy selection stays within archetype preferences**
    - Generate random archetypes with non-empty strategy lists and random contexts; verify returned strategy is in preferredStrategies
    - **Validates: Requirements 1.2, 2.3**

- [x] 5. Implement template resolution utility
  - [x] 5.1 Create `src/utils/templateResolver.ts`
    - Implement a function that resolves `{{placeholder}}` tokens in message templates using a context values map
    - _Requirements: 4.3, 5.3_

  - [ ]* 5.2 Write property test: Template resolution includes all context values
    - **Property 6: Template resolution includes all context values**
    - Generate templates with random placeholders and random context values; verify resolved message contains all values and no unresolved `{{...}}` placeholders
    - **Validates: Requirements 4.3, 5.3**

- [x] 6. Checkpoint — Core utilities verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement NudgeSequenceEngine and NudgeEmitter
  - [x] 7.1 Create `src/conversational/NudgeSequenceEngine.ts`
    - Implement `load(sequence)`, `getCurrentStep()`, `advance(trigger)`, `reset()`, `isComplete()`
    - `advance()` checks trigger match against current step, emits `NudgeEvent` on match, returns null on mismatch
    - Use template resolver to fill message placeholders when emitting events
    - Include ISO 8601 timestamp and metadata (archetypeName, strategyName) in emitted events
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 9.1, 9.3_

  - [ ]* 7.2 Write property test: Sequence engine advances only on matching trigger
    - **Property 4: Sequence advance on matching trigger**
    - Generate random sequences (1–10 steps) with random triggers; verify event emitted only on match, step advances correctly, mismatch returns null with no state change
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 7.3 Write property test: Sequence reset restores initial state
    - **Property 5: Sequence reset restores initial state**
    - Generate random sequences, advance 0–N steps, then reset; verify engine returns to step 0 equivalent to freshly loaded
    - **Validates: Requirements 3.4**

  - [ ]* 7.4 Write property test: NudgeEvent structural completeness
    - **Property 7: NudgeEvent structural completeness**
    - Generate random valid nudge events from the engine; verify non-empty stepId, non-empty message, UIDirective with non-empty componentType, valid ISO 8601 timestamp, non-empty metadata fields
    - **Validates: Requirements 7.1, 9.1, 9.3**

  - [ ]* 7.5 Write property test: NudgeEvent JSON serialization round-trip
    - **Property 8: NudgeEvent JSON serialization round-trip**
    - Generate random valid nudge events; verify `JSON.parse(JSON.stringify(event))` deeply equals original
    - **Validates: Requirements 9.2**

- [x] 8. Define the Squeezed Saver checkout nudge sequence
  - Create `src/conversational/sequences/squeezedSaverCheckout.ts`
  - Define the 3-step NudgeSequence: savings-alert → trial-offer → delight-confirm with correct triggers, message templates, and UI directives as specified in the design
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2_

- [x] 9. Checkpoint — Conversational Layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement PIE Component Layer
  - [x] 10.1 Create `src/pie/PIERenderer.tsx`
    - Implement `registerComponent(type, component)` and `render(directive)` methods
    - Return `null` and log warning for unknown component types
    - _Requirements: 7.3, 8.4_

  - [ ]* 10.2 Write property test: Unknown PIE component type produces null
    - **Property 10: Unknown PIE component type produces null**
    - Generate random non-registered component type strings; verify render returns null without throwing
    - **Validates: Requirements 8.4**

  - [x] 10.3 Create `src/pie/SavingsBadge.tsx`
    - Render a savings badge with configurable `position` and `animationType` (vibrate) props
    - Fire `tapped` interaction event on click
    - _Requirements: 8.1_

  - [x] 10.4 Create `src/pie/QuickToggle.tsx`
    - Render a toggle switch with `label`, `savingsAmount`, `trialDuration` props
    - Fire `toggled-on` interaction event on activation via `onInteraction` callback
    - _Requirements: 8.2_

  - [x] 10.5 Create `src/pie/ConfettiAnimation.tsx`
    - Render a confetti animation targeting `targetSelector` with configurable `duration`
    - Fire-and-forget, no interaction event
    - _Requirements: 8.3_

- [x] 11. Implement basket state management and trial activation
  - [x] 11.1 Create `src/state/BasketContext.tsx`
    - Implement React context providing `BasketState` and an `activateTrial()` action that sets `trialActive: true` and `deliveryFee: 0`
    - _Requirements: 6.3_

  - [ ]* 11.2 Write property test: Trial activation zeroes delivery fee
    - **Property 9: Trial activation zeroes delivery fee**
    - Generate random BasketState with positive deliveryFee and trialActive false; verify activating trial sets deliveryFee to 0
    - **Validates: Requirements 6.3**

- [x] 12. Wire checkout integration
  - [x] 12.1 Create `src/checkout/CheckoutNudgeController.ts`
    - Orchestrate the full flow: UserContextEvaluator → StrategySelector → NudgeSequenceEngine with the Squeezed Saver sequence
    - Map PIE interaction events back to trigger conditions to advance the sequence
    - Reset sequence on checkout abandonment
    - _Requirements: 1.1, 1.2, 3.2, 3.3, 3.4_

  - [x] 12.2 Create `src/checkout/CheckoutPage.tsx`
    - Integrate CheckoutNudgeController with PIERenderer
    - Render nudge events as PIE components in the checkout UI
    - Connect QuickToggle activation to BasketContext `activateTrial()`
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 6.3, 7.1_

  - [ ]* 12.3 Write unit tests for checkout integration
    - Test full 3-step Squeezed Saver flow end-to-end
    - Test null archetype fallback produces no nudges
    - Test checkout abandonment resets sequence
    - _Requirements: 1.3, 3.4, 4.1, 5.1, 6.1_

- [x] 13. Final checkpoint — All tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Register Value Seeker archetype and update types
  - [x] 14.1 Add `subscription-upsell` trigger condition to `TriggerCondition` type in `src/types/index.ts`
    - Add `| { type: 'subscription-upsell'; monthlyFeesExceed: number }` to the union
    - Add `monthlyAccumulatedFees: number` to the `UserContext` interface
    - _Requirements: 11.2_

  - [x] 14.2 Register Value Seeker archetype in `src/conversational/ArchetypeRegistry.ts`
    - Export `VALUE_SEEKER_ARCHETYPE` constant with name `"value-seeker"`, traits `["optimization-driven", "data-responsive", "exclusivity-motivated"]`, and preferredStrategies `["identity-reinforcement", "loss-aversion", "peak-end-rule"]`
    - Register it in `createDefaultRegistry()` alongside the Squeezed Saver archetype
    - _Requirements: 10.1, 10.2_

  - [ ]* 14.3 Write property test: Multiple archetypes coexist in registry
    - **Property 11: Multiple archetypes coexist in registry**
    - Generate random sets of 2–10 distinct archetypes, register all, verify each retrieval returns the original definition unchanged
    - **Validates: Requirements 10.2, 2.4**

- [x] 15. Add `monthlyAccumulatedFees` to UserContext and UserContextEvaluator
  - [x] 15.1 Update `UserData` interface in `src/conversational/UserContextEvaluator.ts`
    - Add optional `monthlyAccumulatedFees?: number` field to `UserData`
    - Update `evaluate()` to include `monthlyAccumulatedFees` in the returned `UserContext`, defaulting to `0` when unavailable
    - Update `FALLBACK_CONTEXT` to include `monthlyAccumulatedFees: 0`
    - _Requirements: 11.2_

- [x] 16. Add template variable support for new placeholders
  - [x] 16.1 Update `src/utils/templateResolver.ts` if needed and verify `{{userName}}`, `{{accumulatedFees}}`, `{{currentOrderSavings}}` placeholders resolve correctly
    - The existing template resolver should already handle arbitrary `{{key}}` placeholders — verify with unit tests
    - _Requirements: 12.3_

- [x] 17. Define nudge sequences for Value Seeker and Subscription Upsell
  - [x] 17.1 Create `src/conversational/sequences/valueSeekerCheckout.ts`
    - Define the 3-step Value Seeker checkout NudgeSequence: savings-alert → trial-offer → delight-confirm with identity-reinforcement strategy overrides and Value Seeker message templates
    - _Requirements: 10.3_

  - [x] 17.2 Create `src/conversational/sequences/squeezedSaverUpsell.ts`
    - Define the 3-step Squeezed Saver Subscription Upsell NudgeSequence: upsell-alert → upsell-offer → upsell-confirm with loss-aversion framing and "convenience tax" message template including `{{userName}}`, `{{accumulatedFees}}`, `{{currentOrderSavings}}` placeholders
    - _Requirements: 12.1, 12.4_

  - [x] 17.3 Create `src/conversational/sequences/valueSeekerUpsell.ts`
    - Define the 3-step Value Seeker Subscription Upsell NudgeSequence: upsell-alert → upsell-offer → upsell-confirm with identity-reinforcement framing and optimization/exclusivity message template including `{{userName}}`, `{{accumulatedFees}}`, `{{currentOrderSavings}}` placeholders
    - _Requirements: 12.2, 12.4_

- [x] 18. Checkpoint — New sequences and types verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Implement sequence lookup logic in CheckoutNudgeController
  - [x] 19.1 Update `src/checkout/CheckoutNudgeController.ts` to support sequence selection
    - Add sequence lookup: if `monthlyAccumulatedFees > 1000` and user is `non-member`, select the archetype's Subscription Upsell sequence; otherwise select the archetype's standard checkout sequence
    - Map archetype name to the correct sequence pair (squeezed-saver-checkout / squeezed-saver-upsell, value-seeker-checkout / value-seeker-upsell)
    - Include `userName`, `accumulatedFees`, `currentOrderSavings` in the template context passed to `NudgeSequenceEngine`
    - Handle `subscription-upsell` trigger matching in `NudgeSequenceEngine.triggersMatch()`
    - _Requirements: 11.1, 11.3_

  - [x] 19.2 Add upsell-related interaction mappings in `CheckoutNudgeController`
    - Map `savings-badge` tapped on `upsell-alert` step to `nudge-tapped` trigger with stepId `upsell-alert`
    - Ensure `quick-toggle` toggled-on still maps to `trial-activated` for upsell flow
    - _Requirements: 11.1_

  - [ ]* 19.3 Write property test: Subscription upsell threshold triggers correctly
    - **Property 12: Subscription upsell threshold triggers correctly**
    - Generate random UserContexts with varying `monthlyAccumulatedFees` and `membershipStatus`; verify upsell sequence is selected if and only if fees > 1000 and non-member
    - **Validates: Requirements 11.1, 11.3**

  - [ ]* 19.4 Write property test: Upsell message contains resolved template variables
    - **Property 13: Upsell message contains resolved archetype-specific template variables**
    - Generate random archetype names, user names, fee amounts; trigger upsell and verify emitted message contains all resolved values of `userName`, `accumulatedFees`, `currentOrderSavings` with no unresolved placeholders
    - **Validates: Requirements 12.1, 12.2, 12.3**

- [x] 20. Checkpoint — Sequence lookup and upsell logic verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Create ArchetypeToggle PIE component
  - [x] 21.1 Create `src/pie/ArchetypeToggle.tsx`
    - Render a control that lists all registered archetype names from the `archetypes` prop (string array)
    - Display the currently active archetype name via `activeArchetype` prop
    - Allow selecting one archetype at a time
    - Fire `archetype-switched` interaction event with `{ archetype: string }` payload via `onInteraction` callback
    - Follow PIE Design System foundations (spacing, typography, colour tokens)
    - _Requirements: 13.1, 13.4_

  - [ ]* 21.2 Write unit tests for ArchetypeToggle
    - Test rendering all archetype names
    - Test displaying active archetype
    - Test firing `archetype-switched` event on selection
    - _Requirements: 13.1, 13.4_

- [x] 22. Wire ArchetypeToggle into CheckoutPage
  - [x] 22.1 Update `src/checkout/CheckoutPage.tsx` to include ArchetypeToggle
    - Register `archetype-toggle` component type in PIERenderer
    - Add ArchetypeToggle to the checkout UI, passing registered archetype names and current active archetype
    - On `archetype-switched` interaction, re-initialize the `CheckoutNudgeController` with the new archetype and re-evaluate the nudge sequence
    - Re-render the current nudge step with the newly selected archetype's messaging and tone
    - _Requirements: 13.2, 13.3_

  - [ ]* 22.2 Write property test: Archetype switch re-evaluates nudge sequence
    - **Property 14: Archetype switch re-evaluates nudge sequence**
    - Generate pairs of distinct registered archetypes with different preferred strategies; verify switching produces a NudgeEvent whose `metadata.strategyName` matches the new archetype's first preferred strategy and whose message reflects the new archetype's template
    - **Validates: Requirements 13.2**

- [x] 23. Update existing tests for new features
  - [x] 23.1 Update `src/checkout/CheckoutNudgeController.test.ts`
    - Add tests for Value Seeker initialization and checkout flow
    - Add tests for Subscription Upsell sequence selection when `monthlyAccumulatedFees > 1000`
    - Add tests for upsell not triggering when fees ≤ 1000 or user is a member
    - Add test for boundary case: fees exactly at £10.00 (1000 pence)
    - _Requirements: 10.3, 11.1, 11.3, 12.1, 12.2_

  - [x] 23.2 Update `src/checkout/CheckoutPage.test.tsx`
    - Add tests for ArchetypeToggle rendering and archetype switching
    - Add test for re-rendering nudge with new archetype messaging after switch
    - _Requirements: 13.2, 13.3_

  - [x] 23.3 Update `src/conversational/ArchetypeRegistry.test.ts`
    - Add tests for Value Seeker archetype registration and retrieval
    - Verify both archetypes coexist in `createDefaultRegistry()`
    - _Requirements: 10.1, 10.2_

  - [x] 23.4 Update `src/conversational/UserContextEvaluator.test.ts`
    - Add tests for `monthlyAccumulatedFees` field in returned `UserContext`
    - Test default to `0` when `monthlyAccumulatedFees` is not provided
    - _Requirements: 11.2_

- [x] 24. Final checkpoint — All new features verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Add MOV fields to UserContext type and UserContextEvaluator
  - [x] 25.1 Update `src/types/index.ts` to add `basketTotal` and `minimumOrderValue` fields to `UserContext`
    - Add `basketTotal: number` (integer pence, current basket total)
    - Add `minimumOrderValue: number` (integer pence, restaurant's MOV, default 1500)
    - _Requirements: 14.3_

  - [x] 25.2 Update `src/conversational/UserContextEvaluator.ts` to support MOV fields
    - Add optional `basketTotal?: number` and `minimumOrderValue?: number` fields to `UserData` interface
    - Update `evaluate()` to include `basketTotal` (default `0`) and `minimumOrderValue` (default `1500`) in the returned `UserContext`
    - Update `FALLBACK_CONTEXT` to include `basketTotal: 0` and `minimumOrderValue: 1500`
    - _Requirements: 1.1, 14.3_

  - [ ]* 25.3 Write unit tests for MOV fields in UserContextEvaluator
    - Test that `minimumOrderValue` defaults to `1500` when not provided
    - Test that `basketTotal` defaults to `0` when not provided
    - Test that provided values are passed through correctly
    - _Requirements: 14.3_

- [x] 26. Implement MOV gate logic in CheckoutNudgeController
  - [x] 26.1 Update `src/checkout/CheckoutNudgeController.ts` to add MOV gate
    - Store `basketTotal` and `minimumOrderValue` from `UserContext` during `initialize()`
    - Add private `isMovMet()` method that returns `basketTotal >= minimumOrderValue`
    - Add `updateBasketTotal(newTotal: number)` public method for the UI layer to call when basket changes
    - Guard all trigger methods (`handleItemAdded`, `handleCheckout`, `handleSubscriptionUpsell`, `handleInteraction`, `triggerFirstStep`) with the MOV gate check as the first condition — return `null` when `basketTotal < minimumOrderValue`
    - Ensure MOV gate is evaluated before the Subscription Upsell threshold and all other trigger conditions
    - _Requirements: 14.1, 14.2, 14.4, 14.5_

  - [ ]* 26.2 Write property test: MOV gate suppresses nudges when basket total is below MOV
    - **Property 15: MOV gate suppresses nudges when basket total is below minimum order value**
    - Generate random UserContexts with varying `basketTotal` and `minimumOrderValue`; verify all trigger methods return `null` when `basketTotal < minimumOrderValue`, and evaluate normally when `basketTotal >= minimumOrderValue`
    - **Validates: Requirements 14.1, 14.2, 14.5**

- [x] 27. Handle mid-sequence MOV suppression
  - [x] 27.1 Ensure `updateBasketTotal` suppresses further nudge steps when basket drops below MOV
    - When `updateBasketTotal` is called with a value below `minimumOrderValue`, subsequent trigger method calls return `null`
    - When basket total is restored to meet or exceed MOV, trigger methods resume normal evaluation
    - Sequence position is preserved (not reset) during MOV suppression
    - _Requirements: 14.4_

  - [ ]* 27.2 Write unit tests for mid-sequence MOV suppression
    - Test that advancing past step 1, then dropping basket below MOV, suppresses step 2
    - Test that restoring basket above MOV allows step 2 to proceed
    - Test that sequence position is preserved (not reset) during suppression
    - _Requirements: 14.4_

- [x] 28. Checkpoint — MOV gate logic verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 29. Update CheckoutPage and existing tests for MOV gate
  - [x] 29.1 Update `src/checkout/CheckoutPage.tsx` to pass basket total to controller
    - Call `controller.updateBasketTotal()` when basket state changes
    - Compute basket total from `basket.items` (sum of `price × quantity`)
    - _Requirements: 14.1, 14.4_

  - [x] 29.2 Update `src/checkout/CheckoutNudgeController.test.ts` with MOV gate tests
    - Add tests for nudge suppression when basket total < MOV
    - Add test for nudges proceeding when basket total >= MOV
    - Add boundary test: basket total exactly at MOV should allow nudges
    - Add test for MOV gate checked before upsell threshold (Req 14.5)
    - Add test for default MOV of 1500 pence when not specified
    - _Requirements: 14.1, 14.2, 14.3, 14.5_

  - [x] 29.3 Update `src/conversational/UserContextEvaluator.test.ts` with MOV field tests
    - Add tests for `basketTotal` and `minimumOrderValue` fields in returned `UserContext`
    - Test defaults when fields are not provided in `UserData`
    - _Requirements: 14.3_

- [x] 30. Final checkpoint — MOV gate fully integrated and verified
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The Conversational Layer is fully framework-agnostic; React is only used in PIE and checkout integration
