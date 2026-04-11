# Requirements Document

## Introduction

This feature adds Gemini AI-powered translation capabilities to the food delivery checkout app. A language selector (country flag icon with dropdown) is placed in the top-right area of the top bar. When the user selects a language, all visible UI text across the app — menu page, checkout flow, nudge messages, bottom sheets, offers strip, and FAQs — is translated via the Google Gemini API. Currency formatting and message template placeholders are preserved during translation. The feature operates client-side with an optional lightweight proxy for API key security.

## Glossary

- **Translation_Service**: A TypeScript module (`src/translation/`) responsible for calling the Gemini API, caching results, and returning translated strings. Framework-agnostic — no React dependencies.
- **Language_Selector**: A PIE-compliant React component rendered in the top bar that displays the active language as a country flag icon and opens a dropdown for language switching.
- **Translation_Context**: A React context provider (`TranslationProvider`) that holds the active locale, provides a `t()` lookup function, and triggers re-renders when the language changes.
- **Translation_Cache**: An in-memory map keyed by `(locale, sourceText)` that stores previously translated strings to avoid redundant Gemini API calls.
- **Locale**: A BCP 47 language tag string (e.g., `"en"`, `"de"`, `"es"`, `"fr"`, `"nl"`) identifying the selected language.
- **Source_Text**: The original English UI string before translation.
- **Translatable_String**: Any user-visible text rendered in the PIE Component Layer or emitted in NudgeEvent messages, excluding currency values and placeholder tokens.
- **Placeholder_Token**: A `{{key}}` token inside a message template that must be preserved verbatim through translation.
- **Currency_Value**: An integer-pence amount formatted for display (e.g., `399` → `£3.99`). Currency symbols and numeric values must not be altered by translation.
- **Top_Bar**: The horizontal navigation bar at the top of MenuPage containing the back button (left), ArchetypeToggle (centre), and search button (right).
- **Gemini_API**: Google's Generative AI REST API used to translate text strings from English to a target Locale.

## Requirements

### Requirement 1: Language Selector Component

**User Story:** As a user, I want to see a language selector in the top-right corner of the screen, so that I can switch the app to my preferred language.

#### Acceptance Criteria

1. THE Language_Selector SHALL render a country flag icon (24×24px) in the Top_Bar, positioned to the left of the existing search button.
2. WHEN the user taps the Language_Selector flag icon, THE Language_Selector SHALL open a dropdown menu listing all supported languages with their corresponding country flag and language name.
3. THE Language_Selector SHALL support the following Locales: English (`en`), German (`de`), Spanish (`es`), French (`fr`), and Dutch (`nl`).
4. WHEN a Locale is selected from the dropdown, THE Language_Selector SHALL close the dropdown and update the flag icon to reflect the newly selected Locale.
5. WHILE the dropdown is open, WHEN the user taps outside the dropdown, THE Language_Selector SHALL close the dropdown without changing the active Locale.
6. THE Language_Selector SHALL use PIE Design System spacing tokens (multiples of 4px), radius tokens, and elevation tokens for the dropdown container.
7. THE Language_Selector SHALL use Takeaway Sans Regular (400) for language names and JET Sans Digital (600) for any heading text within the dropdown.
8. THE Language_Selector SHALL include `aria-haspopup="listbox"`, `aria-expanded`, and `aria-label` attributes for screen reader accessibility.
9. WHEN the dropdown is open, THE Language_Selector SHALL support keyboard navigation (Arrow keys to move, Enter to select, Escape to close).

### Requirement 2: Translation Context Provider

**User Story:** As a developer, I want a React context that provides the current locale and a translation lookup function, so that all components can access translated strings without prop drilling.

#### Acceptance Criteria

1. THE Translation_Context SHALL expose the active Locale, a `t(sourceText: string): string` function, and a `setLocale(locale: string): void` function.
2. WHEN `setLocale` is called with a new Locale, THE Translation_Context SHALL update the active Locale and trigger a re-render of all consuming components.
3. WHILE the active Locale is `"en"`, THE Translation_Context `t()` function SHALL return the Source_Text unchanged without calling the Gemini_API.
4. WHEN `t()` is called with a Source_Text that exists in the Translation_Cache for the active Locale, THE Translation_Context SHALL return the cached translation without calling the Gemini_API.
5. THE Translation_Context SHALL initialise with `"en"` as the default Locale.

### Requirement 3: Gemini API Translation Service

**User Story:** As a developer, I want a translation service that calls the Gemini API to translate UI strings, so that the app can display content in multiple languages.

#### Acceptance Criteria

1. WHEN `t()` is called with a Source_Text not in the Translation_Cache for the active Locale, THE Translation_Service SHALL send a translation request to the Gemini_API with the Source_Text and target Locale.
2. WHEN the Gemini_API returns a successful response, THE Translation_Service SHALL store the translated string in the Translation_Cache keyed by `(locale, sourceText)` and return the translated string.
3. THE Translation_Service SHALL send batch translation requests, grouping multiple untranslated strings into a single Gemini_API call to reduce network overhead.
4. IF the Gemini_API request fails or times out, THEN THE Translation_Service SHALL return the original Source_Text and log a structured warning including the Locale and Source_Text.
5. IF the Gemini_API response is empty or malformed, THEN THE Translation_Service SHALL return the original Source_Text and log a structured warning.
6. THE Translation_Service SHALL set a request timeout of 10 seconds for each Gemini_API call.
7. THE Translation_Service SHALL accept the Gemini API key via an environment variable (`VITE_GEMINI_API_KEY`) and not hard-code credentials in source files.

