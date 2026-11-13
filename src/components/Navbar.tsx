import React, { useState } from 'react';
import { Plus, Sparkles, Receipt, Globe, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onNewBill: () => void;
  onTryDemo: (currency?: 'USD' | 'EUR' | 'JPY') => void;
  isInRoom?: boolean;
  roomTitle?: string;
  currentCurrency?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewBill,
  onTryDemo,
  isInRoom,
  roomTitle,
  currentCurrency,
}) => {
  const [showDemoMenu, setShowDemoMenu] = useState(false);

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
              <span className="rounded-full bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-medium text-blue-300">
                Split
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
          {/* Demos Dropdown for Judges */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/15 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              <Globe className="h-3 w-3 text-blue-400" />
              <span className="hidden sm:inline">Demos</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 text-xs z-50">
                <button
                  onClick={() => {
                    onTryDemo('USD');
                    setShowDemoMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 flex items-center justify-between cursor-pointer"
                >
                  <span>🇺🇸 NYC Bistro</span>
                  <span className="font-mono text-slate-400">USD $</span>
                </button>
                <button
                  onClick={() => {
                    onTryDemo('EUR');
                    setShowDemoMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 flex items-center justify-between cursor-pointer"
                >
                  <span>🇪🇺 Berlin Tasting</span>
                  <span className="font-mono text-slate-400">EUR €</span>
                </button>
                <button
                  onClick={() => {
                    onTryDemo('JPY');
                    setShowDemoMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 flex items-center justify-between cursor-pointer"
                >
                  <span>🇯🇵 Tokyo Izakaya</span>
                  <span className="font-mono text-slate-400">JPY ¥</span>
                </button>
              </div>
            )}
          </div>

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
