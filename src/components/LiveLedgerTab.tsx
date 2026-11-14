import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Scan, 
  ChevronDown, 
  ChevronRight,
  ArrowDownLeft,
  Sparkles,
  Zap,
  Users,
  ArrowLeft
} from 'lucide-react';
import { Room, SplitCalculationResult, Participant, Transaction } from '../types';
import { formatMoney } from '../utils/splitMath';

interface LiveLedgerTabProps {
  room: Room;
  splitResult: SplitCalculationResult;
  currentUser: Participant;
  onOpenSettleModal: (participant: Participant) => void;
  onInspectForensics: (participant: Participant) => void;
  onViewTransactionReceipt: (tx: Transaction) => void;
  onBackToHome?: () => void;
}

export const LiveLedgerTab: React.FC<LiveLedgerTabProps> = ({
  room,
  splitResult,
  currentUser,
  onOpenSettleModal,
  onInspectForensics,
  onViewTransactionReceipt,
  onBackToHome,
}) => {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedUser(expandedUser === id ? null : id);
  };

  const myBreakdown = splitResult.participantBreakdowns[currentUser.id];
  const myRemaining = myBreakdown?.amountRemaining || 0;

  return (
    <div className="space-y-4 pb-28 text-[#0B2B16] font-sans">
      
      {/* Subpage Header with Back to Home */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        {onBackToHome ? (
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0B2B16] transition-colors cursor-pointer py-1 px-2 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-1.5 bg-[#0B2B16] text-[#B4F32D] px-2.5 py-1 rounded-full text-[10px] font-bold">
          <Users className="h-3 w-3" />
          <span>Live Ledger & Settlements</span>
        </div>
      </div>
      
      {/* Real-time Collection Progress Bar (Lime Green Accent) */}
      <div className="rounded-3xl bg-[#F8FAF6] border border-[#DDF3BA] p-4 space-y-2.5 shadow-soft">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#0B2B16] uppercase tracking-wider text-[10px]">
            Collection Progress
          </span>
          <span className="font-extrabold text-[#0B2B16]">
            {splitResult.collectionProgressPercent}% Collected
          </span>
        </div>

        {/* Progress Track */}
        <div className="h-3 w-full bg-slate-200/70 rounded-full overflow-hidden p-0.5">
          <div 
            className="h-full bg-[#B4F32D] rounded-full transition-all duration-500 ease-out border border-[#8ED818]"
            style={{ width: `${splitResult.collectionProgressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <div>
            <span className="text-[10px] text-slate-500 block font-medium">Collected</span>
            <span className="font-bold text-[#0B2B16]">
              {formatMoney(splitResult.totalCollected, room.currency)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block font-medium">Remaining</span>
            <span className="font-bold text-[#0B2B16]">
              {formatMoney(splitResult.remainingToCollect, room.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* User's Direct Settle Banner if Unpaid */}
      {myRemaining > 0 && (
        <div className="rounded-3xl bg-[#0B2B16] p-4 text-white shadow-forest-btn flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-[#B4F32D] font-bold uppercase tracking-wider">Your Owed Share</p>
            <h4 className="text-2xl font-extrabold tracking-tight">
              {formatMoney(myRemaining, room.currency)}
            </h4>
          </div>
          <button
            onClick={() => onOpenSettleModal(currentUser)}
            className="rounded-full bg-[#B4F32D] text-[#0B2B16] hover:bg-[#A0E21B] px-5 py-2.5 text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Zap className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Settle Share</span>
          </button>
        </div>
      )}

      {/* Participants Split Ledger Section */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-[#0B2B16] uppercase tracking-wider">
            Breakdown by Participant
          </h4>
          <span className="text-[11px] text-slate-500">
            {room.participants.length} total
          </span>
        </div>

        <div className="space-y-2.5">
          {room.participants.map((p) => {
            const breakdown = splitResult.participantBreakdowns[p.id];
            const isExpanded = expandedUser === p.id;
            const isMe = p.id === currentUser.id;

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-100 bg-white shadow-soft overflow-hidden transition-all"
              >
                {/* Main Row */}
                <div 
                  onClick={() => toggleExpand(p.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#ECFDC5] text-[#0B2B16] font-bold text-xs flex items-center justify-center shrink-0">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-[#0B2B16]">
                          {p.name}
                        </span>
                        {isMe && (
                          <span className="rounded-full bg-[#F2FCE2] text-[#0B2B16] px-2 py-0.2 text-[9px] font-bold">
                            You
                          </span>
                        )}
                        {p.isOrganizer && (
                          <span className="rounded-full bg-[#0B2B16] text-[#B4F32D] px-2 py-0.2 text-[9px] font-bold">
                            Host
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {breakdown?.claimedItems.length || 0} item{(breakdown?.claimedItems.length || 0) === 1 ? '' : 's'} claimed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-bold text-[#0B2B16]">
                        {formatMoney(breakdown?.totalOwed || 0, room.currency)}
                      </p>
                      <span className={`text-[10px] font-bold block ${
                        p.paymentStatus === 'VERIFIED'
                          ? 'text-emerald-600'
                          : p.paymentStatus === 'SUSPICIOUS_EDIT'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}>
                        {p.paymentStatus === 'VERIFIED' ? '✓ Paid' : 'Pending'}
                      </span>
                    </div>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && breakdown && (
                  <div className="px-4 pb-4 pt-1 bg-[#F8FAF6] border-t border-slate-100 text-xs space-y-2">
                    <div className="space-y-1.5 pt-1">
                      {breakdown.claimedItems.map((ci) => (
                        <div key={ci.item.id} className="flex justify-between text-slate-600 text-[11px]">
                          <span>
                            {ci.item.cleanName} {ci.shareCount > 1 ? `(1/${ci.shareCount})` : ''}
                          </span>
                          <span className="font-mono">{formatMoney(ci.userPortionPrice, room.currency)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center font-bold text-xs">
                      <span>Total Share</span>
                      <span className="text-[#0B2B16]">{formatMoney(breakdown.totalOwed, room.currency)}</span>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => onOpenSettleModal(p)}
                        className="flex-1 rounded-full bg-[#0B2B16] text-[#B4F32D] py-2 text-xs font-bold shadow-xs hover:bg-[#051F10] transition-colors"
                      >
                        Settle or Verify
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
