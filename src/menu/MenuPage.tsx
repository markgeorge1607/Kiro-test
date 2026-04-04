import React, { useEffect, useState, useCallback } from 'react';
import type { BasketItem, NudgeEvent, PIEInteractionEvent } from '../types';
import { useBasket } from '../state/BasketContext';
import { CheckoutNudgeController } from '../checkout/CheckoutNudgeController';
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

// ── Figma asset URLs (expire after 7 days) ──────────────────────────
const imgHeroImage = 'https://www.figma.com/api/mcp/asset/3e9ee9d4-55f4-4c24-b4d2-8cdbdf915150';
const imgLogoPlaceholder = 'https://www.figma.com/api/mcp/asset/63312969-970b-474a-95e9-eeda4247e68d';
const imgStarFilled = 'https://www.figma.com/api/mcp/asset/cb2485c5-9b2d-48b4-a9f8-ae7aba961a64';
const imgSeparator = 'https://www.figma.com/api/mcp/asset/7ff5f0a1-d8be-4b31-ac06-ed9fc0d02fef';
const imgBike = 'https://www.figma.com/api/mcp/asset/9983480f-6ef5-4261-9de2-e648ad202f5a';
const imgDishImage = 'https://www.figma.com/api/mcp/asset/7a5180c0-c2ab-434c-bb24-bccdb185a32d';
const imgDishImage1 = 'https://www.figma.com/api/mcp/asset/f85a0997-026b-4b36-b685-a3bbf69125ab';
const imgPlus = 'https://www.figma.com/api/mcp/asset/d1b21af8-c7ca-4515-a162-621f8af81152';
const imgSpicy = 'https://www.figma.com/api/mcp/asset/f9986662-bfaa-4277-a06f-ceb5b304f280';
const imgVegetarian = 'https://www.figma.com/api/mcp/asset/4a8ffe6f-c00c-44e9-b903-736daea3dab4';
const imgOffer = 'https://www.figma.com/api/mcp/asset/47310c6b-4861-4715-b5c0-8fdb625a1780';
const imgUsers = 'https://www.figma.com/api/mcp/asset/6fb64e7a-f277-45fc-bacc-ff0453fb2a4a';
const imgChevronLeft = 'https://www.figma.com/api/mcp/asset/11519929-fe6f-4592-a56c-be827575f1c3';
const imgSearch = 'https://www.figma.com/api/mcp/asset/237048fa-7745-4640-af1a-2615c75caab5';
const imgContent = 'https://www.figma.com/api/mcp/asset/aab851cf-a697-4cb6-9a81-3359aed175a2';
const imgMoreHorizontal = 'https://www.figma.com/api/mcp/asset/292badd0-188f-4fcb-a36f-2d2badde5a24';

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
      { label: 'Spicy', icon: imgSpicy },
      { label: 'Vegetarian', icon: imgVegetarian },
    ],
  },
  {
    id: 'sushi-2', name: 'Chicken Souvlaki', price: 1050, quantity: 1,
    image: imgDishImage1,
    offer: 'Get a freebie with this item',
  },
  { id: 'sushi-3', name: 'Edamame', price: 499, quantity: 1, image: imgDishImage },
  { id: 'sushi-4', name: 'Miso Soup', price: 399, quantity: 1, image: imgDishImage1 },
  { id: 'sushi-5', name: 'Gyoza (6pc)', price: 699, quantity: 1, image: imgDishImage },
  { id: 'sushi-6', name: 'Teriyaki Chicken', price: 1199, quantity: 1, image: imgDishImage1 },
];

// ── Shared style constants (PIE Design System) ──────────────────────
const font = "'JET Sans Digital', Arial, sans-serif";
const colorDefault = '#242e30';
const colorSubdued = '#3c4c4f';
const colorBorder = '#dbd9d7';
const colorSubtle = '#f5f3f1';
const colorBrand05 = '#f6c243';
const colorDivider = 'rgba(0,0,0,0.08)';

