import React from 'react';
import { PERP_MARKETS } from '@/config/markets';
import { useTradingStore } from '@/store/tradingStore';

export const MarketSelector = () => {
  const { selectedMarket, setSelectedMarket } = useTradingStore();

  return (
    <div className="flex items-center gap-2 p-4 border-b border-[#1A1B2E]">
      {PERP_MARKETS.map((market) => (
        <button
          key={market.symbol}
          onClick={() => setSelectedMarket(market.symbol)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            selectedMarket === market.symbol
              ? 'bg-[#1A1B2E] text-white'
              : 'text-[#8B8EA8] hover:text-white'
          }`}
        >
          <span className="font-bold">{market.symbol}</span>
          <span className="text-xs text-[#00C896]">+2.4%</span>
        </button>
      ))}
    </div>
  );
};
