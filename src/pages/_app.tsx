import type { AppProps } from 'next/app';
import Head from 'next/head';
import { SolanaWalletProvider } from '@/providers/WalletProvider';
import { Buffer } from 'buffer';
import { RevenueDebugPanel } from '@/components/RevenueDebugPanel';
import { NetworkStatusBar } from '@/components/NetworkStatusBar';
import '@/styles/globals.css';

if (typeof window !== 'undefined') {
  window.global = window;
  (window as any).Buffer = Buffer;
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="SolSwap Perpetuals — Trade perpetual futures on Solana with up to 20x leverage." />
        <meta property="og:title" content="SolSwap Perpetuals" />
        <meta property="og:description" content="Trade perpetual futures on Solana with up to 20x leverage." />
        <meta property="og:url" content="https://perps.solswap.cloud/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SolSwap Perpetuals" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SolSwapProtocol" />
        <meta name="twitter:title" content="SolSwap Perpetuals" />
        <meta name="twitter:description" content="Trade perpetual futures on Solana with up to 20x leverage." />
        <link rel="manifest" href="/manifest.json" />
        <title>SolSwap Perpetuals — Trade on Solana</title>
      </Head>
      <SolanaWalletProvider>
        <Component {...pageProps} />
        {/* Operator debug panel — only renders when ?debug=revenue is in URL */}
        <RevenueDebugPanel />
        {/* Platform Network Status Indicator */}
        <NetworkStatusBar />
      </SolanaWalletProvider>
    </>
  );
}

export default MyApp;

