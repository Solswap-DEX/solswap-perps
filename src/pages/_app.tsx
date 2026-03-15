import type { AppProps } from 'next/app';
import { SolanaWalletProvider } from '@/providers/WalletProvider';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SolanaWalletProvider>
      <Component {...pageProps} />
    </SolanaWalletProvider>
  );
}

export default MyApp;
