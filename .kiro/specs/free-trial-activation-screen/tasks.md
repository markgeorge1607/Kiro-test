# Implementation Plan: Free Trial Activation Screen

## Overview

Replace the Step 3 confetti-only experience with a rich Celebration Bottom Sheet across all four nudge sequences. This involves creating a new PIE component, updating sequence definitions, registering the component in CheckoutPage, handling the "dismissed" interaction, and updating existing tests that reference the old "confetti" componentType.

## Tasks

- [ ] 1. Create CelebrationBottomSheet PIE component
  - [ ] 1.1 Create `src/pie/CelebrationBottomSheet.tsx` implementing the celebration bottom sheet
    - Render backdrop overlay (semi-transparent, full viewport, tap-to-dismiss)
    - Render sheet container with rounded top corners (16px radius), elevation shadow, pull-tab indicator
    - Render header section with background image, confetti overlay (aria-hidden="true"), and JET+ logo (84x84px)
    - Render welcome title in ExtraBlack Italic 32px/36px
    - Render body message from directive props
    - Render Trial Active Indicator with #E7F4F6 background, check-circle icon, "JET+ trial active" bold 16px, "Delivery fee removed" regular 14px subdued
    - Extract `welcomeTitle`, `bodyMessage`, `autoDismissDuration`, `archetypeName` from `directive.props`
    - Default `autoDismissDuration` to 4000ms when missing or non-positive
    - Default `welcomeTitle` to "Welcome to Just Eat+" when missing
    - Implement auto-dismiss timer via `useEffect` with cleanup to prevent memory leaks
    - Fire `{ componentType: "celebration-sheet", action: "dismissed" }` via `onInteraction` on auto-dismiss, backdrop tap, or Escape key
    - Guard with a `dismissed` ref flag so `onInteraction` fires at most once
    - Set `role="dialog"`, `aria-modal="true"`, `aria-label="JET+ trial activation confirmed"` on sheet container
    - Move focus to sheet container on mount; return focus to previously focused element on dismiss
    - Wrap focus calls in try/catch for edge cases
    - Support `prefers-reduced-motion`: static confetti image, no slide animation
    - Use inline styles following NudgeBottomSheet pattern, PIE Design System foundations
    - Use Figma asset URLs from design document for background, logo, confetti, check-circle icon
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3_

  - [ ]* 1.2 Write unit tests for CelebrationBottomSheet
    - Create `src/pie/CelebrationBottomSheet.test.tsx`
    - Test rendering of all visual elements (background image, confetti overlay, JET+ logo, welcome title, body message, trial-active indicator, pull-tab)
    - Test `role="dialog"`, `aria-modal="true"`, `aria-label` attributes
    - Test confetti overlay has `aria-hidden="true"`
    - Test focus moves to sheet container on mount
    - Test focus returns to previously focused element on dismiss
    - Test backdrop click fires "dismissed" interaction event
    - Test Escape key fires "dismissed" interaction event
    - Test auto-dismiss fires "dismissed" event after configured duration (use fake timers)
    - Test default duration of 4000ms when `autoDismissDuration` is omitted
    - Test backdrop renders full-viewport overlay
    - Test `prefers-reduced-motion` disables animations
    - Test that `onInteraction` fires at most once on multiple rapid dismiss triggers
    - Test graceful handling of missing `welcomeTitle` (defaults to "Welcome to Just Eat+")
    - Test graceful handling of missing `bodyMessage` (renders empty body)
    - _Requirements: 1.1-1.6, 3.1, 3.2, 3.4, 5.2, 6.1-6.5, 7.1-7.3_

- [ ] 2. Update nudge sequence definitions to use "celebration-sheet"
  - [ ] 2.1 Update `src/conversational/sequences/squeezedSaverCheckout.ts` Step 3 (delight-confirm)
    - Change `componentType` from `"confetti"` to `"celebration-sheet"`
    - Remove `targetSelector: '.delivery-fee-line'`
    - Replace `props: { duration: 3000 }` with `{ welcomeTitle: 'Welcome to Just Eat+', bodyMessage: "You just saved {{savings}} on delivery. Your fee is gone — enjoy free delivery on this order.", autoDismissDuration: 4000, archetypeName: 'squeezed-saver' }`
    - _Requirements: 4.1, 4.2, 8.1, 8.5_

  - [ ] 2.2 Update `src/conversational/sequences/valueSeekerCheckout.ts` Step 3 (delight-confirm)
    - Change `componentType` from `"confetti"` to `"celebration-sheet"`
    - Remove `targetSelector: '.delivery-fee-line'`
    - Replace props with `{ welcomeTitle: 'Welcome to Just Eat+', bodyMessage: "You're officially a JET+ member. Exclusive savings and £0.00 delivery start now.", autoDismissDuration: 4000, archetypeName: 'value-seeker' }`
    - _Requirements: 4.1, 4.2, 8.2, 8.5_

  - [ ] 2.3 Update `src/conversational/sequences/squeezedSaverUpsell.ts` Step 3 (upsell-confirm)
    - Change `componentType` from `"confetti"` to `"celebration-sheet"`
    - Remove `targetSelector: '.delivery-fee-line'`
    - Replace props with `{ welcomeTitle: 'Welcome to Just Eat+', bodyMessage: "You just saved {{currentOrderSavings}} on delivery. Your fee is gone — enjoy free delivery on this order.", autoDismissDuration: 4000, archetypeName: 'squeezed-saver' }`
    - _Requirements: 4.1, 4.2, 8.3, 8.5_

  - [ ] 2.4 Update `src/conversational/sequences/valueSeekerUpsell.ts` Step 3 (upsell-confirm)
    - Change `componentType` from `"confetti"` to `"celebration-sheet"`
    - Remove `targetSelector: '.delivery-fee-line'`
    - Replace props with `{ welcomeTitle: 'Welcome to Just Eat+', bodyMessage: "You're officially a JET+ member. Exclusive savings and £0.00 delivery start now.", autoDismissDuration: 4000, archetypeName: 'value-seeker' }`
    - _Requirements: 4.1, 4.2, 8.4, 8.5_

  - [ ]* 2.5 Write property test: All sequences use celebration-sheet for final step
    - **Property 1: All sequences use celebration-sheet for final step**
    - **Validates: Requirements 4.1, 8.1, 8.2, 8.3, 8.4**
    - Import all 4 sequence definitions, verify each final step's `uiDirective.componentType === "celebration-sheet"`
    - Tag: `// Feature: free-trial-activation-screen, Property 1: All sequences use celebration-sheet for final step`
    - Minimum 100 iterations

  - [ ]* 2.6 Write property test: Celebration-sheet directives include all required props
    - **Property 2: Celebration-sheet directives include all required props**
    - **Validates: Requirements 2.4, 4.2, 8.5**
    - For each sequence's final step, verify `uiDirective.props` contains non-empty `welcomeTitle` string, non-empty `bodyMessage` string, positive `autoDismissDuration` number, and non-empty `archetypeName` string
    - Tag: `// Feature: free-trial-activation-screen, Property 2: Celebration-sheet directives include all required props`
    - Minimum 100 iterations

