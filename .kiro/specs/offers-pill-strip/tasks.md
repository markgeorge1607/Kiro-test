# Implementation Plan: Offers Pill Strip

## Overview

Implementation of the OffersPillStrip PIE component as card-based offer banners matching the Figma Partner-Offers design (node 8267:109063). Two card variants: jetplus (gradient + orange border + logo) and standard (tonal yellow + circular tag icon).

## Tasks

- [x] 1. Create OffersPillStrip PIE component
  - [x] 1.1 Create `src/pie/OffersPillStrip.tsx`
    - Implement `OffersPillStrip` as a `React.FC<PIEComponentProps>`
    - Extract `offers` array from `directive.props` (each offer has `id`, `text`, optional `subtitle`, optional `variant`)
    - Return `null` when `offers` is empty or missing
    - Render a scrollable container with `role="list"` and `aria-label="Available offers"`
    - For each offer, render a `<button>` card inside a `role="listitem"` wrapper
    - JET+ variant: gradient bg, 1px solid #f36805 border, 12px radius, 287x66px, elevation shadow
    - Standard variant: #fceac0 bg, no border, 16px radius, 220x66px
    - Title: 16px, weight 900, italic, line-height 20px, colour rgba(0,0,0,0.76)
    - Subtitle: 12px, weight 400, line-height 16px, colour rgba(0,0,0,0.64)
    - Font feature settings: `'lnum' 1, 'tnum' 1` on title and subtitle
    - JET+ logo overlay: 38x38px at left: 10, top: 13 on first jetplus card
    - Standard offer tag: 24x24px circle (bg #f6c243, border-radius 50%) at left: 0, top: 0
    - Text offset: 48px from content edge on jetplus, 32px on standard
    - Arrow Right chevron (16x16px SVG, aria-hidden) on each card
    - Strip: horizontal flex, 8px gap, overflow-x auto, hidden scrollbar, padding 12px 10px
    - Fire `onInteraction` on card tap with `componentType: 'offers-pill-strip'`, `action: 'offer-tapped'`, `payload: { offerId }`
    - Include `prefers-reduced-motion` media query
    - Use inline `<style>` block pattern
    - _Requirements: 1.1-1.7, 2.1-2.5, 3.1-3.5, 4.1-4.5, 6.1-6.5, 7.1-7.2_

- [x] 2. Write unit tests for OffersPillStrip
  - [x] 2.1 Create `src/pie/OffersPillStrip.test.tsx`
    - Test: renders 2 known offers with correct text content
    - Test: single offer renders without errors
    - Test: empty offers array returns null
    - Test: missing offers prop returns null
    - Test: arrow icons have `aria-hidden="true"`
    - Test: component registers with PIE_Renderer and renders via `render()` function
    - _Requirements: 1.1, 4.2, 4.3, 4.4_

- [x] 3. Integrate OffersPillStrip into MenuPage
  - [x] 3.1 Update `src/menu/MenuPage.tsx`
    - Import `OffersPillStrip` and register with `registerComponent('offers-pill-strip', OffersPillStrip)`
    - Render `OffersPillStrip` directly (not via pieRender) for always-visible display
    - Pass offer data with `id`, `text`, `subtitle`, and `variant` fields
    - Remove border-bottom divider below offers section
    - Initialize nudge controller eagerly on mount (not gated behind handleAdd)
    - _Requirements: 5.1-5.5, 4.4_

- [x] 4. Checkpoint: verify all tests pass
  - All 200 tests pass
  - `tsc --noEmit` compiles cleanly
