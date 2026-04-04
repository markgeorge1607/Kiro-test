# Requirements Document

## Introduction

This document defines the requirements for a Conversational Nudge Layer — a prototype system that personalizes persuasive "nudges" during a food delivery checkout flow. The layer operates as a decoupled conversational engine that reasons about user context (membership status, fees, archetype) and produces personalized messaging and dynamic UI directives. The initial archetypes are "Sam the Squeezed Saver," a cost-conscious user who responds to loss-aversion framing and tangible savings, and "Alex the Value-Seeker," an optimization-driven user who responds to data-backed value propositions and exclusivity framing. The system applies behavioral psychology principles (loss aversion, peak-end rule, identity reinforcement) to guide users toward actions that benefit both the user and the platform.

## Glossary

- **Conversational_Layer**: The decoupled logic engine responsible for evaluating user context, selecting a behavioral strategy, and producing nudge output (message text + UI directive). It is separate from the UI rendering layer.
- **Nudge**: A single persuasive intervention consisting of a conversational message and an optional dynamic UI directive, triggered by a user action or system event.
- **Archetype**: A predefined user persona model that encodes behavioral traits, motivations, and preferred persuasion strategies. Used by the Conversational_Layer to personalize nudges.
- **Squeezed_Saver**: An archetype representing a user who prioritizes financial necessity, constantly re-evaluates costs, and values clear, tangible savings that alleviate financial pressure. Persona name: "Sam."
- **Value_Seeker**: An archetype representing a user who is optimization-driven, responds to data-backed value propositions, and is motivated by exclusivity and getting the best deal. Persona name: "Alex."
- **Subscription_Upsell**: A nudge intent triggered at checkout when a user has accumulated delivery fees exceeding a threshold within the current billing month, designed to convert non-members to JET+ subscribers.
- **Archetype_Toggle**: A UI control that allows switching between registered Archetype personas to preview how the conversational nudge messaging and tone change per archetype.
- **PIE_Component**: A Persuasive, Interactive, Engaging UI component that renders dynamic UI elements (badges, toggles, animations) as directed by the Conversational_Layer.
- **Nudge_Sequence**: An ordered series of nudges that form a multi-step conversational flow tied to a single user journey (e.g., checkout).
- **UI_Directive**: A structured instruction emitted by the Conversational_Layer that tells the UI which PIE_Component to render, where, and with what parameters.
- **Behavioral_Strategy**: A named psychological principle (e.g., loss aversion, peak-end rule, identity reinforcement) that the Conversational_Layer selects to frame a nudge for a given archetype and context.
- **Monthly_Accumulated_Fees**: The total delivery fees a user has paid within the current calendar month, stored in integer pence. Used as a threshold condition for the Subscription_Upsell intent.
- **Minimum_Order_Value (MOV)**: The minimum basket total, in integer pence, that a restaurant requires before an order can be placed. Each restaurant partner defines its own MOV. The default MOV is £15.00 (1500 pence).

## Requirements

### Requirement 1: User Context Evaluation

**User Story:** As the Conversational_Layer, I want to evaluate user context at checkout so that I can determine the appropriate nudge strategy.

#### Acceptance Criteria

1. WHEN a user adds items to the basket from a restaurant partners menu page, THE Conversational_Layer SHALL retrieve the user's membership status, applicable delivery fee, assigned Archetype, and the restaurant's Minimum_Order_Value.
2. WHEN context evaluation completes, THE Conversational_Layer SHALL select a Behavioral_Strategy based on the user's Archetype and current context.
3. IF the user's membership status or Archetype cannot be retrieved, THEN THE Conversational_Layer SHALL fall back to a generic non-personalized checkout flow with no nudges.

### Requirement 2: Archetype-Based Nudge Personalization

**User Story:** As a product designer, I want nudges to be personalized based on user archetypes so that messaging resonates with each user's motivations.

#### Acceptance Criteria

1. THE Conversational_Layer SHALL support registering Archetype definitions that include a name, behavioral traits, and a ranked list of preferred Behavioral_Strategies.
2. WHEN generating a Nudge for a Squeezed_Saver Archetype, THE Conversational_Layer SHALL prioritize loss-aversion framing that emphasizes tangible monetary savings.
3. WHEN generating a Nudge, THE Conversational_Layer SHALL use the Archetype's preferred Behavioral_Strategy to select message tone and content.
4. THE Conversational_Layer SHALL support adding new Archetype definitions without modifying existing nudge logic.

### Requirement 3: Nudge Sequence Orchestration

**User Story:** As a product designer, I want nudges to follow a multi-step conversational flow so that the user is guided through a coherent persuasive journey.

#### Acceptance Criteria

