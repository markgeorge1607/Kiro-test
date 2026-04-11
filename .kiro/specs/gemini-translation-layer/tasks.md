# Implementation Plan: Gemini Translation Layer

## Overview

Implement the Gemini Translation Layer following the existing two-layer architecture. The framework-agnostic Translation Service (`src/translation/`) handles caching, placeholder shielding, and Gemini API communication. A React TranslationContext bridges it into the component tree, and a LanguageSelector PIE component provides the UI. All PIE components are then wired to use the `t()` function for translated text.

## Tasks

- [x] 1. Add Locale type and translation interfaces to shared types
  - [x] 1.1 Add `Locale` type, `TranslationRequest`, and `TranslationResponse` interfaces to `src/types/index.ts`
    - Add `type Locale = 'en' | 'de' | 'es' | 'fr' | 'nl'`
    - Add `TranslationRequest` with `sourceTexts: string[]` and `targetLocale: string`
    - Add `TranslationResponse` with `translations: string[]`
    - _Requirements: 1.3, 9.1, 9.2_

- [x] 2. Implement TranslationCache
  - [x] 2.1 Create `src/translation/TranslationCache.ts` with `set`, `get`, `has`, and `clear` methods
    - Key format: `${locale}::${sourceText}`
    - Backed by a `Map<string, string>`
    - No React or framework dependencies
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ]* 2.2 Write property test for TranslationCache round-trip (Property 2)
    - **Property 2: Cache round-trip**
    - For any locale, source text, and translation string, storing and retrieving returns the identical string
    - **Validates: Requirements 7.4, 2.4, 7.2**

