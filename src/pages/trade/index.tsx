import React from 'react';
import { Header } from '@/components/Header';
import { MarketSelector } from '@/components/MarketSelector';
import { TradingView } from '@/components/TradingView';
import { OrderForm } from '@/components/OrderForm';
import { PositionsTable } from '@/components/PositionsTable';
import { PERP_MARKETS } from '@/config/markets';
import { useTradingStore } from '@/store/tradingStore';

const TradePage = () => {
  const { selectedMarket } = useTradingStore();
  const currentMarket = PERP_MARKETS.find(m => m.symbol === selectedMarket) || PERP_MARKETS[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#0C0D14]">
      <Header />
      
      <main className="flex flex-1 overflow-hidden">
        {/* Zone A: Chart & Market Info */}
        <div className="flex-1 flex flex-col border-r border-[#1A1B2E]">
          <MarketSelector />
          <div className="flex-1">
            <TradingView pool={currentMarket.geckoPool} />
          </div>
          
          {/* Bottom section of Zone A (Order Book & Trades placeholder) */}
          <div className="flex flex-1 border-t border-[#1A1B2E]">
            <div className="flex-1 border-r border-[#1A1B2E] p-4">
              <div className="text-xs font-bold text-[#8B8EA8] mb-4 uppercase tracking-wider">Order Book</div>
              <div className="text-sm text-[#8B8EA8]">Loading order book...</div>
            </div>
            <div className="flex-1 p-4">
              <div className="text-xs font-bold text-[#8B8EA8] mb-4 uppercase tracking-wider">Recent Trades</div>
              <div className="text-sm text-[#8B8EA8]">Loading trades...</div>
            </div>
          </div>
        </div>

        {/* Zone B: Order Form */}
        <div className="w-[400px] flex flex-col p-4 border-l border-[#1A1B2E]">
          <div className="text-sm font-bold text-[#8B8EA8] mb-4 uppercase tracking-wider">Trading</div>
          <div className="bg-[#1A1B2E] rounded-xl p-6 border border-[#2D2E42]">
             <OrderForm />
          </div>

          <div className="mt-6 flex flex-col gap-4 px-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#8B8EA8]">Available Balance</span>
              <span className="text-white font-mono">0.00 USDC</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#8B8EA8]">Account Health</span>
              <span className="text-[#00C896] font-bold">100%</span>
            </div>
          </div>
        </div>
      </main>

      {/* Zone C: Account Panels */}
      <footer className="h-[250px] border-t border-[#1A1B2E] bg-[#0C0D14] flex flex-col">
        <div className="flex gap-8 border-b border-[#1A1B2E] px-6">
          <button className="text-white border-b-2 border-[#00D1CF] py-4 font-bold text-sm uppercase tracking-wider">Positions</button>
          <button className="text-[#8B8EA8] py-4 font-bold text-sm uppercase tracking-wider">Open Orders</button>
          <button className="text-[#8B8EA8] py-4 font-bold text-sm uppercase tracking-wider">Trade History</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <PositionsTable />
        </div>
      </footer>
    </div>
  );
};

export default TradePage;
