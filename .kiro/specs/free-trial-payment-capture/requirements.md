# Requirements Document

## Introduction

This document defines the requirements for the Free Trial Payment Capture feature. Currently, when a user taps "Start your free trial" on the NudgeBottomSheet (triggered from the OffersPillStrip JET+ tile on the menu screen or from the existing checkout nudge flow), the JET+ trial activates immediately without collecting payment details. This feature introduces a payment capture step between the trial CTA and trial activation. After the user taps "Start your free trial," a Payment_Capture_Sheet collects a saved card selection or new card entry. Only after valid payment details are confirmed does the trial activate and the existing CelebrationBottomSheet appear.

The feature also wires up the JET+ tile tap in the OffersPillStrip on the menu screen to trigger the NudgeBottomSheet upsell flow, which currently has no handler for JET+ tile interactions.

## Glossary

- **Payment_Capture_Sheet**: A bottom sheet PIE component that collects payment details (saved card selection or new card entry) before activating a JET+ free trial. Registered as componentType `"payment-capture-sheet"`.
- **Saved_Card**: A previously stored payment card associated with the user's account, displayed as a selectable option showing the last four digits, card brand, and expiry date.
- **Card_Entry_Form**: An inline form within the Payment_Capture_Sheet for entering new card details (card number, expiry, CVV, cardholder name).
- **Payment_Method**: Either a Saved_Card selection or a completed Card_Entry_Form submission representing valid payment details.
- **OffersPillStrip**: An existing PIE component that renders horizontally scrollable offer cards on the menu page. JET+ variant cards fire an `offer-tapped` interaction event with the offer ID.
- **NudgeBottomSheet**: An existing bottom sheet component that presents the JET+ upsell offer with benefits and a "Start your free trial" CTA button.
- **CelebrationBottomSheet**: An existing bottom sheet component that confirms successful trial activation with a welcome message and auto-dismiss behavior.
- **MenuPage**: The restaurant menu screen that renders the OffersPillStrip and handles nudge interactions.
- **Conversational_Layer**: The decoupled logic engine that evaluates user context, selects behavioral strategies, and emits structured nudge events as JSON. Must not import React.
- **PIE_Component**: A Persuasive, Interactive, Engaging UI component that renders dynamic UI elements as directed by the Conversational_Layer.
- **UI_Directive**: A structured instruction emitted by the Conversational_Layer that tells the UI which PIE_Component to render, where, and with what parameters.
- **Nudge_Sequence**: An ordered series of nudge steps forming a multi-step conversational flow tied to a single user journey.
- **Trial_Activation_Trigger**: The `trial-activated` trigger condition that advances the nudge sequence to the confirmation step. In this feature, this trigger fires only after valid payment details are captured.

## Requirements
