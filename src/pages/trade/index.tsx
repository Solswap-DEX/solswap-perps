import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { MarketSelector } from '@/components/MarketSelector';
import { TradingView } from '@/components/TradingView';
import { OrderForm } from '@/components/OrderForm';
import { PositionsTable } from '@/components/PositionsTable';
import { OpenOrdersTable } from '@/components/OpenOrdersTable';
import { FillsTable } from '@/components/FillsTable';
import { AssetsPanel } from '@/components/AssetsPanel';
import { LiquidationPanel } from '@/components/LiquidationPanel';
import { PERP_MARKETS } from '@/config/markets';
import { useTradingStore } from '@/store/tradingStore';
import { useMarketData } from '@/hooks/useMarketData';
import { useOrderBook } from '@/hooks/useOrderBook';

type FooterTab = 'positions' | 'orders' | 'fills' | 'assets' | 'liquidation';

const TradePage = () => {
  const { selectedMarket } = useTradingStore();
  const [timeframe, setTimeframe] = useState('1h');
  const [footerTab, setFooterTab] = useState<FooterTab>('positions');
  const currentMarket = PERP_MARKETS.find(m => m.symbol === selectedMarket) || PERP_MARKETS[0];
  const { currentPrice } = useMarketData(currentMarket.geckoPool, timeframe);
  const { orderBook } = useOrderBook(currentPrice ?? null);

  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    if (!currentPrice) return;
    const precision = currentPrice > 1000 ? 1 : 2;
    const generateInitialTrades = () => Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      price: (currentPrice + (Math.random() - 0.5) * currentPrice * 0.002).toFixed(precision),
      size: (Math.random() * 10 + 0.01).toFixed(3),
      side: Math.random() > 0.45 ? 'BUY' : 'SELL',
      time: new Date(Date.now() - Math.random() * 600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }));
    setTrades(generateInitialTrades());
    const interval = setInterval(() => {
      setTrades(prev => [
        {
          id: Date.now(),
          price: (currentPrice + (Math.random() - 0.5) * currentPrice * 0.001).toFixed(precision),
          size: (Math.random() * 5 + 0.01).toFixed(3),
          side: Math.random() > 0.5 ? 'BUY' : 'SELL',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 24)
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, [currentPrice]);

  return (
    <div className="flex flex-col h-screen bg-[#05070A] text-white overflow-hidden">
      <Header />
      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        <div className="lg:hidden w-full p-4 border-b border-[#0D1117] bg-[#05070A] flex-shrink-0">
           <div className="bg-[#0D1117] rounded-xl p-4 border border-[#2D2E42]">
             <OrderForm />
           </div>
        </div>
        
        {/* Main Content Area: Chart + Sidebar */}
        <div className="flex-1 flex flex-col border-r border-[#0D1117] overflow-hidden min-h-0">
          <div className="flex justify-between items-center bg-[#05070A] flex-shrink-0">
            <MarketSelector />
            <div className="flex gap-1 p-2 bg-[#05070A]">
              {['1m', '5m', '15m', '1h', '4h', '1D'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    timeframe === tf ? 'bg-[#0D1117] text-[#00D1FF]' : 'text-[#8B8EA8] hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 flex flex-row overflow-hidden min-h-0">
            {/* Chart Area */}
            <div className="flex-1 relative border-r border-[#0D1117] min-w-0">
              <TradingView pool={currentMarket.geckoPool} timeframe={timeframe} />
            </div>

            {/* Order Book & Trades Strip (Vertical Sidebar) */}
            <div className="w-[300px] flex flex-col overflow-hidden bg-[#05070A] flex-shrink-0">
              {/* Order Book Section */}
              <div className="flex-[3] flex flex-col overflow-hidden border-b border-[#0D1117]">
                <div className="p-3 bg-[#05070A] border-b border-[#0D1117] flex-shrink-0">
                  <div className="text-[10px] font-bold text-[#8B8EA8] uppercase tracking-wider">Order Book</div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-3 font-mono text-[10px]">
                  <div className="grid grid-cols-3 text-[#525465] mb-2 uppercase text-[9px] sticky top-0 bg-[#05070A] py-1 z-10 border-b border-[#0D1117]/50">
                      <span>Price (USDC)</span>
                      <span className="text-right">Size ({currentMarket.baseAsset})</span>
                      <span className="text-right">Total</span>
                  </div>
                  {orderBook.asks.map((ask, i) => (
                      <div key={`ask-${i}`} className="grid grid-cols-3 text-[#FF4D6D] py-0.5 hover:bg-[#FF4D6D]/5 transition-colors">
                          <span>{ask.price}</span>
                          <span className="text-right text-[#8B8EA8]">{ask.size}</span>
                          <span className="text-right text-[#525465]">${ask.total.split('.')[0]}</span>
                      </div>
                  ))}
                  <div className="my-2 py-2 border-y border-[#0D1117]/50 text-center text-sm font-bold text-[#00FFA3] bg-[#00FFA3]/5">
                      ${currentPrice?.toLocaleString() || '---'}
                  </div>
                  {orderBook.bids.map((bid, i) => (
                      <div key={`bid-${i}`} className="grid grid-cols-3 text-[#00FFA3] py-0.5 hover:bg-[#00FFA3]/5 transition-colors">
                          <span>{bid.price}</span>
                          <span className="text-right text-[#8B8EA8]">{bid.size}</span>
                          <span className="text-right text-[#525465]">${bid.total.split('.')[0]}</span>
                      </div>
                  ))}
                </div>
              </div>

              {/* Recent Trades Section */}
              <div className="flex-[2] flex flex-col overflow-hidden">
                <div className="p-3 bg-[#05070A] border-b border-[#0D1117] flex-shrink-0">
                  <div className="text-[10px] font-bold text-[#8B8EA8] uppercase tracking-wider">Recent Trades</div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-3 font-mono text-[10px]">
                  <div className="grid grid-cols-3 text-[#525465] mb-2 uppercase text-[9px] border-b border-[#0D1117]/50 py-1">
                      <span>Price (USDC)</span>
                      <span className="text-right">Size ({currentMarket.baseAsset})</span>
                      <span className="text-right">Time</span>
                  </div>
                  {trades.map(trade => (
                      <div key={trade.id} className="grid grid-cols-3 py-1 hover:bg-[#0D1117]/30 transition-colors">
                          <span className={trade.side === 'BUY' ? 'text-[#00FFA3]' : 'text-[#FF4D6D]'}>
                              {trade.price}
                          </span>
                          <span className="text-right text-[#8B8EA8]">{trade.size}</span>
                          <span className="text-right text-[#525465]">{trade.time.split(' ')[0]}</span>
                      </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone B: Order Form (Desktop) */}
        <div className="hidden lg:flex flex-col w-[350px] flex-shrink-0 p-4 border-l border-[#0D1117] bg-[#05070A] overflow-y-auto min-h-0">
          <div className="text-xs font-bold text-[#8B8EA8] mb-4 uppercase tracking-wider flex items-center gap-2 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse"></span>
            Trade Execution
          </div>
          <div className="bg-[#0D1117] rounded-xl p-6 border border-[#2D2E42] shadow-2xl flex-shrink-0">
             <OrderForm />
          </div>
          <div className="mt-6 flex flex-col gap-4 px-2 mb-6 flex-shrink-0">
            <div className="flex justify-between text-xs">
              <span className="text-[#8B8EA8]">Available Balance</span>
              <span className="text-white font-mono font-bold font-medium tracking-tight">0.00 USDC</span>
            </div>
            <div className="flex justify-between text-xs pt-4 border-t border-[#0D1117]">
              <span className="text-[#8B8EA8]">Account Health</span>
              <span className="text-[#00FFA3] font-bold">100% SECURE</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="h-[200px] border-t border-[#0D1117] bg-[#05070A] flex flex-col flex-shrink-0">
        <div className="flex gap-8 border-b border-[#0D1117] px-6 flex-shrink-0 overflow-x-auto no-scrollbar">
          {['positions', 'orders', 'fills', 'assets', 'liquidation'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFooterTab(tab as FooterTab)}
              className={`py-3 font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all ${
                footerTab === tab
                  ? 'text-[#00D1FF] border-b-2 border-[#00D1FF]'
                  : 'text-[#8B8EA8] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto bg-[#05070A]">
          {footerTab === 'positions' && <PositionsTable />}
          {footerTab === 'orders' && <OpenOrdersTable />}
          {footerTab === 'fills' && <FillsTable />}
          {footerTab === 'assets' && <AssetsPanel />}
          {footerTab === 'liquidation' && <LiquidationPanel />}
        </div>
      </footer>
    </div>
  );
};

export default TradePage;