interface MenuPageProps {
  controller: CheckoutNudgeController;
  userId: string;
  archetypeNames?: string[];
  activeArchetype?: string;
  onArchetypeSwitch?: (archetype: string) => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ controller, userId, archetypeNames = [], activeArchetype, onArchetypeSwitch }) => {
  const { state: basket, addItem, activateTrial } = useBasket();
  const [nudgeEvent, setNudgeEvent] = useState<NudgeEvent | null>(null);
  const [nudgeTriggered, setNudgeTriggered] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  useEffect(() => {
    registerComponent('savings-badge', SavingsBadge);
    registerComponent('quick-toggle', QuickToggle);
    registerComponent('confetti', ConfettiAnimation);
    registerComponent('archetype-toggle', ArchetypeToggle);
    registerComponent('celebration-sheet', CelebrationBottomSheet);
    return () => { clearRegistry(); };
  }, []);

  useEffect(() => {
    setNudgeEvent(null);
    setNudgeTriggered(false);
    setShowBottomSheet(false);
  }, [controller]);

  const handleAdd = useCallback((item: BasketItem) => {
    addItem(item);
    if (!nudgeTriggered) {
      controller.initialize(userId);
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
  }, [addItem, controller, userId, basket.deliveryFee, basket.items, nudgeTriggered]);

  const handleInteraction = useCallback((event: PIEInteractionEvent) => {
    if (event.componentType === 'quick-toggle' && event.action === 'toggled-on') {
      activateTrial();
    }
    if (event.componentType === 'celebration-sheet' && event.action === 'dismissed') {
      setNudgeEvent(null);
      return;
    }
    const nextEvent = controller.handleInteraction(event);
    setNudgeEvent(nextEvent);
  }, [controller, activateTrial]);

  const renderPIEComponent = () => {
    if (!nudgeEvent) return null;
    const element = pieRender(nudgeEvent.uiDirective);
    if (!element) return null;
    return React.cloneElement(element, { onInteraction: handleInteraction });
  };

  const basketTotal = basket.items.reduce(
    (sum, i) => sum + i.price * i.quantity, 0,
  );

  // ── Bottom sheet content per archetype ──────────────────────────
  const isSam = activeArchetype === 'squeezed-saver';
  const deliveryFeeFormatted = `£${(basket.deliveryFee / 100).toFixed(2)}`;

  const bottomSheetHeadline = isSam ? 'Wake up, Sam!' : 'Ready to optimise, Alex?';

  const bottomSheetBody = isSam ? (
    <p style={{ margin: 0 }}>
      {'You\'ve hit '}
      <span style={{ fontWeight: 700 }}>£15.00</span>
      {' in delivery fees this month—that\'s money that could\'ve stayed in your pocket. Stop paying the \'convenience tax\' today. Start your '}
      <span style={{ fontWeight: 700 }}>14-day free trial</span>
      {' of '}
      <span style={{ fontWeight: 700 }}>JET+</span>
      {' and take '}
      <span style={{ fontWeight: 700 }}>£3.50</span>
      {' off this order instantly.'}
    </p>
  ) : (
    <p style={{ margin: 0 }}>
      {'Most '}
      <span style={{ fontWeight: 700 }}>JET+</span>
      {' members save over '}
      <span style={{ fontWeight: 700 }}>£20 a month</span>
      {'.'}
    </p>
  );

  const bottomSheetBanner = isSam ? (
    <p style={{ margin: 0 }}>
      {'Let\'s eliminate that fee right now. Start your free '}
      <span style={{ fontWeight: 700 }}>14-day JET+ trial</span>
      {' and '}
      <span style={{ fontWeight: 700 }}>save {deliveryFeeFormatted}</span>
      {' on this order.'}
    </p>
  ) : (
    <p style={{ margin: 0 }}>
      {'Start your '}
      <span style={{ fontWeight: 700 }}>14-day JET+</span>
      {' '}
      <span style={{ fontWeight: 700 }}>trial</span>
      {' to get this delivery for £0 and unlock '}
      <span style={{ fontWeight: 700 }}>exclusive member-only offers</span>
    </p>
  );

  const handleBottomSheetTrial = useCallback(() => {
    // Activate the trial via the existing nudge flow
    activateTrial();
    setShowBottomSheet(false);
    // Advance the nudge engine through the interaction flow
    if (nudgeEvent) {
      // Simulate savings-badge tap → trial-offer step
      const tapEvent = controller.handleInteraction({
        componentType: 'savings-badge', action: 'tapped',
      });
      if (tapEvent) setNudgeEvent(tapEvent);
      // Simulate quick-toggle activation → delight-confirm step
      const trialEvent = controller.handleInteraction({
        componentType: 'quick-toggle', action: 'toggled-on',
      });
      setNudgeEvent(trialEvent);
    }
  }, [activateTrial, controller, nudgeEvent]);

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
                      <div style={{ fontWeight: 400 }}>{name === 'squeezed-saver' ? 'Saver' : 'Seeker'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

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
          <img alt="Restaurant hero" src={imgHeroImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Group order button */}
          <button type="button" style={{
            position: 'absolute', bottom: 12, right: 12, background: colorSubtle,
            border: `1px solid ${colorBorder}`, borderRadius: 5000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8, padding: '6px 8px',
            cursor: 'pointer', minWidth: 48,
          }}>
            <img alt="" src={imgUsers} style={{ width: 16, height: 16 }} />
            <span style={{ fontWeight: 700, fontSize: 14, lineHeight: '20px', color: colorDefault }}>Group order</span>
          </button>
        </div>
        {/* Restaurant logo */}
        <div style={{
          position: 'absolute', left: 28, bottom: -24, width: 48, height: 48,
          background: 'white', border: `1px solid ${colorBorder}`, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 1,
        }}>
          <img alt="Restaurant logo" src={imgLogoPlaceholder} style={{ width: '100%', height: '100%', borderRadius: 7, objectFit: 'cover' }} />
        </div>
      </div>

      {/* ── Menu header ─────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${colorBorder}` }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 16px', paddingTop: 32 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 24, fontWeight: 800, lineHeight: '32px', color: colorDefault, margin: 0 }}>
              The Greek Kitchen
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Rating + min order */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <img alt="Rating" src={imgStarFilled} style={{ width: 20, height: 20 }} />
                  <span style={{ fontSize: 14, lineHeight: '20px', color: colorDefault }}>
                    <span style={{ fontWeight: 700 }}>4.9 </span>
                    <span style={{ fontWeight: 400 }}>(213)</span>
                  </span>
                </div>
                <img alt="" src={imgSeparator} style={{ width: 2, height: 2 }} />
                <span style={{ fontSize: 14, lineHeight: '20px', color: colorDefault, fontWeight: 400 }}>
                  Min order. £{(1500 / 100).toFixed(2)}
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
                <span style={{ fontSize: 14, lineHeight: '20px', color: colorDefault, fontWeight: 400 }}>
                  Free delivery £{(basket.deliveryFee / 100).toFixed(2)}
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

        {/* Promotions banner */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 0 12px 16px', overflowX: 'auto' }}>
          {[0, 1].map((i) => (
            <div key={i} style={{
              background: colorBrand05, borderRadius: 12, width: '85%', minWidth: 280, maxWidth: 319,
              overflow: 'hidden', position: 'relative', padding: 8,
            }}>
              <img alt="" src={imgContent} style={{
                position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                width: '32%', opacity: 0.6, pointerEvents: 'none',
              }} />
              <p style={{ fontSize: 14, fontWeight: 700, lineHeight: '20px', color: colorDefault, margin: 0, position: 'relative' }}>
                20% off when you spend £15
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Menu list ───────────────────────────────────────────── */}
      <div style={{ background: 'white', borderRadius: '16px 16px 0 0' }}>
        {/* Category title */}
        <div style={{ padding: '24px 16px 8px 16px' }}>
          <p style={{ fontSize: 20, fontWeight: 800, lineHeight: '28px', color: colorDefault, margin: 0 }}>
            Wraps
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
                    <p style={{ fontSize: 16, fontWeight: 800, lineHeight: '24px', color: colorDefault, margin: 0 }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 700, lineHeight: '24px', color: colorDefault, margin: 0 }}>
                      £{(item.price / 100).toFixed(2)}
                    </p>
                    {item.description && (
                      <p style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', color: colorSubdued, margin: 0, paddingTop: 4 }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  {/* Image + add button */}
                  {item.image ? (
                    <div style={{ position: 'relative', width: 136, height: 89, flexShrink: 0 }}>
                      <img alt={item.name} src={item.image} style={{
                        width: 120, height: 89, borderRadius: 12, objectFit: 'cover',
                      }} />
                      <button type="button" onClick={() => handleAdd(item)} aria-label={`Add ${item.name}`} style={{
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
                      {inBasket ? `Added (${inBasket.quantity})` : 'Add'}
                    </button>
                  )}
                </div>

                {/* Calories */}
                {item.calories && (
                  <div style={{ padding: '4px 16px 0', fontSize: 12, fontWeight: 400, lineHeight: '16px', color: colorSubdued }}>
                    {item.calories}
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
                        <span style={{ fontSize: 12, lineHeight: '16px', color: colorDefault }}>{tag.label}</span>
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
                    <span style={{ fontSize: 14, fontWeight: 700, lineHeight: '20px', color: colorDefault }}>
                      {item.offer}
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
      {nudgeEvent && !showBottomSheet && nudgeEvent.uiDirective.componentType === 'celebration-sheet' && (
        <div>{renderPIEComponent()}</div>
      )}

      {/* ── Legacy confetti fallback ──── */}
      {nudgeEvent && !showBottomSheet && nudgeEvent.uiDirective.componentType === 'confetti' && (
        <div style={{
          margin: '16px', padding: 16, borderRadius: 8,
          background: '#fff8f0', border: '1px solid #e36002',
        }}>
          <div style={{ fontSize: 14, lineHeight: '1.5', marginBottom: 12, color: colorDefault }}>
            {nudgeEvent.message}
          </div>
          <div>{renderPIEComponent()}</div>
        </div>
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
                Add £{(movGap / 100).toFixed(2)} to get it delivered
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
                <div style={{ color: colorDefault, fontSize: 16, fontWeight: 700, lineHeight: '20px' }}>
                  £{(totalWithFees / 100).toFixed(2)}
                </div>
                <div style={{ color: 'rgba(0,0,0,0.64)', fontSize: 12, lineHeight: '16px' }}>
                  inc. £{(basket.deliveryFee / 100).toFixed(2)} fees
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
                View basket
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MenuPage;
