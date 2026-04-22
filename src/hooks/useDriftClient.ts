import { useEffect, useState, useCallback, useRef } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Buffer } from 'buffer';
import {
  DriftClient,
  Wallet,
  BN,
  PositionDirection,
  OrderType,
  MarketType,
  getRevenueShareEscrowAccountPublicKey,
} from '@drift-labs/sdk/lib/browser';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { DRIFT_CONFIG } from '@/config/driftConfig';
import { usePreflightCheck } from '@/hooks/usePreflightCheck';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { sendWithRetry } from '@/utils/tx/sendWithRetry';
import { track, trackWalletConnected } from '@/utils/analytics';

if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

// Pre-allocate 10 revenue-share slots. Costs ~0.002 SOL one-time.
const ESCROW_NUM_ORDERS = 10;

// changeApprovedBuilder expects tenth-bps units
const MAX_FEE_TENTH_BPS = DRIFT_CONFIG.builderInfo.builderFee * 10;

export type OnboardingStatus =
  | 'idle'
  | 'checking'
  | 'needs_onboarding'     // no Drift account yet
  | 'needs_escrow'         // has Drift account, no revenue share escrow
  | 'ready';               // fully onboarded

export const useDriftClient = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [driftClient, setDriftClient] = useState<DriftClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInitialized, setUserInitialized] = useState(false);
  const [escrowInitialized, setEscrowInitialized] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>('idle');

  // Persistent onboarding cache (survives page reloads)
  const { markReady, invalidate: invalidateCache, isFresh } = useOnboardingStore();

  // Track previous wallet to detect changes
  const prevWalletRef = useRef<string | null>(null);

  // ─── 1. Initialize DriftClient ──────────────────────────────────────────────
  useEffect(() => {
    let client: DriftClient | null = null;

    const initDrift = async () => {
      setIsLoading(true);
      setError(null);

      // Detect wallet change → invalidate cached state
      const currentWallet = wallet?.publicKey?.toBase58() ?? null;
      if (prevWalletRef.current && prevWalletRef.current !== currentWallet) {
        invalidateCache('wallet_changed');
        track('wallet_disconnected', { prev: prevWalletRef.current?.slice(0, 8) });
      }
      prevWalletRef.current = currentWallet;

      try {
        const driftConnection = new Connection(DRIFT_CONFIG.rpcUrl, {
          wsEndpoint: DRIFT_CONFIG.wsUrl,
          commitment: 'confirmed',
        });

        // Use a dummy wallet when not connected so charts & prices still load
        const providerWallet = wallet || {
          publicKey: Keypair.generate().publicKey,
          signTransaction: async () => { throw new Error('Not connected to a wallet') },
          signAllTransactions: async () => { throw new Error('Not connected to a wallet') },
        };

        client = new DriftClient({
          connection: driftConnection,
          wallet: providerWallet as Wallet,
          env: 'mainnet-beta',
        });

        await client.subscribe();
        setDriftClient(client);
        setIsConnected(true);

        // ── Check onboarding state for real wallets ──────────────────────────
        if (wallet) {
          const walletAddress = wallet.publicKey.toBase58();
          trackWalletConnected(walletAddress);

          // Fast path: use persistent cache if still fresh
          if (isFresh(walletAddress)) {
            setUserInitialized(true);
            setEscrowInitialized(true);
            setOnboardingStatus('ready');
            setIsLoading(false);
            return;
          }

          setOnboardingStatus('checking');

          const hasUser = client.hasUser();
          setUserInitialized(hasUser);

          if (!hasUser) {
            setOnboardingStatus('needs_onboarding');
            return;
          }

          // Check if the RevenueShareEscrow account exists on-chain
          const escrowPk = getRevenueShareEscrowAccountPublicKey(
            client.program.programId,
            wallet.publicKey
          );
          const escrowInfo = await driftConnection.getAccountInfo(escrowPk);
          const hasEscrow = !!escrowInfo;
          setEscrowInitialized(hasEscrow);

          if (hasEscrow) {
            setOnboardingStatus('ready');
            // Update persistent cache
            markReady(
              walletAddress,
              DRIFT_CONFIG.builderInfo.builder.toBase58(),
              MAX_FEE_TENTH_BPS
            );
          } else {
            setOnboardingStatus('needs_escrow');
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
      if (client) client.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, connection]);

  // ─── 2. Unified "Enable Trading" onboarding ─────────────────────────────────
  /**
   * FLOW A — Brand new user: initializeUserStats + initializeUser +
   *           initializeRevenueShareEscrow + changeApprovedBuilder (1 tx)
   * FLOW B — Existing user without escrow: initializeRevenueShareEscrow +
   *           changeApprovedBuilder (1 tx)
   */
  const enableTrading = useCallback(async () => {
    if (!driftClient || !wallet) throw new Error('Wallet not connected');
    if (onboardingStatus === 'ready') return;

    setIsLoading(true);
    setError(null);

    try {
      const builderPublicKey = DRIFT_CONFIG.builderInfo.builder;
      const instructions: any[] = [];

      if (onboardingStatus === 'needs_onboarding') {
        const [initIxs] = await (driftClient as any).getInitializeUserAccountIxs(0);
        instructions.push(...initIxs);
      }

      const escrowIx = await (driftClient as any).getInitializeRevenueShareEscrowIx(
        wallet.publicKey,
        ESCROW_NUM_ORDERS
      );
      instructions.push(escrowIx);

      const changeBuilderIx = await (driftClient as any).getChangeApprovedBuilderIx(
        builderPublicKey,
        MAX_FEE_TENTH_BPS,
        true
      );
      instructions.push(changeBuilderIx);

      const tx = await (driftClient as any).buildTransaction(instructions);

      // Use sendWithRetry for improved success rate
      const txSig = await sendWithRetry(driftClient, tx);
      console.info('[enableTrading] Onboarding tx:', txSig);
      track('escrow_initialized', { txSig: txSig.slice(0, 16) });

      if (onboardingStatus === 'needs_onboarding') {
        await driftClient.addUser(0);
        setUserInitialized(true);
      }
      setEscrowInitialized(true);
      setOnboardingStatus('ready');
      track('builder_approved', { builder: DRIFT_CONFIG.builderInfo.builder.toBase58().slice(0, 8) });

      // Persist to cache
      markReady(
        wallet.publicKey.toBase58(),
        builderPublicKey.toBase58(),
        MAX_FEE_TENTH_BPS
      );

      return txSig;
    } catch (err: any) {
      console.error('enableTrading failed:', err);

      if (
        err.message?.includes('already in use') ||
        err.message?.includes('already initialized')
      ) {
        // Escrow already exists (race / stale check) — just mark ready
        setEscrowInitialized(true);
        setUserInitialized(true);
        setOnboardingStatus('ready');
        if (wallet) {
          markReady(
            wallet.publicKey.toBase58(),
            DRIFT_CONFIG.builderInfo.builder.toBase58(),
            MAX_FEE_TENTH_BPS
          );
        }
        return;
      }

      setError(err.message || 'Failed to enable trading');
      throw err;
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driftClient, wallet, onboardingStatus]);

  // ─── 3. Place order ──────────────────────────────────────────────────────────
  const { runCheck: runPreflightCheck, invalidate: invalidatePreflight } = usePreflightCheck();

  const placeOrder = useCallback(async (params: {
    marketIndex: number;
    direction: 'long' | 'short';
    size: number;
    orderType: 'market' | 'limit';
    limitPrice?: number;
  }) => {
    if (!driftClient || !wallet) throw new Error('Wallet not connected');
    if (onboardingStatus !== 'ready') {
      throw new Error('Please complete trading setup first');
    }

    // Pre-flight: verify escrow + builder approval (cached 5 min)
    await runPreflightCheck(driftClient, wallet.publicKey, enableTrading);

    const direction =
      params.direction === 'long' ? PositionDirection.LONG : PositionDirection.SHORT;

    const baseAssetAmount = new BN(Math.round(params.size * 1e9));

    const orderParams: any = {
      orderType: params.orderType === 'market' ? OrderType.MARKET : OrderType.LIMIT,
      marketType: MarketType.PERP,
      marketIndex: params.marketIndex,
      direction,
      baseAssetAmount,
      reduceOnly: false,
      builderInfo: DRIFT_CONFIG.builderInfo,
    };

    if (params.orderType === 'limit' && params.limitPrice) {
      orderParams.price = new BN(Math.round(params.limitPrice * 1e6));
    }

    // Use sendWithRetry for improved success rate on place-order tx
    const placeTx = await (driftClient as any).buildTransaction(
      [await (driftClient as any).getPlacePerpOrderIx(orderParams)]
    ).catch(() => null);

    if (placeTx) {
      return await sendWithRetry(driftClient, placeTx);
    }

    // Fallback to native SDK call if we cannot extract the ix
    return await driftClient.placePerpOrder(orderParams);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driftClient, wallet, onboardingStatus]);

  // ─── 4. Close position ───────────────────────────────────────────────────────
  const closePosition = useCallback(async (
    marketIndex: number,
    isLong: boolean,
    size: number
  ) => {
    if (!driftClient || !wallet) throw new Error('Wallet not connected');

    const direction = isLong ? PositionDirection.SHORT : PositionDirection.LONG;
    const baseAssetAmount = new BN(Math.round(size * 1e9));

    return await driftClient.placePerpOrder({
      orderType: OrderType.MARKET,
      marketType: MarketType.PERP,
      marketIndex,
      direction,
      baseAssetAmount,
      reduceOnly: true,
      builderInfo: DRIFT_CONFIG.builderInfo,
    } as any);
  }, [driftClient, wallet]);

  return {
    driftClient,
    isConnected,
    isLoading,
    error,
    userInitialized: onboardingStatus === 'ready',
    escrowInitialized,
    onboardingStatus,
    enableTrading,
    placeOrder,
    closePosition,
  };
};
