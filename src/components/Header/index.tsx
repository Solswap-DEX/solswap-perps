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
    <>
      <header className="h-16 border-b border-[#0D1117] bg-[#05070A] flex items-center justify-between px-3 md:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-xl md:text-2xl font-bold text-white">SolSwap</div>
            <span className="bg-[#0D1117] text-[#00D1FF] text-[10px] md:text-xs px-2 py-1 rounded font-mono">PERPS</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="https://solswap.cloud/swap/" className="text-[#8B8EA8] hover:text-white transition-colors">
              Swap
            </Link>
            <Link href="/trade" className="text-white border-b-2 border-[#00D1FF] h-16 flex items-center">
              Perpetuals
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {hasMounted && connected && (
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] text-[#8B8EA8] uppercase font-bold">Mainnet</span>
              <span className="text-xs text-white">connected</span>
            </div>
          )}
          {hasMounted ? (
            <div className="scale-90 md:scale-100 origin-right">
              <WalletMultiButton className="!bg-[#0D1117] !h-10 !rounded-lg !text-sm !font-bold hover:!opacity-80 transition-opacity" />
            </div>
          ) : (
            <button className="bg-[#0D1117] h-10 rounded-lg px-4 text-sm font-bold text-white opacity-80">
              Select Wallet
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#05070A] border-t border-[#0D1117] flex items-center justify-around px-4 z-[100] safe-area-inset-bottom">
        <Link href="https://solswap.cloud/swap/" className="flex flex-col items-center gap-1 group">
          <div className="text-[#8B8EA8] group-hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
          </div>
          <span className="text-[10px] text-[#8B8EA8] font-medium uppercase tracking-tighter">Swap</span>
        </Link>

        <Link href="/trade" className="flex flex-col items-center gap-1 group">
          <div className="text-[#00D1FF]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="20" x2="12" y2="10"></line>
              <line x1="18" y1="20" x2="18" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="16"></line>
            </svg>
          </div>
          <span className="text-[10px] text-[#00D1FF] font-bold uppercase tracking-tighter">Perps</span>
        </Link>

        <div className="flex flex-col items-center gap-1">
          <div className="relative scale-75 origin-center -mt-1">
            <WalletMultiButton className="!bg-[#0D1117] !h-12 !w-12 !rounded-full !flex !items-center !justify-center !p-0 !min-w-0" />
          </div>
          <span className="text-[10px] text-[#8B8EA8] font-medium uppercase tracking-tighter -mt-1">Wallet</span>
        </div>
      </nav>
    </>
  );
};
