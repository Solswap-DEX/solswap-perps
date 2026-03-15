import { create } from 'zustand';

interface TradingState {
  selectedMarket: string;
  orderSide: 'long' | 'short';
  orderType: 'market' | 'limit';
  leverage: number;
  orderSize: string;
  limitPrice: string;
  setSelectedMarket: (market: string) => void;
  setOrderSide: (side: 'long' | 'short') => void;
  setOrderType: (type: 'market' | 'limit') => void;
  setLeverage: (leverage: number) => void;
  setOrderSize: (size: string) => void;
  setLimitPrice: (price: string) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  selectedMarket: 'SOL-PERP',
  orderSide: 'long',
  orderType: 'market',
  leverage: 5,
  orderSize: '',
  limitPrice: '',
  setSelectedMarket: (market) => set({ selectedMarket: market }),
  setOrderSide: (side) => set({ orderSide: side }),
  setOrderType: (type) => set({ orderType: type }),
  setLeverage: (leverage) => set({ leverage }),
  setOrderSize: (size) => set({ orderSize: size }),
  setLimitPrice: (price) => set({ limitPrice: price }),
}));
