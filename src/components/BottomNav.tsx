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
      <nav className="pointer-events-auto w-full max-w-xs rounded-full bg-white/95 backdrop-blur-md px-4 py-2 flex items-center justify-between border border-slate-200/80 shadow-floating">
        
        {/* Tab 1: Claim Items */}
        <button
          onClick={() => onSelectTab('CLAIM')}
          className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'CLAIM' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Receipt className="h-5 w-5 stroke-[1.75]" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-slate-100 px-1 text-[9px] font-semibold text-slate-700">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Claim</span>
        </button>

        {/* Tab 2: Ledger & Balances */}
        <button
          onClick={() => onSelectTab('LEDGER')}
          className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'LEDGER' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Users className="h-5 w-5 stroke-[1.75]" />
            {unsettledCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-blue-50 px-1 text-[9px] font-semibold text-blue-600">
                {unsettledCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Ledger</span>
        </button>

        {/* Center Floating Action Button (Forensic ELA Scan) */}
        <div className="relative -mt-6 px-1 flex flex-col items-center">
          <button
            onClick={onCenterAction}
            title="Scan & Verify Payment Screenshot"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-blue-btn hover:scale-105 active:scale-95 transition-all cursor-pointer border-[3px] border-white"
          >
            <Scan className="h-5 w-5 stroke-[2]" />
          </button>
          <span className="text-[9px] font-medium text-slate-400 tracking-tight mt-0.5">
            Verify AI
          </span>
        </div>

        {/* Tab 3: Summary & Share */}
        <button
          onClick={() => onSelectTab('SUMMARY')}
          className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'SUMMARY' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="h-5 w-5 stroke-[1.75]" />
          <span className="text-[10px] mt-0.5 font-medium tracking-tight">Summary</span>
        </button>
      </nav>
    </div>
  );
};
