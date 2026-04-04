import { PublicKey } from "@solana/web3.js";

export const DRIFT_CONFIG = {
  builderInfo: {
    builder: new PublicKey(
      "5KUA4a4qFusTvJeSquKsBSEPvhiVedvaj8hE8pVp2vmz"
    ),
    builderFee: 10, // 10 bps = 0.10% per trade
  },
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ||
    "https://mainnet.helius-rpc.com/?api-key=690983ee-d6ad-49bb-880e-7a9673c12244",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ||
    "wss://mainnet.helius-rpc.com/?api-key=690983ee-d6ad-49bb-880e-7a9673c12244",
  network: "mainnet-beta" as const,
  defaultMarket: "SOL-PERP",
  defaultLeverage: 5,
};
