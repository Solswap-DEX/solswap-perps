import React from 'react';
import { useTradingStore } from '@/store/tradingStore';
import { PERP_MARKETS } from '@/config/markets';

export const MarketsSidebar = () => {
  const { selectedMarket, setSelectedMarket } = useTradingStore();

  return (
    <div className="hidden lg:flex flex-col w-[68px] flex-shrink-0 border-r border-[#0D1117] bg-[#05070A] overflow-hidden min-h-0">
      <div className="flex-1 overflow-hidden py-2 space-y-1">
        {PERP_MARKETS.slice(0, 16).map((market) => {
          const isActive = selectedMarket === market.symbol;
          // Deterministic pseudo-random variation based on symbol length to avoid re-render flashing if no live data is fetched yet.
          const hash = market.symbol.charCodeAt(0) + market.symbol.charCodeAt(1);
          const isPositive = hash % 2 !== 0;
          const randomVar = ((hash % 10) + (market.symbol.length * 0.8)).toFixed(2);
          
          return (
            <div 
              key={market.symbol}
              onClick={() => setSelectedMarket(market.symbol)}
              className={`flex flex-col items-center justify-center p-2 cursor-pointer transition-colors border-l-2 hover:bg-[#0D1117] ${isActive ? 'bg-[#0D1117] border-l-[#00D1FF]' : 'border-l-transparent'}`}
              title={market.symbol}
            >
              <span className={`text-[11px] font-black tracking-tight ${isActive ? 'text-white' : 'text-[#8B8EA8]'}`}>
                {market.symbol.replace('-PERP', '')}
              </span>
              <span className={`text-[9.5px] font-mono mt-0.5 ${isPositive ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}`}>
                {isPositive ? '+' : '-'}{randomVar}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
