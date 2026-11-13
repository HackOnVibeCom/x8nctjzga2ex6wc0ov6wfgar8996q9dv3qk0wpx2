import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Receipt, 
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Room, SplitCalculationResult } from '../types';
import { formatMoney } from '../utils/splitMath';

interface SummaryCardTabProps {
  room: Room;
  splitResult: SplitCalculationResult;
  onShare: () => void;
}

export const SummaryCardTab: React.FC<SummaryCardTabProps> = ({
  room,
  splitResult,
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);

  const generateSummaryText = () => {
    let text = `🧾 *IPIN SETTLEMENT SUMMARY*\n`;
    text += `*Event:* ${room.title}\n`;
    text += `*Total Bill:* ${formatMoney(room.grandTotal, room.currency)}\n`;
    text += `*Host Payout:* ${room.organizer.payout.bankName} - ${room.organizer.payout.accountNumber} (${room.organizer.payout.accountName})\n\n`;
    text += `*PARTICIPANT BREAKDOWN:*\n`;

    for (const p of room.participants) {
      const breakdown = splitResult.participantBreakdowns[p.id];
      const statusIcon =
        p.paymentStatus === 'VERIFIED'
          ? '✅'
          : p.paymentStatus === 'PARTIAL_OR_MISMATCH'
          ? '⚠️'
          : p.paymentStatus === 'SUSPICIOUS_EDIT'
          ? '🚨'
          : '⏳';
      const statusLabel =
        p.paymentStatus === 'VERIFIED'
          ? 'Paid'
          : p.paymentStatus === 'PARTIAL_OR_MISMATCH'
          ? 'Partial/Mismatch'
          : p.paymentStatus === 'SUSPICIOUS_EDIT'
          ? 'Flagged'
          : 'Pending';

      text += `${statusIcon} *${p.name}:* ${formatMoney(breakdown?.totalOwed || 0, room.currency)} (${statusLabel})\n`;
    }

    text += `\n🔗 *Live Bill Link:* ${window.location.href}\n`;
    text += `_Split & verified with IPIN_`;
    return text;
  };

  const copySummaryText = () => {
    const text = generateSummaryText();
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const shareSummaryWhatsApp = () => {
    const text = encodeURIComponent(generateSummaryText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const verifiedCount = room.participants.filter((p) => p.paymentStatus === 'VERIFIED').length;

  return (
    <div className="space-y-4 pb-28 text-slate-900">
      {/* Top Action Pills */}
      <div className="flex items-center gap-2">
        <button
          onClick={shareSummaryWhatsApp}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 text-xs font-medium shadow-blue-btn transition-colors cursor-pointer"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Send to Group Chat</span>
        </button>
        <button
          onClick={copySummaryText}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 text-xs font-medium transition-colors cursor-pointer"
        >
          {copiedSummary ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Clean Digital Receipt Card */}
      <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 space-y-4 shadow-soft">
        <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-200">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 text-blue-600 mb-1">
            <Receipt className="h-5 w-5 stroke-[1.75]" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">{room.title}</h3>
          <p className="text-[11px] text-slate-400 font-mono">
            #{room.id} • {new Date().toLocaleDateString()}
          </p>
          <div className="pt-1">
            <span className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-[10px] font-medium">
              {verifiedCount} of {room.participants.length} Settled
            </span>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="space-y-1.5 text-xs text-slate-600 pb-3 border-b border-dashed border-slate-200">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <span>{formatMoney(splitResult.totalClaimedSubtotal, room.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxes & Service Fees</span>
            <span>{formatMoney(splitResult.extraChargesTotal, room.currency)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-slate-900 pt-1.5 border-t border-slate-200">
            <span>Grand Total</span>
            <span className="text-blue-600">{formatMoney(splitResult.grandTotal, room.currency)}</span>
          </div>
        </div>

        {/* Participants Breakdown */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Breakdown by Participant
          </p>

          {room.participants.map((p) => {
            const b = splitResult.participantBreakdowns[p.id];
            return (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {p.paymentStatus === 'VERIFIED' && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                  {p.paymentStatus === 'PARTIAL_OR_MISMATCH' && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  {p.paymentStatus === 'SUSPICIOUS_EDIT' && (
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  {p.paymentStatus === 'UNPAID' && (
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span className="font-medium text-slate-700">{p.name}</span>
                </div>

                <div className="text-right">
                  <span className="font-medium text-slate-900">
                    {formatMoney(b?.totalOwed || 0, room.currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payout note */}
        <div className="pt-2 text-center text-[10px] text-slate-400">
          Host Payout: {room.organizer.payout.bankName} • {room.organizer.payout.accountNumber}
        </div>
      </div>
    </div>
  );
};
