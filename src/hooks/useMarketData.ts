import { useState, useEffect } from 'react';
import axios from 'axios';

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export const useMarketData = (pool: string, timeframe: string = '1h') => {
  const [data, setData] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Map timeframe to GeckoTerminal format if necessary
      const tf = timeframe === '1D' ? 'day' : timeframe; 
      const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}/ohlcv/${tf}`;
      
      const response = await axios.get(url);
      const ohlcvData = response.data.data.attributes.ohlcv_list;
      
      const formattedData: Candle[] = ohlcvData.map((item: any) => ({
        time: item[0], // GeckoTerminal usually returns unix timestamp in first pos
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
      })).reverse(); // Gecko returns newest first, lightweight-charts needs oldest first

      setData(formattedData);
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

  return { data, isLoading, error };
};
