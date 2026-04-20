import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTradingStore } from '@/store/tradingStore';
import { useDriftClient } from '@/hooks/useDriftClient';
import { PERP_MARKETS } from '@/config/markets';
import { SelectWalletModal } from './SolWallet/SelectWalletModal';
import { DRIFT_CONFIG, validateLeverage } from '@/config/driftConfig';
import { OrderStatusBar, OrderStatusState } from './OrderStatusBar';
import {
  trackTradeSubmitted,
  trackTradeConfirmed,
  trackTradeFailed,
  track,
} from '@/utils/analytics';

// ─── Slippage options ─────────────────────────────────────────────────────────
const SLIPPAGE_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '0.1%', value: 0.001 },
  { label: '0.5%', value: 0.005 },
  { label: '1%',   value: 0.01  },
];

// ─── Fee tooltip ──────────────────────────────────────────────────────────────
function FeeTooltip() {
  const [visible, setVisible] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'help',
          color: '#00D1FF80',
          fontSize: '10px',
          padding: '0 4px',
        }}
        aria-label="About SolSwap fee"
      >
        ℹ
      </button>
      {visible && (
        <span
          style={{
            position: 'absolute',
            bottom: '120%',
            right: 0,
            width: '220px',
            background: '#0D1117',
            border: '1px solid #7B61FF30',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px',
            color: '#8B8EA8',
            zIndex: 50,
            lineHeight: '1.5',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          This fee funds SolSwap&apos;s routing engine, execution optimization, and
          platform infrastructure — enabling the best fills on Drift Protocol.
        </span>
      )}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const OrderForm = () => {
  const { connected } = useWallet();
  const {
    driftClient,
    placeOrder,
    enableTrading,
    onboardingStatus,
    isLoading: isDriftLoading,
  } = useDriftClient();
  const {
    selectedMarket,
    orderSide, setOrderSide,
    orderType, setOrderType,
    leverage, setLeverage,
    orderSize, setOrderSize,
    limitPrice, setLimitPrice,
  } = useTradingStore();

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [isEnabling, setIsEnabling]       = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [orderStatusState, setOrderStatusState] = useState<OrderStatusState>({ status: 'idle' });

  // Slippage
  const [slippage, setSlippage] = useState<number>(0.005); // default 0.5%
  const [customSlippage, setCustomSlippage] = useState<string>('');
  const [showCustom, setShowCustom] = useState(false);

  const currentMarket = PERP_MARKETS.find(m => m.symbol === selectedMarket) || PERP_MARKETS[0];
  const sizeNum       = parseFloat(orderSize) || 0;

  const handlePercentSize = (pct: string) => {
    if (!driftClient || !driftClient.hasUser()) return;
    const pctVal = parseFloat(pct) / 100;
    try {
      const freeCollateral = driftClient.getUser().getFreeCollateral().toNumber() / 1e6;
      let price = parseFloat(limitPrice);
      if (!price || isNaN(price)) {
        try {
          const oracleData = driftClient.getOracleDataForPerpMarket(currentMarket.marketIndex);
          // Drift oracle price is scaled by 1e6 usually
          price = oracleData ? oracleData.price.toNumber() / 1e6 : 1;
        } catch(e) {
          price = 1;
        }
      }
      const newSize = (freeCollateral * leverage * pctVal) / price;
      setOrderSize(newSize.toFixed(4));
    } catch(e) {
      console.error('Error calculating percent size', e);
    }
  };

  // Fee breakdown
  const builtFeePercent   = DRIFT_CONFIG.builderInfo.builderFee / 100;       // e.g. 0.10%
  const driftFeePercent   = 0.01;                                             // ~0.01% protocol fee
  const estimatedBuilderFee = (sizeNum * (DRIFT_CONFIG.builderInfo.builderFee / 10000)).toFixed(4);
  const estimatedDriftFee   = (sizeNum * (driftFeePercent / 100)).toFixed(4);
  const estimatedTotalFee   = ((sizeNum * (DRIFT_CONFIG.builderInfo.builderFee / 10000)) +
                               (sizeNum * (driftFeePercent / 100))).toFixed(4);

  // Effective slippage value (custom overrides preset)
  const effectiveSlippage = showCustom
    ? (parseFloat(customSlippage) || 0) / 100
    : slippage;

  // ── Enable Trading handler ──────────────────────────────────────────────────
  const handleEnableTrading = async () => {
    setIsEnabling(true);
    setOrderStatusState({ status: 'pending', label: 'Setting up trading account…' });
    track('enable_trading_clicked');
    try {
      await enableTrading();
      setOrderStatusState({ status: 'idle' }); // Clear — button will change state
    } catch (err: any) {
      setOrderStatusState({ status: 'error', message: err.message || 'Failed to enable trading.' });
    } finally {
      setIsEnabling(false);
    }
  };

  // ── Submit order handler ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!connected || onboardingStatus !== 'ready') return;
    if (sizeNum <= 0) {
      setOrderStatusState({ status: 'error', message: 'Enter a valid order size.' });
      return;
    }
    if (sizeNum < currentMarket.minOrderSize) {
      setOrderStatusState({
        status: 'error',
        message: `Minimum order size is ${currentMarket.minOrderSize} ${currentMarket.baseAsset}`,
      });
      return;
    }
    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      setOrderStatusState({ status: 'error', message: 'Enter a valid limit price.' });
      return;
    }

    if (driftClient && driftClient.hasUser()) {
      const { valid, reason } = validateLeverage(driftClient.getUser(), leverage);
      if (!valid) {
        setOrderStatusState({ status: 'error', message: reason || 'Leverage check failed.' });
        return;
      }
    }

    setIsSubmitting(true);
    setOrderStatusState({ status: 'pending', label: 'Signing transaction…' });

    trackTradeSubmitted({
      market: currentMarket.symbol,
      side: orderSide,
      size: sizeNum,
      orderType,
    });

    try {
      setOrderStatusState({ status: 'signing' });

      const txSig = await placeOrder({
        marketIndex: currentMarket.marketIndex,
        direction: orderSide,
        size: sizeNum,
        orderType,
        limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
      });

      const sig = typeof txSig === 'string' ? txSig : String(txSig);
      trackTradeConfirmed(sig, currentMarket.symbol);
      setOrderStatusState({ status: 'success', txSig: sig, market: currentMarket.symbol });
      setOrderSize('');
      setLimitPrice('');
    } catch (err: any) {
      console.error('Order failed:', err);
      const msg = err.message || 'Order failed. Please try again.';
      trackTradeFailed(msg, currentMarket.symbol);
      setOrderStatusState({ status: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Long/Short Toggle */}
      <div className="flex bg-[#05070A] p-1 rounded-lg">
        <button
          id="order-side-long"
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
          id="order-side-short"
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

      {/* Order Type + Slippage Row */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-4">
          <button
            id="order-type-market"
            onClick={() => setOrderType('market')}
            className={`text-sm font-bold ${orderType === 'market' ? 'text-[#00D1FF]' : 'text-[#8B8EA8]'}`}
          >
            Market
          </button>
          <button
            id="order-type-limit"
            onClick={() => setOrderType('limit')}
            className={`text-sm font-bold ${orderType === 'limit' ? 'text-[#00D1FF]' : 'text-[#8B8EA8]'}`}
          >
            Limit
          </button>
        </div>

        {/* Slippage Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
          <span style={{ color: '#8B8EA8' }}>Slippage:</span>
          {SLIPPAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setSlippage(opt.value); setShowCustom(false); }}
              style={{
                padding: '2px 7px',
                borderRadius: '6px',
                border: `1px solid ${!showCustom && slippage === opt.value ? '#00D1FF' : '#2D2E42'}`,
                background: !showCustom && slippage === opt.value ? '#00D1FF15' : 'transparent',
                color: !showCustom && slippage === opt.value ? '#00D1FF' : '#8B8EA8',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setShowCustom(true)}
            style={{
              padding: '2px 7px',
              borderRadius: '6px',
              border: `1px solid ${showCustom ? '#7B61FF' : '#2D2E42'}`,
              background: showCustom ? '#7B61FF15' : 'transparent',
              color: showCustom ? '#7B61FF' : '#8B8EA8',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            {showCustom ? (
              <input
                type="number"
                value={customSlippage}
                onChange={(e) => setCustomSlippage(e.target.value)}
                placeholder="0.5"
                style={{
                  width: '40px',
                  background: 'transparent',
                  border: 'none',
                  color: '#7B61FF',
                  fontSize: '11px',
                  outline: 'none',
                  textAlign: 'center',
                }}
                autoFocus
              />
            ) : (
              'Custom'
            )}
          </button>
          {showCustom && <span style={{ color: '#8B8EA8' }}>%</span>}
        </div>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-4">
        {orderType === 'limit' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#8B8EA8] font-bold uppercase">Price</label>
            <div className="relative">
              <input
                id="order-limit-price"
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full"
              />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#8B8EA8]">{(currentMarket as any).quoteAsset || 'USDC'}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs text-[#8B8EA8] font-bold uppercase">Size</label>
          <div className="relative">
            <input
              id="order-size"
              type="number"
              value={orderSize}
              onChange={(e) => setOrderSize(e.target.value)}
              placeholder="0.00"
              className="w-full"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#8B8EA8]">{currentMarket.baseAsset}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {['25%', '50%', '75%', '100%'].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentSize(pct)}
                className="bg-[#0D1117] text-[10px] py-1 rounded border border-[#2D2E42] text-[#8B8EA8] hover:border-[#00D1FF] transition-colors"
              >
                {pct}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leverage */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#8B8EA8] font-bold uppercase">Leverage</span>
          <span className="text-[#00D1FF] font-bold">{leverage}x</span>
        </div>
        <input
          id="order-leverage"
          type="range"
          min="1"
          max={DRIFT_CONFIG.maxLeverage || 20}
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value))}
          className="w-full accent-[#00D1FF]"
        />
      </div>

      {/* ── Fee Breakdown Summary ──────────────────────────────────────────────── */}
      <div className="bg-[#0D1117] rounded-lg p-3 flex flex-col gap-2 text-[11px]">
        <div className="flex justify-between">
          <span className="text-[#8B8EA8]">Current Liq. Price</span>
          <span className="text-[#FF4D6D] font-bold">
            {(() => {
               if(!driftClient || !driftClient.hasUser()) return '--';
               try {
                 const liq = driftClient.getUser().liquidationPrice(currentMarket.marketIndex).toNumber() / 1e6;
                 return liq > 0 ? `$${liq.toFixed(4)}` : 'None';
               } catch(e) { return '--'; }
            })()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8B8EA8]">Slippage Tolerance</span>
          <span className="text-[#00D1FF]">{(effectiveSlippage * 100).toFixed(2)}%</span>
        </div>

        {/* Drift Protocol Fee */}
        <div className="flex justify-between">
          <span className="text-[#8B8EA8]">Drift Protocol Fee (~{driftFeePercent}%)</span>
          <span className="text-white">{sizeNum > 0 ? `${estimatedDriftFee} USDC` : '--'}</span>
        </div>

        {/* SolSwap Fee — presented as a value-add, not a tax */}
        <div className="flex justify-between items-center">
          <span className="text-[#8B8EA8]">
            SolSwap Fee ({builtFeePercent.toFixed(2)}%)
            <FeeTooltip />
          </span>
          <span className="text-[#00D1FF]">
            {sizeNum > 0 ? `${estimatedBuilderFee} USDC` : '--'}
          </span>
        </div>

        {/* Total estimated fee */}
        {sizeNum > 0 && (
          <>
            <div style={{ height: '1px', background: '#2D2E42', margin: '2px 0' }} />
            <div className="flex justify-between">
              <span className="text-[#8B8EA8] font-bold">Total Est. Fee</span>
              <span className="text-white font-bold">{estimatedTotalFee} USDC</span>
            </div>
          </>
        )}

        {/* Value proposition callout, subtle */}
        <div
          style={{
            marginTop: '4px',
            fontSize: '10px',
            color: '#7B61FF80',
            letterSpacing: '0.02em',
          }}
        >
          ⚡ Powered by SolSwap — smart routing &amp; best execution on Drift
        </div>
      </div>

      {/* Order Status Bar */}
      <OrderStatusBar
        state={orderStatusState}
        onDismiss={() => setOrderStatusState({ status: 'idle' })}
      />

      {/* ── CTA Buttons ───────────────────────────────────────────────────────── */}

      {/* 1. Not connected → show Connect Wallet */}
      {!connected ? (
        <div className="w-full flex justify-center">
          <button
            id="connect-wallet-btn"
            onClick={() => setIsWalletModalOpen(true)}
            className="w-full py-4 rounded-xl font-bold text-lg bg-[#00D1FF] text-[#05070A] hover:opacity-90 transition-all"
          >
            Connect Wallet
          </button>
          <SelectWalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
        </div>

      // 2. Connected but needs onboarding or escrow → Enable Trading
      ) : onboardingStatus === 'needs_onboarding' || onboardingStatus === 'needs_escrow' ? (
        <button
          id="enable-trading-btn"
          onClick={handleEnableTrading}
          disabled={isEnabling || isDriftLoading}
          className="w-full py-4 rounded-xl font-bold text-lg bg-[#7B61FF] text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEnabling ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Setting up trading account…</span>
            </div>
          ) : (
            '⚡ Enable Trading'
          )}
        </button>

      // 3. Checking status
      ) : onboardingStatus === 'checking' || isDriftLoading ? (
        <button id="connecting-btn" disabled className="w-full py-4 rounded-xl font-bold text-lg bg-[#1A1B2E] text-[#8B8EA8] cursor-not-allowed">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8B8EA8]"></div>
            <span>Connecting to Drift…</span>
          </div>
        </button>

      // 4. Ready → place order
      ) : (
        <button
          id="place-order-btn"
          onClick={handleSubmit}
          disabled={isSubmitting || sizeNum <= 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            orderSide === 'long'
              ? 'bg-[#00FFA3] text-[#05070A] hover:opacity-90'
              : 'bg-[#FF4D6D] text-white hover:opacity-90'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              <span>Placing Order…</span>
            </div>
          ) : (
            `Open ${orderSide === 'long' ? 'Long' : 'Short'} ${currentMarket.baseAsset}`
          )}
        </button>
      )}
    </div>
  );
};
