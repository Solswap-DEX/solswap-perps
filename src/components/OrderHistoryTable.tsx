import React from 'react';

export const OrderHistoryTable = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-[#8B8EA8]">
      <svg className="w-12 h-12 mb-4 opacity-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      <div className="text-sm">No order history</div>
    </div>
  );
};
