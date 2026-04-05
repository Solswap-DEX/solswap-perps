import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTradingStore } from '@/store/tradingStore';
import { useDriftClient } from '@/hooks/useDriftClient';
import { PERP_MARKETS } from '@/config/markets';
import { SelectWalletModal } from './SolWallet/SelectWalletModal';
import { DRIFT_CONFIG } from '@/config/driftConfig';

export const OrderForm = () => {
  const { connected } = useWallet();
  const { placeOrder, userInitialized, initializeUser, isLoading: isDriftLoading } = useDriftClient();
  const {
    selectedMarket,
    orderSide, setOrderSide,
    orderType, setOrderType,
    leverage, setLeverage,
    orderSize, setOrderSize,
    limitPrice, setLimitPrice
  } = useTradingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentMarket = PERP_MARKETS.find(m => m.symbol === selectedMarket) || PERP_MARKETS[0];
  const sizeNum = parseFloat(orderSize) || 0;
  const feePct = DRIFT_CONFIG.builderInfo.builderFee / 100;
  const estimatedFee = (sizeNum * (DRIFT_CONFIG.builderInfo.builderFee / 10000)).toFixed(4); 
  const notionalValue = sizeNum; // In USDC terms

  const handleSubmit = async () => {
    if (!connected) return;
    if (sizeNum <= 0) {
      setOrderStatus({ type: 'error', message: 'Enter a valid order size' });
      return;
    }
    if (sizeNum < currentMarket.minOrderSize) {
      setOrderStatus({ type: 'error', message: `Minimum order size is ${currentMarket.minOrderSize} ${currentMarket.baseAsset}` });
      return;
    }
    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      setOrderStatus({ type: 'error', message: 'Enter a valid limit price' });
      return;
    }

    setIsSubmitting(true);
    setOrderStatus(null);

    try {
      const txSig = await placeOrder({
        marketIndex: currentMarket.marketIndex,
        direction: orderSide,
        size: sizeNum,
        orderType: orderType,
        limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
      });

      setOrderStatus({
        type: 'success',
        message: `Order placed! TX: ${typeof txSig === 'string' ? txSig.slice(0, 16) + '...' : 'confirmed'}`
      });
      setOrderSize('');
      setLimitPrice('');
    } catch (err: any) {
      console.error('Order failed:', err);
      const msg = err.message || 'Order failed. Please try again.';
      // Provide user-friendly messages for common errors
      if (msg.includes('insufficient')) {
        setOrderStatus({ type: 'error', message: 'Insufficient balance. Deposit USDC to your Drift account first.' });
      } else if (msg.includes('User does not have')) {
        setOrderStatus({ type: 'error', message: 'You need a Drift account. Initializing...' });
        try {
          await initializeUser();
          setOrderStatus({ type: 'error', message: 'Account created! Please try your order again.' });
        } catch {
          setOrderStatus({ type: 'error', message: 'Could not create Drift account. Visit drift.trade to set up.' });
        }
      } else {
        setOrderStatus({ type: 'error', message: msg.length > 100 ? msg.slice(0, 100) + '...' : msg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Long/Short Toggle */}
      <div className="flex bg-[#05070A] p-1 rounded-lg">
        <button
          onClick={() => setOrderSide('long')}
          className={`flex-1 py-2 rounded-md font-bold transition-all ${
            orderSide === 'long'
            ? 'bg-[#00FFA3] text-[#05070A] shadow-lg shadow-[#00FFA3]/20'
            : 'text-[#8B8EA8]'
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setOrderSide('short')}
          className={`flex-1 py-2 rounded-md font-bold transition-all ${
            orderSide === 'short'
            ? 'bg-[#FF4D6D] text-white shadow-lg shadow-[#FF4D6D]/20'
            : 'text-[#8B8EA8]'
          }`}
        >
          Short
        </button>
      </div>

      {/* Order Type */}
      <div className="flex gap-4">
        <button
          onClick={() => setOrderType('market')}
          className={`text-sm font-bold ${orderType === 'market' ? 'text-[#00D1FF]' : 'text-[#8B8EA8]'}`}
        >
          Market
        </button>
        <button
          onClick={() => setOrderType('limit')}
          className={`text-sm font-bold ${orderType === 'limit' ? 'text-[#00D1FF]' : 'text-[#8B8EA8]'}`}
        >
          Limit
        </button>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-4">
        {orderType === 'limit' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#8B8EA8] font-bold uppercase">Price</label>
            <div className="relative">
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#8B8EA8]">USDC</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs text-[#8B8EA8] font-bold uppercase">Size</label>
          <div className="relative">
            <input
              type="number"
              value={orderSize}
              onChange={(e) => setOrderSize(e.target.value)}
              placeholder="0.00"
              className="w-full"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#8B8EA8]">USDC</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {['25%', '50%', '75%', '100%'].map((pct) => (
              <button key={pct} className="bg-[#0D1117] text-[10px] py-1 rounded border border-[#2D2E42] text-[#8B8EA8] hover:border-[#00D1FF] transition-colors">
                {pct}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leverage Slider */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#8B8EA8] font-bold uppercase">Leverage</span>
          <span className="text-[#00D1FF] font-bold">{leverage}x</span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value))}
          className="w-full accent-[#00D1FF]"
        />
      </div>

      {/* Summary */}
      <div className="bg-[#0D1117] rounded-lg p-3 flex flex-col gap-2 text-[11px]">
        <div className="flex justify-between">
          <span className="text-[#8B8EA8]">Liquidation Price</span>
          <span className="text-white">--</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B8EA8]">Estimated Fee ({feePct}%)</span>
          <span className="text-white">{sizeNum > 0 ? `${estimatedFee} USDC` : '--'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B8EA8]">Builder Fee</span>
          <span className="text-[#00D1FF]">{DRIFT_CONFIG.builderInfo.builderFee} bps → SolSwap</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B8EA8]">Protocol</span>
          <span className="text-[#00D1FF]">Drift v2</span>
        </div>
      </div>

      {/* Status Message */}
      {orderStatus && (
        <div className={`p-3 rounded-lg text-xs font-medium ${
          orderStatus.type === 'success'
            ? 'bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3]/20'
            : 'bg-[#FF4D6D]/10 text-[#FF4D6D] border border-[#FF4D6D]/20'
        }`}>
          {orderStatus.message}
        </div>
      )}

      {/* Submit Button or Connect Wallet */}
      {!connected ? (
        <div className="w-full flex justify-center">
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="w-full py-4 rounded-xl font-bold text-lg bg-[#00D1FF] text-[#05070A] hover:opacity-90 transition-all"
          >
            Connect Wallet
          </button>
          <SelectWalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isDriftLoading || sizeNum <= 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            orderSide === 'long'
              ? 'bg-[#00FFA3] text-[#05070A] hover:opacity-90'
              : 'bg-[#FF4D6D] text-white hover:opacity-90'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              <span>Placing Order...</span>
            </div>
          ) : isDriftLoading ? (
            'Connecting to Drift...'
          ) : (
            `Open ${orderSide === 'long' ? 'Long' : 'Short'} ${currentMarket.baseAsset}`
          )}
        </button>
      )}
    </div>
  );
};