### Requirement 4: Placeholder and Currency Preservation

**User Story:** As a user, I want translated messages to keep correct currency values and dynamic content, so that prices and personalised details remain accurate after translation.

#### Acceptance Criteria

1. WHEN translating a Translatable_String containing Placeholder_Tokens, THE Translation_Service SHALL preserve all `{{key}}` tokens verbatim in the translated output.
2. WHEN translating a Translatable_String containing Currency_Values (e.g., `£3.99`, `€5.00`), THE Translation_Service SHALL preserve the currency symbol and numeric value unchanged in the translated output.
3. FOR ALL Translatable_Strings containing Placeholder_Tokens, translating from English to any supported Locale SHALL produce output containing the same set of Placeholder_Tokens as the Source_Text (round-trip token preservation property).
4. IF a translated string is missing one or more Placeholder_Tokens present in the Source_Text, THEN THE Translation_Service SHALL discard the translation, return the original Source_Text, and log a warning identifying the missing tokens.

### Requirement 5: App-Wide Translation Coverage

**User Story:** As a user, I want all visible text across the app to be translated when I switch languages, so that I have a fully localised experience.

#### Acceptance Criteria

1. WHEN the active Locale changes, THE MenuPage SHALL display translated text for restaurant name, menu category headings, menu item names, menu item descriptions, calorie labels, and tag labels.
2. WHEN the active Locale changes, THE OffersPillStrip SHALL display translated text for offer titles and subtitles.
3. WHEN the active Locale changes, THE NudgeBottomSheet SHALL display translated text for the hero title, body text, benefit row titles and subtitles, FAQ questions and answers, and button labels.
4. WHEN the active Locale changes, THE CelebrationBottomSheet SHALL display translated text for the welcome title and body message.
5. WHEN the active Locale changes, THE PaymentCaptureSheet SHALL display translated text for form labels, button labels, and instructional text.
6. WHEN the active Locale changes, THE SavingsBadge SHALL display translated text for the badge label.
7. WHEN a NudgeEvent is emitted by the Conversational Layer, THE Translation_Context SHALL translate the `message` field of the NudgeEvent before the PIE Component Layer renders the message.

### Requirement 6: Translation Loading State

**User Story:** As a user, I want to see that translation is in progress, so that I understand why text may briefly appear untranslated.

#### Acceptance Criteria

1. WHILE a translation batch request is in progress, THE Translation_Context SHALL expose an `isTranslating: boolean` flag set to `true`.
2. WHILE `isTranslating` is `true`, THE Language_Selector SHALL display a subtle loading indicator (e.g., a spinner overlay on the flag icon) to signal that translation is in progress.
3. WHEN all pending translation requests complete, THE Translation_Context SHALL set `isTranslating` to `false`.
4. WHILE a translation is pending for a specific string, THE Translation_Context `t()` function SHALL return the Source_Text as a fallback until the translation is available.

### Requirement 7: Translation Cache Management

**User Story:** As a user, I want previously translated text to appear instantly when I switch back to a language I used before, so that I do not wait for repeated API calls.

#### Acceptance Criteria

1. THE Translation_Cache SHALL persist translations in memory for the lifetime of the browser session.
2. WHEN the user switches to a Locale that has cached translations, THE Translation_Context SHALL serve all cached strings immediately without calling the Gemini_API.
3. WHEN the user switches to a Locale with partial cache coverage, THE Translation_Service SHALL request translations only for uncached strings and merge results into the Translation_Cache.
4. FOR ALL Source_Text values, storing a translation in the Translation_Cache and retrieving it SHALL return the identical translated string (cache round-trip property).

### Requirement 8: Accessibility and Motion Compliance

**User Story:** As a user with accessibility needs, I want the language selector and translation features to be fully accessible, so that I can use them with assistive technologies.

#### Acceptance Criteria

1. THE Language_Selector dropdown SHALL meet WCAG 2.1 Level AA contrast ratio requirements for all text and interactive elements.
2. WHEN the Language_Selector dropdown opens, THE Language_Selector SHALL move focus to the first item in the dropdown list.
3. THE Language_Selector SHALL announce language changes to screen readers via an `aria-live="polite"` region.
4. WHILE the user has `prefers-reduced-motion: reduce` enabled, THE Language_Selector SHALL suppress any dropdown open/close animations and display the dropdown immediately.
5. THE Language_Selector flag icons SHALL include `alt` text describing the language name (e.g., `alt="English"`, `alt="German"`).

### Requirement 9: Translation Service Serialisation Contract

**User Story:** As a developer, I want the translation request and response to follow a defined JSON contract, so that the Translation_Service can be tested and mocked reliably.

#### Acceptance Criteria

1. THE Translation_Service SHALL accept translation input as a JSON object with fields `sourceTexts: string[]` and `targetLocale: string`.
2. THE Translation_Service SHALL return translation output as a JSON object with field `translations: string[]` where each entry corresponds positionally to the input `sourceTexts` array.
3. FOR ALL valid input arrays, the length of the `translations` output array SHALL equal the length of the `sourceTexts` input array.
4. FOR ALL valid translation inputs, serialising the input to JSON, sending to the Translation_Service, and deserialising the output SHALL produce a valid translation response with matching array lengths (serialisation round-trip property).
