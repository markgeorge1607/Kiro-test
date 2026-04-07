# Requirements Document

## Introduction

The OffersPillStrip component renders a horizontally scrollable strip of offer banner cards on the MenuPage. It displays two card variants: a "JET+" card with a gradient background, orange border, and JET+ logo overlay, and "standard" cards with a yellow tonal background and a circular offer tag icon. Each card shows a title, optional subtitle, and a right-arrow chevron. The component lives in the PIE component layer (`src/pie/`) and is rendered directly in `MenuPage.tsx` between the menu header and the menu list. It is always visible on the menu page, not gated behind basket interactions.

Figma reference: JET-SKI-Experimentation, node 8267:109063 (Partner-Offers).

## Glossary

- **Offers_Pill_Strip**: A horizontally scrollable container that renders a series of Offer_Card elements. Always visible on the menu page.
- **Offer_Card**: A banner-style card displaying offer title and subtitle. Two variants exist: "jetplus" and "standard".
- **JET+ Logo**: An overlay image positioned on the first jetplus card, showing the JET+ house icon.
- **Offer Tag Icon**: A circular icon with the offer/discount tag, displayed on standard variant cards.
- **Arrow Right**: A chevron icon on the right side of each card indicating the card is tappable.
- **PIE_Renderer**: The existing PIE component registry and rendering system (`src/pie/PIERenderer.tsx`).
- **UIDirective**: A serializable JSON object with `componentType` and `props`, used to drive PIE component rendering.

## Requirements

### Requirement 1: Offer Card Rendering

**User Story:** As a customer browsing the menu, I want to see promotional offers displayed as banner cards with clear titles and subtitles, so that I can quickly understand available deals.

#### Acceptance Criteria

1. WHEN an Offer with variant "jetplus" is provided, THE Offer_Card SHALL render with a gradient background (`linear-gradient(125deg, #fff2e5 11%, #fddfc3 42%, #ffd3bf 87%)`), a 1px solid orange border (`#f36805`), and 12px border-radius.
2. WHEN an Offer with variant "standard" is provided, THE Offer_Card SHALL render with a yellow tonal background (`#fceac0`), no border, and 16px border-radius.
3. THE Offer_Card SHALL render the offer title using JET Sans Digital font at 16px size, 900 font weight, italic style, and 20px line height, with colour `rgba(0,0,0,0.76)`.
4. WHEN an Offer has a subtitle, THE Offer_Card SHALL render it at 12px size, 400 font weight, 16px line height, with colour `rgba(0,0,0,0.64)`.
5. THE jetplus Offer_Card SHALL be 287px wide and 66px tall. Standard Offer_Cards SHALL be 220px wide and 66px tall.
6. THE Offer_Card SHALL prevent title and subtitle text wrapping, using text-overflow ellipsis for overflow.
7. THE Offer_Card SHALL apply `fontFeatureSettings: "'lnum' 1, 'tnum' 1"` to title and subtitle text.

### Requirement 2: Card Strip Layout and Scrolling

**User Story:** As a customer, I want to scroll through multiple offer cards horizontally, so that I can discover all available promotions.

#### Acceptance Criteria

1. THE Offers_Pill_Strip SHALL arrange Offer_Card elements in a horizontal row with 8px gaps between cards.
2. WHEN the combined width of all Offer_Card elements exceeds the viewport width, THE Offers_Pill_Strip SHALL enable horizontal scrolling.
3. THE Offers_Pill_Strip SHALL hide the scrollbar visually while maintaining scroll functionality.
4. THE Offers_Pill_Strip SHALL apply 12px vertical padding and 10px horizontal padding.
5. WHEN fewer cards exist than fill the viewport width, THE Offers_Pill_Strip SHALL render the cards left-aligned without stretching.

### Requirement 3: JET+ Logo and Offer Tag Icon

**User Story:** As a customer, I want to see visual indicators distinguishing JET+ offers from standard offers, so that I can identify membership-exclusive deals.

