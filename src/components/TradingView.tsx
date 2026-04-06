import React, { useEffect, useRef } from 'react';
import { useTradingStore } from '@/store/tradingStore';
import { PERP_MARKETS } from '@/config/markets';

interface TradingViewProps {
  pool: string;
  timeframe: string;
}

const TIMEFRAME_TO_TV_INTERVAL: Record<string, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1D': 'D',
};

// Next.js fast refresh sometimes remounts the component, we want to ensure the script only loads once.
let tvScriptLoadingPromise: Promise<void> | null = null;

export const TradingView: React.FC<TradingViewProps> = ({ pool, timeframe }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { selectedMarket } = useTradingStore();
  
  // Dynamically resolve TradingView symbol from market config
  const currentMarket = PERP_MARKETS.find(m => m.symbol === selectedMarket);
  const tvSymbol = currentMarket?.tvSymbol || 'BINANCE:SOLUSDT';

  const tvInterval = TIMEFRAME_TO_TV_INTERVAL[timeframe] || '60';

  useEffect(() => {
    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.id = 'tradingview-widget-loading-script';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.type = 'text/javascript';
        script.onload = () => resolve();
        // Check if script already exists (in case of hot reload)
        if (!document.getElementById('tradingview-widget-loading-script')) {
            document.head.appendChild(script);
        } else {
            resolve();
        }
      });
    }

    tvScriptLoadingPromise.then(() => {
      if (chartContainerRef.current && 'TradingView' in window) {
        // @ts-ignore
        new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: tvInterval,
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          backgroundColor: "#05070A",
          gridColor: "#0D1117",
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: chartContainerRef.current.id,
          toolbar_bg: "#05070A",
        });
      }
    });
  }, [tvSymbol, tvInterval]);

  return (
    <div className="w-full h-full min-h-[300px] border-none bg-[#05070A]">
      <div id="tradingview_chart_container" ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};
