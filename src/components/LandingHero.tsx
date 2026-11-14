import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Receipt,
  Plus,
  CreditCard,
  Layers,
  ShieldCheck,
  X,
  LogIn
} from 'lucide-react';
import { Currency, Room } from '../types';
import { getCurrencySymbol } from '../utils/splitMath';
import { createRoomStellarVault } from '../services/pollarStellar';
import { CreateRoomModal } from './CreateRoomModal';

interface LandingHeroProps {
  onCreateRoom: (roomData: Partial<Room>) => void;
  onJoinRoomById?: (roomId: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onCreateRoom,
  onJoinRoomById,
}) => {
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [joinInput, setJoinInput] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInput.trim()) return;

    let targetId = joinInput.trim();
    if (targetId.includes('?r=')) {
      const match = targetId.match(/[?&]r=([^&]+)/);
      if (match && match[1]) targetId = match[1];
    } else if (targetId.includes('/')) {
      const parts = targetId.split('/');
      targetId = parts[parts.length - 1];
    }

    if (onJoinRoomById) {
      onJoinRoomById(targetId);
    } else {
      window.location.search = `?r=${encodeURIComponent(targetId)}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#B4F32D] text-[#0B2B16] flex flex-col justify-between max-w-md mx-auto relative overflow-hidden font-sans">
      
      {/* Top Header Branding (Modeled after Paymal Screen 1) */}
      <div className="pt-8 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-[#0B2B16] text-[#B4F32D] flex items-center justify-center shadow-sm">
            <Receipt className="h-5 w-5 stroke-[2.2]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0B2B16]">
            Ipin
          </span>
        </div>

        <div className="rounded-full bg-[#0B2B16]/10 px-3 py-1 text-[11px] font-semibold text-[#0B2B16]">
          Multiplayer Split
        </div>
      </div>

      {/* 3D Floating Layered Cards Graphic (Modeled directly after Screen 1) */}
      <div className="relative py-8 flex items-center justify-center overflow-hidden">
        {/* Floating coins */}
        <div className="absolute top-4 left-10 h-7 w-7 rounded-full bg-amber-400 border-2 border-amber-300 shadow-md flex items-center justify-center text-[10px] font-bold text-amber-900 animate-pulse">
          $
        </div>
        <div className="absolute top-12 right-12 h-6 w-6 rounded-full bg-amber-400 border-2 border-amber-300 shadow-md flex items-center justify-center text-[9px] font-bold text-amber-900">
          ¥
        </div>
        <div className="absolute bottom-6 left-12 h-6 w-6 rounded-full bg-amber-400 border-2 border-amber-300 shadow-md flex items-center justify-center text-[9px] font-bold text-amber-900">
          €
        </div>
        <div className="absolute bottom-10 right-10 h-7 w-7 rounded-full bg-amber-400 border-2 border-amber-300 shadow-md flex items-center justify-center text-[10px] font-bold text-amber-900 animate-bounce">
          ₦
        </div>

        {/* Stacked 3D Credit Cards */}
        <div className="relative w-64 h-52 flex items-center justify-center">
          {/* Bottom Card (Deep Blue) */}
          <div 
            className="absolute w-48 h-30 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 shadow-xl border border-white/20 p-3.5 text-white transform -rotate-12 translate-y-6 -translate-x-4 opacity-90"
          >
            <div className="flex justify-between items-start">
              <div className="h-4 w-6 rounded bg-amber-300/80" />
              <span className="text-[10px] font-mono opacity-80">•••• 4102</span>
            </div>
            <div className="mt-8 text-[11px] font-medium tracking-wide">
              MULTI-CURRENCY
            </div>
          </div>

          {/* Middle Card (Purple / Magenta) */}
          <div 
            className="absolute w-48 h-30 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-2xl border border-white/20 p-3.5 text-white transform rotate-3 translate-y-1 translate-x-2"
          >
            <div className="flex justify-between items-start">
              <div className="h-4 w-6 rounded bg-amber-300/80" />
              <span className="text-[10px] font-mono opacity-80">•••• 8901</span>
            </div>
            <div className="mt-8 text-[11px] font-medium tracking-wide">
              REAL-TIME SYNC
            </div>
          </div>

          {/* Top Card (Glowing Mint Green) */}
          <div 
            className="absolute w-52 h-32 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-2xl border border-white/40 p-4 text-white transform -rotate-6 -translate-y-4 hover:rotate-0 transition-transform duration-300 cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-7 rounded bg-amber-300/90 shadow-xs" />
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-100">IPIN SPLIT</span>
              </div>
              <span className="text-xs font-mono font-semibold">•••• 7749</span>
            </div>
            <div className="mt-7 flex justify-between items-end">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-emerald-100">Zero-CAC IT Product</p>
                <p className="text-xs font-bold">100% Math Fair</p>
              </div>
              <div className="flex -space-x-1.5">
                <div className="h-4 w-4 rounded-full bg-white/60" />
                <div className="h-4 w-4 rounded-full bg-amber-300/80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Headline & Bottom Actions Section (Modeled after Screen 1) */}
      <div className="px-6 pb-10 space-y-6 z-10">
        <div className="space-y-2.5 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-[#0B2B16]">
            The Smartest Way to Manage & Split Bills
          </h1>
          <p className="text-xs sm:text-sm text-[#0B2B16]/80 font-medium leading-relaxed max-w-xs mx-auto">
            Create a live split link in seconds. Friends tap items in real-time, zero penny drift, and client-side pixel forensics verify payment transfer screenshots.
          </p>
        </div>

        {/* Action Buttons: Solid Forest Green + Pure White */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setShowCreateSheet(true)}
            className="w-full rounded-full bg-[#0B2B16] hover:bg-[#051F10] text-white py-4 px-6 font-semibold text-sm shadow-forest-btn transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Create Split Room</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => setShowJoinSheet(true)}
            className="w-full rounded-full bg-white hover:bg-slate-50 text-[#0B2B16] py-4 px-6 font-semibold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <LogIn className="h-4 w-4 text-[#0B2B16]" />
            <span>Join Existing Split</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-[#0B2B16]/60">
          No sign-up or credit card required • Instant multiplayer link
        </p>
      </div>

      {/* Modal: Create Room (Dynamic Item Builder & Auto-Resolving Bank) */}
      <CreateRoomModal
        isOpen={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onCreateRoom={onCreateRoom}
      />

      {/* Slide-up Sheet: Join Room with Code or Link */}
      {showJoinSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-[32px] sm:rounded-3xl bg-white p-6 shadow-2xl text-[#0B2B16] animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-[#0B2B16] text-[#B4F32D] flex items-center justify-center font-bold">
                  <LogIn className="h-4 w-4 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-bold text-[#0B2B16]">Join Existing Split</h3>
              </div>
              <button
                onClick={() => setShowJoinSheet(false)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0B2B16]">
                  Room Code or Full URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste room ID (e.g. room-lxyz123) or full share link"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-[#F8FAF6] px-4 py-3 text-xs text-[#0B2B16] focus:border-[#0B2B16] focus:bg-white focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#0B2B16] hover:bg-[#051F10] text-[#B4F32D] py-4 text-xs font-bold tracking-wide uppercase shadow-forest-btn transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Enter Room</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
