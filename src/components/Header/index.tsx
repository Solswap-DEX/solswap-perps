import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolWallet } from '../SolWallet';

export const Header = () => {
  const { connected, publicKey } = useWallet();
  const [hasMounted, setHasMounted] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <>
      <header className="h-16 border-b border-[#0D1117] bg-[#05070A] flex items-center justify-between px-3 md:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="SolSwap" width={120} height={30} style={{ objectFit: 'contain', height: '30px', width: 'auto' }} />
            <span className="bg-[#0D1117] text-[#00D1FF] text-[10px] md:text-xs px-2 py-1 rounded font-mono">PERPS</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 font-medium text-[15px]">
            <a href="https://solswap.cloud/swap/" className="text-[#8B8EA8] hover:text-white transition-colors">
              Swap
            </a>
            <a href="https://solswap.cloud/liquidity-pools/" className="text-[#8B8EA8] hover:text-white transition-colors">
              Liquidity
            </a>
            <a href="https://solswap.cloud/portfolio/" className="text-[#8B8EA8] hover:text-white transition-colors">
              Portfolio
            </a>
            <a href="https://solswap.cloud/bridge/" className="text-[#8B8EA8] hover:text-white transition-colors">
              Bridge
            </a>
            <Link href="/trade" className="text-white border-b-2 border-[#00D1FF] h-16 flex items-center font-bold">
              Perpetuals
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[10px] text-[#8B8EA8] uppercase font-bold">Mainnet</span>
            <span className="text-[11px] text-white/50">{connected ? 'connected' : 'disconnected'}</span>
          </div>
          {hasMounted && <SolWallet />}
        </div>
      </header>

      {/* Mobile Bottom Navbar (5 items standard) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#05070A] border-t border-[#0D1117] flex items-center justify-around px-2 z-[100] safe-area-inset-bottom">
        <a href="https://solswap.cloud/swap/" className="flex flex-col items-center gap-1 group">
          <div className="text-[#8B8EA8] group-hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
          </div>
          <span className="text-[9px] text-[#8B8EA8] font-medium uppercase tracking-tighter">Swap</span>
        </a>

        <a href="https://solswap.cloud/liquidity-pools/" className="flex flex-col items-center gap-1 group">
          <div className="text-[#8B8EA8] group-hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <span className="text-[9px] text-[#8B8EA8] font-medium uppercase tracking-tighter">Liquidity</span>
        </a>

        <a href="https://solswap.cloud/portfolio/" className="flex flex-col items-center gap-1 group">
          <div className="text-[#8B8EA8] group-hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <span className="text-[9px] text-[#8B8EA8] font-medium uppercase tracking-tighter">Portfolio</span>
        </a>

        <Link href="/trade" className="flex flex-col items-center gap-1 group">
          <div className="text-[#00D1FF]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="20" x2="12" y2="10"></line>
              <line x1="18" y1="20" x2="18" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="16"></line>
            </svg>
          </div>
          <span className="text-[9px] text-[#00D1FF] font-medium uppercase tracking-tighter">Trade</span>
        </Link>
      </nav>
    </>
  );
};
