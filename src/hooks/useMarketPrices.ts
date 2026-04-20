import { useState, useEffect, useCallback } from 'react';

export const useMarketPrices = (pools: string[]) => {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const url = `/api/prices?pools=${pools.join(',')}`;
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.data) {
          setPrices(json.data);
      }
    } catch (err) {
      console.error('Error fetching market prices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pools]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, isLoading };
};
