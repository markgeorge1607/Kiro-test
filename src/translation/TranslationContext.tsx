/**
 * TranslationContext — React context provider for locale management
 * and translated string lookup via the `t()` function.
 *
 * This is the only React file in the translation feature.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { Locale } from '../types';
import { TranslationService } from './TranslationService';

// ── Context shape ────────────────────────────────────────────────────

export interface TranslationContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (sourceText: string) => string;
  isTranslating: boolean;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────

export function TranslationProvider({
  children,
  service,
}: {
  children: React.ReactNode;
  service?: TranslationService;
}) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState<Map<string, string>>(
    () => new Map(),
  );

  // Track all source strings that have been registered via t() calls
  const registeredStrings = useRef<Set<string>>(new Set());
  const serviceRef = useRef(service);
  serviceRef.current = service;

  // Debounce timer for batching newly discovered strings
  const pendingFlushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether a translation batch is currently in-flight
  const inflightRef = useRef(false);
  // Tracks the locale that was active when the current batch was sent
  const inflightLocaleRef = useRef<Locale>('en');

  /**
   * Flush: collect all registered strings that are missing from the
   * current translations map and send them to the TranslationService.
   * Merges results into the existing translations (additive, never
   * replaces already-translated strings).
   */
  const flush = useCallback(async (targetLocale: Locale) => {
    const svc = serviceRef.current;
    if (!svc || targetLocale === 'en') return;

    // Collect only strings that don't have a translation yet
    const allStrings = Array.from(registeredStrings.current);
    // We read the latest translations from the ref-backed state via
    // a functional update later, but for the API call we need to know
    // which strings to request. We'll let the TranslationService cache
    // handle dedup — send all registered strings and the service will
    // only call Gemini for uncached ones.
    if (allStrings.length === 0) return;

    inflightRef.current = true;
    inflightLocaleRef.current = targetLocale;
    setIsTranslating(true);

    try {
      const response = await svc.translateBatch({
        sourceTexts: allStrings,
        targetLocale,
      });

      // Only apply results if the locale hasn't changed while we were waiting
      if (inflightLocaleRef.current === targetLocale) {
        setTranslations((prev) => {
          const merged = new Map(prev);
          for (let i = 0; i < allStrings.length; i++) {
            merged.set(allStrings[i], response.translations[i]);
          }
          return merged;
        });
      }
    } catch {
      // Graceful fallback — translations map stays as-is,
      // t() will return source text for missing entries
    } finally {
      inflightRef.current = false;
      setIsTranslating(false);

      // After the batch completes, check if new strings were registered
      // while we were in-flight. If so, schedule another flush.
      if (inflightLocaleRef.current === targetLocale) {
        const currentStrings = Array.from(registeredStrings.current);
        // Use functional read of translations to check for gaps
        setTranslations((prev) => {
          const missing = currentStrings.filter((s) => !prev.has(s));
          if (missing.length > 0) {
            // Schedule a follow-up flush for newly discovered strings
            scheduleFlush(targetLocale);
          }
          return prev; // no change
        });
      }
    }
  }, []);

  const scheduleFlush = useCallback(
    (targetLocale: Locale) => {
      if (pendingFlushTimer.current) {
        clearTimeout(pendingFlushTimer.current);
      }
      // Small delay to batch multiple t() registrations from a single render
      pendingFlushTimer.current = setTimeout(() => {
        pendingFlushTimer.current = null;
        if (!inflightRef.current) {
          flush(targetLocale);
        }
      }, 50);
    },
    [flush],
  );

  // When locale changes, clear translations and trigger a fresh flush
  useEffect(() => {
    if (locale === 'en') {
      setTranslations(new Map());
      setIsTranslating(false);
      return;
    }

    // Clear existing translations so we start fresh for the new locale
    setTranslations(new Map());
    // Schedule a flush after a micro-delay so that the current render
    // cycle's t() calls have time to register their strings.
    const timer = setTimeout(() => {
      flush(locale);
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [locale, flush]);

  // Cleanup pending timers on unmount
  useEffect(() => {
    return () => {
      if (pendingFlushTimer.current) {
        clearTimeout(pendingFlushTimer.current);
      }
    };
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  const t = useCallback(
    (sourceText: string): string => {
      // Register the string for translation
      const isNew = !registeredStrings.current.has(sourceText);
      if (isNew) {
        registeredStrings.current.add(sourceText);
      }

      // English locale — return source text unchanged
      if (locale === 'en') {
        return sourceText;
      }

      // If this is a newly discovered string without a translation,
      // schedule a flush to pick it up (debounced).
      if (isNew && !translations.has(sourceText)) {
        scheduleFlush(locale);
      }

      // Return cached translation if available, otherwise fallback to source
      return translations.get(sourceText) ?? sourceText;
    },
    [locale, translations, scheduleFlush],
  );

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t, isTranslating }}>
      {children}
    </TranslationContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useTranslation(): TranslationContextValue {
  const ctx = useContext(TranslationContext);
  if (ctx === null) {
    throw new Error(
      'useTranslation must be used within a <TranslationProvider>',
    );
  }
  return ctx;
}
