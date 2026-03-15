import React from 'react';
import { usePositions } from '@/hooks/usePositions';

export const PositionsTable = () => {
  const { positions, isLoading } = usePositions();

  if (isLoading) return <div className="p-4 text-sm text-[#8B8EA8]">Loading positions...</div>;
  if (positions.length === 0) return <div className="p-4 text-sm text-[#8B8EA8]">No active positions</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-[#8B8EA8] uppercase tracking-wider border-b border-[#1A1B2E]">
          <tr>
            <th className="px-4 py-3 font-bold">Market</th>
            <th className="px-4 py-3 font-bold">Side</th>
            <th className="px-4 py-3 font-bold">Size</th>
            <th className="px-4 py-3 font-bold">Entry</th>
            <th className="px-4 py-3 font-bold">Mark</th>
            <th className="px-4 py-3 font-bold">Liq Price</th>
            <th className="px-4 py-3 font-bold">Unrealized PnL</th>
            <th className="px-4 py-3 font-bold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1A1B2E]">
          {positions.map((pos, idx) => (
            <tr key={idx} className="hover:bg-[#161726] transition-colors">
              <td className="px-4 py-4 font-bold text-white">{pos.marketName}</td>
              <td className="px-4 py-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                  pos.direction === 'LONG' ? 'bg-[#00C896]/10 text-[#00C896]' : 'bg-[#FF4D6A]/10 text-[#FF4D6A]'
                }`}>
                  {pos.direction}
                </span>
              </td>
              <td className="px-4 py-4 text-white">{(pos.baseAssetAmount.toNumber() / 10**9).toFixed(3)}</td>
              <td className="px-4 py-4 text-white">--</td>
              <td className="px-4 py-4 text-white">--</td>
              <td className="px-4 py-4 text-[#FF4D6A]">--</td>
              <td className={`px-4 py-4 font-bold ${pos.pnl >= 0 ? 'text-[#00C896]' : 'text-[#FF4D6A]'}`}>
                {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)} USDC
              </td>
              <td className="px-4 py-4">
                <button className="text-white bg-[#1A1B2E] px-3 py-1 rounded hover:bg-[#2D2E42] transition-colors border border-[#2D2E42]">
                  Close
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
