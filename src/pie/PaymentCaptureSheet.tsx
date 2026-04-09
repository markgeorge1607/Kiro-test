import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PIEComponentProps, SavedCard, PaymentMethod } from '../types';

// ── Figma asset URLs ─────────────────────────────────────────────────
const imgMastercard = 'https://www.figma.com/api/mcp/asset/d88eca9a-1932-4b9c-be39-2da09e0d3f2f';
const imgAmex = 'https://www.figma.com/api/mcp/asset/08409ea0-607d-4dcb-bfce-401d04748085';
const imgInfoIcon = 'https://www.figma.com/api/mcp/asset/29262134-58be-40fa-9555-3f056d217468';

// ── Style constants (PIE Design System) ──────────────────────────────
const font = "'JET Sans Digital', Arial, sans-serif";
const colorDefault = '#242e30';
const colorSubdued = '#3c4c4f';
const colorContentDefault = '#2a3846';
const colorBrand = '#f36805';
const colorBorderForm = '#8a8786';
const colorInfoBg = '#ebf6fa';
const colorDivider = 'rgba(0,0,0,0.08)';

const bodyFont = "'Takeaway Sans', 'JET Sans Digital', Arial, sans-serif";

const brandLabels: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
};

// ── Card validation utilities ─────────────────────────────────────────

