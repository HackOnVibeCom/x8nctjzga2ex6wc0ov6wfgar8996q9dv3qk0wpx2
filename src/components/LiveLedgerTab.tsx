import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Scan, 
  ChevronDown, 
  ChevronRight,
  ArrowDownLeft,
  Sparkles,
  Zap
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
}

export const LiveLedgerTab: React.FC<LiveLedgerTabProps> = ({
  room,
  splitResult,
  currentUser,
  onOpenSettleModal,
  onInspectForensics,
  onViewTransactionReceipt,
}) => {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedUser(expandedUser === id ? null : id);
  };

  const myBreakdown = splitResult.participantBreakdowns[currentUser.id];
  const myRemaining = myBreakdown?.amountRemaining || 0;

  return (
    <div className="space-y-4 pb-28 text-slate-900">
      
      {/* Real-time Collection Progress Bar */}
      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500 uppercase tracking-wider text-[10px]">
            Collection Progress
          </span>
          <span className="font-semibold text-blue-600">
            {splitResult.collectionProgressPercent}% Collected
          </span>
        </div>

        {/* Progress Track */}
        <div className="h-2.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${splitResult.collectionProgressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <div>
            <span className="text-[10px] text-slate-400 block font-normal">Collected</span>
            <span className="font-semibold text-emerald-600">
              {formatMoney(splitResult.totalCollected, room.currency)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-normal">Remaining</span>
            <span className="font-semibold text-slate-800">
              {formatMoney(splitResult.remainingToCollect, room.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* User's Direct Settle Banner if Unpaid */}
      {myRemaining > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-soft flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-blue-100 font-medium">Your Owed Share</p>
            <h4 className="text-xl font-bold tracking-tight">
              {formatMoney(myRemaining, room.currency)}
            </h4>
          </div>
          <button
            onClick={() => onOpenSettleModal(currentUser)}
            className="rounded-xl bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Settle Now</span>
          </button>
        </div>
      )}

      {/* Participants Split Ledger Section */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Participant Balances
          </h3>
          <span className="text-[10px] text-slate-400">Proportional Tax & Tip</span>
        </div>

        <div className="space-y-2">
          {room.participants.map((participant) => {
            const breakdown = splitResult.participantBreakdowns[participant.id];
            const isMe = participant.id === currentUser.id;
            const isExpanded = expandedUser === participant.id;
            const status = participant.paymentStatus;
            const remaining = breakdown?.amountRemaining || 0;

            return (
              <div
                key={participant.id}
                className={`rounded-2xl border transition-all ${
                  isMe ? 'bg-blue-50/30 border-blue-200' : 'bg-white border-slate-100'
                } shadow-soft overflow-hidden`}
              >
                {/* Main Participant Row */}
                <div className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isMe ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {participant.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900">
                          {participant.name}
                        </span>
                        {isMe && (
                          <span className="rounded-md bg-blue-100 px-1.5 py-0.2 text-[9px] font-medium text-blue-700">
                            You
                          </span>
                        )}
                        {participant.isOrganizer && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-600">
                            Host
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {breakdown?.claimedItems.length || 0} items ({breakdown?.percentageOfSubtotal || 0}%)
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Badges */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900">
                        {formatMoney(breakdown?.totalOwed || 0, room.currency)}
                      </p>
                      <p className="text-[10px]">
                        {remaining === 0 && (breakdown?.totalOwed || 0) > 0 ? (
                          <span className="text-emerald-600 font-medium">Fully Settled</span>
                        ) : status === 'PARTIAL_OR_MISMATCH' ? (
                          <span className="text-amber-600 font-medium">Underpaid</span>
                        ) : (
                          <span className="text-slate-400">Owes {formatMoney(remaining, room.currency)}</span>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    {remaining > 0 ? (
                      <button
                        onClick={() => onOpenSettleModal(participant)}
                        className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Settle
                      </button>
                    ) : (
                      <button
                        onClick={() => onInspectForensics(participant)}
                        className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Scan className="h-3.5 w-3.5 text-blue-600 inline mr-1" />
                        Proof
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(participant.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Breakdown */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-1.5 text-xs">
                    {breakdown?.claimedItems.map((ci) => (
                      <div key={ci.item.id} className="flex justify-between text-slate-600">
                        <span>{ci.item.cleanName} {ci.shareCount > 1 && `(1/${ci.shareCount})`}</span>
                        <span>{formatMoney(ci.userPortionPrice, room.currency)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-200/60 text-[11px]">
                      <span>Proportional Tax & Tip</span>
                      <span>{formatMoney(breakdown?.proportionalExtraCharges || 0, room.currency)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Settlements Activity Feed */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Settlement Feed ({room.transactions?.length || 0})
          </h3>
          <span className="text-[10px] text-slate-400">Live ledger</span>
        </div>

        {(!room.transactions || room.transactions.length === 0) ? (
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center text-xs text-slate-400">
            No payments recorded yet. Tap "Settle" to log a payment.
          </div>
        ) : (
          <div className="space-y-1.5">
            {room.transactions.map((tx) => {
              const isCompleted = tx.status === 'COMPLETED';
              return (
                <div
                  key={tx.id}
                  onClick={() => onViewTransactionReceipt(tx)}
                  className="rounded-2xl bg-white border border-slate-100 hover:border-slate-200 p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer shadow-soft group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 stroke-[2.2]" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 stroke-[2.2]" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {tx.senderName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          → {tx.recipientName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {tx.method === 'DIRECT_TRANSFER' ? 'Direct Settle' : 'Screenshot Scan'} • {tx.timestamp}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-xs sm:text-sm font-semibold ${
                      isCompleted ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      +{formatMoney(tx.amount, tx.currency)}
                    </p>
                    <span className={`inline-block rounded-full px-1.5 py-0.2 text-[9px] font-medium ${
                      isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {isCompleted ? 'Settled' : 'Flagged'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
