import React, { useState, useMemo } from 'react';
import { BasketProvider } from './state/BasketContext';
import MenuPage from './menu/MenuPage';
import { CheckoutNudgeController } from './checkout/CheckoutNudgeController';
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

  const controller = useMemo(() => {
    const registry = createDefaultRegistry();
    const provider = () => ({
      membershipStatus: 'non-member' as const,
      deliveryFee: 350,
      archetypeName: activeArchetype,
      monthlyAccumulatedFees: 1500,
    });
    const evaluator = new UserContextEvaluator(provider, registry);
    const selector = new StrategySelector();
    return new CheckoutNudgeController(evaluator, selector, registry);
  }, [activeArchetype]);

  return (
    <div style={{
      width: '100%',
      maxWidth: 375,
      margin: '0 auto',
      position: 'relative',
      background: 'white',
      minHeight: '100vh',
    }}>
      <div style={{ width: '100%', overflowX: 'hidden' }}>
        <BasketProvider initialState={INITIAL_BASKET}>
          <MenuPage
            controller={controller}
            userId="demo-user"
            archetypeNames={ARCHETYPE_NAMES}
            activeArchetype={activeArchetype}
            onArchetypeSwitch={setActiveArchetype}
          />
        </BasketProvider>
      </div>
    </div>
  );
};

export default App;
