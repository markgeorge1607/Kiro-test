import React, { useState, useMemo } from 'react';
import { BasketProvider } from './state/BasketContext';
import { TranslationProvider } from './translation/TranslationContext';
import { TranslationService } from './translation/TranslationService';
import MenuPage from './menu/MenuPage';
import { CheckoutNudgeController } from './checkout/CheckoutNudgeController';
import { OfferNudgeController } from './checkout/OfferNudgeController';
import { UserContextEvaluator } from './conversational/UserContextEvaluator';
import { StrategySelector } from './conversational/StrategySelector';
import { createDefaultRegistry } from './conversational/ArchetypeRegistry';
import type { BasketState } from './types';

const ARCHETYPE_NAMES = ['squeezed-saver', 'value-seeker'];

const INITIAL_BASKET: BasketState = {
  items: [],
  deliveryFee: 350,
  membershipStatus: 'non-member',
  trialActive: false,
};

const App: React.FC = () => {
  const [activeArchetype, setActiveArchetype] = useState('squeezed-saver');

  const translationService = useMemo(
    () => new TranslationService({ apiKey: import.meta.env.VITE_GEMINI_API_KEY ?? '' }),
    [],
  );

  const { controller, offerController } = useMemo(() => {
    const registry = createDefaultRegistry();
    const provider = () => ({
      membershipStatus: 'non-member' as const,
      deliveryFee: 350,
      archetypeName: activeArchetype,
      monthlyAccumulatedFees: 1500,
    });
    const evaluator = new UserContextEvaluator(provider, registry);
    const selector = new StrategySelector();
    return {
      controller: new CheckoutNudgeController(evaluator, selector, registry),
      offerController: new OfferNudgeController(evaluator, selector, registry),
    };
  }, [activeArchetype]);

  return (
    <div style={{
      width: '100%',
      maxWidth: 480,
      margin: '0 auto',
      position: 'relative',
      background: 'white',
      minHeight: '100vh',
    }}>
      <div style={{ width: '100%', overflowX: 'hidden' }}>
        <BasketProvider initialState={INITIAL_BASKET}>
          <TranslationProvider service={translationService}>
            <MenuPage
              controller={controller}
              offerController={offerController}
              userId="demo-user"
              archetypeNames={ARCHETYPE_NAMES}
              activeArchetype={activeArchetype}
              onArchetypeSwitch={setActiveArchetype}
            />
          </TranslationProvider>
        </BasketProvider>
      </div>
    </div>
  );
};

export default App;
