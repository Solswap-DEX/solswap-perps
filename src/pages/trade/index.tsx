import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { MarketSelector } from '@/components/MarketSelector';
import { TradingView } from '@/components/TradingView';
import { OrderForm } from '@/components/OrderForm';
import { PositionsTable } from '@/components/PositionsTable';
import { PERP_MARKETS } from '@/config/markets';
import { useTradingStore } from '@/store/tradingStore';
import { useMarketData } from '@/hooks/useMarketData';

const TradePage = () => {
  const { selectedMarket } = useTradingStore();
  const [timeframe, setTimeframe] = useState('1h');
  const currentMarket = PERP_MARKETS.find(m => m.symbol === selectedMarket) || PERP_MARKETS[0];
  const { currentPrice } = useMarketData(currentMarket.geckoPool, timeframe);

  // Mock Order Book Logic
  const [orderBook, setOrderBook] = useState<{ asks: any[], bids: any[] }>({ asks: [], bids: [] });

  useEffect(() => {
    if (!currentPrice) return;

    const generateOrderBook = (basePrice: number) => {
      const asks = Array.from({length: 10}, (_, i) => ({
        price: (basePrice * (1 + (i+1) * 0.001)).toFixed(2),
        size: (Math.random() * 100 + 10).toFixed(1),
        total: (Math.random() * 1000 + 100).toFixed(0),
      }))
      const bids = Array.from({length: 10}, (_, i) => ({
        price: (basePrice * (1 - (i+1) * 0.001)).toFixed(2),
        size: (Math.random() * 100 + 10).toFixed(1),
        total: (Math.random() * 1000 + 100).toFixed(0),
      }))
      return { asks: asks.reverse(), bids }
    }

    setOrderBook(generateOrderBook(currentPrice));

    const interval = setInterval(() => {
      setOrderBook(generateOrderBook(currentPrice));
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  // Mock Recent Trades Logic
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    if (!currentPrice) return;
    
    const generateInitialTrades = () => Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      price: (currentPrice + (Math.random() - 0.5) * currentPrice * 0.005).toFixed(2),
      size: (Math.random() * 49.9 + 0.1).toFixed(2),
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      time: new Date(Date.now() - Math.random() * 60000).toLocaleTimeString(),
    }));

    setTrades(generateInitialTrades());

    const interval = setInterval(() => {
      setTrades(prev => [
        {
          id: Date.now(),
          price: (currentPrice + (Math.random() - 0.5) * currentPrice * 0.005).toFixed(2),
          size: (Math.random() * 49.9 + 0.1).toFixed(2),
          side: Math.random() > 0.5 ? 'BUY' : 'SELL',
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 19)
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0C0D14] text-white overflow-x-hidden">
      <Header />
      
      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Mobile: Order Form on TOP */}
        <div className="lg:hidden w-full p-4 border-b border-[#1A1B2E] bg-[#0C0D14]">
           <div className="bg-[#1A1B2E] rounded-xl p-4 border border-[#2D2E42]">
             <OrderForm />
           </div>
        </div>

        {/* Zone A: Chart & Market Info (65% width on Desktop) */}
        <div className="flex-1 lg:flex-[0.65] flex flex-col border-r border-[#1A1B2E] overflow-y-auto lg:overflow-hidden">
          <div className="flex justify-between items-center bg-[#0C0D14] sticky top-0 z-20">
            <MarketSelector />
            <div className="flex gap-1 p-2 bg-[#0C0D14]">
              {['1m', '5m', '15m', '1h', '4h', '1D'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    timeframe === tf ? 'bg-[#1A1B2E] text-[#00D1CF]' : 'text-[#8B8EA8] hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[400px] lg:min-h-0 relative">
            <TradingView pool={currentMarket.geckoPool} timeframe={timeframe} />
          </div>
          
          {/* Bottom section of Zone A (Order Book & Trades) */}
          <div className="flex flex-col md:flex-row h-auto md:h-[350px] border-t border-[#1A1B2E]">
            <div className="flex-1 border-r border-[#1A1B2E] flex flex-col overflow-hidden min-h-[300px] md:min-h-0">
              <div className="p-4 border-b border-[#1A1B2E]">
                <div className="text-xs font-bold text-[#8B8EA8] uppercase tracking-wider">Order Book</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px]">
                <div className="grid grid-cols-3 text-[#8B8EA8] mb-2 uppercase text-[10px]">
                    <span>Price</span>
                    <span className="text-right">Size</span>
                    <span className="text-right">Total</span>
                </div>
                {orderBook.asks.map((ask, i) => (
                    <div key={`ask-${i}`} className="grid grid-cols-3 text-[#FF4D6A] py-0.5">
                        <span>{ask.price}</span>
                        <span className="text-right text-[#8B8EA8]">{ask.size}</span>
                        <span className="text-right text-[#8B8EA8]">${ask.total}</span>
                    </div>
                ))}
                <div className="my-2 py-2 border-y border-[#1A1B2E] text-center text-lg font-bold text-[#00D1CF]">
                    ${currentPrice?.toLocaleString() || '---'}
                </div>
                {orderBook.bids.map((bid, i) => (
                    <div key={`bid-${i}`} className="grid grid-cols-3 text-[#00C896] py-0.5">
                        <span>{bid.price}</span>
                        <span className="text-right text-[#8B8EA8]">{bid.size}</span>
                        <span className="text-right text-[#8B8EA8]">${bid.total}</span>
                    </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden min-h-[300px] md:min-h-0">
              <div className="p-4 border-b border-[#1A1B2E]">
                <div className="text-xs font-bold text-[#8B8EA8] uppercase tracking-wider">Recent Trades</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px]">
                <div className="grid grid-cols-3 text-[#8B8EA8] mb-2 uppercase text-[10px]">
                    <span>Price</span>
                    <span className="text-right">Size</span>
                    <span className="text-right">Time</span>
                </div>
                {trades.map(trade => (
                    <div key={trade.id} className="grid grid-cols-3 py-1">
                        <span className={trade.side === 'BUY' ? 'text-[#00C896]' : 'text-[#FF4D6A]'}>
                            {trade.price}
                        </span>
                        <span className="text-right text-[#8B8EA8]">{trade.size}</span>
                        <span className="text-right text-[#8B8EA8]">{trade.time}</span>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Zone B: Order Form (35% width on Desktop) */}
        <div className="hidden lg:flex lg:flex-[0.35] lg:w-[400px] flex-col p-4 border-l border-[#1A1B2E] bg-[#0C0D14] overflow-y-auto">
          <div className="text-xs font-bold text-[#8B8EA8] mb-4 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00D1CF] animate-pulse"></span>
            Trade Execution
          </div>
          <div className="bg-[#1A1B2E] rounded-xl p-6 border border-[#2D2E42] shadow-2xl">
             <OrderForm />
          </div>

          <div className="mt-8 flex flex-col gap-4 px-2 mb-8">
            <div className="flex justify-between text-xs">
              <span className="text-[#8B8EA8]">Available Balance</span>
              <span className="text-white font-mono font-bold font-medium tracking-tight">0.00 USDC</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#8B8EA8]">Current Margin Usage</span>
              <span className="text-white font-mono font-bold font-medium tracking-tight">0.00 USDC</span>
            </div>
            <div className="flex justify-between text-xs pt-4 border-t border-[#1A1B2E]">
              <span className="text-[#8B8EA8]">Account Health</span>
              <span className="text-[#00C896] font-bold">100% SECURE</span>
            </div>
          </div>
        </div>
      </main>

      {/* Zone C: Account Panels */}
      <footer className="h-auto lg:h-[300px] border-t border-[#1A1B2E] bg-[#0C0D14] flex flex-col">
        <div className="flex overflow-x-auto gap-8 border-b border-[#1A1B2E] px-6 no-scrollbar">
          <button className="text-[#00D1CF] border-b-2 border-[#00D1CF] py-4 font-bold text-xs uppercase tracking-widest whitespace-nowrap">Positions</button>
          <button className="text-[#8B8EA8] py-4 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors whitespace-nowrap">Open Orders</button>
          <button className="text-[#8B8EA8] py-4 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors whitespace-nowrap">Trade History</button>
        </div>
        <div className="flex-1 overflow-y-auto bg-[#08090F] min-h-[200px]">
          <PositionsTable />
        </div>
      </footer>
    </div>
  );
};

export default TradePage;