1. THE Conversational_Layer SHALL support defining Nudge_Sequences as ordered lists of steps, where each step has a trigger condition, a message template, and a UI_Directive.
2. WHEN a trigger condition for the next step in a Nudge_Sequence is met, THE Conversational_Layer SHALL emit the corresponding Nudge.
3. WHILE a Nudge_Sequence is active, THE Conversational_Layer SHALL track the current step and prevent skipping or repeating steps.
4. IF the user abandons the checkout during an active Nudge_Sequence, THEN THE Conversational_Layer SHALL reset the sequence state for that session.

### Requirement 4: Step 1 — Initial Savings Nudge

**User Story:** As a Squeezed_Saver user, I want to be alerted about avoidable fees at checkout so that I can make an informed decision before paying.

#### Acceptance Criteria

1. WHEN a non-member user with the Squeezed_Saver Archetype reaches checkout with a delivery fee greater than £0.00, THE Conversational_Layer SHALL emit a Nudge with a loss-aversion message that frames the delivery fee as an avoidable cost.
2. WHEN the Step 1 Nudge is emitted, THE Conversational_Layer SHALL include a UI_Directive for a "Savings" badge PIE_Component positioned over the checkout button with a vibrating animation.
3. THE Conversational_Layer SHALL include the exact delivery fee amount in the Step 1 nudge message.

### Requirement 5: Step 2 — Trial Offer Nudge

**User Story:** As a Squeezed_Saver user, I want to see a frictionless way to remove the fee so that I can save money without leaving my current flow.

#### Acceptance Criteria

1. WHEN the user taps the Step 1 nudge message, THE Conversational_Layer SHALL emit a Step 2 Nudge that frames a free trial as "protecting" the user's money using loss-aversion logic.
2. WHEN the Step 2 Nudge is emitted, THE Conversational_Layer SHALL include a UI_Directive for a "Quick-Toggle" switch PIE_Component that allows trial activation without navigating away from the basket.
3. THE Conversational_Layer SHALL include the trial duration and the specific savings amount in the Step 2 nudge message.

### Requirement 6: Step 3 — Confirmation and Delight Nudge

**User Story:** As a Squeezed_Saver user, I want to feel rewarded after activating a trial so that I feel positive about my decision.

#### Acceptance Criteria

1. WHEN the user activates the free trial via the Quick-Toggle, THE Conversational_Layer SHALL emit a Step 3 Nudge that uses the peak-end rule to create a moment of delight and reinforces the user's new membership identity.
2. WHEN the Step 3 Nudge is emitted, THE Conversational_Layer SHALL include a UI_Directive for a confetti animation PIE_Component that triggers on the delivery fee line as the fee transitions to £0.00.
3. WHEN the Step 3 Nudge is emitted, THE Conversational_Layer SHALL update the basket state to reflect the £0.00 delivery fee.

### Requirement 7: Conversational Layer — UI Separation

**User Story:** As a developer, I want the conversational logic to be decoupled from the UI so that either layer can be modified independently.

#### Acceptance Criteria

1. THE Conversational_Layer SHALL communicate with the UI exclusively through structured Nudge events containing a message string and a UI_Directive object.
2. THE Conversational_Layer SHALL have no direct dependency on any UI framework or rendering library.
3. THE PIE_Component layer SHALL render UI_Directives without knowledge of the Behavioral_Strategy or Archetype that produced them.

### Requirement 8: PIE Component Rendering

**User Story:** As a developer, I want a set of reusable PIE components so that dynamic UI elements can be rendered from UI_Directives.

#### Acceptance Criteria

1. THE PIE_Component layer SHALL support rendering a "Savings Badge" component with configurable position and animation type.
2. THE PIE_Component layer SHALL support rendering a "Quick-Toggle" switch component with a callback for activation events.
3. THE PIE_Component layer SHALL support rendering a "Confetti Animation" component that triggers on a specified target element.
4. WHEN a UI_Directive references an unknown PIE_Component type, THE PIE_Component layer SHALL ignore the directive and log a warning.

### Requirement 9: Nudge Event Serialization

**User Story:** As a developer, I want nudge events to be serializable so that they can be logged, replayed, and tested independently.

#### Acceptance Criteria

1. THE Conversational_Layer SHALL emit Nudge events as serializable JSON objects containing: a step identifier, a message string, a UI_Directive object, and a timestamp.
2. FOR ALL valid Nudge events, serializing to JSON then deserializing back SHALL produce an equivalent Nudge event (round-trip property).
3. WHEN a Nudge event is emitted, THE Conversational_Layer SHALL include the Archetype name and Behavioral_Strategy name in the event metadata for traceability.

