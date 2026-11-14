import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Share2, 
  UserPlus, 
  Plus, 
  Sparkles, 
  Zap, 
  Info,
  Bell,
  Scan,
  Receipt,
  ShieldCheck,
  ChevronRight,
  X
} from 'lucide-react';
import { Room, SplitCalculationResult, Participant } from '../types';
import { formatMoney } from '../utils/splitMath';

interface RoomHeaderProps {
  room: Room;
  splitResult: SplitCalculationResult;
  currentUser: Participant;
  onAddParticipant: (name: string) => void;
  onSwitchUser: (participantId: string) => void;
  onShare: () => void;
  onOpenSettleUp: () => void;
  onOpenAddItem: () => void;
  onOpenVerifyAI?: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  room,
  splitResult,
  currentUser,
  onAddParticipant,
  onSwitchUser,
  onShare,
  onOpenSettleUp,
  onOpenAddItem,
  onOpenVerifyAI,
}) => {
  const [copiedBank, setCopiedBank] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  const copyBankDetails = () => {
    const text = `${room.organizer.payout.bankName} - ${room.organizer.payout.accountNumber} (${room.organizer.payout.accountName})`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    onAddParticipant(newUserName.trim());
    setNewUserName('');
    setShowAddUserModal(false);
  };

  const myBreakdown = splitResult.participantBreakdowns[currentUser.id];
  const myRemaining = myBreakdown?.amountRemaining || 0;

  return (
    <div className="w-full bg-white text-[#0B2B16] px-5 pt-4 pb-2 space-y-4 font-sans">
      
      {/* 1. Top Bar: Avatar + Active User Name on Left, Notification / Share Bell on Right (Modeled after Screen 2) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#ECFDC5] border-2 border-[#B4F32D] text-[#0B2B16] font-bold text-sm flex items-center justify-center shadow-xs">
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-[#0B2B16] leading-tight">
                {currentUser.name}
              </h3>
              {currentUser.isOrganizer && (
                <span className="rounded-full bg-[#0B2B16] text-[#B4F32D] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  Host
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {room.title}
            </p>
          </div>
        </div>

        {/* Right Bell / Share Icon in light lime circular button */}
        <button
          onClick={onShare}
          title="Share room link"
          className="h-10 w-10 rounded-full bg-[#F2FCE2] hover:bg-[#E2F7C2] text-[#0B2B16] flex items-center justify-center transition-colors cursor-pointer border border-[#DDF3BA] shadow-xs active:scale-95"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Vibrant Lime Green Balance Card (Modeled directly after Screen 2) */}
      <div className="rounded-[26px] bg-gradient-to-br from-[#B4F32D] via-[#A8F01D] to-[#88D61A] p-5 text-[#0B2B16] shadow-sm space-y-3 relative overflow-hidden">
        {/* Subtle decorative circles in corner */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/20 pointer-events-none" />
        <div className="absolute right-10 -top-6 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B2B16]/80 uppercase tracking-wider">
            <Receipt className="h-4 w-4" />
            <span>Total Bill</span>
          </div>
          <button
            onClick={() => setShowPayoutModal(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#0B2B16] bg-black/5 hover:bg-black/10 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
          >
            <Info className="h-3 w-3" />
            <span>Payout Info</span>
          </button>
        </div>

        <div className="relative z-10">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B2B16] font-sans">
            {formatMoney(room.grandTotal, room.currency)}
          </div>
          <p className="text-xs font-semibold text-[#0B2B16]/80 mt-1">
            Collected: {formatMoney(splitResult.totalCollected, room.currency)} •{' '}
            <span className={splitResult.remainingToCollect > 0 ? 'text-[#0B2B16]' : 'text-[#0B2B16] font-bold'}>
              {splitResult.remainingToCollect > 0
                ? `${formatMoney(splitResult.remainingToCollect, room.currency)} remaining`
                : 'All Settled'}
            </span>
          </p>
        </div>

        <div className="pt-1 flex items-center justify-between border-t border-[#0B2B16]/10 relative z-10">
          <span className="text-[11px] font-mono font-medium text-[#0B2B16]/70">
            •••• {room.currency}
          </span>
          <button
            onClick={onOpenAddItem}
            className="rounded-full bg-white hover:bg-slate-50 text-[#0B2B16] px-4 py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* 3. 4-Tile Quick Action Grid (Modeled after Send / Receive / Scan QR / More in Screen 2) */}
      <div className="grid grid-cols-4 gap-2.5 pt-1">
        
        {/* Tile 1: Claim */}
        <button
          onClick={onOpenAddItem}
          className="rounded-2xl bg-[#F2FCE2] hover:bg-[#E4F8CC] text-[#0B2B16] p-3 flex flex-col items-center justify-center gap-1.5 border border-[#DDF3BA] shadow-soft transition-all cursor-pointer group active:scale-95"
        >
          <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-[#0B2B16] shadow-2xs group-hover:bg-[#B4F32D] transition-colors">
            <Receipt className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold">Claim</span>
        </button>

        {/* Tile 2: Settle */}
        <button
          onClick={onOpenSettleUp}
          className="rounded-2xl bg-[#F2FCE2] hover:bg-[#E4F8CC] text-[#0B2B16] p-3 flex flex-col items-center justify-center gap-1.5 border border-[#DDF3BA] shadow-soft transition-all cursor-pointer group active:scale-95"
        >
          <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-[#0B2B16] shadow-2xs group-hover:bg-[#B4F32D] transition-colors">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold">Settle</span>
        </button>

        {/* Tile 3: Verify AI (with highlight ring like Scan QR in Screen 2) */}
        <button
          onClick={onOpenVerifyAI || onOpenSettleUp}
          className="rounded-2xl bg-[#F2FCE2] hover:bg-[#E4F8CC] text-[#0B2B16] p-3 flex flex-col items-center justify-center gap-1.5 border border-[#DDF3BA] shadow-soft transition-all cursor-pointer group active:scale-95"
        >
          <div className="h-9 w-9 rounded-xl bg-[#0B2B16] text-[#B4F32D] flex items-center justify-center shadow-xs">
            <Scan className="h-4 w-4 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold">Verify AI</span>
        </button>

        {/* Tile 4: Add Friend */}
        <button
          onClick={() => setShowAddUserModal(true)}
          className="rounded-2xl bg-[#F2FCE2] hover:bg-[#E4F8CC] text-[#0B2B16] p-3 flex flex-col items-center justify-center gap-1.5 border border-[#DDF3BA] shadow-soft transition-all cursor-pointer group active:scale-95"
        >
          <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-[#0B2B16] shadow-2xs group-hover:bg-[#B4F32D] transition-colors">
            <UserPlus className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold">Add Friend</span>
        </button>

      </div>

      {/* 4. Deep Forest Green Fairness Banner (Modeled after "Get 5% Cashback" in Screen 2) */}
      <div 
        onClick={() => setShowPayoutModal(true)}
        className="rounded-2xl bg-[#0B2B16] text-white p-3.5 flex items-center justify-between gap-3 shadow-sm cursor-pointer hover:bg-[#051F10] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-[#B4F32D] text-[#0B2B16] flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Zero-Drift Fair Split Math</span>
            </h4>
            <p className="text-[10px] text-slate-300 font-normal">
              Exact penny balancing • Proportional tax & gratuity
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-[#B4F32D] shrink-0" />
      </div>

      {/* 5. Dynamic Participants Section (ZERO pre-added friends!) */}
      <div className="pt-1 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#0B2B16] uppercase tracking-wider">
            Participants ({room.participants.length})
          </h4>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1 text-xs text-[#0B2B16] font-bold hover:underline cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Dynamic avatars row: If no friends joined yet, show friendly encouragement */}
        {room.participants.length <= 1 ? (
          <div className="rounded-2xl border border-dashed border-[#DDF3BA] bg-[#F8FAF6] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-[#ECFDC5] text-[#0B2B16] font-bold text-xs flex items-center justify-center">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0B2B16]">Only you (Host) are here</p>
                <p className="text-[10px] text-slate-500">Share the link or tap '+ Add Friend' so friends can claim items!</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="rounded-full bg-[#0B2B16] text-[#B4F32D] px-3 py-1.5 text-xs font-bold shrink-0 cursor-pointer hover:bg-[#051F10]"
            >
              + Friend
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {room.participants.map((p) => {
              const breakdown = splitResult.participantBreakdowns[p.id];
              const owed = breakdown?.totalOwed || 0;
              const isSelected = p.id === currentUser.id;

              return (
                <button
                  key={p.id}
                  onClick={() => onSwitchUser(p.id)}
                  className={`flex flex-col items-center gap-1 shrink-0 p-1.5 rounded-2xl transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-[#0B2B16] bg-[#F2FCE2]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-[#ECFDC5] border border-[#B4F32D] text-[#0B2B16] font-bold text-xs flex items-center justify-center">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    {p.paymentStatus === 'VERIFIED' && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#0B2B16] border-2 border-white flex items-center justify-center text-[7px] text-[#B4F32D] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-[#0B2B16] max-w-[60px] truncate">
                    {p.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {p.paymentStatus === 'VERIFIED' ? 'Paid' : formatMoney(owed, room.currency)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Friend Dynamic Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-[#0B2B16]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[#0B2B16]">Add Friend to Split</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="h-7 w-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter their name so they can claim their items and settle their portion.
            </p>
            <form onSubmit={handleAddUser} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Friend's Name (e.g. David, Maria)"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-[#F8FAF6] px-4 py-3 text-xs text-[#0B2B16] focus:border-[#0B2B16] focus:bg-white focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0B2B16] text-[#B4F32D] px-5 py-2 text-xs font-bold hover:bg-[#051F10] cursor-pointer shadow-sm"
                >
                  Add Friend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Host Payout Destination Details Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-[#0B2B16]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[#0B2B16]">Host Payment Destination</h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="h-7 w-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Friends send their share directly to the organizer:
            </p>
            <div className="space-y-2.5 rounded-2xl bg-[#F8FAF6] border border-slate-100 p-4 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Organizer</span>
                <span className="font-bold text-[#0B2B16]">{room.organizer.payout.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Method</span>
                <span className="font-bold text-[#0B2B16]">{room.organizer.payout.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Account / Handle</span>
                <span className="font-mono font-bold text-[#0B2B16] bg-[#ECFDC5] px-2 py-0.5 rounded-md">
                  {room.organizer.payout.accountNumber}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={copyBankDetails}
                className="w-full rounded-full bg-[#0B2B16] text-[#B4F32D] py-3 text-xs font-bold hover:bg-[#051F10] cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {copiedBank ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedBank ? 'Copied to Clipboard' : 'Copy Payout Details'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
