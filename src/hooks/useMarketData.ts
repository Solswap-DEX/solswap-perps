import { useState, useEffect } from 'react';

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

  const fetchData = async () => {
    try {
      const tf = TIMEFRAME_MAP[timeframe] || TIMEFRAME_MAP['1h'];
      const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}/ohlcv/${tf.type}?aggregate=${tf.aggregate}&limit=300`;

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`GeckoTerminal error: ${response.status}`);

      const json = await response.json();
      const ohlcvData = json?.data?.attributes?.ohlcv_list;

      if (!ohlcvData || ohlcvData.length === 0) {
        throw new Error('No OHLCV data returned');
      }

      const formattedCandles: Candle[] = ohlcvData
        .map((item: any) => ({
          time: item[0],
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
        }))
        .sort((a: any, b: any) => a.time - b.time);

      setCandles(formattedCandles);
      const lastCandle = formattedCandles[formattedCandles.length - 1];
      setCurrentPrice(lastCandle.close);
      const firstCandle = formattedCandles[0];
      const change = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;
      setPriceChange24h(change);
      setError(null);
    } catch (err: any) {
      console.error('useMarketData error:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setCandles([]);
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [pool, timeframe]);

  return { candles, currentPrice, priceChange24h, isLoading, error };
};
