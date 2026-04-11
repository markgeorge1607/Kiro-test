# Requirements Document

## Introduction

This feature replaces the Gemini generative AI API with a purpose-built translation provider chain for translating UI strings across the food delivery checkout app. The current implementation uses Gemini 2.5 Flash (`generateContent` endpoint) for runtime translation, which is unreliable for straightforward UI string translation — an LLM is overkill for deterministic locale mapping and introduces unpredictable output formatting, latency spikes, and occasional hallucinated translations.

The replacement introduces a provider-based architecture with a primary translation backend (static JSON locale bundles for known strings, with an optional runtime API fallback such as DeepL or Google Cloud Translation v2) and a fallback chain that degrades gracefully through providers before returning English source text. The existing TranslationCache, PlaceholderShielder, TranslationContext, and LanguageSelector remain unchanged — only the translation backend inside TranslationService is replaced.

## Glossary

- **Translation_Service**: The TypeScript module (`src/translation/TranslationService.ts`) responsible for resolving translations via the provider chain, caching results, and returning translated strings. Framework-agnostic.
- **Translation_Provider**: An interface representing a single translation backend (e.g., static bundles, DeepL API, Google Cloud Translation). Each provider implements a common contract for translating an array of strings to a target locale.
- **Provider_Chain**: An ordered list of Translation_Providers. The Translation_Service tries each provider in sequence until one succeeds for all requested strings.
- **Static_Bundle**: A JSON file per locale (e.g., `src/translation/locales/de.json`) containing pre-translated key-value pairs where keys are English source texts and values are translated strings. Loaded at build time via Vite's static import.
- **Runtime_Provider**: A Translation_Provider that calls an external translation API (e.g., DeepL, Google Cloud Translation v2) at runtime for strings not found in Static_Bundles.
- **Translation_Cache**: The existing in-memory map keyed by `(locale, sourceText)` that stores previously resolved translations to avoid redundant provider lookups.
- **Translation_Context**: The existing React context provider that holds the active locale, provides the `t()` function, and triggers re-renders on language change.
- **Language_Selector**: The existing PIE-compliant React component for switching locales.
- **Placeholder_Shielder**: The existing module that replaces `{{key}}` tokens and currency values with XML shield tags before translation and restores them after.
- **Locale**: A BCP 47 language tag (`"en"`, `"de"`, `"es"`, `"fr"`, `"nl"`) identifying the selected language.
- **Source_Text**: The original English UI string before translation.
- **Placeholder_Token**: A `{{key}}` token inside a message template that must be preserved verbatim through translation.
- **Currency_Value**: A currency symbol followed by a numeric amount (e.g., `£3.99`, `€5.00`) that must not be altered by translation.
- **Bundle_Coverage**: The percentage of registered source texts that have a pre-translated entry in the Static_Bundle for a given locale.

## Requirements

### Requirement 1: Translation Provider Interface

**User Story:** As a developer, I want a common interface for translation backends, so that I can swap or chain providers without changing the rest of the translation layer.

#### Acceptance Criteria

1. THE Translation_Provider interface SHALL define a `translate(sourceTexts: string[], targetLocale: string): Promise<(string | null)[]>` method that returns a translated string for each input or `null` if the provider cannot translate that string.
2. THE Translation_Provider interface SHALL define a `name: string` property that identifies the provider for logging and diagnostics.
3. FOR ALL Translation_Provider implementations, the length of the returned array SHALL equal the length of the input `sourceTexts` array.
4. FOR ALL Translation_Provider implementations, calling `translate` with an empty `sourceTexts` array SHALL return an empty array.

### Requirement 2: Static Bundle Provider

**User Story:** As a developer, I want pre-translated JSON locale bundles shipped at build time, so that known UI strings resolve instantly without any network call.

#### Acceptance Criteria

