import { useState, useEffect } from 'react';
import { useDriftClient } from './useDriftClient';

export const usePositions = () => {
  const { driftClient, isConnected } = useDriftClient();
  const [positions, setPositions] = useState<any[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!driftClient || !isConnected) return;

    const fetchPositions = async () => {
      try {
        const user = driftClient.getUser();
        const activePositions = user.getActivePerpPositions();
        
        const formattedPositions = activePositions.map((pos: any) => {
          const marketIndex = pos.marketIndex;
          
          // Calculate PnL (simplified for UI)
          const pnl = user.getUnrealizedPNL(false, marketIndex);
          
          return {
            ...pos,
            marketName: `MARKET-${marketIndex}`, // Replace with symbol lookup
            pnl: pnl.toNumber() / 10**6, // Drift uses 6 decimals for USDC
            direction: pos.baseAssetAmount.isNeg() ? 'SHORT' : 'LONG',
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
