import React from 'react';
import { 
  Receipt, 
  Users, 
  Scan, 
  FileText 
} from 'lucide-react';

interface BottomNavProps {
  activeTab: 'CLAIM' | 'LEDGER' | 'SUMMARY';
  onSelectTab: (tab: 'CLAIM' | 'LEDGER' | 'SUMMARY') => void;
  onCenterAction: () => void;
  itemCount: number;
  unsettledCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onCenterAction,
  itemCount,
  unsettledCount,
}) => {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-sm rounded-full bg-white/95 backdrop-blur-md px-2 py-1.5 border border-slate-200/80 shadow-floating">
        <div className="grid grid-cols-4 items-center gap-1">
          
          {/* 1. Claim Items */}
          <button
            type="button"
            onClick={() => onSelectTab('CLAIM')}
            className={`w-full flex flex-col items-center justify-center py-1.5 rounded-full transition-all cursor-pointer ${
              activeTab === 'CLAIM'
                ? 'text-blue-600 font-semibold bg-blue-50/70'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/60'
            }`}
          >
            <div className="relative">
              <Receipt className="h-5 w-5 stroke-[1.8]" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-2.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-slate-100 px-1 text-[9px] font-semibold text-slate-700 border border-slate-200">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none">Claim</span>
          </button>

          {/* 2. Ledger & Balances */}
          <button
            type="button"
            onClick={() => onSelectTab('LEDGER')}
            className={`w-full flex flex-col items-center justify-center py-1.5 rounded-full transition-all cursor-pointer ${
              activeTab === 'LEDGER'
                ? 'text-blue-600 font-semibold bg-blue-50/70'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/60'
            }`}
          >
            <div className="relative">
              <Users className="h-5 w-5 stroke-[1.8]" />
              {unsettledCount > 0 && (
                <span className="absolute -top-1 -right-2.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-semibold text-white">
                  {unsettledCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none">Ledger</span>
          </button>

          {/* 3. Verify AI */}
          <button
            type="button"
            onClick={onCenterAction}
            title="Scan & Verify Payment Screenshot"
            className="w-full flex flex-col items-center justify-center py-1.5 rounded-full transition-all cursor-pointer text-slate-500 hover:text-blue-600 hover:bg-blue-50/60"
          >
            <div className="relative">
              <Scan className="h-5 w-5 stroke-[1.8]" />
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none">Verify AI</span>
          </button>

          {/* 4. Summary & Export */}
          <button
            type="button"
            onClick={() => onSelectTab('SUMMARY')}
            className={`w-full flex flex-col items-center justify-center py-1.5 rounded-full transition-all cursor-pointer ${
              activeTab === 'SUMMARY'
                ? 'text-blue-600 font-semibold bg-blue-50/70'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/60'
            }`}
          >
            <div className="relative">
              <FileText className="h-5 w-5 stroke-[1.8]" />
            </div>
            <span className="text-[10px] mt-1 tracking-tight leading-none">Summary</span>
          </button>

        </div>
      </nav>
    </div>
  );
};