1. THE Static_Bundle provider SHALL load translations from JSON files located at `src/translation/locales/{locale}.json` where each file maps English Source_Text keys to translated string values.
2. WHEN `translate` is called, THE Static_Bundle provider SHALL return the translated string for each Source_Text that exists as a key in the locale file, and `null` for any Source_Text not found in the bundle.
3. THE Static_Bundle provider SHALL support all five Locales: `de`, `es`, `fr`, `nl` (no bundle is needed for `en`).
4. FOR ALL Source_Text keys present in a Static_Bundle, looking up the key SHALL return the same translated string on every call (deterministic, no network dependency).
5. WHEN a locale JSON file does not exist or fails to load, THE Static_Bundle provider SHALL return `null` for all requested strings and log a structured warning identifying the missing locale.

### Requirement 3: Runtime Translation Provider

**User Story:** As a developer, I want an optional runtime translation API provider, so that strings not covered by static bundles can still be translated dynamically.

#### Acceptance Criteria

1. THE Runtime_Provider SHALL implement the Translation_Provider interface and call an external translation API to translate Source_Texts not resolved by earlier providers in the chain.
2. THE Runtime_Provider SHALL accept configuration for the API endpoint URL and API key via environment variables.
3. WHEN the external API returns a successful response, THE Runtime_Provider SHALL return the translated strings positionally matching the input array.
4. IF the external API request fails or times out, THEN THE Runtime_Provider SHALL return `null` for all requested strings and log a structured warning including the target Locale and error details.
5. THE Runtime_Provider SHALL set a request timeout of 10 seconds for each API call.
6. WHEN translating strings containing Placeholder_Tokens or Currency_Values, THE Runtime_Provider SHALL use the Placeholder_Shielder to shield tokens before sending and unshield after receiving translations.
7. IF a translated string from the Runtime_Provider is missing one or more Placeholder_Tokens present in the Source_Text, THEN THE Runtime_Provider SHALL return `null` for that string and log a warning identifying the missing tokens.

### Requirement 4: Provider Chain Orchestration

**User Story:** As a developer, I want the TranslationService to try providers in order and merge results, so that static bundles handle known strings instantly and runtime providers fill the gaps.

#### Acceptance Criteria

1. THE Translation_Service SHALL accept an ordered array of Translation_Providers at construction time, defining the Provider_Chain.
2. WHEN `translateBatch` is called, THE Translation_Service SHALL pass all untranslated Source_Texts to the first provider in the chain.
3. WHEN a provider returns `null` for one or more strings, THE Translation_Service SHALL pass only those unresolved strings to the next provider in the chain.
4. WHEN all providers in the chain have been tried, THE Translation_Service SHALL use the original Source_Text as the fallback for any strings that remain unresolved.
5. FOR ALL input arrays, the final `translations` output array length SHALL equal the input `sourceTexts` array length, with each entry either a resolved translation or the original Source_Text.
6. THE Translation_Service SHALL log a structured summary after each `translateBatch` call indicating how many strings were resolved by each provider and how many fell back to Source_Text.

### Requirement 5: Cache Integration with Provider Chain

**User Story:** As a user, I want previously translated strings to load instantly from cache regardless of which provider originally translated them, so that I experience no delay when switching back to a previously used language.

#### Acceptance Criteria

1. WHEN `translateBatch` is called, THE Translation_Service SHALL check the Translation_Cache before invoking any provider in the chain.
2. WHEN a provider successfully resolves a translation, THE Translation_Service SHALL store the result in the Translation_Cache keyed by `(locale, sourceText)`.
3. WHEN the user switches to a Locale with fully cached translations, THE Translation_Service SHALL return all cached strings without invoking any provider.
4. WHEN the user switches to a Locale with partial cache coverage, THE Translation_Service SHALL invoke the Provider_Chain only for uncached strings and merge cached and newly resolved strings into the result.
5. FOR ALL Source_Text values, storing a translation in the Translation_Cache and retrieving it with the same `(locale, sourceText)` key SHALL return the identical translated string (cache round-trip property).

