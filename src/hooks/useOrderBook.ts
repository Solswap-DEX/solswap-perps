import { useEffect, useState, useCallback } from 'react';
import { useDriftClient } from './useDriftClient';
import { PERP_MARKETS } from '@/config/markets';
import { useTradingStore } from '@/store/tradingStore';

export interface OrderBookEntry {
  price: string;
  size: string;
  total: string;
}

export interface OrderBookData {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
}

export const useOrderBook = () => {
  const { driftClient, isConnected } = useDriftClient();
  const { selectedMarket } = useTradingStore();
  
  const [orderBook, setOrderBook] = useState<OrderBookData>({ asks: [], bids: [] });
  const [isLoading, setIsLoading] = useState(true);

  const currentMarketConfig = PERP_MARKETS.find(m => m.symbol === selectedMarket) || PERP_MARKETS[0];
  const marketIndex = currentMarketConfig.marketIndex;

  const fetchOrderBook = useCallback(async () => {
    if (!driftClient || !isConnected) return;

    try {
      const oraclePrice = await driftClient.getOraclePriceData(marketIndex);
      if (!oraclePrice) return;

      const currentPrice = Number(oraclePrice.price) / 1e6;
      const precision = currentPrice > 1000 ? 1 : 2;

      const perpMarkets = (driftClient as any).perpMarkets;
      const market = perpMarkets?.get(marketIndex);
      
      if (!market) return;

      const bids = [];
      const asks = [];
      
      // Get order book data from Drift
      const orderBookData = (driftClient as any).getPerpOrderBook(marketIndex);
      
      // Process asks (sells) - sorted from lowest to highest
      const sortedAsks = [...(orderBookData.asks || [])]
        .sort((a, b) => Number(a.price) - Number(b.price))
        .slice(0, 15);
      
      let cumulativeTotal = 0;
      for (const order of sortedAsks) {
        const price = Number(order.price) / 1e6;
        const size = Number(order.baseQuantity) / 1e6;
        cumulativeTotal += price * size;
        
        asks.push({
          price: price.toFixed(precision),
          size: size.toFixed(precision === 1 ? 3 : 4),
          total: cumulativeTotal.toFixed(2),
        });
      }

      // Process bids (buys) - sorted from highest to lowest
      const sortedBids = [...(orderBookData.bids || [])]
        .sort((a, b) => Number(b.price) - Number(a.price))
        .slice(0, 15);
      
      cumulativeTotal = 0;
      for (const order of sortedBids) {
        const price = Number(order.price) / 1e6;
        const size = Number(order.baseQuantity) / 1e6;
        cumulativeTotal += price * size;
        
        bids.push({
          price: price.toFixed(precision),
          size: size.toFixed(precision === 1 ? 3 : 4),
          total: cumulativeTotal.toFixed(2),
        });
      }

      setOrderBook({
        asks: asks.reverse(),
        bids: bids,
      });
    } catch (err) {
      console.error('OrderBook fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [driftClient, isConnected, marketIndex]);

  useEffect(() => {
    if (!driftClient || !isConnected) {
      setIsLoading(true);
      return;
    }

    fetchOrderBook();
    
    // Subscribe to order book updates
    const interval = setInterval(fetchOrderBook, 1000);
    
    return () => clearInterval(interval);
  }, [driftClient, isConnected, fetchOrderBook]);

  return {
    orderBook,
    isLoading,
    currentPrice: null, // Will be fetched from useMarketData
  };
};
