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

  const generateMockOrderBook = useCallback((price: number): OrderBookData => {
    const precision = price > 1000 ? 1 : 2;
    const bids: OrderBookEntry[] = [];
    const asks: OrderBookEntry[] = [];

    // Generate 5 asks (above current price)
    let cumulativeAskTotal = 0;
    for (let i = 1; i <= 5; i++) {
      const p = price + (i * (price * 0.0005));
      const s = Math.random() * 5 + 0.1;
      cumulativeAskTotal += p * s;
      asks.push({
        price: p.toFixed(precision),
        size: s.toFixed(3),
        total: cumulativeAskTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      });
    }

    // Generate 5 bids (below current price)
    let cumulativeBidTotal = 0;
    for (let i = 1; i <= 5; i++) {
      const p = price - (i * (price * 0.0005));
      const s = Math.random() * 5 + 0.1;
      cumulativeBidTotal += p * s;
      bids.push({
        price: p.toFixed(precision),
        size: s.toFixed(3),
        total: cumulativeBidTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      });
    }

    return {
      asks: asks.reverse(),
      bids,
    };
  }, []);

  const fetchOrderBook = useCallback(async () => {
    // Show mock data when Drift isn't ready but we do have a base price.
    if ((!driftClient || !isConnected) && basePrice) {
      setOrderBook(generateMockOrderBook(basePrice));
      setIsLoading(false);
      return;
    }

    if (!driftClient || !isConnected) return;

    try {
      const sdk = driftClient as any;
      
      // Get the perp market
      const perpMarket = sdk.perpMarkets?.get(marketIndexRef.current);
      if (!perpMarket && basePrice) {
        setOrderBook(generateMockOrderBook(basePrice));
        return;
      }
      if (!perpMarket) return;

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
        if (basePrice) setOrderBook(generateMockOrderBook(basePrice));
        return;
      }
      
      if (!orderBookData || ((orderBookData.asks || []).length === 0 && (orderBookData.bids || []).length === 0)) {
        if (basePrice) setOrderBook(generateMockOrderBook(basePrice));
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
      if (basePrice) setOrderBook(generateMockOrderBook(basePrice));
    } finally {
      setIsLoading(false);
    }
  }, [driftClient, isConnected, basePrice, generateMockOrderBook]);

  useEffect(() => {
    if (!driftClient || !isConnected) {
      if (basePrice) {
        setOrderBook(generateMockOrderBook(basePrice));
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
      return;
    }

    fetchOrderBook();
    
    const interval = setInterval(fetchOrderBook, 1000);
    
    return () => clearInterval(interval);
  }, [driftClient, isConnected, fetchOrderBook, basePrice, generateMockOrderBook]);

  return {
    orderBook,
    isLoading,
  };
};
