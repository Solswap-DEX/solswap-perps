import { useEffect, useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { 
  DriftClient, 
  Wallet, 
} from '@drift-labs/sdk';
import { Connection, Keypair } from '@solana/web3.js';
import { DRIFT_CONFIG } from '@/config/driftConfig';

export const useDriftClient = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [driftClient, setDriftClient] = useState<DriftClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const placeOrder = async (orderParams: any) => {
    if (!driftClient || !wallet) throw new Error('Client or Wallet not connected');
    
    const orderParamsWithBuilder = {
      ...orderParams,
      builderInfo: DRIFT_CONFIG.builderInfo,
    };

    return await (driftClient as any).placePerpOrder(orderParamsWithBuilder);
  };

  return {
    driftClient,
    isConnected,
    isLoading,
    error,
    placeOrder,
  };
};
