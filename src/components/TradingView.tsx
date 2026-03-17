import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickData, CrosshairMode, ISeriesApi } from 'lightweight-charts';
import { useMarketData } from '@/hooks/useMarketData';

interface TradingViewProps {
  pool: string;
  timeframe: string;
}

export const TradingView: React.FC<TradingViewProps> = ({ pool, timeframe }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'>>(null);
  const { candles, isLoading } = useMarketData(pool, timeframe);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const getContainerHeight = () => {
      const h = chartContainerRef.current?.clientHeight || 0;
      // Fallback height so the chart can render even if container
      // is temporarily 0 during layout/hydration.
      return h > 0 ? h : 320;
    };

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: getContainerHeight(),
      layout: {
        background: { type: ColorType.Solid, color: '#0C0D14' },
        textColor: '#8B8EA8',
      },
      grid: {
        vertLines: { color: '#1A1B2E' },
        horzLines: { color: '#1A1B2E' },
      },
      timeScale: {
        borderColor: '#1A1B2E',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1A1B2E',
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00C896',
      downColor: '#FF4D6A',
      borderUpColor: '#00C896',
      borderDownColor: '#FF4D6A',
      wickUpColor: '#00C896',
      wickDownColor: '#FF4D6A',
    });

    chartRef.current = chart;
    (candleSeriesRef as any).current = candleSeries;

    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: getContainerHeight(),
        });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (candleSeriesRef.current && candles.length > 0) {
      candleSeriesRef.current.setData(candles as CandlestickData[]);
    }
  }, [candles]);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      {isLoading && candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0C0D14]/50 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D1CF]"></div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};
