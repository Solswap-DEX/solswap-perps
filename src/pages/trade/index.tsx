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

  const [orderBook, setOrderBook] = useState<{ asks: any[], bids: any[] }>({ asks: [], bids: [] });

  useEffect(() => {
    if (!currentPrice) return;
    const generateOrderBook = (basePrice: number) => {
      const precision = basePrice > 1000 ? 1 : 2;
      const asks = Array.from({length: 12}, (_, i) => {
        const price = basePrice * (1 + (i + 1) * 0.0005 + Math.random() * 0.0002);
        return {
          price: price.toFixed(precision),
          size: (Math.random() * (20 / (i + 1)) + 0.1).toFixed(precision === 1 ? 2 : 1),
          total: (Math.random() * 5000 + 500).toFixed(0),
        };
      });
      const bids = Array.from({length: 12}, (_, i) => {
        const price = basePrice * (1 - (i + 1) * 0.0005 - Math.random() * 0.0002);
        return {
          price: price.toFixed(precision),
          size: (Math.random() * (20 / (i + 1)) + 0.1).toFixed(precision === 1 ? 2 : 1),
          total: (Math.random() * 5000 + 500).toFixed(0),
        };
      });
      return { asks: asks.reverse(), bids };
    };
    setOrderBook(generateOrderBook(currentPrice));
    const interval = setInterval(() => {
      setOrderBook(generateOrderBook(currentPrice));
    }, 2500);
    return () => clearInterval(interval);
  }, [currentPrice]);

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
    <div className="flex flex-col h-screen bg-[#0C0D14] text-white overflow-hidden">
      <Header />
      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        <div className="lg:hidden w-full p-4 border-b border-[#1A1B2E] bg-[#0C0D14] flex-shrink-0">
           <div className="bg-[#1A1B2E] rounded-xl p-4 border border-[#2D2E42]">
             <OrderForm />
           </div>
        </div>
        <div className="flex-1 flex flex-col border-r border-[#1A1B2E] overflow-hidden min-h-0">
          <div className="flex justify-between items-center bg-[#0C0D14] flex-shrink-0">
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
          <div className="flex-1 min-h-0 relative">
            <TradingView pool={currentMarket.geckoPool} timeframe={timeframe} />
          </div>
          <div className="flex flex-row h-[260px] border-t border-[#1A1B2E] flex-shrink-0">
            <div className="flex-1 border-r border-[#1A1B2E] flex flex-col overflow-hidden">
              <div className="p-3 border-b border-[#1A1B2E] flex-shrink-0">
                <div className="text-xs font-bold text-[#8B8EA8] uppercase tracking-wider">Order Book</div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px]">
                <div className="grid grid-cols-3 text-[#8B8EA8] mb-2 uppercase text-[10px] sticky top-0 bg-[#0C0D14] z-10">
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
                <div className="my-1 py-1 border-y border-[#1A1B2E] text-center text-base font-bold text-[#00D1CF]">
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
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-[#1A1B2E] flex-shrink-0">
                <div className="text-xs font-bold text-[#8B8EA8] uppercase tracking-wider">Recent Trades</div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px]">
                <div className="grid grid-cols-3 text-[#8B8EA8] mb-2 uppercase text-[10px] sticky top-0 bg-[#0C0D14] z-10">
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
        <div className="hidden lg:flex flex-col w-[380px] flex-shrink-0 p-4 border-l border-[#1A1B2E] bg-[#0C0D14] overflow-y-auto min-h-0">
          <div className="text-xs font-bold text-[#8B8EA8] mb-4 uppercase tracking-wider flex items-center gap-2 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#00D1CF] animate-pulse"></span>
            Trade Execution
          </div>
          <div className="bg-[#1A1B2E] rounded-xl p-6 border border-[#2D2E42] shadow-2xl flex-shrink-0">
             <OrderForm />
          </div>
          <div className="mt-6 flex flex-col gap-4 px-2 mb-6 flex-shrink-0">
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
      <footer className="h-[200px] border-t border-[#1A1B2E] bg-[#0C0D14] flex flex-col flex-shrink-0">
        <div className="flex gap-8 border-b border-[#1A1B2E] px-6 flex-shrink-0">
          <button className="text-[#00D1CF] border-b-2 border-[#00D1CF] py-3 font-bold text-xs uppercase tracking-widest whitespace-nowrap">Positions</button>
          <button className="text-[#8B8EA8] py-3 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors whitespace-nowrap">Open Orders</button>
          <button className="text-[#8B8EA8] py-3 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors whitespace-nowrap">Trade History</button>
        </div>
        <div className="flex-1 overflow-y-auto bg-[#08090F]">
          <PositionsTable />
        </div>
      </footer>
    </div>
  );
};

export default TradePage;
