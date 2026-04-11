import React, { useEffect, useState, useCallback } from 'react';
import type { BasketItem, NudgeEvent, PIEInteractionEvent } from '../types';
import { useBasket } from '../state/BasketContext';
import { CheckoutNudgeController } from '../checkout/CheckoutNudgeController';
import { OfferNudgeController } from '../checkout/OfferNudgeController';
import {
  registerComponent,
  render as pieRender,
  clearRegistry,
} from '../pie/PIERenderer';
import SavingsBadge from '../pie/SavingsBadge';
import QuickToggle from '../pie/QuickToggle';
import ConfettiAnimation from '../pie/ConfettiAnimation';
import ArchetypeToggle from '../pie/ArchetypeToggle';
import CelebrationBottomSheet from '../pie/CelebrationBottomSheet';
import NudgeBottomSheet from '../pie/NudgeBottomSheet';
import OffersPillStrip from '../pie/OffersPillStrip';
import PaymentCaptureSheet from '../pie/PaymentCaptureSheet';
import LanguageSelector from '../pie/LanguageSelector';
import { useTranslation } from '../translation/TranslationContext';
import { translateDirectiveProps } from '../translation/translateDirectiveProps';

// ── Local images from /images folder ─────────────────────────────────
import imgHeroImage from '../../Images/Hero image.png';
import imgDishImage from '../../Images/dish image.png';
import imgLogoPlaceholder from '../../Images/Logo Placeholder.png';
import imgSpicyIcon from '../../Images/Dietary/Subtract.png';
import imgVegetarianIcon from '../../Images/Dietary/Vector.png';

// ── PIE icon SVGs (@justeattakeaway/pie-icons) ──────────────────────
// Build data URIs from PIE icon SVGs with the correct fill colour.
const pieIcon = (svgPath: string, color = '#242e30') =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" role="presentation" focusable="false" fill="${color}" viewBox="0 0 16 16">${svgPath}</svg>`)}`;

const imgChevronLeft = pieIcon('<path d="M10.96 2.82 5.605 8l5.399 5.197-.875.963-5.565-5.364a1.164 1.164 0 0 1 0-1.671l5.495-5.25.901.945Z"/>');
const imgSearch = pieIcon('<path d="M14.125 13.162 11.15 10.18a5.049 5.049 0 1 0-.936.936l2.948 3.01.963-.963Zm-7-2.318a3.718 3.718 0 1 1 3.719-3.72 3.728 3.728 0 0 1-3.72 3.72Z"/>');
const imgMoreHorizontal = pieIcon('<path d="M3.188 6.688a1.313 1.313 0 1 1 0 2.625 1.313 1.313 0 0 1 0-2.626ZM6.688 8a1.313 1.313 0 1 0 2.625 0 1.313 1.313 0 0 0-2.626 0ZM11.5 8a1.313 1.313 0 1 0 2.625 0A1.313 1.313 0 0 0 11.5 8Z"/>');
const imgPlus = pieIcon('<path d="M14.125 7.344H8.656V1.875H7.344v5.469H1.875v1.312h5.469v5.469h1.312V8.656h5.469V7.344Z"/>');
const imgStarFilled = pieIcon('<path d="m12.288 14.449-4.183-2.197a.219.219 0 0 0-.21 0L3.713 14.45 4.5 9.794a.254.254 0 0 0 0-.193L1.07 6.302l4.673-.682a.228.228 0 0 0 .166-.114L8 1.271l2.091 4.235a.227.227 0 0 0 .167.114l4.672.682-3.386 3.3a.254.254 0 0 0-.061.192l.805 4.655Z"/>', '#e8a000');
const imgSeparator = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><circle cx="1" cy="1" r="1" fill="#242e30"/></svg>')}`;
const imgBike = pieIcon('<path d="M12.139 7.405 11 4.158a.218.218 0 0 1 0-.157.246.246 0 0 1 .158-.123l1.216-.446v-1.4l-1.627.613a1.514 1.514 0 0 0-.998 1.933l.359 1.015H9.75a2.433 2.433 0 0 0-1.925.963l-1.207 1.61-1.06-2.135h.692V4.718h-3.5v1.313H4.09l.726 1.461a2.87 2.87 0 0 0-.735-.105 2.826 2.826 0 1 0 2.826 2.818v-.201l1.97-2.66a1.111 1.111 0 0 1 .874-.438h.831l.254.717a2.844 2.844 0 1 0 1.313-.218h-.01ZM4.08 11.719a1.514 1.514 0 1 1 1.514-1.514 1.505 1.505 0 0 1-1.514 1.514Zm7.875 0a1.514 1.514 0 1 1 1.401-.934 1.505 1.505 0 0 1-1.4.934Z"/>');
const imgSpicy = imgSpicyIcon;
const imgVegetarian = imgVegetarianIcon;
const imgOffer = pieIcon('<path d="M7.676 14.939 1.087 8.35l6.38-6.387a1.409 1.409 0 0 1 1.12-.403l5.337.534.533 5.346a1.373 1.373 0 0 1-.393 1.111L7.676 14.94ZM2.942 8.35l4.734 4.734 5.46-5.46-.411-4.331-4.27-.42L2.942 8.35Zm7.683-3.85a.875.875 0 1 0 0 1.75.875.875 0 0 0 0-1.75Z"/>');
const imgUsers = pieIcon('<path d="m1.21 11.824.49-1.391a2.87 2.87 0 0 1 2.021-1.75 2.704 2.704 0 0 1-.481-.368 2.406 2.406 0 1 1 3.395 0 1.898 1.898 0 0 1-.324.271 2.905 2.905 0 0 1 1.689.5 2.94 2.94 0 0 1 1.697-.535 2.415 2.415 0 0 1-1.04-1.977 2.406 2.406 0 1 1 4.103 1.75c-.146.14-.308.263-.481.367a2.853 2.853 0 0 1 2.021 1.75l.49 1.392h-1.391l-.341-.954A1.584 1.584 0 0 0 11.5 9.855H9.75a1.583 1.583 0 0 0-1.523 1.015l-.34.954H6.46l.49-1.391c0-.123.105-.237.157-.35a1.653 1.653 0 0 0-.857-.228H4.5a1.583 1.583 0 0 0-1.523 1.015l-.34.954H1.21Zm8.75-5.25a1.094 1.094 0 1 0 .324-.77 1.084 1.084 0 0 0-.315.77H9.96Zm-6.125 0a1.094 1.094 0 1 0 .324-.77 1.085 1.085 0 0 0-.315.77h-.009Z"/>');

