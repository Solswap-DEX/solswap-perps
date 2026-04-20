/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SelectWalletModal } from './SelectWalletModal';
import { WalletRecentTransactionBoard } from './WalletRecentTransactionBoard';

export const SolWallet = () => {
  const { connected, connecting, wallet, publicKey, disconnect } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBoardOpen, setIsBoardOpen] = useState(false);

  const encodeStr = (str: string | undefined, length: number) => {
    if (!str) return '';
    return `${str.substring(0, length)}...${str.substring(str.length - length)}`;
  };

  const getShorterStr = () => {
      const b58 = publicKey?.toBase58();
      if (!b58) return '';
      // mobile format 5ku...
      return `${b58.substring(0, 3)}...`;
  };

  if (connected && publicKey) {
    return (
      <>
        <div
          className="flex items-center gap-2 cursor-pointer py-1.5 px-3 md:px-4 bg-[#111620] hover:bg-[#1A202C] transition-colors rounded-full"
          onClick={() => setIsBoardOpen(true)}
        >
          {wallet && wallet.adapter.icon && (
            <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-5 h-5 md:w-6 md:h-6 rounded-full" />
          )}
          <span className="text-sm font-bold text-white hidden sm:block">
            {encodeStr(publicKey.toBase58(), 4)}
          </span>
          <span className="text-sm font-bold text-white sm:hidden">
            {getShorterStr()}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <WalletRecentTransactionBoard
          isOpen={isBoardOpen}
          onClose={() => setIsBoardOpen(false)}
          wallet={wallet}
          address={publicKey.toBase58()}
          onDisconnect={disconnect}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={connecting}
        className="bg-[#00D1FF] hover:opacity-80 transition-opacity h-10 rounded-lg px-5 text-sm font-bold text-[#05070A] shadow-[0_0_15px_rgba(0,209,255,0.3)]"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      <SelectWalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
