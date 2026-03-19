import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTradingStore } from '@/store/tradingStore';
import { DRIFT_CONFIG } from '@/config/driftConfig';

export const OrderForm = () => {
  const { connected } = useWallet();
  const { 
    orderSide, setOrderSide, 
    orderType, setOrderType, 
    leverage, setLeverage,
    orderSize, setOrderSize,
    limitPrice, setLimitPrice
  } = useTradingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!connected) return;
    setIsSubmitting(true);
    // Logic to call useDriftClient.placeOrder will go here
    setTimeout(() => setIsSubmitting(false), 1000);
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
          <span className="text-[#8B8EA8]">Estimated Fee</span>
          <span className="text-white">0.1 USDC</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B8EA8]">Builder Allocation</span>
          <span className="text-[#00D1FF]">100% (Drift)</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!connected || isSubmitting}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          !connected 
          ? 'bg-[#0D1117] text-[#8B8EA8] cursor-not-allowed' 
          : orderSide === 'long' 
            ? 'bg-[#00FFA3] text-[#05070A] hover:opacity-90' 
            : 'bg-[#FF4D6D] text-white hover:opacity-90'
        }`}
      >
        {isSubmitting ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
        ) : !connected ? (
          'Connect Wallet'
        ) : (
          `Open ${orderSide === 'long' ? 'Long' : 'Short'}`
        )}
      </button>
    </div>
  );
};
