# Requirements Document

## Introduction

This document defines the requirements for a Free Trial Activation Screen — a celebration bottom sheet that replaces the current Step 3 (delight-confirm) confetti-only experience in the Conversational Nudge Layer. When either the Squeezed_Saver (Sam) or Value_Seeker (Alex) archetype activates a free trial via the Quick-Toggle, the system transitions to a rich confirmation bottom sheet displaying a welcome message, JET+ branding, a confetti overlay, and a trial-active status indicator. The screen auto-dismisses after a configurable duration and then closes, completing the delight moment in the nudge sequence.

## Glossary

- **Celebration_Bottom_Sheet**: A modal bottom sheet component that slides up from the bottom of the viewport to confirm successful free trial activation. It contains a header with background imagery, a welcome title, a JET+ logo, a body message, a trial-active status indicator, and a confetti overlay.
- **Auto_Dismiss**: The behavior where the Celebration_Bottom_Sheet automatically closes after a configurable duration without requiring user interaction.
- **Trial_Active_Indicator**: A list item section within the Celebration_Bottom_Sheet that displays a check-circle icon, a "JET+ trial active" label, and a "Delivery fee removed" subtitle on a light teal background.
- **Confetti_Overlay**: A decorative confetti streamers image rendered at the top of the Celebration_Bottom_Sheet as a visual delight element.
- **Celebration_Sheet_Props**: The structured properties passed to the Celebration_Bottom_Sheet PIE_Component via a UI_Directive, including welcome title, body message, auto-dismiss duration, and archetype name.
- **Conversational_Layer**: The decoupled logic engine responsible for evaluating user context, selecting a behavioral strategy, and producing nudge output. Defined in the parent Conversational Nudge Layer spec.
- **PIE_Component**: A Persuasive, Interactive, Engaging UI component that renders dynamic UI elements as directed by the Conversational_Layer.
- **UI_Directive**: A structured instruction emitted by the Conversational_Layer that tells the UI which PIE_Component to render, where, and with what parameters.
- **Nudge_Sequence**: An ordered series of nudges that form a multi-step conversational flow tied to a single user journey.
- **Squeezed_Saver**: An archetype representing a cost-conscious user. Persona name: "Sam."
- **Value_Seeker**: An archetype representing an optimization-driven user. Persona name: "Alex."

## Requirements

### Requirement 1: Celebration Bottom Sheet Rendering

**User Story:** As a user who just activated a free trial, I want to see a visually rich confirmation screen so that I feel rewarded and confident about my decision.

#### Acceptance Criteria