export function computeLuhnCheckDigit(digits: string): number {
  let sum = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    const pos = digits.length - i;
    let d = Number(digits[i]);
    if (pos % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

export function isCardNumberValid(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    const pos = digits.length - i;
    let d = Number(digits[i]);
    if (pos % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

export function isExpiryValid(month: number, year: number): boolean {
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

export function isCvvValid(cvv: string, brand?: string): boolean {
  const expectedLength = brand === 'amex' ? 4 : 3;
  return new RegExp(`^\\d{${expectedLength}}$`).test(cvv);
}

export function isCardholderNameValid(name: string): boolean {
  return name.trim().length > 0;
}

// ── Card conversion utilities ─────────────────────────────────────────

export function detectCardBrand(cardNumber: string): SavedCard['brand'] {
  const digits = cardNumber.replace(/\s/g, '');
  if (digits.startsWith('34') || digits.startsWith('37')) return 'amex';
  if (/^5[1-5]/.test(digits)) return 'mastercard';
  if (digits.startsWith('4')) return 'visa';
  return 'visa'; // default fallback
}

export function cardEntryToSavedCard(
  cardNumber: string,
  expiryMonth: number,
  expiryYear: number,
  idGenerator?: () => string,
): SavedCard {
  const digits = cardNumber.replace(/\s/g, '');
  return {
    id: (idGenerator ?? (() => crypto.randomUUID()))(),
    brand: detectCardBrand(digits),
    lastFour: digits.slice(-4),
    expiryMonth,
    expiryYear,
  };
}

// ── Shared input style ───────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  fontSize: 16,
  fontFamily: font,
  color: colorDefault,
  border: `1px solid ${colorBorderForm}`,
  borderRadius: 12,
  outline: 'none',
  boxSizing: 'border-box',
  lineHeight: '24px',
};

// ── Sub-components ───────────────────────────────────────────────────

const ChevronLeftIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M12.5 15L7.5 10L12.5 5" stroke={colorDefault} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5V19M5 12H19" stroke={colorDefault} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RadioIndicator: React.FC<{ selected: boolean }> = ({ selected }) => (
  <div
    role="radio"
    aria-checked={selected}
    style={{
      width: 24,
      height: 24,
      borderRadius: '50%',
      border: `2px solid ${selected ? colorBrand : colorBorderForm}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      transition: 'border-color 150ms ease',
    }}
  >
    {selected && (
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: colorBrand,
        }}
      />
    )}
  </div>
);

const PaymentBrandIcon: React.FC<{ brand: string }> = ({ brand }) => {
  const isAmex = brand === 'amex';
  return (
    <div style={{
      position: 'relative', width: 34, height: 24,
      background: isAmex ? '#1f72cd' : 'white',
      border: isAmex ? 'none' : '1px solid #d9d9d9',
      borderRadius: 4,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {brand === 'mastercard' && (
        <img alt="Mastercard" src={imgMastercard} style={{ width: '66%', height: '56%', objectFit: 'contain' }} />
      )}
      {isAmex && (
        <img alt="Amex" src={imgAmex} style={{ width: '83%', height: '30%', objectFit: 'contain' }} />
      )}
    </div>
  );
};

type SheetView = 'available-cards' | 'add-card';

/**
 * PaymentCaptureSheet PIE component.
 *
 * Two-view bottom sheet:
 * 1. "Available Cards" — shows saved cards with radio selection + "Add Credit card" CTA
 * 2. "Add Card" — new card entry form with back navigation
 *
 * "Start free trial" on Available Cards confirms with a saved card.
 * "Add card" on the Add Card view saves the new card and returns to Available Cards.
 * Both views can dismiss via Cancel or backdrop tap.
 *
 * Registered as componentType: "payment-capture-sheet"
 */
const PaymentCaptureSheet: React.FC<PIEComponentProps> = ({ directive, onInteraction }) => {
  const [localSavedCards, setLocalSavedCards] = useState<SavedCard[]>(
    Array.isArray(directive.props.savedCards) ? directive.props.savedCards as SavedCard[] : []
  );

  const [view, setView] = useState<SheetView>(localSavedCards.length > 0 ? 'available-cards' : 'add-card');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    localSavedCards.length > 0 ? localSavedCards[0].id : null,
  );
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const dismissedRef = useRef(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    onInteraction?.({
      componentType: 'payment-capture-sheet',
      action: 'dismissed',
    });
    try { previousFocusRef.current?.focus(); } catch { /* noop */ }
  }, [onInteraction]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    try { sheetRef.current?.focus(); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dismiss]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = sheet.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  const isNewCardFormValid =
    isCardNumberValid(cardNumber)
    && expiryDate.length >= 4
    && isCvvValid(cvv)
    && isCardholderNameValid(cardholderName);

  const handleStartFreeTrial = () => {
    if (!selectedCardId) return;
    const paymentMethod: PaymentMethod = { type: 'saved-card', cardId: selectedCardId };
    onInteraction?.({
      componentType: 'payment-capture-sheet',
      action: 'payment-confirmed',
      payload: { paymentMethod },
    });
  };

  const handleAddCard = () => {
    if (!isNewCardFormValid) return;
    const parts = expiryDate.replace(/\s/g, '').split('/');
    const month = Number(parts[0]);
    const year = parts[1]?.length === 2 ? 2000 + Number(parts[1]) : Number(parts[1]);
    const newCard = cardEntryToSavedCard(cardNumber, month, year);
    setLocalSavedCards(prev => [...prev, newCard]);
    setSelectedCardId(newCard.id);
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName('');
    setView('available-cards');
  };

  if (dismissedRef.current) return null;

  const sheetStyle: React.CSSProperties = {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    zIndex: 1000,
    background: 'white',
    borderRadius: '16px 16px 0 0',
    fontFamily: font,
    maxWidth: 480, margin: '0 auto',
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0px -3px 6px 0px rgba(0,0,0,0.06), 0px -2px 12px -2px rgba(0,0,0,0.08), 0px -4px 6px 0px rgba(0,0,0,0.02)',
    animation: 'pcs-slide-up 0.3s ease-out',
  };

  return (
    <>
      <style>{`
        @keyframes pcs-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pcs-sheet { animation: none !important; }
        }
      `}</style>

      <div
        data-testid="pcs-backdrop"
        onClick={dismiss}
        role="presentation"
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
      />

      <div
        ref={sheetRef}
        className="pcs-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={view === 'available-cards' ? 'Credit cards' : 'Add Credit card'}
        tabIndex={-1}
        data-testid="payment-capture-sheet"
        style={sheetStyle}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <div style={{ width: 32, height: 4, borderRadius: 100, background: '#efedea' }} />
        </div>

        {view === 'available-cards' ? (
          <AvailableCardsView
            savedCards={localSavedCards}
            selectedCardId={selectedCardId}
            onSelectCard={setSelectedCardId}
            onAddCard={() => setView('add-card')}
            onCancel={dismiss}
            onStartFreeTrial={handleStartFreeTrial}
          />
        ) : (
          <AddCardView
            showBackButton={localSavedCards.length > 0}
            onBack={() => setView('available-cards')}
            cardNumber={cardNumber}
            onCardNumberChange={setCardNumber}
            expiryDate={expiryDate}
            onExpiryDateChange={setExpiryDate}
            cvv={cvv}
            onCvvChange={setCvv}
            cardholderName={cardholderName}
            onCardholderNameChange={setCardholderName}
            isValid={isNewCardFormValid}
            onCancel={dismiss}
            onAddCard={handleAddCard}
          />
        )}
      </div>
    </>
  );
};

// ── Available Cards View ─────────────────────────────────────────────

interface AvailableCardsViewProps {
  savedCards: SavedCard[];
  selectedCardId: string | null;
  onSelectCard: (id: string) => void;
  onAddCard: () => void;
  onCancel: () => void;
  onStartFreeTrial: () => void;
}

const AvailableCardsView: React.FC<AvailableCardsViewProps> = ({
  savedCards, selectedCardId, onSelectCard, onAddCard, onCancel, onStartFreeTrial,
}) => (
  <>
    {/* Header */}
    <div style={{ padding: '8px 16px 8px 16px' }}>
      <h2
        data-testid="pcs-title"
        style={{
          margin: 0, fontSize: 20, fontWeight: 800,
          lineHeight: '28px', color: colorDefault, fontFamily: font,
        }}
      >
        Credit cards
      </h2>
    </div>

    {/* Scrollable content */}
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Info notification */}
      <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center' }}>
        <div
          data-testid="pcs-info-notification"
          style={{
            background: colorInfoBg,
            borderRadius: 12,
            padding: 16,
            display: 'flex', gap: 16, alignItems: 'flex-start',
            margin: '0 12px',
            width: 'calc(100% - 24px)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ width: 24, height: 24, flexShrink: 0, position: 'relative' }}>
            <img alt="" src={imgInfoIcon} style={{ position: 'absolute', inset: '6.25% 14.58% 8.33% 14.58%', width: '71%', height: '85%' }} />
          </div>
          <p style={{
            margin: 0, fontSize: 16, fontWeight: 400,
            lineHeight: '24px', color: colorDefault, fontFamily: bodyFont,
            flex: 1,
          }}>
            Your details are securely stored with our payment processing partner using bank-grade encryption
          </p>
        </div>
      </div>

      {/* Card list */}
      {savedCards.map((card, index) => (
        <div key={card.id}>
          <button
            type="button"
            data-testid={`pcs-saved-card-${card.id}`}
            onClick={() => onSelectCard(card.id)}
            style={{
              display: 'flex', gap: 16, alignItems: 'flex-start',
              padding: '14px 16px 13px',
              width: '100%',
              background: 'white',
              border: 'none',
              cursor: 'pointer',
              fontFamily: font,
              textAlign: 'left',
            }}
          >
            <PaymentBrandIcon brand={card.brand} />
            <div style={{ flex: 1, display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <p style={{
                  margin: 0, fontSize: 16, fontWeight: 400,
                  lineHeight: '24px', color: colorContentDefault, fontFamily: bodyFont,
                }}>
                  {brandLabels[card.brand] ?? card.brand}
                </p>
                <p style={{
                  margin: 0, fontSize: 16, fontWeight: 400,
                  lineHeight: '24px', color: colorSubdued, fontFamily: bodyFont,
                }}>
                  Ending {card.lastFour}
                </p>
              </div>
              <RadioIndicator selected={selectedCardId === card.id} />
            </div>
          </button>
          {index < savedCards.length - 1 && (
            <div style={{ paddingLeft: 56 }}>
              <div style={{ height: 1, background: colorDivider }} />
            </div>
          )}
        </div>
      ))}

      {savedCards.length > 0 && (
        <div style={{ paddingLeft: 56 }}>
          <div style={{ height: 1, background: colorDivider }} />
        </div>
      )}

      {/* Add Credit card button */}
      <div style={{ padding: '12px 0' }}>
        <button
          type="button"
          data-testid="pcs-add-card-button"
          onClick={onAddCard}
          style={{
            display: 'flex', gap: 8, alignItems: 'center',
            padding: '8px 16px',
            width: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: font,
          }}
        >
          <PlusIcon />
          <span style={{
            fontSize: 19, fontWeight: 700,
            lineHeight: '24px', color: colorDefault, fontFamily: font,
            fontStyle: 'italic',
          }}>
            Add Credit card
          </span>
        </button>
      </div>

      {/* Terms and conditions */}
      <div style={{ padding: '8px 16px 16px' }}>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 400,
          lineHeight: '16px', color: colorDefault, fontFamily: font,
        }}>
          You can cancel Just Eat+ anytime. By joining, you agree to the{' '}
          <span style={{ textDecoration: 'underline' }}>Just Eat+ terms</span>
          , a free trial, and £1.99/month after. Cancel 48 hours before the trial ends to avoid charges.
        </p>
      </div>
    </div>

    {/* Divider */}
    <div style={{ height: 1, background: colorDivider }} />

    {/* CTA row */}
    <div style={{
      display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'flex-end',
      padding: 16,
    }}>
      <button
        type="button"
        data-testid="pcs-cancel-button"
        onClick={onCancel}
        style={{
          background: 'transparent', border: 'none', borderRadius: 800,
          padding: '8px 16px', cursor: 'pointer', fontFamily: font,
          fontSize: 19, fontWeight: 700, lineHeight: '24px', color: colorDefault,
          fontStyle: 'italic',
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        data-testid="pcs-confirm-button"
        disabled={!selectedCardId}
        onClick={onStartFreeTrial}
        style={{
          background: selectedCardId ? colorBrand : '#c4c8c9',
          border: 'none', borderRadius: 800,
          padding: '10px 24px', cursor: selectedCardId ? 'pointer' : 'not-allowed',
          fontFamily: font,
          fontSize: 20, fontWeight: 700, lineHeight: '28px', color: 'white',
          opacity: selectedCardId ? 1 : 0.6,
          fontStyle: 'italic',
        }}
      >
        Start free trial
      </button>
    </div>
  </>
);

// ── Add Card View ────────────────────────────────────────────────────

interface AddCardViewProps {
  showBackButton: boolean;
  onBack: () => void;
  cardNumber: string;
  onCardNumberChange: (v: string) => void;
  expiryDate: string;
  onExpiryDateChange: (v: string) => void;
  cvv: string;
  onCvvChange: (v: string) => void;
  cardholderName: string;
  onCardholderNameChange: (v: string) => void;
  isValid: boolean;
  onCancel: () => void;
  onAddCard: () => void;
}

const AddCardView: React.FC<AddCardViewProps> = ({
  showBackButton, onBack,
  cardNumber, onCardNumberChange,
  expiryDate, onExpiryDateChange,
  cvv, onCvvChange,
  cardholderName, onCardholderNameChange,
  isValid, onCancel, onAddCard,
}) => (
  <>
    {/* Header with back button */}
    <div style={{ padding: '8px 16px 8px 16px' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {showBackButton && (
          <button
            type="button"
            data-testid="pcs-back-button"
            onClick={onBack}
            aria-label="Back to available cards"
            style={{
              display: 'flex', alignItems: 'center',
              padding: 10,
              background: 'transparent', border: 'none',
              cursor: 'pointer',
            }}
          >
            <ChevronLeftIcon />
          </button>
        )}
        <h2
          data-testid="pcs-title"
          style={{
            margin: 0, fontSize: 20, fontWeight: 800,
            lineHeight: '28px', color: colorDefault, fontFamily: font,
          }}
        >
          Add Credit card
        </h2>
      </div>
    </div>

    {/* Form fields */}
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label
          htmlFor="pcs-card-number"
          style={{ fontSize: 14, fontWeight: 700, lineHeight: '20px', color: colorDefault, fontFamily: bodyFont, display: 'block' }}
        >
          Cardnumber
        </label>
        <div style={{ height: 4 }} />
        <input
          id="pcs-card-number"
          data-testid="pcs-card-number"
          type="text"
          inputMode="numeric"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={(e) => onCardNumberChange(e.target.value)}
          aria-label="Card number"
          autoComplete="cc-number"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="pcs-expiry-date"
            style={{ fontSize: 14, fontWeight: 700, lineHeight: '20px', color: colorDefault, fontFamily: bodyFont, display: 'block' }}
          >
            Expiration date
          </label>
          <div style={{ height: 4 }} />
          <input
            id="pcs-expiry-date"
            data-testid="pcs-expiry-date"
            type="text"
            inputMode="numeric"
            placeholder="MM/YY"
            value={expiryDate}
            onChange={(e) => onExpiryDateChange(e.target.value)}
            aria-label="Expiration date"
            autoComplete="cc-exp"
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="pcs-cvv"
            style={{ fontSize: 14, fontWeight: 700, lineHeight: '20px', color: colorDefault, fontFamily: bodyFont, display: 'block' }}
          >
            CVC / CVV
          </label>
          <div style={{ height: 4 }} />
          <input
            id="pcs-cvv"
            data-testid="pcs-cvv"
            type="text"
            inputMode="numeric"
            placeholder="123"
            maxLength={4}
            value={cvv}
            onChange={(e) => onCvvChange(e.target.value)}
            aria-label="CVV"
            autoComplete="cc-csc"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="pcs-cardholder-name"
          style={{ fontSize: 14, fontWeight: 700, lineHeight: '20px', color: colorDefault, fontFamily: bodyFont, display: 'block' }}
        >
          Cardholder name
        </label>
        <div style={{ height: 4 }} />
        <input
          id="pcs-cardholder-name"
          data-testid="pcs-cardholder-name"
          type="text"
          placeholder="Name on card"
          value={cardholderName}
          onChange={(e) => onCardholderNameChange(e.target.value)}
          aria-label="Cardholder name"
          autoComplete="cc-name"
          style={inputStyle}
        />
      </div>
    </div>

    {/* CTA row */}
    <div style={{
      display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'flex-end',
      padding: 16,
    }}>
      <button
        type="button"
        data-testid="pcs-cancel-button"
        onClick={onCancel}
        style={{
          background: 'transparent', border: 'none', borderRadius: 800,
          padding: '8px 16px', cursor: 'pointer', fontFamily: font,
          fontSize: 19, fontWeight: 700, lineHeight: '24px', color: colorDefault,
          fontStyle: 'italic',
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        data-testid="pcs-add-card-submit"
        disabled={!isValid}
        onClick={onAddCard}
        style={{
          background: isValid ? colorBrand : '#c4c8c9',
          border: 'none', borderRadius: 800,
          padding: '10px 24px', cursor: isValid ? 'pointer' : 'not-allowed',
          fontFamily: font,
          fontSize: 20, fontWeight: 700, lineHeight: '28px', color: 'white',
          opacity: isValid ? 1 : 0.6,
          fontStyle: 'italic',
        }}
      >
        Add card
      </button>
    </div>
  </>
);

export default PaymentCaptureSheet;
