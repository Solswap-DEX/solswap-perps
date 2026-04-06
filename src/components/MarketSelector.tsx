import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PERP_MARKETS } from '@/config/markets';
import { useTradingStore } from '@/store/tradingStore';

export const MarketSelector = () => {
  const { selectedMarket, setSelectedMarket } = useTradingStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

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

  // Calculate position when opening
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Recalculate on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
    if (isOpen) setSearch('');
  };

  const handleSelect = (symbol: string) => {
    setSelectedMarket(symbol);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <>
      {/* Selected Market Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center gap-3 px-4 py-3 bg-[#05070A] hover:bg-[#0D1117] transition-colors rounded-lg border border-transparent hover:border-[#2D2E42] flex-shrink-0"
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

      {/* Dropdown Portal */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-[320px] bg-[#0D1117] border border-[#2D2E42] rounded-xl shadow-2xl overflow-hidden"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 9999,
            animation: 'fadeSlideIn 150ms ease-out',
          }}
        >
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
                onClick={() => handleSelect(market.symbol)}
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
        </div>,
        document.body
      )}

      {/* Portal animation styles */}
      {isOpen && createPortal(
        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>,
        document.head
      )}
    </>
  );
};
