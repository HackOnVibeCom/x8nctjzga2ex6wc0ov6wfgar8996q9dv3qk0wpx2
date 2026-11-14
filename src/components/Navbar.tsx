import React from 'react';
import { Plus, Receipt } from 'lucide-react';

interface NavbarProps {
  onNewBill: () => void;
  isInRoom?: boolean;
  roomTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewBill,
  isInRoom,
  roomTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B2B16] text-white border-b border-white/10 shadow-sm font-sans">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4 sm:px-5">
        {/* Brand */}
        <div 
          onClick={onNewBill}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#B4F32D] text-[#0B2B16] font-extrabold text-sm shadow-xs group-hover:scale-105 transition-transform">
            <Receipt className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-white">
                Ipin
              </span>
              <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] font-bold text-[#B4F32D] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B4F32D] animate-pulse" />
                Live SQL
              </span>
            </div>
            {isInRoom && roomTitle ? (
              <p className="text-[10px] text-slate-300 truncate max-w-[150px] font-medium leading-none">
                {roomTitle}
              </p>
            ) : (
              <p className="text-[10px] text-slate-300 font-medium leading-none">
                Multiplayer Bill Split
              </p>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewBill}
            className="flex items-center gap-1 rounded-full bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#0B2B16] shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>New Split</span>
          </button>
        </div>
      </div>
    </header>
  );
};
