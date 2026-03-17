import { useState, useEffect, useCallback } from 'react';

export const useMarketPrices = (mints: string[]) => {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const url = `/api/prices?mints=${mints.join(',')}`;
      const response = await fetch(url);
      const json = await response.json();
      
      if (json.data && json.data.attributes && json.data.attributes.token_prices) {
          const priceMap = json.data.attributes.token_prices;
          const formattedPrices: Record<string, number> = {};
          Object.entries(priceMap).forEach(([mint, price]) => {
            formattedPrices[mint] = parseFloat(price as string);
          });
          setPrices(formattedPrices);
      }
    } catch (err) {
      console.error('Error fetching market prices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [mints]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, isLoading };
};
