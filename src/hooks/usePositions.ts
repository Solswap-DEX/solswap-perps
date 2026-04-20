import { useState, useEffect } from 'react';
import { useDriftClient } from './useDriftClient';
import { PERP_MARKETS } from '@/config/markets';

export const usePositions = () => {
  const { driftClient, isConnected } = useDriftClient();
  const [positions, setPositions] = useState<any[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!driftClient || !isConnected) {
      setPositions([]);
      setTotalPnL(0);
      setIsLoading(false);
      return;
    }

    const fetchPositions = async () => {
      try {
        if (!driftClient.hasUser()) {
          setIsLoading(false);
          return;
        }
        const user = driftClient.getUser();
        const activePositions = user.getActivePerpPositions();
        
        const formattedPositions = activePositions.map((pos: any) => {
          const marketIndex = pos.marketIndex;
          
          // Calculate PnL
          const pnl = user.getUnrealizedPNL(false, marketIndex);
          
          const market = PERP_MARKETS.find(m => m.marketIndex === marketIndex);
          const symbol = market ? market.symbol : `MARKET-${marketIndex}`;

          let entryPrice = 0;
          if (pos.baseAssetAmount.toNumber() !== 0) {
             const baseAssets = Math.abs(pos.baseAssetAmount.toNumber()) / 1e9;
             const quoteTokens = Math.abs(pos.quoteEntryAmount.toNumber()) / 1e6;
             entryPrice = baseAssets !== 0 ? quoteTokens / baseAssets : 0;
          }

          let markPrice = 0;
          try {
             const oracle = driftClient.getOracleDataForPerpMarket(marketIndex);
             markPrice = oracle ? oracle.price.toNumber() / 1e6 : 0;
          } catch(e) {}

          let liqPrice = 0;
          try {
             liqPrice = user.liquidationPrice(marketIndex).toNumber() / 1e6;
          } catch(e) {}
          
          return {
            ...pos,
            marketName: symbol,
            pnl: pnl.toNumber() / 1e6, // Drift uses 6 decimals for USDC
            direction: pos.baseAssetAmount.isNeg() ? 'SHORT' : 'LONG',
            entryPrice,
            markPrice,
            liqPrice,
          };
        });

        setPositions(formattedPositions);
        
        const total = formattedPositions.reduce((acc, pos) => acc + pos.pnl, 0);
        setTotalPnL(total);
      } catch (err) {
        console.error('Error fetching positions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();
    const interval = setInterval(fetchPositions, 5000); // 5s refresh
    return () => clearInterval(interval);
  }, [driftClient, isConnected]);

  return { positions, totalPnL, isLoading };
};
