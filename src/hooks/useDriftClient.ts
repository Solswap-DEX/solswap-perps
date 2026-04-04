import { useEffect, useState, useCallback } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Buffer } from 'buffer';
import {
  DriftClient,
  Wallet,
  BN,
  BASE_PRECISION,
  PRICE_PRECISION,
  PositionDirection,
  OrderType,
  MarketType,
} from '@drift-labs/sdk/lib/browser';
import { Connection, Keypair } from '@solana/web3.js';
import { DRIFT_CONFIG } from '@/config/driftConfig';

if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

export const useDriftClient = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [driftClient, setDriftClient] = useState<DriftClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInitialized, setUserInitialized] = useState(false);

  useEffect(() => {
    let client: DriftClient | null = null;

    const initDrift = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const driftConnection = new Connection(DRIFT_CONFIG.rpcUrl, {
          wsEndpoint: DRIFT_CONFIG.wsUrl,
          commitment: 'confirmed',
        });

        // Use a dummy wallet if user isn't connected to view data
        const providerWallet = wallet || {
          publicKey: Keypair.generate().publicKey,
          signTransaction: async (tx: any) => tx,
          signAllTransactions: async (txs: any) => txs,
        };

        client = new DriftClient({
          connection: driftConnection,
          wallet: providerWallet as Wallet,
          env: 'mainnet-beta',
        });

        await client.subscribe();
        setDriftClient(client);
        setIsConnected(true);

        // Check if user has an existing Drift account
        if (wallet) {
          try {
            const hasUser = client.hasUser();
            setUserInitialized(hasUser);
          } catch {
            setUserInitialized(false);
          }
        }
      } catch (err: any) {
        console.error('Failed to init DriftClient:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initDrift();

    return () => {
      if (client) {
        client.unsubscribe();
      }
    };
  }, [wallet, connection]);

  /**
   * Initialize user account on Drift if it doesn't exist yet.
   */
  const initializeUser = useCallback(async () => {
    if (!driftClient || !wallet) throw new Error('Client or Wallet not connected');
    if (userInitialized) return; // Already initialized

    try {
      await (driftClient as any).initializeUserAccount();
      setUserInitialized(true);
    } catch (err: any) {
      // User might already exist — that's ok
      if (err.message?.includes('already in use') || err.message?.includes('already initialized')) {
        setUserInitialized(true);
      } else {
        throw err;
      }
    }
  }, [driftClient, wallet, userInitialized]);

  /**
   * Place a real perpetual order on Drift Protocol.
   * @param params.marketIndex - Drift market index (SOL=0, BTC=1, ETH=2)
   * @param params.direction - 'long' | 'short'
   * @param params.size - Base asset amount (e.g. 1.5 for 1.5 SOL)
   * @param params.orderType - 'market' | 'limit'
   * @param params.limitPrice - Price in USD (only for limit orders)
   */
  const placeOrder = useCallback(async (params: {
    marketIndex: number;
    direction: 'long' | 'short';
    size: number;
    orderType: 'market' | 'limit';
    limitPrice?: number;
  }) => {
    if (!driftClient || !wallet) throw new Error('Client or Wallet not connected');

    // Ensure user has an account
    if (!userInitialized) {
      await initializeUser();
    }

    const direction = params.direction === 'long'
      ? PositionDirection.LONG
      : PositionDirection.SHORT;

    // Convert human-readable size to BN with BASE_PRECISION (1e9)
    const baseAssetAmount = new BN(Math.round(params.size * 1e9));

    const orderParams: any = {
      orderType: params.orderType === 'market' ? OrderType.MARKET : OrderType.LIMIT,
      marketType: MarketType.PERP,
      marketIndex: params.marketIndex,
      direction,
      baseAssetAmount,
      reduceOnly: false,
    };

    // Add price for limit orders
    if (params.orderType === 'limit' && params.limitPrice) {
      orderParams.price = new BN(Math.round(params.limitPrice * 1e6)); // PRICE_PRECISION = 1e6
    }

    // Attach builderInfo for revenue sharing
    orderParams.builderInfo = DRIFT_CONFIG.builderInfo;

    const txSig = await driftClient.placePerpOrder(orderParams);
    return txSig;
  }, [driftClient, wallet, userInitialized, initializeUser]);

  /**
   * Close an existing position by placing a reduce-only order.
   */
  const closePosition = useCallback(async (marketIndex: number, isLong: boolean, size: number) => {
    if (!driftClient || !wallet) throw new Error('Client or Wallet not connected');

    const direction = isLong ? PositionDirection.SHORT : PositionDirection.LONG;
    const baseAssetAmount = new BN(Math.round(size * 1e9));

    const orderParams: any = {
      orderType: OrderType.MARKET,
      marketType: MarketType.PERP,
      marketIndex,
      direction,
      baseAssetAmount,
      reduceOnly: true,
      builderInfo: DRIFT_CONFIG.builderInfo,
    };

    const txSig = await driftClient.placePerpOrder(orderParams);
    return txSig;
  }, [driftClient, wallet]);

  return {
    driftClient,
    isConnected,
    isLoading,
    error,
    userInitialized,
    initializeUser,
    placeOrder,
    closePosition,
  };
};
