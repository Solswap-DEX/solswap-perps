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

  const handleSimulatedConnect = (name: string) => {
    alert(`${name} is fully integrated in the main Swap application. Switch to swap.solswap.cloud to use this method.`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05070A]/80 backdrop-blur-sm p-4">
      <div className="bg-[#11131E] border border-[#1b212f]/40 w-full max-w-[36rem] rounded-2xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-200 text-[#E2E8F0] tracking-wide relative">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-[19px] font-bold text-white tracking-normal">Connect your wallet to SolSwap</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#1A1D2B] rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-2 pb-6 flex-1 overflow-y-auto max-h-[80vh]">
          <div className="mb-6 bg-[rgba(0,209,255,0.08)] p-4 rounded-xl text-[14px] text-[#00D1FF] font-medium leading-relaxed">
             By connecting your wallet, you acknowledge that you have read, understand and accept the terms in the disclaimer
          </div>

          <div className="flex items-center justify-between mb-4 mt-2">
             <h3 className="text-[15px] font-bold text-white/90">Choose wallet</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {recommendedWallets.map((wallet) => (
              <div 
                key={wallet.adapter.name}
                onClick={() => handleConnect(wallet.adapter.name)}
                className="flex items-center gap-3 p-4 bg-[#0A0D14] hover:bg-[#161B28] group cursor-pointer rounded-xl transition-all border border-[#1b212f]/80"
              >
                <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-8 h-8 rounded-lg shadow-md" />
                <span className="font-bold text-white text-[15px] drop-shadow-sm">{wallet.adapter.name}</span>
                {wallet.adapter.name === 'Phantom' && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-[11px] text-[#A69CFF] font-semibold flex flex-col items-center leading-[1.1]">
                       <span>Auto</span>
                       <span>Confirm</span>
                    </span>
                    <div className="w-[14px] h-[14px] rounded-full border border-[#40386c] text-[#A69CFF] flex items-center justify-center text-[9px] font-bold">?</div>
                  </div>
                )}
                {wallet.adapter.name === 'Solflare' && (
                  <div className="ml-auto flex items-center gap-1.5">
                     <span className="text-[11px] text-[#A69CFF] font-semibold">Auto Approve</span>
                     <div className="w-[14px] h-[14px] rounded-full border border-[#40386c] text-[#A69CFF] flex items-center justify-center text-[9px] font-bold">?</div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Custom Manual Injections for parity */}
            <div 
                onClick={() => handleSimulatedConnect('Ethereum Wallet')}
                className="flex items-center gap-3 p-4 bg-[#0A0D14] hover:bg-[#161B28] group cursor-pointer rounded-xl transition-all border border-[#1b212f]/80"
            >
                <div className="w-8 h-8 relative flex items-center justify-center bg-white rounded-full">
                   <svg width="18" height="25" viewBox="0 0 117 197" fill="none" className="text-[#3c3c3d]">
                      <path d="M58.0003 0L56.6348 4.6402V132.887L58.0003 134.25L116 99.9882L58.0003 0Z" fill="#343434"/>
                      <path d="M58.0003 0L0 99.9882L58.0003 134.25V79.6052V0Z" fill="#8C8C8C"/>
                      <path d="M58.0004 146.402L57.2188 147.355V196.486L58.0004 196.969L116.012 112.56L58.0004 146.402Z" fill="#3C3C3B"/>
                      <path d="M58.0004 196.969V146.402L0 112.56L58.0004 196.969Z" fill="#8C8C8C"/>
                   </svg>
                   <img src="https://solswap.cloud/images/evm_wallet_sub_icon.png" className="w-[16px] h-[16px] absolute -bottom-1 -right-1" alt="" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <span className="font-bold text-white text-[15px] drop-shadow-sm">Ethereum Wallet</span>
            </div>

            <div 
                onClick={() => handleSimulatedConnect('Google')}
                className="flex items-center gap-3 p-4 bg-[#0A0D14] hover:bg-[#161B28] group cursor-pointer rounded-xl transition-all border border-[#1b212f]/80"
            >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                </div>
                <span className="font-bold text-white text-[15px] drop-shadow-sm">Sign in with Google</span>
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
