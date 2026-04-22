import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { ExodusWalletAdapter } from '@solana/wallet-adapter-exodus';
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

// Frontend wallet operations use public RPC (cheap, no rate limits)
// Helius is reserved for Drift SDK backend operations (logsSubscribe, orderbook, enriched data)
const PUBLIC_RPC = "https://rpc.ankr.com/solana";

export const SolanaWalletProvider = ({ children }: { children: React.ReactNode }) => {
    const network = WalletAdapterNetwork.Mainnet;
    const endpoint = useMemo(() => PUBLIC_RPC, []);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new BackpackWalletAdapter(),
            new TrustWalletAdapter(),
            new ExodusWalletAdapter(),
            new CoinbaseWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