- [x] 3. Implement PlaceholderShielder
  - [x] 3.1 Create `src/translation/PlaceholderShielder.ts` with `shield`, `unshield`, `extractPlaceholders`, and `validatePlaceholders` functions
    - `shield`: replace `{{key}}` tokens and currency patterns (`£X.XX`, `€X.XX`, etc.) with numbered `<xN>` XML tags; return `ShieldResult` with `shieldedText` and `tokens` map
    - `unshield`: restore original tokens from `<xN>` tags using the tokens map
    - `extractPlaceholders`: return all `{{key}}` tokens from a string
    - `validatePlaceholders`: check that translated text contains all original `{{key}}` tokens
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 3.2 Write property test for placeholder and currency token preservation (Property 5)
    - **Property 5: Placeholder and currency token preservation**
    - For any source text containing `{{key}}` tokens and/or currency values, shielding then unshielding preserves all original tokens
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 3.3 Write unit tests for PlaceholderShielder
    - Test specific shield/unshield examples (e.g., `"Save {{fee}} on delivery"` round-trip)
    - Test currency patterns (`£3.99`, `€5.00`)
    - Test strings with no placeholders
    - Test strings with multiple placeholders and currencies
    - _Requirements: 4.1, 4.2_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement TranslationService
  - [x] 5.1 Create `src/translation/TranslationService.ts` with `TranslationServiceConfig` and `TranslationService` class
    - Constructor accepts `apiKey`, optional `timeoutMs` (default 10000), optional `modelName` (default `'gemini-2.0-flash'`)
    - Read API key from `import.meta.env.VITE_GEMINI_API_KEY` at integration level; pass into constructor
    - Log structured error on construction if API key is empty
    - _Requirements: 3.6, 3.7_

  - [x] 5.2 Implement `translateBatch(request: TranslationRequest): Promise<TranslationResponse>` method
    - Check TranslationCache for each source text; separate cached hits from uncached misses
    - Shield placeholders in uncached strings via PlaceholderShielder
    - Build Gemini `generateContent` prompt with shielded strings, `temperature: 0.1`, `responseMimeType: "application/json"`
    - Send single `fetch` POST to Gemini API with `AbortController` timeout (10s)
    - Parse JSON array response; validate response array length matches input
    - Unshield placeholders in each translated string
    - Validate placeholder preservation; discard individual translations that fail validation (fall back to source text, log missing tokens)
    - Store valid translations in TranslationCache
    - Return `translations[]` positionally matching `sourceTexts[]` (merge cached + new)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.3, 4.4, 7.3_

  - [ ]* 5.3 Write property test for English locale identity (Property 1)
    - **Property 1: English locale identity**
    - For any source text, when target locale is `"en"`, `translateBatch` returns the source text unchanged without calling the Gemini API
    - **Validates: Requirements 2.3**

  - [ ]* 5.4 Write property test for batch grouping (Property 3)
    - **Property 3: Batch grouping**
    - For any array of untranslated source texts, `translateBatch` sends exactly one Gemini API call containing all strings
    - **Validates: Requirements 3.3**

  - [ ]* 5.5 Write property test for API failure graceful fallback (Property 4)
    - **Property 4: API failure graceful fallback**
    - For any source text and target locale, if the Gemini API request fails or times out, `translateBatch` returns the original source texts unchanged and logs a warning
    - **Validates: Requirements 3.4**

  - [ ]* 5.6 Write property test for missing token validation fallback (Property 6)
    - **Property 6: Missing token validation fallback**
    - For any source text with placeholder tokens, if the API returns a translation missing tokens, the service discards it and returns the source text
    - **Validates: Requirements 4.4**

  - [ ]* 5.7 Write property test for partial cache efficiency (Property 9)
    - **Property 9: Partial cache efficiency**
    - For any set of source texts with partial cache coverage, the service sends only uncached strings to the API and merges results correctly
    - **Validates: Requirements 7.3**

  - [ ]* 5.8 Write property test for serialisation round-trip with length preservation (Property 10)
    - **Property 10: Serialisation round-trip with length preservation**
    - For any valid `TranslationRequest`, the `TranslationResponse.translations` array length equals `sourceTexts.length`
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

  - [ ]* 5.9 Write property test for successful translation populates cache (Property 11)
    - **Property 11: Successful translation populates cache**
    - For any source text and locale, after a successful translation, the cache contains the result and subsequent calls skip the API
    - **Validates: Requirements 3.2**

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement TranslationContext provider
  - [x] 7.1 Create `src/translation/TranslationContext.tsx` with `TranslationProvider` and `useTranslation` hook
    - Expose `locale`, `setLocale`, `t()`, and `isTranslating` via context
    - Initialise with `locale = "en"`
    - When locale is `"en"`, `t()` returns source text unchanged (no API call)
    - When locale changes, collect registered source strings, call `translateBatch` for uncached ones
    - While batch is in-flight, `isTranslating = true` and `t()` returns source text as fallback
    - Accept optional `service` prop for test injection
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.3, 6.4_

  - [ ]* 7.2 Write property test for pending translation returns source text (Property 8)
    - **Property 8: Pending translation returns source text**
    - For any source text where a translation request is in-flight, `t()` returns the original source text
    - **Validates: Requirements 6.4**

  - [ ]* 7.3 Write unit tests for TranslationContext
    - Test initialisation with `"en"` locale
    - Test `setLocale` triggers re-render
    - Test `t()` returns source text for `"en"` locale
    - Test `isTranslating` flag during batch request
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 8. Implement LanguageSelector PIE component
  - [x] 8.1 Create `src/pie/LanguageSelector.tsx` with flag icon button and dropdown
    - 24×24px country flag icon button; positioned left of the search button in the top bar
    - Dropdown with PIE elevation (`--dt-elevation-below-20`), radius (`--dt-radius-rounded-c`), padding (`--dt-spacing-c`)
    - Each row: flag emoji (20×20px) + language name in Takeaway Sans Regular 400, 14px
    - Active locale row highlighted with `--dt-color-background-subtle`
    - Supported locales: en 🇬🇧 English, de 🇩🇪 German, es 🇪🇸 Spanish, fr 🇫🇷 French, nl 🇳🇱 Dutch
    - Close dropdown on outside click without changing locale
    - Loading spinner overlay on flag icon when `isTranslating` is true
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 6.2_

  - [x] 8.2 Add accessibility attributes and keyboard navigation to LanguageSelector
    - `aria-haspopup="listbox"`, `aria-expanded`, `aria-label="Select language"` on trigger button
    - `role="listbox"` on dropdown, `role="option"` on each item
    - `aria-live="polite"` region for locale change announcements
    - Keyboard: Arrow Up/Down to navigate, Enter to select, Escape to close
    - Focus moves to first item when dropdown opens
    - `prefers-reduced-motion: reduce` suppresses open/close animations
    - Flag images include `alt` text with language name
    - _Requirements: 1.8, 1.9, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 8.3 Write unit tests for LanguageSelector
    - Test renders flag icon, opens/closes dropdown, keyboard navigation, ARIA attributes
    - Test click-outside dismissal, loading spinner when `isTranslating`, reduced-motion
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.8, 1.9, 6.2, 8.4_

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Integrate TranslationProvider into the app and wire LanguageSelector into the top bar
  - [x] 10.1 Wrap the app with `TranslationProvider` in `src/App.tsx`
    - Instantiate `TranslationService` with `import.meta.env.VITE_GEMINI_API_KEY`
    - Pass service instance to `TranslationProvider`
    - _Requirements: 2.1, 2.5, 3.7_

  - [x] 10.2 Add LanguageSelector to the MenuPage top bar
    - Import `useTranslation` hook and `LanguageSelector` component
    - Position LanguageSelector left of the search button in the top bar `<div>`
    - Wire `locale`, `isTranslating`, and `onLocaleChange` → `setLocale`
    - _Requirements: 1.1, 1.4_

