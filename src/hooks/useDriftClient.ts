import { useEffect, useState, useCallback } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Buffer } from 'buffer';
import {
  DriftClient,
  Wallet,
  BN,
  PositionDirection,
  OrderType,
  MarketType,
  getUserStatsAccountPublicKey,
  getRevenueShareEscrowAccountPublicKey,
} from '@drift-labs/sdk/lib/browser';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { DRIFT_CONFIG } from '@/config/driftConfig';

if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

// How many revenue-share slots to pre-allocate for the escrow account.
// 10 is enough for any regular user. Costs ~0.002 SOL one-time.
const ESCROW_NUM_ORDERS = 10;

// maxFeeTenthBps: the fee in "tenth of a basis point" units.
// DRIFT_CONFIG.builderInfo.builderFee is in BPS (e.g. 10 bps = 0.10%).
// changeApprovedBuilder expects tenth-bps, so we multiply by 10.
const MAX_FEE_TENTH_BPS = DRIFT_CONFIG.builderInfo.builderFee * 10;

export type OnboardingStatus =
  | 'idle'
  | 'checking'
  | 'needs_onboarding'     // user has no Drift account at all
  | 'needs_escrow'         // has Drift account but no revenue share escrow
  | 'ready';               // fully onboarded, trading can begin

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

  // ─── 1. Initialize DriftClient ──────────────────────────────────────────────
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

        // Use a dummy wallet when the user is not connected so charts & prices load.
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

        // ── Check onboarding state for real wallets ──────────────────────────
        if (wallet) {
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

          setOnboardingStatus(hasEscrow ? 'ready' : 'needs_escrow');
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
  }, [wallet, connection]);

  // ─── 2. Unified "Enable Trading" onboarding ─────────────────────────────────
  /**
   * Handles all onboarding in one atomic transaction batch.
   *
   * FLOW A — Brand new user (no Drift account):
   *   ix[0]: initializeUserStats  (only for sub-account 0)
   *   ix[1]: initializeUser
   *   ix[2]: initializeRevenueShareEscrow
   *   ix[3]: changeApprovedBuilder  → approves SolSwap as their builder
   *
   * FLOW B — Existing user without escrow:
   *   ix[0]: initializeRevenueShareEscrow
   *   ix[1]: changeApprovedBuilder
   *
   * Both flows culminate in a SINGLE wallet signature prompt.
   */
  const enableTrading = useCallback(async () => {
    if (!driftClient || !wallet) throw new Error('Wallet not connected');
    if (onboardingStatus === 'ready') return; // nothing to do

    setIsLoading(true);
    setError(null);

    try {
      const builderPublicKey = DRIFT_CONFIG.builderInfo.builder;
      const instructions: any[] = [];

      if (onboardingStatus === 'needs_onboarding') {
        // ── FLOW A: full initialization ──────────────────────────────────────
        const [initIxs] = await (driftClient as any).getInitializeUserAccountIxs(0);
        instructions.push(...initIxs);
      }

      // Escrow + builder approval (both flows)
      const escrowIx = await (driftClient as any).getInitializeRevenueShareEscrowIx(
        wallet.publicKey,
        ESCROW_NUM_ORDERS
      );
      instructions.push(escrowIx);

      const changeBuilderIx = await (driftClient as any).getChangeApprovedBuilderIx(
        builderPublicKey,
        MAX_FEE_TENTH_BPS,
        true // add = true → register / update the builder
      );
      instructions.push(changeBuilderIx);

      // Build and send as a single transaction
      const tx = await (driftClient as any).buildTransaction(instructions);
      const { txSig } = await (driftClient as any).sendTransaction(tx, [], driftClient.opts);

      console.info('Onboarding tx:', txSig);

      // Update local state
      if (onboardingStatus === 'needs_onboarding') {
        await driftClient.addUser(0);
        setUserInitialized(true);
      }
      setEscrowInitialized(true);
      setOnboardingStatus('ready');

      return txSig;
    } catch (err: any) {
      console.error('enableTrading failed:', err);

      // If the escrow already exists on-chain (race condition / stale check),
      // just mark it as ready instead of surfacing the error to the user.
      if (
        err.message?.includes('already in use') ||
        err.message?.includes('already initialized')
      ) {
        setEscrowInitialized(true);
        setUserInitialized(true);
        setOnboardingStatus('ready');
        return;
      }

      setError(err.message || 'Failed to enable trading');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [driftClient, wallet, onboardingStatus]);

  // ─── 3. Place order (only callable when onboarding is complete) ──────────────
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
      // Builder info is required for revenue share to actually be collected
      builderInfo: DRIFT_CONFIG.builderInfo,
    };

    if (params.orderType === 'limit' && params.limitPrice) {
      orderParams.price = new BN(Math.round(params.limitPrice * 1e6));
    }

    return await driftClient.placePerpOrder(orderParams);
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
    // Legacy field kept so existing components don't break
    userInitialized: onboardingStatus === 'ready',
    escrowInitialized,
    onboardingStatus,
    enableTrading,
    placeOrder,
    closePosition,
  };
};
