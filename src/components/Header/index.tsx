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
          {hasMounted && connected && (
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] text-[#8B8EA8] uppercase font-bold">Mainnet</span>
              <span className="text-xs text-white">connected</span>
            </div>
          )}
          {hasMounted ? (
            <div className="hidden md:block scale-90 md:scale-100 origin-right">
              <WalletMultiButton className="!bg-[#0D1117] !h-10 !rounded-lg !text-sm !font-bold hover:!opacity-80 transition-opacity" />
            </div>
          ) : (
            <button className="hidden md:block bg-[#0D1117] h-10 rounded-lg px-4 text-sm font-bold text-white opacity-80">
              Select Wallet
            </button>
          )}
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

        <a href="https://solswap.cloud/liquidity/" className="flex flex-col items-center gap-1 group">
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
          <span className="text-[9px] text-[#00D1FF] font-bold uppercase tracking-tighter">Perps</span>
        </Link>

        <div className="relative">
          <button 
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} 
            className="flex flex-col items-center gap-1 group w-full outline-none"
          >
            <div className={`${isMoreMenuOpen ? 'text-white' : 'text-[#8B8EA8] group-hover:text-white'} transition-colors`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </div>
            <span className={`text-[9px] ${isMoreMenuOpen ? 'text-white' : 'text-[#8B8EA8]'} font-medium uppercase tracking-tighter`}>More</span>
          </button>

          {/* Popup Menu */}
          {isMoreMenuOpen && (
            <>
              {/* Invisible overlay to close menu when clicking outside */}
              <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={() => setIsMoreMenuOpen(false)}
              ></div>
              
              {/* Menu Container */}
              <div className="absolute bottom-[calc(100%+8px)] right-0 w-48 bg-[#0D1117] border border-[#2D2E42] rounded-xl shadow-2xl py-2 z-50 animate-fade-in-up">
                
                <a href="https://solswap.cloud/bridge/" className="flex items-center gap-3 px-4 py-3 hover:bg-[#13141F] transition-colors" onClick={() => setIsMoreMenuOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B61FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                  <span className="text-sm text-white font-medium">Bridge</span>
                </a>
                
                <div className="h-[1px] bg-[#2D2E42] w-full my-1"></div>
                
                <Link href="https://solswap.cloud/docs/disclaimer" className="flex items-center justify-between px-4 py-3 hover:bg-[#13141F] transition-colors" onClick={() => setIsMoreMenuOpen(false)}>
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8EA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span className="text-sm text-white font-medium">Disclaimer</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8EA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </Link>

                <Link href="https://docs.solswap.cloud/raydium/" className="flex items-center justify-between px-4 py-3 hover:bg-[#13141F] transition-colors" target="_blank" onClick={() => setIsMoreMenuOpen(false)}>
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8EA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span className="text-sm text-white font-medium">Docs</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8EA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </Link>

                <Link href="https://tally.so/r/n9WZZV" className="flex items-center justify-between px-4 py-3 hover:bg-[#13141F] transition-colors" target="_blank" onClick={() => setIsMoreMenuOpen(false)}>
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8EA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span className="text-sm text-white font-medium">Feedback</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8EA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </Link>

                {/* Socials at bottom */}
                <div className="flex justify-around items-center px-4 py-3 mt-1 bg-[#1A1B2E]/50 border-t border-[#2D2E42]">
                  <Link href="https://twitter.com/SolSwapProtocol" target="_blank" className="text-[#8B8EA8] hover:text-[#00D1FF] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                  </Link>
                  <Link href="https://t.me/raydiumprotocol" target="_blank" className="text-[#8B8EA8] hover:text-[#00D1FF] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-18 8a2.25 2.25 0 0 0 .12 4.192l4.7 1.6L10.2 19.5a2.25 2.25 0 0 0 3.7.8l2.6-2.5 4.3 3.3a2.25 2.25 0 0 0 3.5-1.4l3-15a2.25 2.25 0 0 0-2.102-2.667z"></path></svg>
                  </Link>
                  <Link href="https://discord.com/invite/raydium" target="_blank" className="text-[#8B8EA8] hover:text-[#00D1FF] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-12A4 4 0 0 0 2 6v12a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-12a4 4 0 0 0-4-4ZM8 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2Zm8 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2Z"></path><path d="M6 10c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4"></path></svg>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  );
};
