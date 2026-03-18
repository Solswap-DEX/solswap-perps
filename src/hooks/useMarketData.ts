import { useState, useEffect, useCallback } from 'react';

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

const TIMEFRAME_MAP: Record<string, { type: string; aggregate: number }> = {
  '1m':  { type: 'minute', aggregate: 1  },
  '5m':  { type: 'minute', aggregate: 5  },
  '15m': { type: 'minute', aggregate: 15 },
  '1h':  { type: 'hour',   aggregate: 1  },
  '4h':  { type: 'hour',   aggregate: 4  },
  '1D':  { type: 'day',    aggregate: 1  },
};

export const useMarketData = (pool: string, timeframe: string = '1h') => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const tf = TIMEFRAME_MAP[timeframe] || TIMEFRAME_MAP['1h'];
      const url = `/api/ohlcv?pool=${pool}&timeframe=${tf.type}&aggregate=${tf.aggregate}&limit=300`;

      const response = await fetch(url);

      if (!response.ok) throw new Error(`OHLCV API error: ${response.status}`);

      const json = await response.json();
      const ohlcvData = json?.data?.attributes?.ohlcv_list;

      if (!ohlcvData || ohlcvData.length === 0) {
        throw new Error('No OHLCV data returned');
      }

      const formattedCandles: Candle[] = ohlcvData
        .map((item: any) => ({
          time: Number(item[0]),
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
        }))
        .filter((c: any) => 
          !isNaN(c.time) && 
          !isNaN(c.open) && 
          !isNaN(c.high) && 
          !isNaN(c.low) && 
          !isNaN(c.close)
        )
        .sort((a: any, b: any) => a.time - b.time);

      // Remove duplicate timestamps which cause lightweight-charts to crash
      const uniqueCandles: Candle[] = [];
      const seenTimes = new Set<number>();
      for (const candle of formattedCandles) {
        if (!seenTimes.has(candle.time)) {
          uniqueCandles.push(candle);
          seenTimes.add(candle.time);
        }
      }

      setCandles(uniqueCandles);
      const lastCandle = uniqueCandles[uniqueCandles.length - 1];
      if (lastCandle) {
        setCurrentPrice(lastCandle.close);
        const firstCandle = uniqueCandles[0];
        const change = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;
        setPriceChange24h(change);
      }
      setError(null);
    } catch (err: any) {
      console.error('useMarketData error:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pool, timeframe]);

  useEffect(() => {
    setIsLoading(true);
    setCandles([]);
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { candles, currentPrice, priceChange24h, isLoading, error };
};