// ── Menu data ────────────────────────────────────────────────────────

interface MenuItem extends BasketItem {
  description?: string;
  calories?: string;
  image?: string;
  tags?: Array<{ label: string; icon: string }>;
  offer?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'sushi-1', name: 'Chicken Gyros', price: 1050, quantity: 1,
    description: 'Shavings of Marinated Chicken wrapped in Greek Flatbread...',
    calories: 'from 2378 kcal • from 2 servings',
    image: imgDishImage,
    tags: [
      { label: 'Spicy', icon: imgVegetarian },
      { label: 'Vegetarian', icon: imgSpicy },
    ],
  },
  {
    id: 'sushi-2', name: 'Chicken Souvlaki', price: 1050, quantity: 1,
    image: imgDishImage,
    offer: 'Get a freebie with this item',
  },
  { id: 'sushi-3', name: 'Edamame', price: 499, quantity: 1, image: imgDishImage },
  { id: 'sushi-4', name: 'Miso Soup', price: 399, quantity: 1, image: imgDishImage },
  { id: 'sushi-5', name: 'Gyoza (6pc)', price: 699, quantity: 1, image: imgDishImage },
  { id: 'sushi-6', name: 'Teriyaki Chicken', price: 1199, quantity: 1, image: imgDishImage },
];

// ── Offers data ─────────────────────────────────────────────────────
const OFFERS = [
  { id: 'offer-1', text: 'Get £10 Monthly Credit', subtitle: 'through Just Eat+ savings', variant: 'jetplus' as const },
  { id: 'offer-2', text: 'Buy 1 get 1 free', subtitle: 'When you spend £15', variant: 'standard' as const },
  { id: 'offer-3', text: 'Free item', subtitle: 'When you spend £15', variant: 'standard' as const },
];

// ── Shared style constants (PIE Design System) ──────────────────────
const font = "'JET Sans Digital', Arial, sans-serif";
const bodyFont = "'Takeaway Sans', 'JET Sans Digital', Arial, sans-serif";
const colorDefault = '#242e30';
const colorSubdued = '#3c4c4f';
const colorBorder = '#dbd9d7';
const colorSubtle = '#f5f3f1';
const colorBrand05 = '#f6c243';
const colorDivider = 'rgba(0,0,0,0.08)';

