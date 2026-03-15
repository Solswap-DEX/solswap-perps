import React from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const Header = () => {
  const { connected, publicKey } = useWallet();

  return (
    <header className="h-16 border-b border-[#1A1B2E] bg-[#0C0D14] flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-white">SolSwap</div>
          <span className="bg-[#1A1B2E] text-[#00D1CF] text-xs px-2 py-1 rounded font-mono">PERPS</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link href="https://solswap.cloud/swap/" className="text-[#8B8EA8] hover:text-white transition-colors">
            Swap
          </Link>
          <Link href="/trade" className="text-white border-b-2 border-[#00D1CF] h-16 flex items-center">
            Perpetuals
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {connected && (
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] text-[#8B8EA8] uppercase font-bold">Mainnet</span>
            <span className="text-xs text-white">connected</span>
          </div>
        )}
        <WalletMultiButton className="!bg-[#1A1B2E] !h-10 !rounded-lg !text-sm !font-bold hover:!opacity-80 transition-opacity" />
      </div>
    </header>
  );
};
