import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Share2, 
  UserPlus, 
  Plus, 
  ExternalLink,
  Sparkles,
  Zap,
  Info
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
    <div className="w-full bg-[#050819] text-white">
      <div className="px-4 sm:px-6 pt-4 pb-5 space-y-4">
        
        {/* Top Info Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold ring-2 ring-white/10">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-normal">Active Participant</p>
              <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                {currentUser.name}
                {currentUser.isOrganizer && (
                  <span className="rounded-md bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-medium text-blue-300">
                    Host
                  </span>
                )}
              </h3>
            </div>
          </div>

          <button
            onClick={onShare}
            className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-blue-400" />
            <span>Share Room</span>
          </button>
        </div>

        {/* Total Bill Balance Display */}
        <div className="text-center py-1.5 space-y-1">
          <p className="text-[11px] uppercase tracking-wider font-medium text-slate-400">
            Total Bill
          </p>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
            {formatMoney(room.grandTotal, room.currency)}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-0.5">
            <span className="text-emerald-400 font-medium">
              Collected: {formatMoney(splitResult.totalCollected, room.currency)}
            </span>
            <span>•</span>
            <span className={splitResult.remainingToCollect > 0 ? 'text-amber-300' : 'text-emerald-400'}>
              {splitResult.remainingToCollect > 0
                ? `${formatMoney(splitResult.remainingToCollect, room.currency)} remaining`
                : 'All Settled'}
            </span>
          </div>

          {/* Quick Action Pills */}
          <div className="flex items-center justify-center gap-2 pt-2.5">
            <button
              onClick={onOpenAddItem}
              className="flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-blue-400" />
              <span>Add Item</span>
            </button>

            {myRemaining > 0 && (
              <button
                onClick={onOpenSettleUp}
                className="flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white shadow-blue-btn hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Settle My Share ({formatMoney(myRemaining, room.currency)})</span>
              </button>
            )}

            <button
              onClick={() => setShowPayoutModal(true)}
              className="flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/15 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              <Info className="h-3.5 w-3.5 text-slate-300" />
              <span>Host Info</span>
            </button>
          </div>
        </div>
      </div>

      {/* Participants Avatar Row */}
      <div className="rounded-t-[28px] bg-white pt-4 pb-3 px-4 sm:px-6 text-slate-900 border-b border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Participants ({room.participants.length})
          </h4>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Horizontal Avatars */}
        <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none">
          {room.participants.map((p) => {
            const isSelected = p.id === currentUser.id;
            const b = splitResult.participantBreakdowns[p.id];
            const remaining = b?.amountRemaining || 0;
            return (
              <button
                key={p.id}
                onClick={() => onSwitchUser(p.id)}
                className={`flex flex-col items-center gap-1 shrink-0 p-1 rounded-2xl transition-all cursor-pointer ${
                  isSelected ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-semibold shadow-xs transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[11px] font-medium text-slate-800 truncate max-w-[56px]">
                  {p.name}
                </span>
                <span className={`text-[9px] font-normal -mt-0.5 ${
                  remaining === 0 && (b?.totalOwed || 0) > 0 ? 'text-emerald-600 font-medium' : 'text-slate-500'
                }`}>
                  {remaining === 0 && (b?.totalOwed || 0) > 0 ? 'Paid' : formatMoney(remaining, room.currency)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Friend Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Add Friend to Bill</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter their name so they can claim items and settle up.
            </p>
            <form onSubmit={handleAddUser} className="space-y-3">
              <input
                type="text"
                required
                placeholder="e.g. Kenji, Sarah, Mateo"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Host Payment Destination</h3>
            <p className="text-xs text-slate-500 mb-4">
              Send your share directly to the organizer using these details:
            </p>
            <div className="space-y-2 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400 font-normal">Organizer</span>
                <span className="font-semibold text-slate-800">{room.organizer.payout.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-normal">Method / Rail</span>
                <span className="font-semibold text-slate-800">{room.organizer.payout.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-normal">Handle / Link / IBAN</span>
                <span className="font-mono font-semibold text-blue-600">{room.organizer.payout.accountNumber}</span>
              </div>
              {room.organizer.payout.note && (
                <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 italic">
                  Note: "{room.organizer.payout.note}"
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={copyBankDetails}
                className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer flex items-center gap-1.5"
              >
                {copiedBank ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedBank ? 'Copied' : 'Copy Details'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
