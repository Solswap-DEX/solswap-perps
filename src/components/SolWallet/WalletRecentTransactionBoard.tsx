import React, { useEffect, useState } from 'react';
import { Wallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface WalletRecentTransactionBoardProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet | null;
  address: string;
  onDisconnect: () => void;
}

export const WalletRecentTransactionBoard: React.FC<WalletRecentTransactionBoardProps> = ({ 
  isOpen, onClose, wallet, address, onDisconnect 
}) => {
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && address) {
      let subscriptionId: number | null = null;
      let isMounted = true;
      const pubKey = new PublicKey(address);

      const getBalance = async () => {
        try {
          const bal = await connection.getBalance(pubKey);
          if (isMounted) {
            setBalance(bal / LAMPORTS_PER_SOL);
          }
        } catch (error) {
          console.error("Error fetching balance", error);
        }
      };
      getBalance();
      
      try {
        subscriptionId = connection.onAccountChange(pubKey, (accountInfo) => {
          if (isMounted) {
            setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
          }
        });
      } catch (e) {
         console.error("PubSub error", e);
      }

      return () => {
        isMounted = false;
        if (subscriptionId !== null && connection) {
          connection.removeAccountChangeListener(subscriptionId).catch(console.error);
        }
      };
    }
  }, [isOpen, address, connection]);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    // Simple visual feedback could be added here
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-[#05070A]/50 backdrop-blur-[2px]" onClick={onClose}>
      <div 
        className="w-full md:w-[400px] h-full md:h-auto md:max-h-[85vh] bg-[#0b0e14] border-l md:border border-[#1b212f] md:rounded-2xl md:mt-[72px] md:mr-6 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.6)] animate-in slide-in-from-right md:slide-in-from-top-4 duration-300 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center flex-col p-6 border-b border-[#1b212f] relative bg-[#0D1117] md:rounded-t-2xl">
          <button onClick={onClose} className="absolute right-4 top-4 p-1 rounded-lg hover:bg-[#1b212f] text-gray-400 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <div className="w-[72px] h-[72px] rounded-full bg-[#141a24] border-4 border-[#1b212f] overflow-hidden mb-5 p-[2px] relative shadow-lg mt-2">
             <img src={wallet?.adapter.icon} alt={wallet?.adapter.name} className="w-full h-full object-cover rounded-full" />
          </div>
          
          <div className="flex items-center gap-2 group cursor-pointer bg-[#141A24] px-4 py-1.5 rounded-full border border-[#1b212f] hover:border-[#8C6EEF] transition-colors" onClick={copyToClipboard}>
            <h2 className="text-[15px] font-bold text-white tracking-widest opacity-80">{address.substring(0, 4)}...{address.substring(address.length - 4)}</h2>
            <svg className="text-gray-500 group-hover:text-[#8C6EEF] transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </div>
          
          <div className="flex flex-col items-center gap-1 mt-6 bg-[#0b0e14] border border-[#1b212f] rounded-2xl w-full p-4 hover:border-[#2a344a] transition-colors">
             <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Total Balance</span>
             <div className="text-[32px] font-bold text-white tracking-tight flex items-baseline gap-1.5">
               {balance !== null ? balance.toFixed(4) : '...' } 
               <span className="text-[16px] text-[#00D1FF] font-black uppercase">SOL</span>
             </div>
             <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full border border-[rgba(0,255,163,0.1)]">
               <div className="w-2 h-2 rounded-full bg-[#00FFA3] shadow-[0_0_8px_#00FFA3] animate-pulse"></div>
               <span className="text-[11px] font-bold text-[#00FFA3]/80 uppercase tracking-wide">Mainnet Connected</span>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 place-content-center bg-gradient-to-b from-[#0b0e14] to-[#05070A]">
            <div className="flex flex-col items-center justify-center text-center text-gray-500 h-40">
                <svg className="mb-4 opacity-20" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <p className="font-semibold text-gray-400">No recent transactions</p>
                <p className="text-[13px] mt-1.5 text-gray-600 max-w-[200px]">Your recent SolSwap transactions will appear here</p>
            </div>
        </div>

        <div className="p-4 border-t border-[#1b212f] bg-[#05070A] md:rounded-b-2xl">
          <button 
            onClick={() => {
              onDisconnect();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#141a24] hover:bg-[#FF4D6D]/10 text-gray-300 hover:text-[#FF4D6D] border border-transparent hover:border-[#FF4D6D]/30 rounded-xl font-bold transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Disconnect Wallet
          </button>
        </div>
      </div>
    </div>
  );
};
