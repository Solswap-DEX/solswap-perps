import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

interface SelectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelectWalletModal: React.FC<SelectWalletModalProps> = ({ isOpen, onClose }) => {
  const { wallets, select } = useWallet();
  const [showUninstalled, setShowUninstalled] = useState(false);

  if (!isOpen) return null;

  const supportedWallets = wallets.filter((w) => w.readyState !== WalletReadyState.Unsupported);
  const recommendedWallets = supportedWallets.filter((w) => w.readyState !== WalletReadyState.NotDetected);
  const uninstalledWallets = supportedWallets.filter((w) => w.readyState === WalletReadyState.NotDetected);

  const handleConnect = (walletName: any) => {
    select(walletName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05070A]/80 backdrop-blur-sm p-4">
      <div className="bg-[#0D1117] border border-[#1b212f] w-full max-w-[36rem] rounded-2xl overflow-hidden flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-[#1b212f]">
          <h2 className="text-[17px] font-bold text-white tracking-wide">Connect wallet</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#1b212f] rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto max-h-[70vh]">
          <div className="mb-6 bg-[#05070A]/50 p-4 rounded-xl text-[13px] text-gray-400 border border-[#141a24]">
             By connecting a wallet, you agree to SolSwap’s Terms of Service and acknowledge that you have read and understand the SolSwap Protocol Disclaimer.
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/90">Choose a wallet</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {recommendedWallets.map((wallet) => (
              <div 
                key={wallet.adapter.name}
                onClick={() => handleConnect(wallet.adapter.name)}
                className="flex items-center gap-3 p-3.5 bg-[#141A24] hover:bg-[#8C6EEF] group cursor-pointer rounded-xl transition-all border border-transparent shadow-sm"
              >
                <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-8 h-8 rounded-lg" />
                <span className="font-bold text-white">{wallet.adapter.name}</span>
                {wallet.adapter.name === 'Phantom' && (
                  <span className="ml-auto text-[10px] bg-[#1a2133] text-[#A69CFF] group-hover:bg-[#7254d3] group-hover:text-white px-2 py-1 rounded-lg font-bold transition-colors">
                    Auto-confirm
                  </span>
                )}
                {wallet.adapter.name === 'Solflare' && (
                  <span className="ml-auto text-[10px] bg-[#1a2133] text-[#A69CFF] group-hover:bg-[#7254d3] group-hover:text-white px-2 py-1 rounded-lg font-bold transition-colors">
                    Auto-approve
                  </span>
                )}
              </div>
            ))}
          </div>

          <div 
            className="flex items-center justify-between p-4 bg-[#141A24] rounded-xl cursor-pointer hover:bg-[#1a222f] transition-colors"
            onClick={() => setShowUninstalled(!showUninstalled)}
          >
            <div className="flex items-center gap-3 text-gray-300 font-medium text-[13px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              Show uninstalled wallets
            </div>
            <div className={`w-[36px] h-[20px] rounded-full transition-colors relative ${showUninstalled ? 'bg-[#8C6EEF]' : 'bg-[#20283A]'}`}>
              <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white transition-all ${showUninstalled ? 'left-[18px]' : 'left-[2px]'}`} />
            </div>
          </div>

          {showUninstalled && (
            <div className="mt-5 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-4 mb-4 opacity-70">
                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#20283A] to-transparent flex-1"></div>
                <span className="text-[12px] text-gray-500 font-medium tracking-wide">UNINSTALLED WALLETS</span>
                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#20283A] to-transparent flex-1"></div>
              </div>
              <div className="grid grid-cols-2 gap-3 opacity-40 pointer-events-none">
                {uninstalledWallets.map((wallet) => (
                  <div key={wallet.adapter.name} className="flex items-center gap-3 p-3 bg-[#111620] rounded-xl border border-[#20283A]">
                    <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-7 h-7 rounded-lg grayscale" />
                    <span className="font-bold text-gray-400 text-sm">{wallet.adapter.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#05070A] border-t border-[#1b212f] hidden md:block">
           <div className="flex justify-between items-center text-sm text-gray-400">
             <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <circle cx="12" cy="12" r="10"></circle>
                   <line x1="12" y1="16" x2="12" y2="12"></line>
                   <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                New to SolSwap wallets?
             </div>
             <a href="https://docs.solswap.cloud/" target="_blank" className="hover:text-white transition-colors flex items-center gap-1 font-medium bg-[#141A24] px-3 py-1.5 rounded-lg border border-[#1b212f]">
                Tour & Instructions
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
             </a>
           </div>
        </div>
      </div>
    </div>
  );
};