### Requirement 6: Placeholder and Currency Preservation

**User Story:** As a user, I want translated messages to keep correct currency values and dynamic content, so that prices and personalised details remain accurate after translation.

#### Acceptance Criteria

1. WHEN translating a Source_Text containing Placeholder_Tokens, THE Translation_Service SHALL preserve all `{{key}}` tokens verbatim in the translated output.
2. WHEN translating a Source_Text containing Currency_Values, THE Translation_Service SHALL preserve the currency symbol and numeric value unchanged in the translated output.
3. FOR ALL Source_Texts containing Placeholder_Tokens, translating from English to any supported Locale SHALL produce output containing the same set of Placeholder_Tokens as the Source_Text (round-trip token preservation property).
4. IF a resolved translation is missing one or more Placeholder_Tokens present in the Source_Text, THEN THE Translation_Service SHALL discard the translation, use the original Source_Text as fallback, and log a warning identifying the missing tokens.

### Requirement 7: Static Bundle Generation Utility

**User Story:** As a developer, I want a script that extracts all translatable strings from the codebase and generates locale JSON skeleton files, so that I can populate bundles without manually tracking every string.

#### Acceptance Criteria

1. THE bundle generation utility SHALL scan all `t()` call sites in the `src/` directory and extract the Source_Text string arguments.
2. THE bundle generation utility SHALL output one JSON file per non-English Locale at `src/translation/locales/{locale}.json` with Source_Text keys and empty string values for any new keys not already present.
3. WHEN a locale JSON file already exists, THE bundle generation utility SHALL preserve existing translated values and only add new keys with empty string values.
4. THE bundle generation utility SHALL be executable via an npm script (e.g., `npm run extract-translations`).

### Requirement 8: English Locale Pass-Through

**User Story:** As a user browsing in English, I want the app to return source text immediately without invoking any provider or network call, so that the English experience has zero translation overhead.

#### Acceptance Criteria

1. WHILE the active Locale is `"en"`, THE Translation_Service SHALL return all Source_Texts unchanged without invoking any Translation_Provider.
2. WHILE the active Locale is `"en"`, THE Translation_Context `t()` function SHALL return the Source_Text unchanged without calling `translateBatch`.
3. WHILE the active Locale is `"en"`, THE Translation_Service SHALL not write any entries to the Translation_Cache.

### Requirement 9: Backward Compatibility

**User Story:** As a developer, I want the new provider-based TranslationService to maintain the same public API, so that TranslationContext, LanguageSelector, and all consuming components require no changes.

#### Acceptance Criteria

1. THE Translation_Service SHALL continue to expose the `translateBatch(request: TranslationRequest): Promise<TranslationResponse>` method with the same input and output contracts.
2. THE Translation_Service SHALL continue to expose the `clearCache(): void` method.
3. THE Translation_Context, Language_Selector, and all PIE components that call `t()` SHALL require no code changes to work with the new provider-based Translation_Service.
4. FOR ALL valid TranslationRequest inputs, the `translations` output array length SHALL equal the `sourceTexts` input array length (serialisation contract preserved).

### Requirement 10: Provider Health Logging and Diagnostics

**User Story:** As a developer, I want structured logging from the provider chain, so that I can diagnose translation failures and monitor bundle coverage in development.

#### Acceptance Criteria

1. WHEN a Translation_Provider returns `null` for one or more strings, THE Translation_Service SHALL log a structured warning including the provider name, target Locale, and count of unresolved strings.
2. WHEN all providers in the chain fail to resolve a string, THE Translation_Service SHALL log a structured warning including the Source_Text and target Locale.
3. WHEN `translateBatch` completes, THE Translation_Service SHALL log a structured info message summarising: total strings requested, cache hits, strings resolved per provider, and strings that fell back to Source_Text.
4. IF a Translation_Provider throws an unexpected error, THEN THE Translation_Service SHALL catch the error, log a structured error with the provider name and error details, and continue to the next provider in the chain.