- [ ] 3. Register CelebrationBottomSheet in CheckoutPage and handle dismissed interaction
  - [ ] 3.1 Register CelebrationBottomSheet in `src/checkout/CheckoutPage.tsx`
    - Import `CelebrationBottomSheet` from `'../pie/CelebrationBottomSheet'`
    - Add `registerComponent('celebration-sheet', CelebrationBottomSheet)` in the `useEffect` that registers PIE components
    - _Requirements: 4.3_

  - [ ] 3.2 Handle "dismissed" interaction in `src/checkout/CheckoutPage.tsx`
    - In the `handleInteraction` callback, when `event.componentType === 'celebration-sheet'` and `event.action === 'dismissed'`, clear the nudge event from state (`setNudgeEvent(null)`)
    - _Requirements: 3.4, 4.4_

  - [ ] 3.3 Update `CheckoutNudgeController.mapInteractionToTrigger` in `src/checkout/CheckoutNudgeController.ts`
    - Add mapping: when `event.componentType === 'celebration-sheet'` and `event.action === 'dismissed'`, return `null` (no further trigger — sequence is already complete)
    - _Requirements: 4.4_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Update existing tests that reference "confetti" componentType for Step 3
  - [ ] 5.1 Update `src/checkout/CheckoutNudgeController.test.ts`
    - Change all assertions that expect `componentType` `'confetti'` for Step 3 (delight-confirm / upsell-confirm) to expect `'celebration-sheet'`
    - Affected tests: "maps quick-toggle toggled-on to trial-activated trigger", "completes the squeezed saver checkout sequence end-to-end", "completes the 3-step value seeker checkout flow", "completes the full 3-step upsell flow with loss-aversion framing", "completes the full 3-step upsell flow with identity-reinforcement framing"
    - _Requirements: 4.1, 8.1, 8.2, 8.3, 8.4_

  - [ ] 5.2 Update `src/checkout/CheckoutPage.test.tsx`
    - Verify the full 3-step flow test still passes with the celebration-sheet rendering instead of confetti
    - Add a test that verifies the "dismissed" interaction clears the nudge event from state
    - _Requirements: 3.4, 4.3, 4.4_

  - [ ] 5.3 Update `src/conversational/NudgeSequenceEngine.test.ts`
    - Update `step3` fixture to use `componentType: 'celebration-sheet'` with the new props structure instead of `'confetti'`
    - Verify all existing engine tests still pass with the updated fixture
    - _Requirements: 4.1_

- [ ] 6. Write property-based tests for component behavior
  - [ ]* 6.1 Write property test: Auto-dismiss fires dismissed event after configured duration
    - **Property 3: Auto-dismiss fires dismissed event after configured duration**
    - **Validates: Requirements 3.1, 3.4**
    - Generate random positive integers (100-10000) for `autoDismissDuration`
    - Render CelebrationBottomSheet with fake timers, verify "dismissed" event fires after exact duration
    - Tag: `// Feature: free-trial-activation-screen, Property 3: Auto-dismiss fires dismissed event after configured duration`
    - Minimum 100 iterations

  - [ ]* 6.2 Write property test: Component renders bodyMessage from props unchanged
    - **Property 4: Component renders bodyMessage from props unchanged**
    - **Validates: Requirements 1.4, 2.1, 2.2**
    - Generate random non-empty strings (including unicode, special characters, long strings) as `bodyMessage`
    - Render CelebrationBottomSheet, verify exact string appears in rendered output
    - Tag: `// Feature: free-trial-activation-screen, Property 4: Component renders bodyMessage from props unchanged`
    - Minimum 100 iterations

  - [ ]* 6.3 Write property test: Visual structure is identical across archetypes
    - **Property 5: Visual structure is identical across archetypes**
    - **Validates: Requirements 2.3**
    - Generate pairs of random archetype names with different body messages but same `welcomeTitle` and `autoDismissDuration`
    - Render both, compare structural elements (element count, types, classes) excluding body text
    - Tag: `// Feature: free-trial-activation-screen, Property 5: Visual structure is identical across archetypes`
    - Minimum 100 iterations

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific rendering, accessibility, and interaction behavior
- The ConfettiAnimation component and its tests remain unchanged — the confetti component stays available for other uses
