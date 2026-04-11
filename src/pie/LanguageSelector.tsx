import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Locale } from '../types';

// ── Locale data ──────────────────────────────────────────────────────

const LOCALE_DATA: Array<{ locale: Locale; flag: string; name: string }> = [
  { locale: 'en', flag: '🇬🇧', name: 'English' },
  { locale: 'de', flag: '🇩🇪', name: 'German' },
  { locale: 'es', flag: '🇪🇸', name: 'Spanish' },
  { locale: 'fr', flag: '🇫🇷', name: 'French' },
  { locale: 'nl', flag: '🇳🇱', name: 'Dutch' },
];

// ── Style constants (matching MenuPage conventions) ──────────────────

const bodyFont = "'Takeaway Sans', 'JET Sans Digital', Arial, sans-serif";
const colorDefault = '#242e30';
const colorSubtle = '#f5f3f1';
const colorBorder = '#dbd9d7';
const colorFocusRing = '#0056b3';

// ── Props ────────────────────────────────────────────────────────────

interface LanguageSelectorProps {
  locale: Locale;
  isTranslating: boolean;
  onLocaleChange: (locale: Locale) => void;
}

// ── Component ────────────────────────────────────────────────────────

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  locale,
  isTranslating,
  onLocaleChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus the active (or first) item when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const activeIndex = LOCALE_DATA.findIndex((l) => l.locale === locale);
      const idx = activeIndex >= 0 ? activeIndex : 0;
      setFocusedIndex(idx);
      // Defer focus so the DOM has rendered the dropdown
      requestAnimationFrame(() => {
        optionRefs.current[idx]?.focus();
      });
    }
  }, [isOpen, locale]);

  const activeLocale = LOCALE_DATA.find((l) => l.locale === locale) ?? LOCALE_DATA[0];

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = useCallback(
    (selected: Locale) => {
      const selectedData = LOCALE_DATA.find((l) => l.locale === selected);
      onLocaleChange(selected);
      setIsOpen(false);
      setFocusedIndex(-1);
      triggerRef.current?.focus();
      if (selectedData) {
        setAnnouncement(`Language changed to ${selectedData.name}`);
      }
    },
    [onLocaleChange],
  );

  const handleDropdownKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          const nextIndex = focusedIndex < LOCALE_DATA.length - 1 ? focusedIndex + 1 : 0;
          setFocusedIndex(nextIndex);
          optionRefs.current[nextIndex]?.focus();
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : LOCALE_DATA.length - 1;
          setFocusedIndex(prevIndex);
          optionRefs.current[prevIndex]?.focus();
          break;
        }
        case 'Enter': {
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < LOCALE_DATA.length) {
            handleSelect(LOCALE_DATA[focusedIndex].locale);
          }
          break;
        }
        case 'Escape': {
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          triggerRef.current?.focus();
          break;
        }
      }
    },
    [focusedIndex, handleSelect],
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Flag icon trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select language"
        style={{
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          position: 'relative',
          fontSize: 20,
          lineHeight: 1,
        }}
      >
        <span
          role="img"
          aria-label={activeLocale.name}
          style={{ fontSize: 20, lineHeight: 1 }}
        >
          {activeLocale.flag}
        </span>

        {/* Loading spinner overlay */}
        {isTranslating && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '50%',
            }}
          >
            <div
              className="lang-spinner"
              style={{
                width: 14,
                height: 14,
                border: '2px solid ' + colorBorder,
                borderTopColor: colorDefault,
                borderRadius: '50%',
                animation: 'lang-spinner 0.6s linear infinite',
              }}
            />
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          role="listbox"
          aria-label="Select language"
          onKeyDown={handleDropdownKeyDown}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 1000,
            background: '#ffffff',
            borderRadius: 12, // PIE rounded-c
            padding: 8, // PIE spacing-c
            boxShadow: '0px 4px 12px rgba(0,0,0,0.12)', // PIE elevation below-20
            minWidth: 160,
          }}
        >
          {LOCALE_DATA.map((item, index) => {
            const isActive = item.locale === locale;
            const isFocused = index === focusedIndex;
            return (
              <div
                key={item.locale}
                ref={(el) => { optionRefs.current[index] = el; }}
                role="option"
                aria-selected={isActive}
                tabIndex={isFocused ? 0 : -1}
                onClick={() => handleSelect(item.locale)}
                onKeyDown={(e) => {
                  // Let the parent handler deal with navigation keys
                  // but handle Enter/Space directly on the option too
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(item.locale);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 8px',
                  border: 'none',
                  borderRadius: 8,
                  background: isActive ? colorSubtle : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  outline: isFocused ? `2px solid ${colorFocusRing}` : 'none',
                  outlineOffset: -2,
                }}
              >
                <span
                  role="img"
                  aria-label={item.name}
                  style={{
                    fontSize: 20,
                    lineHeight: 1,
                    width: 20,
                    height: 20,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.flag}
                </span>
                <span
                  style={{
                    fontFamily: bodyFont,
                    fontWeight: 400,
                    fontSize: 14,
                    color: colorDefault,
                    lineHeight: '20px',
                  }}
                >
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* aria-live region for locale change announcements */}
      <div
        aria-live="polite"
        role="status"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {announcement}
      </div>

      {/* Spinner keyframes + prefers-reduced-motion */}
      <style>{`
        @keyframes lang-spinner {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lang-spinner {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;
