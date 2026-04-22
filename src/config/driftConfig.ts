import { PublicKey } from "@solana/web3.js";

export const DRIFT_CONFIG = {
  builderInfo: {
    builder: new PublicKey(
      process.env.NEXT_PUBLIC_BUILDER_WALLET || "5KUA4a4qFusTvJeSquKsBSEPvhiVedvaj8hE8pVp2vmz"
    ),
    builderFee: Number(process.env.NEXT_PUBLIC_FEE_BPS || "10"), // bps
  },
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ||
    "https://mainnet.helius-rpc.com/?api-key=690983ee-d6ad-49bb-880e-7a9673c12244",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ||
    "wss://mainnet.helius-rpc.com/?api-key=690983ee-d6ad-49bb-880e-7a9673c12244",
  network: "mainnet-beta" as const,
  defaultMarket: "SOL-PERP",
  defaultLeverage: 5,
  maxLeverage: 20,
};

export const validateLeverage = (user: any, requestedLeverage: number): { valid: boolean; reason?: string } => {
  if (!user) return { valid: true };
  try {
    const health = user.getHealth();
    if (requestedLeverage > 10 && health < 40) {
      return { valid: false, reason: 'Health too low for high leverage' };
    }
  } catch (e) {
    // ignore
  }
  return { valid: true };
};
