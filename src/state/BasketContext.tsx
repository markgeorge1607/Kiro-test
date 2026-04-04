import React, { createContext, useContext, useState, useCallback } from 'react';
import type { BasketState, BasketItem } from '../types';

// ── Context shape ────────────────────────────────────────────────────

export interface BasketContextValue {
  state: BasketState;
  addItem: (item: BasketItem) => void;
  activateTrial: () => void;
}

const BasketContext = createContext<BasketContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────

export interface BasketProviderProps {
  initialState: BasketState;
  children: React.ReactNode;
}

export function BasketProvider({ initialState, children }: BasketProviderProps) {
  const [state, setState] = useState<BasketState>(initialState);

  const addItem = useCallback((item: BasketItem) => {
    setState((prev) => {
      const existing = prev.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return { ...prev, items: [...prev.items, { ...item, quantity: 1 }] };
    });
  }, []);

  const activateTrial = useCallback(() => {
    setState((prev) => ({
      ...prev,
      trialActive: true,
      deliveryFee: 0,
    }));
  }, []);

  return (
    <BasketContext.Provider value={{ state, addItem, activateTrial }}>
      {children}
    </BasketContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useBasket(): BasketContextValue {
  const ctx = useContext(BasketContext);
  if (ctx === null) {
    throw new Error('useBasket must be used within a <BasketProvider>');
  }
  return ctx;
}

export default BasketContext;
