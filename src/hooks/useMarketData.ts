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

const TIMEFRAME_MAP: Record<string, string> = {
  '1m': 'minute&aggregate=1',
  '5m': 'minute&aggregate=5',
  '15m': 'minute&aggregate=15',
  '1h': 'hour&aggregate=1',
  '4h': 'hour&aggregate=4',
  '1D': 'day&aggregate=1',
};

export const useMarketData = (pool: string, timeframe: string = '1h') => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const params = TIMEFRAME_MAP[timeframe] || TIMEFRAME_MAP['1h'];
      const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}/ohlcv/${params}&limit=300`;
      
      const response = await fetch(url);
      const json = await response.json();
      const ohlcvData = json.data.attributes.ohlcv_list;
      
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
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, [pool, timeframe]);

  return { candles, currentPrice, priceChange24h, isLoading, error };
};
