---
inclusion: always
---

# PIE Library — Project Steering

## Project Overview

This project implements a Conversational Nudge Layer for a food delivery checkout flow. It consists of two decoupled layers:

- Conversational Layer (`src/conversational/`): a framework-agnostic logic engine that evaluates user context, selects behavioral strategies, and emits structured nudge events as JSON. No React or DOM dependencies allowed.
- PIE Component Layer (`src/pie/`): a React rendering layer that consumes UI directives from nudge events and renders dynamic components (badges, toggles, animations). Must follow the PIE Design System foundations.

The two layers communicate exclusively through serializable JSON `NudgeEvent` objects.

## Technology Stack

- Language: TypeScript (strict mode)
- UI Framework: React (PIE components and checkout integration only)
- Testing: Vitest + fast-check for property-based testing
- Build: Vite

## PIE Design System

The UI layer must align with the [PIE Design System](https://www.pie.design/) — JET's unified design language. Use PIE Web Components (`@justeattakeaway/pie-webc`) where suitable components exist. For custom PIE components (SavingsBadge, QuickToggle, ConfettiAnimation), follow PIE foundations.

### Key References

- Components: https://www.pie.design/components/
- Design Tokens: https://www.pie.design/foundations/design-tokens/
- Colour: https://www.pie.design/foundations/colour/
- Colour Alias Tokens (Light): https://www.pie.design/foundations/colour/tokens/alias/light/
- Colour Global Tokens: https://www.pie.design/foundations/colour/tokens/global/
- Typography: https://www.pie.design/foundations/typography/
- Spacing: https://www.pie.design/foundations/spacing/
- Radius: https://www.pie.design/foundations/radius/
- Elevation: https://www.pie.design/foundations/elevation/
- Motion: https://www.pie.design/foundations/motion/
- Blur: https://www.pie.design/foundations/blur/
- Iconography: https://www.pie.design/foundations/iconography/
- Web Components Guide: https://pie.design/engineers/web-components/

### Design Token Usage

- Use PIE alias tokens (e.g., `$color-background-default`, `$color-container-default`) instead of hard-coded HEX values.
- Tokens follow a two-tier system: Global Tokens (primitive values like `$color-orange-30`) and Alias Tokens (contextual like `$color-background-dark`).
- Product orange (not brand orange) must be used for interactive elements like buttons, icons, and toggles.
- Content opacity tokens are the default choice; use solid tokens only when pairing with blur or transparency backgrounds.

### Colour Rules

- Orange is the primary brand colour. Use product orange for interactive elements (buttons, toggles, icons).
- Colour alone must never convey information — always pair with text, icons, or patterns for accessibility.
- Follow WCAG 2.1 contrast ratios. The PIE colour system is designed within HSLuv colour space for compliant contrast.

### Typography

- Primary font: JET Sans Digital. Fallback: Arial. Code: PT Mono.
- Type scale uses multiples of 4px for sizes and line height (aligns to 4px vertical grid).
- Headings and subheadings are responsive (different sizes for screens >768px vs <768px). Body styles are fixed.
- Left-align text by default. Centre alignment should be used sparingly.
- Line length: 80–100 characters per line (minimum 60).

### Spacing

- Use PIE spacing scale (multiples of 4px) for all padding, margins, and dimensions.
- Follow the "element first" approach: component dimensions take priority, internal padding adjusts to accommodate content.
- Default spacing for customer-facing products (generous whitespace). Compact spacing for operational/dense UIs.

### Radius

- 0px for full-width structural elements (toolbars, section dividers).
- Partial rounding (multiples of 4px) for most components — cards, containers, inputs.
- Full rounding (`50rem`) sparingly for high-priority interactive elements (buttons, chips, FABs).

### Elevation

- Use elevation tokens to create visual hierarchy via shadows.
- Two shadow positions (above/below) and two intensity levels (10 = subtle, 20 = strong).
- Use default elevation on theme-matching backgrounds; inverse elevation on contrasting backgrounds.
- Don't overuse — reserve higher elevation for interactive or overlapping elements.

### Motion

- Motion must be functional (enhancing UX) or expressive (playful delight moments like confetti).
- Always use easing for smooth, natural transitions.
- Never use motion that slows down the user or hinders task completion.
- Provide reduced-motion alternatives for accessibility (`prefers-reduced-motion` media query).

### Blur

- Use blur tokens paired with their recommended container fill tokens.
- Pair blur with `$content-solid` tokens to ensure text legibility.
- Three levels: base (strong foreground focus), neutral (moderate), prominent (striking effect).

## Architecture Rules

- The Conversational Layer must never import React or any UI framework.
- All communication between layers uses plain JSON `NudgeEvent` objects.
- Archetype definitions are registered at runtime via `ArchetypeRegistry`. New archetypes must not require changes to existing nudge logic.
- Nudge sequences are declarative data structures, not imperative code.

## Code Style

- Use integer pence for all currency values (e.g., `399` = £3.99) to avoid floating-point rounding.
- Use `{{placeholder}}` syntax in message templates. The template resolver must leave no unresolved placeholders.
- All `NudgeEvent` timestamps must be ISO 8601 format.
- Prefer `interface` for object shapes, `type` for unions and utilities.
- Keep Conversational Layer functions pure — side effects belong in the integration layer.

## Testing Conventions

- Use Vitest as the test runner. Do not use Jest.
- Use fast-check for property-based tests. Do not implement PBT from scratch.
- Property-based tests require a minimum of 100 iterations.
- Tag each property test: `// Feature: conversational-nudge-layer, Property {N}: {title}`
- Unit tests cover specific examples, edge cases, and integration flows.

## Error Handling

- The Conversational Layer never throws exceptions to the UI layer. Errors result in `null` returns or no-op behavior.
- When user context is unavailable, fall back to a generic checkout flow with no nudges.
- The PIE layer treats all directives as best-effort: render if possible, return `null` and log a warning for unknown component types.
- Log all error conditions with structured context (stepId, componentType, etc.).