### Requirement 10: Value Seeker Archetype

**User Story:** As a product designer, I want a "Value Seeker" archetype so that optimization-driven users receive nudges framed around data-backed value and exclusivity.

#### Acceptance Criteria

1. THE Conversational_Layer SHALL support a Value_Seeker Archetype definition with the name "value-seeker", traits including "optimization-driven", "data-responsive", and "exclusivity-motivated", and a preferred strategy list prioritizing identity-reinforcement.
2. THE Conversational_Layer SHALL register the Value_Seeker Archetype alongside the Squeezed_Saver Archetype without modifying existing nudge logic.
3. WHEN generating a Nudge for a Value_Seeker Archetype, THE Conversational_Layer SHALL use identity-reinforcement framing that emphasizes data-backed savings figures and exclusive member-only benefits.

### Requirement 11: Subscription Upsell Nudge Intent

**User Story:** As a product designer, I want a Subscription Upsell nudge triggered at checkout when a user has paid more than £10 in delivery fees this month so that high-fee users are prompted to convert to JET+ membership.

#### Acceptance Criteria

1. WHEN a non-member user reaches checkout and the user's accumulated delivery fees for the current month exceed £10.00, THE Conversational_Layer SHALL trigger a Subscription_Upsell Nudge_Sequence.
2. THE Conversational_Layer SHALL evaluate the user's monthly accumulated delivery fees as part of the UserContext.
3. IF the user's accumulated monthly delivery fees do not exceed £10.00, THEN THE Conversational_Layer SHALL not trigger the Subscription_Upsell Nudge_Sequence.

### Requirement 12: Archetype-Specific Subscription Upsell Messages

**User Story:** As a product designer, I want the Subscription Upsell nudge to use different conversational messages per archetype so that each persona receives messaging that resonates with their motivations.

#### Acceptance Criteria

1. WHEN the Subscription_Upsell Nudge is triggered for a Squeezed_Saver Archetype, THE Conversational_Layer SHALL emit a message using loss-aversion framing that references the user's accumulated fee spend and frames JET+ as eliminating a "convenience tax", including the specific savings on the current order.
2. WHEN the Subscription_Upsell Nudge is triggered for a Value_Seeker Archetype, THE Conversational_Layer SHALL emit a message using identity-reinforcement framing that references aggregate member savings data, offers a £0.00 delivery on the current order, and highlights exclusive member-only offers.
3. THE Conversational_Layer SHALL resolve archetype-specific message templates using the user's name, accumulated monthly fees, and current order savings as template variables.
4. THE Conversational_Layer SHALL define separate Nudge_Sequence definitions for each Archetype, each containing archetype-appropriate message templates and UI_Directives.

### Requirement 13: Archetype Toggle UI

**User Story:** As a product designer, I want a UI toggle that switches between archetypes so that I can preview how the conversational nudge messaging and UI components change per persona.

#### Acceptance Criteria

1. THE Archetype_Toggle SHALL render a control that lists all registered Archetype names and allows selecting one at a time.
2. WHEN the user selects a different Archetype via the Archetype_Toggle, THE Conversational_Layer SHALL re-evaluate the nudge sequence using the selected Archetype's preferred strategy and message templates.
3. WHEN the Archetype is switched via the Archetype_Toggle, THE PIE_Component layer SHALL re-render the current nudge step with the newly selected Archetype's messaging and tone.
4. THE Archetype_Toggle SHALL display the currently active Archetype name.

### Requirement 14: Restaurant Minimum Order Value Gate

**User Story:** As a product designer, I want conversational nudges to only trigger after the user's basket meets the restaurant's Minimum_Order_Value so that nudges are shown at a point where the user is committed to ordering and the messaging is contextually relevant.

#### Acceptance Criteria

1. WHILE the basket total is below the restaurant's Minimum_Order_Value, THE Conversational_Layer SHALL suppress all Nudge_Sequence triggers.
2. WHEN the basket total meets or exceeds the restaurant's Minimum_Order_Value, THE Conversational_Layer SHALL evaluate nudge trigger conditions as normal.
3. THE Conversational_Layer SHALL retrieve the restaurant's Minimum_Order_Value as part of the UserContext evaluation, defaulting to 1500 pence (£15.00) when the restaurant does not specify a value.
4. IF the basket total drops below the restaurant's Minimum_Order_Value after a Nudge_Sequence has started, THEN THE Conversational_Layer SHALL suppress further nudge steps until the basket total meets or exceeds the Minimum_Order_Value again.
5. THE Conversational_Layer SHALL evaluate the Minimum_Order_Value gate before checking any other nudge trigger conditions, including the Subscription_Upsell fee threshold.