interface MenuPageProps {
  controller: CheckoutNudgeController;
  offerController: OfferNudgeController;
  userId: string;
  archetypeNames?: string[];
  activeArchetype?: string;
  onArchetypeSwitch?: (archetype: string) => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ controller, offerController, userId, archetypeNames = [], activeArchetype, onArchetypeSwitch }) => {
  const { state: basket, addItem, activateTrial } = useBasket();
  const { locale, setLocale, isTranslating, t } = useTranslation();
  const [nudgeEvent, setNudgeEvent] = useState<NudgeEvent | null>(null);
  const [nudgeTriggered, setNudgeTriggered] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showPaymentCapture, setShowPaymentCapture] = useState(false);

  // ── Independent offer flow state (Req 11.1, 11.2) ──────────────
  const [offerNudgeEvent, setOfferNudgeEvent] = useState<NudgeEvent | null>(null);
  const [showOfferBottomSheet, setShowOfferBottomSheet] = useState(false);
  const [showOfferPaymentCapture, setShowOfferPaymentCapture] = useState(false);
  const [showOfferCelebration, setShowOfferCelebration] = useState(false);

  useEffect(() => {
    registerComponent('savings-badge', SavingsBadge);
    registerComponent('quick-toggle', QuickToggle);
    registerComponent('confetti', ConfettiAnimation);
    registerComponent('archetype-toggle', ArchetypeToggle);
    registerComponent('celebration-sheet', CelebrationBottomSheet);
    registerComponent('offers-pill-strip', OffersPillStrip);
    registerComponent('payment-capture-sheet', PaymentCaptureSheet);
    return () => { clearRegistry(); };
  }, []);

  useEffect(() => {
    setNudgeEvent(null);
    setNudgeTriggered(false);
    setShowBottomSheet(false);
    setShowPaymentCapture(false);

    // Reset offer flow state
    setOfferNudgeEvent(null);
    setShowOfferBottomSheet(false);
    setShowOfferPaymentCapture(false);
    setShowOfferCelebration(false);

    // Initialize the controller eagerly so the offers strip is always
    // populated with the latest personalised offers, even before the
    // user adds anything to the basket.
    controller.initialize(userId);
    offerController.initialize(userId);
  }, [controller, offerController, userId]);

  const handleAdd = useCallback((item: BasketItem) => {
    addItem(item);
    if (!nudgeTriggered) {
      const currentTotal = basket.items.reduce(
        (sum, i) => sum + i.price * i.quantity, 0,
      ) + item.price * item.quantity;
      controller.updateBasketTotal(currentTotal);
      const event = controller.triggerFirstStep(basket.deliveryFee, 1500);
      if (event) {
        setNudgeEvent(event);
        setNudgeTriggered(true);
        // Show bottom sheet when MOV is met (basket total >= 1500)
        if (currentTotal >= 1500) {
          setShowBottomSheet(true);
        }
      }
    }
  }, [addItem, controller, basket.deliveryFee, basket.items, nudgeTriggered]);

  const handleInteraction = useCallback((event: PIEInteractionEvent) => {
    // ── Offers pill strip: JET+ offer tapped → route to OfferNudgeController ──
    if (event.componentType === 'offers-pill-strip' && event.action === 'offer-tapped') {
      const offerId = event.payload?.offerId as string;
      const offer = OFFERS.find(o => o.id === offerId);
      if (offer?.variant === 'jetplus') {
        const offerEvent = offerController.handleOfferTileTapped(offerId);
        if (offerEvent) {
          setOfferNudgeEvent(offerEvent);
          setShowOfferBottomSheet(true);
        }
      }
      return;
    }

    // ── Payment capture: confirmed ────────────────────────────────
    if (event.componentType === 'payment-capture-sheet' && event.action === 'payment-confirmed') {
      setShowPaymentCapture(false);
      const nextEvent = controller.handleInteraction(event);
      activateTrial();
      setNudgeEvent(nextEvent);
      return;
    }

    // ── Payment capture: dismissed ────────────────────────────────
    if (event.componentType === 'payment-capture-sheet' && event.action === 'dismissed') {
      setShowPaymentCapture(false);
      setShowBottomSheet(true);
      return;
    }

    if (event.componentType === 'quick-toggle' && event.action === 'toggled-on') {
      activateTrial();
    }
    if (event.componentType === 'celebration-sheet' && event.action === 'dismissed') {
      setNudgeEvent(null);
      return;
    }
    const nextEvent = controller.handleInteraction(event);

    // ── If the next event is a payment-capture-sheet, show it ────
    if (nextEvent && nextEvent.uiDirective.componentType === 'payment-capture-sheet') {
      setNudgeEvent(nextEvent);
      setShowPaymentCapture(true);
      setShowBottomSheet(false);
      return;
    }

    setNudgeEvent(nextEvent);
  }, [controller, offerController, activateTrial]);

  const renderPIEComponent = () => {
    if (!nudgeEvent) return null;
    const translatedDirective = {
      ...nudgeEvent.uiDirective,
      props: translateDirectiveProps(nudgeEvent.uiDirective.props, t),
    };
    const element = pieRender(translatedDirective);
    if (!element) return null;
    return React.cloneElement(element, { onInteraction: handleInteraction });
  };

  const basketTotal = basket.items.reduce(
    (sum, i) => sum + i.price * i.quantity, 0,
  );

  // ── Bottom sheet content per archetype ──────────────────────────
  const isSam = activeArchetype === 'squeezed-saver';
  const deliveryFeeFormatted = `£${(basket.deliveryFee / 100).toFixed(2)}`;

  const bottomSheetHeadline = isSam ? t('Wake up, Sam!') : t('Ready to optimise, Alex?');

  const bottomSheetBody = isSam ? (
    <p style={{ margin: 0, fontFamily: bodyFont }}>
      {t('Stop paying the \'convenience tax.\' You\'ve spent ')}
      <span style={{ fontWeight: 700 }}>£15</span>
      {t(' on delivery this month—save ')}
      <span style={{ fontWeight: 700 }}>£3.50</span>
      {t(' on this order with a free ')}
      <span style={{ fontWeight: 700 }}>{t('14-day JET+ trial')}</span>
      {'.'}
    </p>
  ) : (
    <p style={{ margin: 0, fontFamily: bodyFont }}>
      {t('Most ')}
      <span style={{ fontWeight: 700 }}>JET+</span>
      {t(' members save over ')}
      <span style={{ fontWeight: 700 }}>£20 a month</span>
      {'.'}
    </p>
  );

  const bottomSheetBanner = isSam ? (
    <p style={{ margin: 0, fontFamily: bodyFont }}>
      {t('Let\'s eliminate that fee right now. Start your free ')}
      <span style={{ fontWeight: 700 }}>{t('14-day JET+ trial')}</span>
      {t(' and ')}
      <span style={{ fontWeight: 700 }}>{t('save')} {deliveryFeeFormatted}</span>
      {t(' on this order.')}
    </p>
  ) : (
    <p style={{ margin: 0, fontFamily: bodyFont }}>
      {t('Start your ')}
      <span style={{ fontWeight: 700 }}>{t('14-day JET+')}</span>
      {' '}
      <span style={{ fontWeight: 700 }}>{t('trial')}</span>
      {t(' to get this delivery for £0 and unlock ')}
      <span style={{ fontWeight: 700 }}>{t('exclusive member-only offers')}</span>
    </p>
  );

  const handleBottomSheetTrial = useCallback(() => {
    setShowBottomSheet(false);
    // Advance the nudge engine through the interaction flow to reach payment-capture
    if (nudgeEvent) {
      // Simulate savings-badge tap → trial-offer step
      controller.handleInteraction({
        componentType: 'savings-badge', action: 'tapped',
      });
      // Simulate quick-toggle toggled-on → payment-capture-requested step
      // The controller now maps this to payment-capture-requested (not trial-activated),
      // so the engine advances to the payment-capture step and emits a payment-capture-sheet directive.
      const paymentCaptureEvent = controller.handleInteraction({
        componentType: 'quick-toggle', action: 'toggled-on',
      });
      if (paymentCaptureEvent && paymentCaptureEvent.uiDirective.componentType === 'payment-capture-sheet') {
        setNudgeEvent(paymentCaptureEvent);
        setShowPaymentCapture(true);
      } else {
        setNudgeEvent(paymentCaptureEvent);
      }
    }
  }, [controller, nudgeEvent]);

  // ── Offer flow: NudgeBottomSheet "Unlock benefits" handler ──────
  const handleOfferStartTrial = useCallback(() => {
    const nextEvent = offerController.handleInteraction({
      componentType: 'nudge-bottom-sheet',
      action: 'start-trial',
    });
    if (nextEvent && nextEvent.uiDirective.componentType === 'payment-capture-sheet') {
      setOfferNudgeEvent(nextEvent);
      setShowOfferBottomSheet(false);
      setShowOfferPaymentCapture(true);
    }
  }, [offerController]);

  // ── Offer flow: NudgeBottomSheet dismiss handler ────────────────
  const handleOfferBottomSheetClose = useCallback(() => {
    setShowOfferBottomSheet(false);
    offerController.reset();
  }, [offerController]);

  // ── Offer flow: PaymentCaptureSheet interaction handler ─────────
  const handleOfferPaymentInteraction = useCallback((event: PIEInteractionEvent) => {
    if (event.componentType === 'payment-capture-sheet' && event.action === 'payment-confirmed') {
      const nextEvent = offerController.handleInteraction(event);
      if (nextEvent && nextEvent.uiDirective.componentType === 'celebration-sheet') {
        setOfferNudgeEvent(nextEvent);
        setShowOfferPaymentCapture(false);
        activateTrial();
        setShowOfferCelebration(true);
      }
      return;
    }
    if (event.componentType === 'payment-capture-sheet' && event.action === 'dismissed') {
      offerController.handleInteraction(event);
      setShowOfferPaymentCapture(false);
      setShowOfferBottomSheet(true);
      return;
    }
  }, [offerController, activateTrial]);

  // ── Offer flow: CelebrationBottomSheet interaction handler ──────
  const handleOfferCelebrationInteraction = useCallback((event: PIEInteractionEvent) => {
    if (event.componentType === 'celebration-sheet' && event.action === 'dismissed') {
      setShowOfferCelebration(false);
      setOfferNudgeEvent(null);
      offerController.reset();
    }
  }, [offerController]);

  return (
    <div style={{ fontFamily: font, background: 'white', overflow: 'hidden', position: 'relative', width: '100%', paddingTop: 10 }}>

      <style>{`
        @keyframes badge-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .badge-pop { animation: none !important; }
        }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div style={{ background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '0 16px', width: '100%', boxSizing: 'border-box' }}>
          <button type="button" aria-label="Go back" style={{
            background: 'transparent', border: 'none', borderRadius: 120, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
          }}>
            <img alt="" src={imgChevronLeft} style={{ width: 24, height: 24 }} />
          </button>

          {/* Persona toggle (replaces Delivery/Collection) */}
          {archetypeNames.length > 0 && activeArchetype && (
            <div style={{
              flex: 1, background: colorSubtle, borderRadius: 100, padding: 2, display: 'flex', gap: 0,
            }}>
              {archetypeNames.map((name) => {
                const isActive = name === activeArchetype;
                const label = name === 'squeezed-saver' ? 'Sam' : 'Alex';
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onArchetypeSwitch?.(name)}
                    style={{
                      flex: 1, background: isActive ? 'white' : 'transparent',
                      borderRadius: 5000, height: 36, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: 4, padding: '2px 12px',
                      border: 'none', cursor: 'pointer', fontFamily: font,
                      boxShadow: isActive ? '0px 4px 6px 0px rgba(0,0,0,0.02), 0px 2px 12px -2px rgba(0,0,0,0.08), 0px 3px 6px 0px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    <div style={{ textAlign: 'center', fontSize: 12, lineHeight: '14px', color: isActive ? colorDefault : '#5d7074' }}>
                      <div style={{ fontWeight: 700 }}>{label}</div>
                      <div style={{ fontWeight: 400, fontFamily: bodyFont }}>{name === 'squeezed-saver' ? 'Saver' : 'Seeker'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <LanguageSelector locale={locale} isTranslating={isTranslating} onLocaleChange={setLocale} />

          <button type="button" aria-label="Search" style={{
            background: 'transparent', border: 'none', borderRadius: 120, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
          }}>
            <img alt="" src={imgSearch} style={{ width: 24, height: 24 }} />
          </button>
        </div>
      </div>

      {/* ── Hero image ──────────────────────────────────────────── */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', padding: '0 16px', boxSizing: 'border-box' }}>
        <div style={{ position: 'relative', width: '100%', height: 152, borderRadius: 16, overflow: 'hidden' }}>
          <img alt={t("Restaurant hero")} src={imgHeroImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Group order button */}
          <button type="button" style={{
            position: 'absolute', bottom: 12, right: 12, background: colorSubtle,
            border: `1px solid ${colorBorder}`, borderRadius: 5000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8, padding: '6px 8px',
            cursor: 'pointer', minWidth: 48,
          }}>
            <img alt="" src={imgUsers} style={{ width: 16, height: 16 }} />
            <span style={{ fontWeight: 700, fontSize: 14, lineHeight: '20px', color: colorDefault, fontFamily: bodyFont }}>{t("Group order")}</span>
          </button>
        </div>
        {/* Restaurant logo */}
        <div style={{
          position: 'absolute', left: 28, bottom: -24, width: 48, height: 48,
          background: 'white', border: `1px solid ${colorBorder}`, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 1,
        }}>
          <img alt={t("Restaurant logo")} src={imgLogoPlaceholder} style={{ width: '100%', height: '100%', borderRadius: 7, objectFit: 'cover' }} />
        </div>
      </div>

      {/* ── Menu header ─────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 16px', paddingTop: 32 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 24, fontWeight: 800, lineHeight: '32px', color: colorDefault, margin: 0 }}>
              {t("The Greek Kitchen")}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Rating + min order */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <img alt={t("Rating")} src={imgStarFilled} style={{ width: 20, height: 20 }} />
                  <span style={{ fontSize: 14, lineHeight: '20px', color: colorDefault }}>
                    <span style={{ fontWeight: 700, fontFamily: bodyFont }}>4.9 </span>
                    <span style={{ fontWeight: 400, fontFamily: bodyFont }}>(213)</span>
                  </span>
                </div>
                <img alt="" src={imgSeparator} style={{ width: 2, height: 2 }} />
                <span style={{ fontSize: 14, lineHeight: '20px', color: colorDefault, fontWeight: 400, fontFamily: bodyFont }}>
                  {t("Min order.")} £{(1500 / 100).toFixed(2)}
                </span>
              </div>
              {/* Delivery fee tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  background: colorBrand05, borderRadius: 100, width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img alt="" src={imgBike} style={{ width: 14, height: 14 }} />
                </div>
                <span style={{ fontSize: 14, lineHeight: '20px', color: colorDefault, fontWeight: 400, fontFamily: bodyFont }}>
                  {t("Free delivery")} £{(basket.deliveryFee / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          {/* More button */}
          <button type="button" aria-label="More options" style={{
            background: colorSubtle, border: 'none', borderRadius: 120, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
          }}>
            <img alt="" src={imgMoreHorizontal} style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Offers pill strip */}
        <OffersPillStrip
          directive={{
            componentType: 'offers-pill-strip',
            props: {
              offers: OFFERS,
            },
          }}
          onInteraction={handleInteraction}
        />
      </div>

      {/* ── Menu list ───────────────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: '16px 16px 0 0' }}>
        {/* Category title */}
        <div style={{ padding: '24px 16px 8px 16px' }}>
          <p style={{ fontSize: 20, fontWeight: 800, lineHeight: '28px', color: colorDefault, margin: 0 }}>
            {t("Wraps")}
          </p>
        </div>

        {/* Menu items */}
        {MENU_ITEMS.map((item) => {
          const inBasket = basket.items.find((i) => i.id === item.id);
          return (
            <div key={item.id}>
              <div style={{ height: 1, background: colorDivider }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '16px 0' }}>
                <div style={{ display: 'flex', gap: 8, paddingLeft: 16, paddingRight: 8 }}>
                  {/* Copy */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, lineHeight: '24px', color: colorDefault, margin: 0, fontFamily: bodyFont }}>
                      {t(item.name)}
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 700, lineHeight: '24px', color: colorDefault, margin: 0, fontFamily: bodyFont }}>
                      £{(item.price / 100).toFixed(2)}
                    </p>
                    {item.description && (
                      <p style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', color: colorSubdued, margin: 0, paddingTop: 4, fontFamily: bodyFont }}>
                        {t(item.description)}
                      </p>
                    )}
                  </div>
                  {/* Image + add button */}
                  {item.image ? (
                    <div style={{ position: 'relative', width: 136, height: 89, flexShrink: 0 }}>
                      <img alt={t(item.name)} src={item.image} style={{
                        width: 120, height: 89, borderRadius: 12, objectFit: 'cover',
                      }} />
                      <button type="button" onClick={() => handleAdd(item)} aria-label={`${t("Add")} ${t(item.name)}`} style={{
                        position: 'absolute', top: -9, right: 0, width: 32, height: 32,
                        background: inBasket ? '#4caf50' : 'white', border: `1px solid ${colorBorder}`,
                        borderRadius: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', padding: 0,
                      }}>
                        {inBasket
                          ? <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{inBasket.quantity}</span>
                          : <img alt="" src={imgPlus} style={{ width: 20, height: 20 }} />
                        }
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => handleAdd(item)} style={{
                      background: inBasket ? '#4caf50' : '#e36002', color: '#fff', border: 'none',
                      borderRadius: 5000, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', alignSelf: 'center', flexShrink: 0,
                    }}>
                      {inBasket ? `${t("Added")} (${inBasket.quantity})` : t('Add')}
                    </button>
                  )}
                </div>

                {/* Calories */}
                {item.calories && (
                  <div style={{ padding: '4px 16px 0', fontSize: 12, fontWeight: 400, lineHeight: '16px', color: colorSubdued, fontFamily: bodyFont }}>
                    {t(item.calories)}
                  </div>
                )}

                {/* Dietary tags */}
                {item.tags && item.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, paddingLeft: 16, paddingTop: 8 }}>
                    {item.tags.map((tag) => (
                      <div key={tag.label} style={{
                        background: '#ffe9ea', borderRadius: 12, display: 'flex', gap: 2,
                        alignItems: 'center', padding: '1px 4px', height: 16,
                      }}>
                        <img alt="" src={tag.icon} style={{ width: 12, height: 12 }} />
                        <span style={{ fontSize: 12, lineHeight: '16px', color: colorDefault }}>{t(tag.label)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Offer tag */}
                {item.offer && (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', paddingLeft: 16, paddingTop: 12 }}>
                    <div style={{
                      background: colorBrand05, borderRadius: 100, width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <img alt="" src={imgOffer} style={{ width: 14, height: 14 }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, lineHeight: '20px', color: colorDefault, fontFamily: bodyFont }}>
                      {t(item.offer)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div style={{ height: 1, background: colorDivider }} />
      </div>

      {/* ── Nudge bottom sheet (shown when MOV is met) ──────── */}
      {showBottomSheet && nudgeEvent && (
        <NudgeBottomSheet
          archetype={activeArchetype ?? 'squeezed-saver'}
          headline={bottomSheetHeadline}
          body={bottomSheetBody}
          bannerText={bottomSheetBanner}
          onStartTrial={handleBottomSheetTrial}
          onClose={() => setShowBottomSheet(false)}
        />
      )}

      {/* ── Delight confirm (celebration sheet after trial activation) ──── */}
      {nudgeEvent && !showBottomSheet && !showPaymentCapture && nudgeEvent.uiDirective.componentType === 'celebration-sheet' && (
        <div>{renderPIEComponent()}</div>
      )}

      {/* ── Payment capture sheet ──── */}
      {showPaymentCapture && nudgeEvent && nudgeEvent.uiDirective.componentType === 'payment-capture-sheet' && (
        <PaymentCaptureSheet
          directive={nudgeEvent.uiDirective}
          onInteraction={handleInteraction}
        />
      )}

      {/* ── Legacy confetti fallback ──── */}
      {nudgeEvent && !showBottomSheet && nudgeEvent.uiDirective.componentType === 'confetti' && (
        <div style={{
          margin: '16px', padding: 16, borderRadius: 8,
          background: '#fff8f0', border: '1px solid #e36002',
        }}>
          <div style={{ fontSize: 14, lineHeight: '1.5', marginBottom: 12, color: colorDefault }}>
            {t(nudgeEvent.message)}
          </div>
          <div>{renderPIEComponent()}</div>
        </div>
      )}

      {/* ── Offer flow: NudgeBottomSheet ──── */}
      {showOfferBottomSheet && offerNudgeEvent && (
        <NudgeBottomSheet
          archetype={activeArchetype ?? 'squeezed-saver'}
          headline={t(String(offerNudgeEvent.uiDirective.props.headline ?? ''))}
          body={<p style={{ margin: 0, fontFamily: bodyFont }}>{t(offerNudgeEvent.message)}</p>}
          bannerText={t(String(offerNudgeEvent.uiDirective.props.bannerText ?? ''))}
          onStartTrial={handleOfferStartTrial}
          onClose={handleOfferBottomSheetClose}
        />
      )}

      {/* ── Offer flow: PaymentCaptureSheet ──── */}
      {showOfferPaymentCapture && offerNudgeEvent && offerNudgeEvent.uiDirective.componentType === 'payment-capture-sheet' && (
        <PaymentCaptureSheet
          directive={offerNudgeEvent.uiDirective}
          onInteraction={handleOfferPaymentInteraction}
        />
      )}

      {/* ── Offer flow: CelebrationBottomSheet ──── */}
      {showOfferCelebration && offerNudgeEvent && offerNudgeEvent.uiDirective.componentType === 'celebration-sheet' && (
        <CelebrationBottomSheet
          directive={offerNudgeEvent.uiDirective}
          onInteraction={handleOfferCelebrationInteraction}
        />
      )}

      {/* ── Spacer for sticky bar ─────────────────────────── */}
      {basket.items.length > 0 && <div style={{ height: 110 }} />}

      {/* ── Sticky bottom bar ─────────────────────────────────── */}
      {basket.items.length > 0 && (() => {
        const itemCount = basket.items.reduce((s, i) => s + i.quantity, 0);
        const totalWithFees = basketTotal + basket.deliveryFee;
        const movGap = 1500 - basketTotal;
        const belowMov = movGap > 0;

        return (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            maxWidth: 480, margin: '0 auto',
            zIndex: 100,
          }}>
            {/* MOV message */}
            {belowMov && (
              <div style={{
                background: '#FFD3BF', color: 'rgba(0,0,0,0.76)',
                fontSize: 13, lineHeight: '20px', fontWeight: 700,
                textAlign: 'center', padding: '6px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: font,
                borderRadius: '12px 12px 0 0',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="rgba(0,0,0,0.76)" role="presentation"><path d="M12.139 7.405 11 4.158a.218.218 0 0 1 0-.157.246.246 0 0 1 .158-.123l1.216-.446v-1.4l-1.627.613a1.514 1.514 0 0 0-.998 1.933l.359 1.015H9.75a2.433 2.433 0 0 0-1.925.963l-1.207 1.61-1.06-2.135h.692V4.718h-3.5v1.313H4.09l.726 1.461a2.87 2.87 0 0 0-.735-.105 2.826 2.826 0 1 0 2.826 2.818v-.201l1.97-2.66a1.111 1.111 0 0 1 .874-.438h.831l.254.717a2.844 2.844 0 1 0 1.313-.218h-.01ZM4.08 11.719a1.514 1.514 0 1 1 1.514-1.514 1.505 1.505 0 0 1-1.514 1.514Zm7.875 0a1.514 1.514 0 1 1 1.401-.934 1.505 1.505 0 0 1-1.4.934Z" /></svg>
                {t("Add")} £{(movGap / 100).toFixed(2)} {t("to get it delivered")}
              </div>
            )}

            {/* Dark bar with price + button */}
            <div style={{
              background: '#F6F3EF', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              fontFamily: font,
            }}>
              {/* Price + fees */}
              <div style={{ flexShrink: 0 }}>
                <div style={{ color: colorDefault, fontSize: 16, fontWeight: 700, lineHeight: '20px', fontFamily: bodyFont }}>
                  £{(totalWithFees / 100).toFixed(2)}
                </div>
                <div style={{ color: 'rgba(0,0,0,0.64)', fontSize: 12, lineHeight: '16px', fontFamily: bodyFont }}>
                  {t("inc.")} £{(basket.deliveryFee / 100).toFixed(2)} {t("fees")}
                </div>
              </div>

              {/* View basket button */}
              <button type="button" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#e36002', color: '#fff', border: 'none',
                borderRadius: 5000, padding: '12px 20px',
                fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: font,
              }}>
                {/* Basket icon with count badge */}
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="white" role="presentation"><path d="M6.031 11.5 5.594 8h1.312l.438 3.5H6.03ZM9.094 8l-.438 3.5H9.97l.437-3.5H9.094ZM15 5.594v1.312h-.752l-.945 5.714a1.522 1.522 0 0 1-1.506 1.286H4.202a1.522 1.522 0 0 1-1.505-1.286l-.945-5.714H1V5.594h3.876L5.918 2.75h1.39L6.25 5.594h3.5L8.691 2.75h1.391l1.042 2.844H15Zm-2.082 1.312H3.082l.874 5.504a.219.219 0 0 0 .21.184h7.595a.219.219 0 0 0 .21-.184l.946-5.504Z" /></svg>
                  <span
                    key={itemCount}
                    className="badge-pop"
                    style={{
                    position: 'absolute', top: -6, right: -8,
                    background: '#fff', color: '#e36002',
                    fontSize: 10, fontWeight: 700, lineHeight: '14px',
                    width: 16, height: 16, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'badge-pop 0.3s ease-out',
                  }}>
                    {itemCount}
                  </span>
                </span>
                {t("View basket")}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MenuPage;
