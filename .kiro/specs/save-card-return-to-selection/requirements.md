# Requirements Document

## Introduction

This feature modifies the PaymentCaptureSheet component to change the "Add card" flow. Currently, tapping "Add card" on the add-card form immediately fires a `payment-confirmed` interaction and dismisses the sheet. The new behavior saves the card to the local saved cards list, navigates back to the AvailableCardsView with the newly added card pre-selected, and lets the user confirm payment from there.

## Glossary

- **PaymentCaptureSheet**: The bottom-sheet React component (`src/pie/PaymentCaptureSheet.tsx`) that manages payment card selection and entry. It has two views: AvailableCardsView and AddCardView.
- **AvailableCardsView**: The sub-view within PaymentCaptureSheet that displays a list of saved cards with radio selection, an "Add Credit card" CTA, and a "Start free trial" confirmation button.
- **AddCardView**: The sub-view within PaymentCaptureSheet containing the new card entry form (card number, expiry, CVV, cardholder name) and an "Add card" submit button.
- **SavedCards_List**: The local in-component state array of `SavedCard` objects representing cards available for selection.
- **CardEntryData**: A typed object containing card number, expiry month, expiry year, CVV, and cardholder name for a newly entered card.
- **Selected_Card**: The currently highlighted card in AvailableCardsView, indicated by the radio indicator.

## Requirements

### Requirement 1: Save New Card to Local List

**User Story:** As a user, I want my newly entered card to be saved to the available cards list, so that I can see it alongside my existing cards before confirming payment.

#### Acceptance Criteria

1. WHEN the user taps "Add card" with a valid form, THE PaymentCaptureSheet SHALL create a new `SavedCard` entry from the CardEntryData and append it to the SavedCards_List.
2. WHEN the PaymentCaptureSheet creates a new SavedCard from CardEntryData, THE PaymentCaptureSheet SHALL derive the card brand from the card number prefix and populate the `lastFour` field from the last four digits of the card number.
3. WHEN the PaymentCaptureSheet creates a new SavedCard, THE PaymentCaptureSheet SHALL assign a unique `id` to the new card entry.
4. IF the card form is invalid when the user taps "Add card", THEN THE PaymentCaptureSheet SHALL keep the AddCardView displayed and not modify the SavedCards_List.

### Requirement 2: Navigate Back to Available Cards After Adding

**User Story:** As a user, I want to return to the card selection screen after adding a new card, so that I can review my cards and choose which one to use for payment.

#### Acceptance Criteria

1. WHEN a new card is successfully saved to the SavedCards_List, THE PaymentCaptureSheet SHALL navigate from the AddCardView to the AvailableCardsView.
2. WHEN the PaymentCaptureSheet navigates to AvailableCardsView after saving a new card, THE PaymentCaptureSheet SHALL set the Selected_Card to the newly added card.
3. WHEN the PaymentCaptureSheet navigates to AvailableCardsView after saving a new card, THE PaymentCaptureSheet SHALL display the new card in the card list with the correct brand icon, brand label, and last four digits.
4. WHEN the PaymentCaptureSheet navigates to AvailableCardsView after saving a new card, THE PaymentCaptureSheet SHALL clear the add-card form fields (card number, expiry date, CVV, cardholder name).

### Requirement 3: Confirm Payment from Available Cards View Only

**User Story:** As a user, I want to confirm payment only from the card selection screen, so that I have a chance to review my choice before committing.

#### Acceptance Criteria

1. WHEN the user taps "Add card" on the AddCardView with a valid form, THE PaymentCaptureSheet SHALL NOT fire a `payment-confirmed` interaction.
2. WHEN the user taps "Start free trial" on the AvailableCardsView with a Selected_Card, THE PaymentCaptureSheet SHALL fire a `payment-confirmed` interaction with the Selected_Card as the payment method.
3. THE PaymentCaptureSheet SHALL support confirming payment with both originally-loaded saved cards and newly-added cards through the same "Start free trial" button on AvailableCardsView.

### Requirement 4: Card Brand Detection

**User Story:** As a user, I want my card brand to be automatically detected from the card number, so that the correct brand icon appears in the card list.

#### Acceptance Criteria

1. WHEN a card number starts with "4", THE PaymentCaptureSheet SHALL assign the brand "visa" to the new SavedCard.
2. WHEN a card number starts with "5" followed by a digit in the range 1–5, THE PaymentCaptureSheet SHALL assign the brand "mastercard" to the new SavedCard.
3. WHEN a card number starts with "34" or "37", THE PaymentCaptureSheet SHALL assign the brand "amex" to the new SavedCard.
4. IF the card number does not match any known brand prefix, THEN THE PaymentCaptureSheet SHALL assign a default brand value of "visa" to the new SavedCard.

### Requirement 5: First Card Flow (No Existing Saved Cards)

**User Story:** As a user with no saved cards, I want to add a card and then see it on the selection screen, so that I have the same confirmation experience as users with existing cards.

#### Acceptance Criteria

1. WHILE the SavedCards_List is empty, THE PaymentCaptureSheet SHALL display the AddCardView as the initial view.
2. WHEN a user with no existing saved cards adds a card, THE PaymentCaptureSheet SHALL navigate to the AvailableCardsView showing the newly added card as the only entry and pre-selected.
3. WHEN the AvailableCardsView is displayed after a first card is added, THE PaymentCaptureSheet SHALL show the "Start free trial" button in an enabled state.
