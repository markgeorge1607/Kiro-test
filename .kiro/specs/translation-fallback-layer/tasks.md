# Tasks: Translation Fallback Layer

## Task 1: Create TranslationProvider interface and StaticBundleProvider

- [x] 1.1 Create `src/translation/TranslationProvider.ts` with the `TranslationProvider` interface defining `name: string` and `translate(sourceTexts: string[], targetLocale: string): Promise<(string | null)[]>`
- [x] 1.2 Create `src/translation/StaticBundleProvider.ts` implementing `TranslationProvider` — constructor accepts `Record<string, LocaleBundle>`, `translate()` looks up each source text in the locale bundle and returns the value or `null`
- [x] 1.3 Create skeleton locale JSON files: `src/translation/locales/de.json`, `es.json`, `fr.json`, `nl.json` with a few sample key-value pairs for testing
- [x] 1.4 Write unit tests for StaticBundleProvider in `src/translation/StaticBundleProvider.test.ts`: returns translations for present keys, returns null for missing keys, returns null for missing locale, handles empty input array, handles empty bundle
- [x] 1.5 Write property-based test: Static bundle lookup correctness (Property 2) — for any generated bundle and source text array, present keys return their value and absent keys return null

## Task 2: Create RuntimeTranslationProvider

- [x] 2.1 Create `src/translation/RuntimeTranslationProvider.ts` implementing `TranslationProvider` — constructor accepts `RuntimeProviderConfig`, `translate()` shields placeholders, calls external API, unshields, validates placeholder preservation, returns null on failure
- [x] 2.2 Write unit tests for RuntimeTranslationProvider in `src/translation/RuntimeTranslationProvider.test.ts`: successful API call returns translations, API timeout returns nulls, API HTTP error returns nulls, placeholder shielding/unshielding works, missing placeholder validation returns null, handles empty input array
- [x] 2.3 Write property-based test: Placeholder and currency token preservation (Property 7) — for any source text with `{{key}}` tokens and currency values, the round-trip through shield → mock translate → unshield preserves all tokens

## Task 3: Refactor TranslationService to use provider chain

- [x] 3.1 Update `TranslationServiceConfig` in `src/translation/TranslationService.ts` to accept `providers: TranslationProvider[]` instead of `apiKey`/`modelName` — remove Gemini API logic, implement provider chain orchestration (cache check → iterate providers → fallback to source text)
- [x] 3.2 Add structured logging to TranslationService: log summary after each `translateBatch` (cache hits, per-provider resolved counts, fallback count), log warnings when providers return nulls or throw errors
- [x] 3.3 Write unit tests for refactored TranslationService in `src/translation/TranslationService.test.ts`: cache checked before providers, chain cascading (unresolved strings forwarded to next provider), fallback to source text, English locale pass-through, provider error caught and chain continues, clearCache works, logging output
- [ ] 3.4 Write property-based tests for TranslationService:
  - [x] 3.4.1 Output length invariant (Property 1) — for any source text array and locale, output length equals input length
  - [x] 3.4.2 Provider chain cascading (Property 3) — for any first-provider null pattern, second provider receives exactly the null strings
  - [x] 3.4.3 Unresolved strings fall back to source text (Property 4) — when all providers return null, output equals source texts
  - [x] 3.4.4 Cache integration with provider chain (Property 6) — partially cached strings skip providers; newly resolved strings are cached
  - [x] 3.4.5 English locale pass-through (Property 8) — for any source texts with locale "en", output equals input, zero provider calls, zero cache writes
  - [x] 3.4.6 Provider error resilience (Property 10) — when a provider throws, chain continues to next provider

## Task 4: Create factory function and update TranslationContext wiring

- [x] 4.1 Create `src/translation/createTranslationService.ts` — factory that imports static locale bundles, reads `VITE_TRANSLATION_API_ENDPOINT` and `VITE_TRANSLATION_API_KEY` env vars, constructs StaticBundleProvider (always) and RuntimeTranslationProvider (only if API key set), returns a configured TranslationService
- [x] 4.2 Update `src/App.tsx` (or wherever TranslationService is instantiated) to use `createTranslationService()` instead of directly constructing TranslationService with Gemini config
- [x] 4.3 Update `.env.example` with new environment variables: `VITE_TRANSLATION_API_ENDPOINT`, `VITE_TRANSLATION_API_KEY` (replacing `VITE_GEMINI_API_KEY`)
- [x] 4.4 Verify backward compatibility: run existing TranslationContext, TranslationCache, PlaceholderShielder, and translateDirectiveProps tests — all must pass without modification

## Task 5: Cache round-trip property test

- [x] 5.1 Write property-based test: Cache round-trip (Property 5) — for any (locale, sourceText, translation) triple, storing and retrieving from TranslationCache returns the identical string. Add to `src/translation/TranslationCache.test.ts`

## Task 6: Static bundle generation utility

- [x] 6.1 Create `scripts/extract-translations.ts` — scans `src/**/*.ts` and `src/**/*.tsx` for `t('...')` and `t("...")` call patterns, extracts source text arguments
- [x] 6.2 Implement locale JSON merge logic: read existing locale files, preserve existing translated values, add new keys with empty string values, write sorted JSON output
- [x] 6.3 Add `"extract-translations": "npx tsx scripts/extract-translations.ts"` to `package.json` scripts
- [x] 6.4 Write unit tests for the extraction and merge logic in `scripts/extract-translations.test.ts`
- [x] 6.5 Write property-based test: Bundle merge preserves existing translations (Property 9) — for any existing bundle and new key set, existing values are preserved and new keys get empty strings
