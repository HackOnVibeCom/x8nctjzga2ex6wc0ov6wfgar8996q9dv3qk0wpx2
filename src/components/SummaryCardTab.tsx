import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Receipt, 
  MessageCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  ArrowLeft 
} from 'lucide-react';
import { Room, SplitCalculationResult } from '../types';
import { formatMoney } from '../utils/splitMath';

interface SummaryCardTabProps {
  room: Room;
  splitResult: SplitCalculationResult;
  onShare: () => void;
  onBackToHome?: () => void;
}

export const SummaryCardTab: React.FC<SummaryCardTabProps> = ({
  room,
  splitResult,
  onShare,
  onBackToHome,
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
          <Receipt className="h-3 w-3" />
          <span>Final Bill Summary</span>
        </div>
      </div>

      {/* Top Action Pills (Lime + Forest Palette) */}
      <div className="flex items-center gap-2">
        <button
          onClick={shareSummaryWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#0B2B16] hover:bg-[#051F10] text-[#B4F32D] px-4 py-3 text-xs font-bold shadow-forest-btn transition-all cursor-pointer active:scale-95"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Send to WhatsApp Group</span>
        </button>
        <button
          onClick={copySummaryText}
          className="flex items-center justify-center gap-1.5 rounded-full bg-[#F2FCE2] hover:bg-[#E4F8CC] text-[#0B2B16] px-4 py-3 text-xs font-bold border border-[#DDF3BA] transition-all cursor-pointer active:scale-95"
        >
          {copiedSummary ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Clean Digital Receipt Card */}
      <div className="rounded-[28px] border border-[#DDF3BA] bg-[#F8FAF6] p-5 space-y-4 shadow-soft">
        <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-200">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#ECFDC5] text-[#0B2B16] mb-1">
            <Receipt className="h-6 w-6 stroke-[2]" />
          </div>
          <h3 className="text-sm font-bold text-[#0B2B16]">{room.title}</h3>
          <p className="text-2xl font-black text-[#0B2B16] font-sans">
            {formatMoney(room.grandTotal, room.currency)}
          </p>
        </div>

        {/* Dynamic Participants Summary Rows */}
        <div className="space-y-2 pt-1">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Participant Balances
          </h4>
          <div className="space-y-1.5">
            {room.participants.map((p) => {
              const b = splitResult.participantBreakdowns[p.id];
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[#ECFDC5] text-[#0B2B16] font-bold text-[10px] flex items-center justify-center">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-[#0B2B16]">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0B2B16]">
                      {formatMoney(b?.totalOwed || 0, room.currency)}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      p.paymentStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.paymentStatus === 'VERIFIED' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payout Reference Note */}
        <div className="rounded-2xl bg-white p-3 border border-slate-100 text-[11px] text-slate-600 space-y-1">
          <span className="font-bold text-[#0B2B16] block">Host Payout Details:</span>
          <p>{room.organizer.payout.bankName} - {room.organizer.payout.accountNumber} ({room.organizer.payout.accountName})</p>
        </div>
      </div>

    </div>
  );
};
