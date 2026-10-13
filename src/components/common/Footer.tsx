import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          <span className="font-semibold text-slate-900">CreatorBridge</span> · The Premier AI Commercial Advertising Marketplace
        </div>
        <div className="flex items-center gap-6">
          <span>Direct Bank Transfers</span>
          <span>·</span>
          <span>Zero Fabricated Data</span>
          <span>·</span>
          <span>Verified Commercial Contracts</span>
        </div>
      </div>
    </footer>
  );
};
