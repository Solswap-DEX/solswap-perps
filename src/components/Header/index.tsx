import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false }
);

export const Header = () => {
  const { connected, publicKey } = useWallet();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <header className="h-16 border-b border-[#0D1117] bg-[#05070A] flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-white">SolSwap</div>
          <span className="bg-[#0D1117] text-[#00D1FF] text-xs px-2 py-1 rounded font-mono">PERPS</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link href="https://solswap.cloud/swap/" className="text-[#8B8EA8] hover:text-white transition-colors">
            Swap
          </Link>
          <Link href="/trade" className="text-white border-b-2 border-[#00D1FF] h-16 flex items-center">
            Perpetuals
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {hasMounted && connected && (
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] text-[#8B8EA8] uppercase font-bold">Mainnet</span>
            <span className="text-xs text-white">connected</span>
          </div>
        )}
        {hasMounted ? (
          <WalletMultiButton className="!bg-[#0D1117] !h-10 !rounded-lg !text-sm !font-bold hover:!opacity-80 transition-opacity" />
        ) : (
          <button className="bg-[#0D1117] h-10 rounded-lg px-4 text-sm font-bold text-white opacity-80">
            Select Wallet
          </button>
        )}
      </div>
    </header>
  );
};
