import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

interface SelectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelectWalletModal: React.FC<SelectWalletModalProps> = ({ isOpen, onClose }) => {
  const featuredWalletNames = ['Phantom', 'Solflare', 'Backpack', 'Trust', 'Exodus', 'Gem Wallet', 'Atomic'];
  const { select, wallets } = useWallet();
  const [showUninstalled, setShowUninstalled] = useState(false);
  const uninstalledWallets = wallets.filter((w) => w.readyState === WalletReadyState.NotDetected || w.readyState === WalletReadyState.Unsupported);

  const handleConnect = (walletName: any) => {
    select(walletName);
    onClose();
  };

  const handleSimulatedConnect = (name: string) => {
    alert(`${name} is fully integrated in the main Swap application. Switch to swap.solswap.cloud to use this method.`);
  };

  // Helper to find wallet by partial name or adapter name
  const getWallet = (name: string) => {
    return wallets.find(w => w.adapter.name.toLowerCase().includes(name.toLowerCase()));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05070A]/80 backdrop-blur-sm p-4">
      <div className="bg-[#11131E] border border-[#1b212f]/40 w-full max-w-[38rem] rounded-2xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-200 text-[#E2E8F0] tracking-wide relative">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-[19px] font-bold text-white tracking-normal">Standardized Wallet Connection</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#1A1D2B] rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-2 pb-6 flex-1 overflow-y-auto max-h-[85vh]">
          <div className="mb-6 bg-[rgba(0,209,255,0.08)] p-4 rounded-xl text-[14px] text-[#00D1FF] font-medium leading-relaxed border border-[#00D1FF]/20">
             SolSwap supports multiple wallets for a seamless trading experience on Solana.
          </div>

          <div className="flex items-center justify-between mb-4 mt-2">
             <h3 className="text-[15px] font-bold text-white/90">Premium Wallets</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {featuredWalletNames.map((name) => {
              const wallet = getWallet(name);
              const icon = wallet?.adapter.icon || `https://solswap.cloud/images/wallets/${name.toLowerCase().replace(' ', '-')}.png`;
              
              return (
                <div 
                  key={name}
                  onClick={() => wallet ? handleConnect(wallet.adapter.name) : handleSimulatedConnect(name)}
                  className="flex items-center gap-3 p-4 bg-[#0A0D14] hover:bg-[#161B28] group cursor-pointer rounded-xl transition-all border border-[#1b212f]/80 hover:border-[#00D1FF]/40"
                >
                  <img 
                    src={icon} 
                    alt={name} 
                    className={`w-8 h-8 rounded-lg shadow-md ${!wallet ? 'grayscale border border-white/10' : ''}`}
                    onError={(e) => {
                      e.currentTarget.src = 'https://solswap.cloud/logo/logo-only-icon.svg';
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-[15px] drop-shadow-sm">{name}</span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {wallet ? (wallet.readyState === WalletReadyState.Installed ? 'Installed' : 'Ready') : 'Web Version'}
                    </span>
                  </div>
                  
                  {/* Badge Standardization */}
                  <div className="ml-auto flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-[#A69CFF] font-semibold border border-[#A69CFF]/30 px-1.5 py-0.5 rounded bg-[#A69CFF]/5">
                       {name === 'Phantom' || name === 'Solflare' ? 'AUTO-CONFIRM' : 'PREMIUM'}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Additional Custom Injections */}
            <div 
                onClick={() => handleSimulatedConnect('Ledger')}
                className="flex items-center gap-3 p-4 bg-[#0A0D14] hover:bg-[#161B28] group cursor-pointer rounded-xl transition-all border border-[#1b212f]/80"
            >
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <rect x="2" y="7" width="20" height="10" rx="2"></rect>
                      <circle cx="18" cy="12" r="1.5" fill="white"></circle>
                   </svg>
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-white text-[15px]">Hardware Wallet</span>
                    <span className="text-[10px] text-gray-500 font-medium">Ledger / Trezor</span>
                </div>
            </div>
          </div>

          <div className="h-[1px] w-full bg-[#1b212f]/60 mb-6"></div>

          <div 
            className="flex items-center justify-between p-4 bg-[#0A0D14] rounded-xl cursor-pointer hover:bg-[#161B28] transition-colors border border-transparent"
            onClick={() => setShowUninstalled(!showUninstalled)}
          >
            <div className="flex items-center gap-3 text-white font-bold text-[14px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              Show uninstalled wallets
            </div>
            <div className={`w-[44px] h-[24px] rounded-full transition-colors relative ${showUninstalled ? 'bg-[#00D1FF]' : 'bg-[#1b212f]'}`}>
              <div className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all ${showUninstalled ? 'left-[23px]' : 'left-[3px]'}`} />
            </div>
          </div>

          {showUninstalled && (
            <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-3 opacity-40 pointer-events-none">
                {uninstalledWallets.map((wallet) => (
                  <div key={wallet.adapter.name} className="flex items-center gap-3 p-4 bg-[#0A0D14] rounded-xl border border-[#1b212f]">
                    <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-7 h-7 rounded-lg grayscale" />
                    <span className="font-bold text-gray-300 text-sm">{wallet.adapter.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
             <div className="flex justify-between items-center bg-[#0A0D14] p-4 rounded-xl border border-[#1b212f]/40">
                <div className="flex items-center gap-3 font-medium text-white text-[14px]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                      <ellipse cx="12" cy="12" rx="6" ry="8"></ellipse>
                      <path d="M11.5 5.5V11"></path>
                  </svg>
                  New here?
                </div>
                <a href="https://docs.solswap.cloud/" target="_blank" className="text-[#00D1FF] hover:text-white transition-colors flex items-center gap-1 font-bold text-[13px]">
                   Get started on SolSwap
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </a>
             </div>
          </div>

          <div className="flex justify-center items-center mt-6 text-[#A69CFF] gap-2 text-[12px] font-bold hover:text-white cursor-pointer transition-colors group">
             Buy Crypto with fiat 
             <span className="flex items-center">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="#A69CFF" className="group-hover:fill-white transition-colors">
                    <circle cx="12" cy="12" r="8"></circle>
                 </svg>
                 MoonPay
             </span>
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>

      </div>
    </div>
  );
};