1. WHEN the free trial is activated via the Quick-Toggle, THE Celebration_Bottom_Sheet SHALL slide up from the bottom of the viewport with rounded top corners (16px radius) and an elevation shadow.
2. THE Celebration_Bottom_Sheet SHALL render a header section containing a background image, a Confetti_Overlay image, and the JET+ logo (84x84px).
3. THE Celebration_Bottom_Sheet SHALL render a welcome title "Welcome to Just Eat+" using JET Sans Digital ExtraBlack Italic at 32px font size with 36px line height.
4. THE Celebration_Bottom_Sheet SHALL render a body message below the welcome title that confirms the trial activation.
5. THE Celebration_Bottom_Sheet SHALL render a Trial_Active_Indicator section with a light teal background (#E7F4F6) containing a check-circle icon, a "JET+ trial active" label in bold 16px, and a "Delivery fee removed" subtitle in regular 14px subdued text.
6. THE Celebration_Bottom_Sheet SHALL render a pull-tab indicator at the top of the sheet.

### Requirement 2: Archetype-Specific Messaging

**User Story:** As a product designer, I want the celebration screen to display archetype-appropriate messaging so that the delight moment resonates with each user persona.

#### Acceptance Criteria

1. WHEN the Celebration_Bottom_Sheet is displayed for a Squeezed_Saver archetype, THE Celebration_Bottom_Sheet SHALL display a body message using loss-aversion framing that reinforces the user's savings decision.
2. WHEN the Celebration_Bottom_Sheet is displayed for a Value_Seeker archetype, THE Celebration_Bottom_Sheet SHALL display a body message using identity-reinforcement framing that emphasizes the user's new member status and exclusive benefits.
3. THE Celebration_Bottom_Sheet SHALL display the same visual layout and design elements for both archetypes, varying only the body message text.
4. THE Conversational_Layer SHALL include the archetype name in the Celebration_Sheet_Props so that the PIE_Component can resolve the correct message.

### Requirement 3: Auto-Dismiss Behavior

**User Story:** As a user, I want the celebration screen to close automatically after a few seconds so that I can continue with my checkout without manual dismissal.

#### Acceptance Criteria

1. THE Celebration_Bottom_Sheet SHALL automatically close after a configurable duration specified in the UI_Directive props.
2. THE Celebration_Bottom_Sheet SHALL use a default Auto_Dismiss duration of 4000 milliseconds when no duration is specified.
3. WHEN the Auto_Dismiss timer expires, THE Celebration_Bottom_Sheet SHALL trigger a slide-down exit animation before removing itself from the viewport.
4. WHEN the Celebration_Bottom_Sheet auto-dismisses, THE Celebration_Bottom_Sheet SHALL fire a "dismissed" interaction event via the onInteraction callback so that the Conversational_Layer can finalize the Nudge_Sequence.

### Requirement 4: Integration with Nudge Sequence

**User Story:** As a developer, I want the celebration screen to integrate with the existing Step 3 (delight-confirm) of the nudge sequence so that it replaces the current confetti-only experience.

#### Acceptance Criteria

1. WHEN the trial-activated trigger fires in any checkout or upsell Nudge_Sequence, THE Conversational_Layer SHALL emit a UI_Directive with componentType "celebration-sheet" instead of "confetti".
2. THE Conversational_Layer SHALL include the welcome title, body message template, Auto_Dismiss duration, and archetype name in the UI_Directive props for the "celebration-sheet" component.
3. THE PIE_Component layer SHALL register the Celebration_Bottom_Sheet under the componentType "celebration-sheet" in the PIERenderer.
4. WHEN the Celebration_Bottom_Sheet fires a "dismissed" interaction event, THE Conversational_Layer SHALL mark the Nudge_Sequence as complete.

### Requirement 5: Confetti Overlay and Motion

**User Story:** As a user, I want to see a celebratory confetti effect on the confirmation screen so that the moment feels special and rewarding.

#### Acceptance Criteria

1. THE Celebration_Bottom_Sheet SHALL render a Confetti_Overlay image at the top of the header section as a decorative element.
2. WHILE the user has the prefers-reduced-motion media query active, THE Celebration_Bottom_Sheet SHALL display the Confetti_Overlay as a static image without animation.
3. WHILE the user does not have prefers-reduced-motion active, THE Celebration_Bottom_Sheet SHALL apply a subtle fade-in animation to the Confetti_Overlay.
4. THE Celebration_Bottom_Sheet SHALL set aria-hidden="true" on the Confetti_Overlay image since the confetti is purely decorative.

### Requirement 6: Accessibility

**User Story:** As a user with assistive technology, I want the celebration screen to be accessible so that I can understand the confirmation message.

#### Acceptance Criteria

1. THE Celebration_Bottom_Sheet SHALL use role="dialog" and aria-modal="true" on the sheet container.
2. THE Celebration_Bottom_Sheet SHALL set an aria-label on the dialog that describes the confirmation context (e.g., "JET+ trial activation confirmed").
3. WHEN the Celebration_Bottom_Sheet opens, THE Celebration_Bottom_Sheet SHALL move focus to the sheet container so that screen readers announce the dialog content.
4. WHEN the Celebration_Bottom_Sheet auto-dismisses, THE Celebration_Bottom_Sheet SHALL return focus to the element that was focused before the sheet opened.
5. THE Celebration_Bottom_Sheet SHALL allow the user to dismiss the sheet early by tapping the backdrop overlay or pressing the Escape key.

### Requirement 7: Backdrop Overlay

**User Story:** As a user, I want a dimmed backdrop behind the celebration screen so that my attention is focused on the confirmation message.

#### Acceptance Criteria

1. WHEN the Celebration_Bottom_Sheet is displayed, THE Celebration_Bottom_Sheet SHALL render a semi-transparent backdrop overlay behind the sheet.
2. WHEN the user taps the backdrop overlay, THE Celebration_Bottom_Sheet SHALL dismiss the sheet and fire a "dismissed" interaction event.
3. THE backdrop overlay SHALL cover the full viewport area behind the Celebration_Bottom_Sheet.

### Requirement 8: Nudge Sequence Update for All Archetypes

**User Story:** As a developer, I want all four nudge sequences (checkout and upsell for both archetypes) to use the new celebration sheet so that the experience is consistent.

#### Acceptance Criteria

1. THE squeezed-saver-checkout Nudge_Sequence SHALL use componentType "celebration-sheet" for the delight-confirm step.
2. THE value-seeker-checkout Nudge_Sequence SHALL use componentType "celebration-sheet" for the delight-confirm step.
3. THE squeezed-saver-upsell Nudge_Sequence SHALL use componentType "celebration-sheet" for the upsell-confirm step.
4. THE value-seeker-upsell Nudge_Sequence SHALL use componentType "celebration-sheet" for the upsell-confirm step.
5. WHEN any Nudge_Sequence emits a "celebration-sheet" UI_Directive, THE UI_Directive props SHALL include a welcomeTitle string, a bodyMessage string template, an autoDismissDuration number, and an archetypeName string.
