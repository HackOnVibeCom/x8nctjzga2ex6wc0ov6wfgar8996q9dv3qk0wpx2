import React from 'react';
import { Plus, Sparkles, Receipt } from 'lucide-react';

interface NavbarProps {
  onNewBill: () => void;
  onTryDemo: () => void;
  isInRoom?: boolean;
  roomTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewBill,
  onTryDemo,
  isInRoom,
  roomTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#060b24] text-white border-b border-white/10 shadow-sm">
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
              <span className="rounded-full bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-medium text-blue-300">
                Split
              </span>
            </div>
            {isInRoom && roomTitle ? (
              <p className="text-[10px] text-slate-400 truncate max-w-[160px] sm:max-w-xs font-normal leading-none">
                {roomTitle}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 font-normal leading-none">
                Multiplayer Bill Settlement
              </p>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {!isInRoom && (
            <button
              onClick={onTryDemo}
              className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-blue-400" />
              <span>Live Demo</span>
            </button>
          )}

          <button
            onClick={onNewBill}
            className="flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isInRoom ? 'New Bill' : 'Create Room'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
