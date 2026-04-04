import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PERP_MARKETS } from '@/config/markets';
import { useTradingStore } from '@/store/tradingStore';

export const MarketSelector = () => {
  const { selectedMarket, setSelectedMarket } = useTradingStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentMarket = PERP_MARKETS.find(m => m.symbol === selectedMarket) || PERP_MARKETS[0];

  const filteredMarkets = useMemo(() => {
    if (!search) return PERP_MARKETS;
    const q = search.toLowerCase();
    return PERP_MARKETS.filter(m =>
      m.symbol.toLowerCase().includes(q) ||
      m.baseAsset.toLowerCase().includes(q) ||
      m.category?.some(c => c.toLowerCase().includes(q))
    );
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Market Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-[#05070A] hover:bg-[#0D1117] transition-colors rounded-lg border border-transparent hover:border-[#2D2E42]"
      >
        <div className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
        <span className="font-bold text-white text-sm">{currentMarket.symbol}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-[#8B8EA8] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[320px] bg-[#0D1117] border border-[#2D2E42] rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-150">
          {/* Search */}
          <div className="p-3 border-b border-[#1A1B2E]">
            <input
              type="text"
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-[#05070A] border border-[#2D2E42] rounded-lg px-3 py-2 text-sm text-white placeholder-[#525465] outline-none focus:border-[#00D1FF] transition-colors"
            />
          </div>

          {/* Market List */}
          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {filteredMarkets.map((market) => (
              <button
                key={market.symbol}
                onClick={() => {
                  setSelectedMarket(market.symbol);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                  selectedMarket === market.symbol
                    ? 'bg-[#00D1FF]/10 text-white'
                    : 'text-[#8B8EA8] hover:bg-[#161B28] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    selectedMarket === market.symbol ? 'bg-[#00D1FF]' : 'bg-[#525465]'
                  }`} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{market.symbol}</span>
                    <div className="flex gap-1 mt-0.5">
                      {market.category?.slice(0, 2).map(c => (
                        <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1B2E] text-[#525465] uppercase font-bold">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#525465]">
                  {market.baseAsset}
                </span>
              </button>
            ))}
            {filteredMarkets.length === 0 && (
              <div className="p-4 text-center text-sm text-[#525465]">No markets found</div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[#1A1B2E] text-[10px] text-[#525465] text-center">
            {PERP_MARKETS.length} markets available · Powered by Drift Protocol
          </div>
        </div>
      )}
    </div>
  );
};
