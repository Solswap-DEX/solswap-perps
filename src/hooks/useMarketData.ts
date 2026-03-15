import { useState, useEffect } from 'react';
import axios from 'axios';

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

const TIMEFRAME_MAP: Record<string, { tf: string; agg: string }> = {
  '1m': { tf: 'minute', agg: '1' },
  '5m': { tf: 'minute', agg: '5' },
  '15m': { tf: 'minute', agg: '15' },
  '1h': { tf: 'hour', agg: '1' },
  '4h': { tf: 'hour', agg: '4' },
  '1D': { tf: 'day', agg: '1' },
};

export const useMarketData = (pool: string, timeframe: string = '1h') => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { tf, agg } = TIMEFRAME_MAP[timeframe] || TIMEFRAME_MAP['1h'];
      const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}/ohlcv/${tf}?aggregate=${agg}&limit=300`;
      
      const response = await axios.get(url);
      const ohlcvData = response.data.data.attributes.ohlcv_list;
      
      const formattedCandles: Candle[] = ohlcvData.map((item: any) => ({
        time: item[0],
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
      })).sort((a: any, b: any) => a.time - b.time);

      if (formattedCandles.length > 0) {
        setCandles(formattedCandles);
        const lastCandle = formattedCandles[formattedCandles.length - 1];
        setCurrentPrice(lastCandle.close);
        
        // Simple 24h change estimate if not using a specific price API
        const firstCandle = formattedCandles[0];
        const change = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;
        setPriceChange24h(change);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching market data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [pool, timeframe]);

  return { candles, currentPrice, priceChange24h, isLoading, error };
};