#### Acceptance Criteria

1. THE first jetplus Offer_Card SHALL display a JET+ logo overlay positioned at left: 10px, top: 13px relative to the card, sized 38x38px.
2. THE JET+ logo SHALL be non-interactive (pointer-events: none) and layered above the card (z-index: 1).
3. Standard Offer_Cards SHALL display a circular offer tag icon (24x24px, background `#f6c243`, border-radius 50%) positioned absolutely at left: 0, top: 0 within the content area.
4. THE offer tag icon SHALL contain a 14x14px offer/discount image centred within the circle.
5. THE text block on jetplus cards SHALL be offset 48px from the content edge (12px gap after the logo). Standard cards SHALL offset text 32px from the content edge.

### Requirement 4: PIE Component Integration

**User Story:** As a developer, I want the Offers Pill Strip to follow the PIE component pattern, so that it integrates consistently with the existing component registry and directive system.

#### Acceptance Criteria

1. THE Offers_Pill_Strip SHALL accept a `PIEComponentProps` interface with a `directive` containing a `componentType` of `"offers-pill-strip"`.
2. THE Offers_Pill_Strip SHALL read an `offers` array from `directive.props`, where each offer contains `id` (string), `text` (string), optional `subtitle` (string), and optional `variant` (`'jetplus' | 'standard'`).
3. WHEN the `offers` array is empty or missing, THE Offers_Pill_Strip SHALL render nothing (return `null`).
4. THE Offers_Pill_Strip SHALL be registerable with the PIE_Renderer via `registerComponent('offers-pill-strip', OffersPillStrip)`.
5. WHEN an Offer_Card is tapped, THE Offers_Pill_Strip SHALL fire an `onInteraction` event with `componentType: 'offers-pill-strip'`, `action: 'offer-tapped'`, and the tapped offer `id` in the payload.

### Requirement 5: MenuPage Integration

**User Story:** As a customer, I want to see the offer cards on the menu page at all times, so that I'm always aware of available promotions.

#### Acceptance Criteria

1. THE MenuPage SHALL render the Offers_Pill_Strip between the menu header info section and the menu list section.
2. THE MenuPage SHALL render the Offers_Pill_Strip directly (not through PIE_Renderer) so it is always visible regardless of registry timing.
3. THE MenuPage SHALL pass offer data including `id`, `text`, `subtitle`, and `variant` fields.
4. THE Offers_Pill_Strip SHALL be visible on the menu page at all times, not gated behind adding items to the basket.
5. THE MenuPage SHALL NOT render a border-bottom divider line below the offers section.

### Requirement 6: Accessibility

**User Story:** As a customer using assistive technology, I want the offers strip to be navigable and understandable.

#### Acceptance Criteria

1. THE Offers_Pill_Strip SHALL use a `role="list"` container with each Offer_Card wrapped in a `role="listitem"` element.
2. THE Offers_Pill_Strip SHALL provide an accessible label (via `aria-label`) of "Available offers" on the scrollable container.
3. WHEN an Offer_Card is interactive (tappable), THE Offer_Card SHALL be rendered as a `button` element.
4. THE Offers_Pill_Strip SHALL respect the `prefers-reduced-motion` media query by disabling smooth-scroll behaviour when reduced motion is preferred.
5. THE Arrow Right chevron icons SHALL be marked `aria-hidden="true"`.

### Requirement 7: Elevation (JET+ card only)

**User Story:** As a customer, I want the JET+ card to have subtle depth, so that it stands out as a premium offer.

#### Acceptance Criteria

1. THE jetplus Offer_Card SHALL apply the PIE elevation-below-10 shadow: `0px 2px 6px 2px rgba(0,0,0,0.02), 0px 2px 12px 0px rgba(0,0,0,0.03), 0px 2px 6px 0px rgba(0,0,0,0.01)`.
2. Standard Offer_Cards SHALL have no box-shadow.
