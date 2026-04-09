# Implementation Plan: Save Card & Return to Selection

## Overview

Modify `PaymentCaptureSheet.tsx` to save new cards locally and navigate back to the card selection view instead of immediately firing `payment-confirmed`. All changes are scoped to `src/pie/PaymentCaptureSheet.tsx` and its test file.

## Tasks

- [x] 1. Add pure helper functions and local saved-cards state
  - [x] 1.1 Add `detectCardBrand` and `cardEntryToSavedCard` pure functions
    - Add exported `detectCardBrand(cardNumber: string): SavedCard['brand']` that maps prefixes `34`/`37` → `'amex'`, `51`–`55` → `'mastercard'`, `4` → `'visa'`, default → `'visa'`
    - Add exported `cardEntryToSavedCard(cardNumber, expiryMonth, expiryYear, idGenerator?)` that returns a `SavedCard` with detected brand, last four digits, and a unique ID
    - _Requirements: 1.2, 4.1, 4.2, 4.3, 4.4_

  - [x] 1.2 Replace prop-based `savedCards` with `localSavedCards` state
    - Introduce `const [localSavedCards, setLocalSavedCards] = useState<SavedCard[]>(...)` seeded from `directive.props.savedCards`
    - Update `view` initial state to use `localSavedCards.length`
    - Pass `localSavedCards` to `AvailableCardsView` and use `localSavedCards.length > 0` for `showBackButton`
    - Update `selectedCardId` initial state to use `localSavedCards`
    - _Requirements: 1.1, 5.1_

  - [x] 1.3 Rewire `handleAddCard` to save card locally and navigate back
    - Call `cardEntryToSavedCard` to create a new `SavedCard`
    - Append the new card to `localSavedCards` via `setLocalSavedCards`
    - Set `selectedCardId` to the new card's `id`
    - Clear form fields (`cardNumber`, `expiryDate`, `cvv`, `cardholderName`) to empty strings
    - Set `view` to `'available-cards'`
    - Remove the `payment-confirmed` interaction from `handleAddCard`
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.4, 3.1_

- [x] 2. Checkpoint
  - Ensure the component compiles and the existing behaviour (Start free trial, Cancel, dismiss) still works. Ask the user if questions arise.

- [ ] 3. Property-based tests (fast-check)
  - [ ]* 3.1 Write property test for card entry to SavedCard conversion
    - **Property 1: Card entry to SavedCard conversion correctness**
    - Generate random card numbers with controlled prefixes; verify `brand` matches prefix rules and `lastFour` equals last 4 digits
    - Minimum 100 iterations
    - Tag: `// Feature: save-card-return-to-selection, Property 1: Card entry to SavedCard conversion correctness`
    - **Validates: Requirements 1.2, 4.1, 4.2, 4.3, 4.4**

  - [ ]* 3.2 Write property test for add-card state transition
    - **Property 2: Add card state transition**
    - Generate random valid form data and existing card lists; simulate add-card logic; verify list grows by 1, view becomes `'available-cards'`, selectedCardId matches new card, form fields cleared, no `payment-confirmed` emitted
    - Minimum 100 iterations
    - Tag: `// Feature: save-card-return-to-selection, Property 2: Add card state transition`
    - **Validates: Requirements 1.1, 2.1, 2.2, 2.4, 3.1**

  - [ ]* 3.3 Write property test for unique ID generation
    - **Property 3: Unique ID generation across additions**
    - Generate N card additions (N ≥ 2), collect IDs, verify uniqueness via Set size
    - Minimum 100 iterations
    - Tag: `// Feature: save-card-return-to-selection, Property 3: Unique ID generation across additions`
    - **Validates: Requirements 1.3**

  - [ ]* 3.4 Write property test for invalid form rejection
    - **Property 4: Invalid form rejection preserves state**
    - Generate card data that fails at least one validation rule; verify `localSavedCards` unchanged and `view` remains `'add-card'`
    - Minimum 100 iterations
    - Tag: `// Feature: save-card-return-to-selection, Property 4: Invalid form rejection preserves state`
    - **Validates: Requirements 1.4**

- [ ] 4. Unit and integration tests
  - [ ]* 4.1 Write unit/integration tests for add-card flow and payment confirmation
    - After adding a card, verify AvailableCardsView renders the new card with correct brand label and last four digits (Req 2.3)
    - With a selected card, tapping "Start free trial" fires `payment-confirmed` with the correct `cardId` (Req 3.2)
    - Add a new card, select it, confirm — verify `payment-confirmed` fires with the new card's ID (Req 3.3)
    - Render with empty `savedCards` — verify AddCardView is the initial view (Req 5.1)
    - With no saved cards, add a card — verify AvailableCardsView shows one card, pre-selected (Req 5.2)
    - After first card add, verify "Start free trial" button is enabled (Req 5.3)
    - _Requirements: 2.3, 3.2, 3.3, 5.1, 5.2, 5.3_

- [x] 5. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All changes are scoped to `src/pie/PaymentCaptureSheet.tsx` and its test file
- Property tests use fast-check with minimum 100 iterations per property
- Unit/integration tests use Vitest + React Testing Library