- [x] 11. Wire translation into all PIE components
  - [x] 11.1 Translate MenuPage text content
    - Use `t()` for restaurant name, category headings, menu item names, descriptions, calorie labels, tag labels, and other visible strings
    - _Requirements: 5.1_

  - [x] 11.2 Translate OffersPillStrip text content
    - Wrap offer titles and subtitles with `t()` before passing to the component
    - _Requirements: 5.2_

  - [x] 11.3 Translate NudgeBottomSheet text content
    - Wrap hero title, body text, benefit row titles/subtitles, FAQ questions/answers, and button labels with `t()`
    - _Requirements: 5.3_

  - [x] 11.4 Translate CelebrationBottomSheet text content
    - Wrap welcome title and body message with `t()`
    - _Requirements: 5.4_

  - [x] 11.5 Translate PaymentCaptureSheet text content
    - Wrap form labels, button labels, and instructional text with `t()`
    - _Requirements: 5.5_

  - [x] 11.6 Translate SavingsBadge text content
    - Wrap badge label with `t()`
    - _Requirements: 5.6_

  - [x] 11.7 Translate NudgeEvent messages at the integration boundary
    - In MenuPage (and CheckoutPage), pass `nudgeEvent.message` through `t()` before rendering
    - Translate string props in `uiDirective.props` via a `translateDirectiveProps` helper
    - Keep the Conversational Layer unaware of translation — it continues to emit English NudgeEvents
    - _Requirements: 5.7_

  - [ ]* 11.8 Write property test for NudgeEvent message translation (Property 7)
    - **Property 7: NudgeEvent message translation**
    - For any NudgeEvent, when locale is not `"en"`, the `message` field is passed through `t()` before rendering
    - **Validates: Requirements 5.7**

  - [ ]* 11.9 Write integration tests for translation coverage
    - Test MenuPage with TranslationProvider: change locale, verify text elements update
    - Test NudgeEvent flow: emit event → translate → render in NudgeBottomSheet
    - Test OffersPillStrip, CelebrationBottomSheet, PaymentCaptureSheet, SavingsBadge with locale change
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 11 correctness properties from the design document using fast-check (minimum 100 iterations)
- Unit tests validate specific examples and edge cases
- All Gemini API calls are mocked in tests — no real API calls in CI
- The Conversational Layer (`src/conversational/`) is never modified; translation is applied at the integration boundary
