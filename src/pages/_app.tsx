import type { AppProps } from 'next/app';
import { SolanaWalletProvider } from '@/providers/WalletProvider';
import { Buffer } from 'buffer';
import { RevenueDebugPanel } from '@/components/RevenueDebugPanel';
import '@/styles/globals.css';

if (typeof window !== 'undefined') {
  window.global = window;
  (window as any).Buffer = Buffer;
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SolanaWalletProvider>
      <Component {...pageProps} />
      {/* Operator debug panel — only renders when ?debug=revenue is in URL */}
      <RevenueDebugPanel />
    </SolanaWalletProvider>
  );
}

export default MyApp;
