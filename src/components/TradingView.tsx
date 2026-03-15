import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { useMarketData } from '@/hooks/useMarketData';

interface TradingViewProps {
  pool: string;
}

export const TradingView: React.FC<TradingViewProps> = ({ pool }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useMarketData(pool);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0C0D14' },
        textColor: '#8B8EA8',
      },
      grid: {
        vertLines: { color: '#1A1B2E' },
        horzLines: { color: '#1A1B2E' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: '#1A1B2E',
        timeVisible: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00C896',
      downColor: '#FF4D6A',
      borderVisible: false,
      wickUpColor: '#00C896',
      wickDownColor: '#FF4D6A',
    });

    if (data.length > 0) {
      candleSeries.setData(data as CandlestickData[]);
    }

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="relative w-full h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0C0D14]/50 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D1CF]"></div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};
