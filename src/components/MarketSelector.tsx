import React, { useMemo } from 'react';
import { PERP_MARKETS } from '@/config/markets';
import { useTradingStore } from '@/store/tradingStore';
import { useMarketPrices } from '@/hooks/useMarketPrices';

const MarketTab = ({ market, isActive, onClick, currentPrice }: { market: any, isActive: boolean, onClick: () => void, currentPrice: number | undefined }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all border ${
        isActive
          ? 'bg-[#1A1B2E] border-[#00D1CF] text-white shadow-[0_0_15px_rgba(0,209,207,0.1)]'
          : 'bg-[#0C0D14] border-transparent text-[#8B8EA8] hover:bg-[#1A1B2E] hover:text-white'
      }`}
    >
      <div className="flex flex-col items-start">
        <span className="font-bold text-sm tracking-tight">{market.symbol}</span>
        <span className="text-[10px] text-[#8B8EA8] uppercase">{market.baseAsset} Perpetual</span>
      </div>
      
      <div className="flex flex-col items-end min-w-[80px]">
        <span className="text-sm font-mono font-medium">
          {currentPrice ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '---'}
        </span>
      </div>
    </button>
  );
};

export const MarketSelector = () => {
  const { selectedMarket, setSelectedMarket } = useTradingStore();
  const mints = useMemo(() => PERP_MARKETS.map(m => m.mint), []);
  const { prices } = useMarketPrices(mints);

  return (
    <div className="flex items-center gap-3 p-4 border-b border-[#1A1B2E] bg-[#0C0D14] overflow-x-auto no-scrollbar">
      {PERP_MARKETS.map((market) => (
        <MarketTab
          key={market.symbol}
          market={market}
          isActive={selectedMarket === market.symbol}
          onClick={() => setSelectedMarket(market.symbol)}
          currentPrice={prices[market.mint]}
        />
      ))}
    </div>
  );
};
