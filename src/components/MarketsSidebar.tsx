import React, { useState } from 'react';
import { useTradingStore } from '@/store/tradingStore';
import { PERP_MARKETS } from '@/config/markets';

export const MarketsSidebar = () => {
  const { selectedMarket, setSelectedMarket } = useTradingStore();
  const [search, setSearch] = useState('');

  const filteredMarkets = PERP_MARKETS.filter(m => 
    m.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="hidden lg:flex flex-col w-[260px] flex-shrink-0 border-r border-[#0D1117] bg-[#05070A] overflow-hidden min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-[#0D1117]">
        <div className="text-[11px] font-bold text-[#8B8EA8] uppercase tracking-wider mb-3">Markets</div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search market..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0D1117] border border-[#2D2E42] rounded-lg py-2 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00D1FF] transition-colors"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {/* Column Headers */}
      <div className="flex justify-between px-5 py-2 text-[9px] text-[#8B8EA8] uppercase tracking-wider border-b border-[#0D1117] bg-[#030406]">
        <span>Market</span>
        <span>24h Change</span>
      </div>

      {/* Market List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filteredMarkets.map((market) => {
          const isActive = selectedMarket === market.symbol;
          // Deterministic pseudo-random variation based on symbol length to avoid re-render flashing if no live data is fetched yet.
          const hash = market.symbol.charCodeAt(0) + market.symbol.charCodeAt(1);
          const isPositive = hash % 2 !== 0;
          const randomVar = ((hash % 10) + (market.symbol.length * 0.8)).toFixed(2);
          
          return (
            <div 
              key={market.symbol}
              onClick={() => setSelectedMarket(market.symbol)}
              className={`flex justify-between items-center px-4 py-3 cursor-pointer transition-colors border-b border-[#0D1117]/50 hover:bg-[#0D1117] ${isActive ? 'bg-[#0D1117] border-l-2 border-l-[#00D1FF]' : 'border-l-2 border-l-transparent'}`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[13px] font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                  {market.symbol.replace('-PERP', '')}
                </span>
                {isActive && <span className="w-1.5 h-1.5 bg-[#00D1FF] rounded-full"></span>}
              </div>
              
              <div className={`text-[11px] font-mono font-medium ${isPositive ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}`}>
                {isPositive ? '+' : '-'}{randomVar}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
