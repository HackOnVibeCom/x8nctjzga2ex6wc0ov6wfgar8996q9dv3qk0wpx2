import React from 'react';
import { Plus } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full bg-[#050819] text-white border-b border-white/10 shadow-sm">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div 
          onClick={onNewBill}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm group-hover:bg-blue-500 transition-colors">
            ɪᴘ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-white">
                Ipin
              </span>
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-medium text-emerald-300 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live SQL
              </span>
            </div>
            {isInRoom && roomTitle ? (
              <p className="text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-xs font-normal leading-none">
                {roomTitle}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 font-normal leading-none">
                Zero-CAC Bill Splitter
              </p>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewBill}
            className="flex items-center gap-1 rounded-full bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-blue-btn transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Split</span>
          </button>
        </div>
      </div>
    </header>
  );
};
