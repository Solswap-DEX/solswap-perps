import { useEffect, useState, useCallback, useRef } from 'react';
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

export const useOrderBook = (basePrice: number | null = null) => {
  const { driftClient, isConnected } = useDriftClient();
  const { selectedMarket } = useTradingStore();
  
  const [orderBook, setOrderBook] = useState<OrderBookData>({ asks: [], bids: [] });
  const [isLoading, setIsLoading] = useState(true);
  const marketIndexRef = useRef(0);

  const currentMarketConfig = PERP_MARKETS.find(m => m.symbol === selectedMarket) || PERP_MARKETS[0];
  const marketIndex = currentMarketConfig.marketIndex;
  marketIndexRef.current = marketIndex;

  // Mock generation removed to prevent UI hallucinations on connection failure

  const fetchOrderBook = useCallback(async () => {
    if (!driftClient || !isConnected) {
      setOrderBook({ asks: [], bids: [] });
      setIsLoading(false);
      return;
    }

    try {
      const sdk = driftClient as any;
      
      // Get the perp market
      const perpMarket = sdk.perpMarkets?.get(marketIndexRef.current);
      if (!perpMarket) {
        setOrderBook({ asks: [], bids: [] });
        return;
      }

      // Get oracle price
      let currentPrice = 0;
      try {
        const oracle = await sdk.getOraclePriceDataForPerp(marketIndexRef.current);
        if (oracle) {
          currentPrice = Number(oracle.price) / 1e6;
        }
      } catch (e) {
        // If oracle fails, try to get from order book
      }
      
      const precision = currentPrice > 1000 ? 1 : 2;

      const bids: OrderBookEntry[] = [];
      const asks: OrderBookEntry[] = [];
      
      // Get order book from Drift SDK
      let orderBookData = null;
      try {
        orderBookData = sdk.getPerpOrderBook(marketIndexRef.current);
      } catch (e) {
        console.error('Failed to get order book:', e);
        setOrderBook({ asks: [], bids: [] });
        return;
      }
      
      if (!orderBookData || ((orderBookData.asks || []).length === 0 && (orderBookData.bids || []).length === 0)) {
        setOrderBook({ asks: [], bids: [] });
        return;
      }

      // Process asks (sells) - sorted from lowest to highest
      const rawAsks = orderBookData.asks || [];
      const sortedAsks = [...rawAsks]
        .sort((a: any, b: any) => Number(a.price) - Number(b.price))
        .slice(0, 5);
      
      let cumulativeTotal = 0;
      for (const order of sortedAsks) {
        const price = Number(order.price) / 1e6;
        const size = Number(order.baseQuantity || order.quantity || 0) / 1e6;
        cumulativeTotal += price * size;
        
        asks.push({
          price: price.toFixed(precision),
          size: size.toFixed(precision === 1 ? 3 : 4),
          total: cumulativeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        });
      }

      // Process bids (buys) - sorted from highest to lowest
      const rawBids = orderBookData.bids || [];
      const sortedBids = [...rawBids]
        .sort((a: any, b: any) => Number(b.price) - Number(a.price))
        .slice(0, 5);
      
      cumulativeTotal = 0;
      for (const order of sortedBids) {
        const price = Number(order.price) / 1e6;
        const size = Number(order.baseQuantity || order.quantity || 0) / 1e6;
        cumulativeTotal += price * size;
        
        bids.push({
          price: price.toFixed(precision),
          size: size.toFixed(precision === 1 ? 3 : 4),
          total: cumulativeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        });
      }

      setOrderBook({
        asks: asks.reverse(),
        bids: bids,
      });
    } catch (err) {
      console.error('OrderBook fetch error:', err);
      setOrderBook({ asks: [], bids: [] });
    } finally {
      setIsLoading(false);
    }
  }, [driftClient, isConnected]);

  useEffect(() => {
    if (!driftClient || !isConnected) {
      setOrderBook({ asks: [], bids: [] });
      setIsLoading(false);
      return;
    }

    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 10000);
    return () => clearInterval(interval);
  }, [driftClient, isConnected, fetchOrderBook]);

  return {
    orderBook,
    isLoading,
  };
};
