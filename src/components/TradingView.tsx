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
  const volumeSeriesRef = useRef<any>(null);
  const { candles, isLoading } = useMarketData(pool, timeframe);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#0C0D14' },
        textColor: '#8B8EA8',
      },
      grid: {
        vertLines: { color: '#1A1B2E' },
        horzLines: { color: '#1A1B2E' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#1A1B2E',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: '#1A1B2E',
        timeVisible: true,
        secondsVisible: false,
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

    const volumeSeries = chart.addHistogramSeries({
      color: '#1A1B2E',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // overlay
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    (candleSeriesRef as any).current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []); // Only on mount

  useEffect(() => {
    if (candleSeriesRef.current && volumeSeriesRef.current && candles.length > 0) {
      candleSeriesRef.current.setData(candles as CandlestickData[]);
      
      const volumeData = candles.map(c => ({
        time: c.time,
        value: c.volume || 0,
        color: c.close >= c.open ? '#00C89644' : '#FF4D6A44',
      }));
      volumeSeriesRef.current.setData(volumeData);
      
      // Auto-scroll to latest
      chartRef.current?.timeScale().scrollToPosition(0, true);
    }
  }, [candles]);

  return (
    <div className="relative w-full h-[400px]">
      {isLoading && candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0C0D14]/50 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D1CF]"></div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};
