import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  Building2,
  ShieldCheck,
  Copy,
  Check,
  Scan,
  ExternalLink
} from 'lucide-react';
import { Transaction, Room } from '../types';
import { formatMoney } from '../utils/splitMath';

interface TransactionReceiptModalProps {
  transaction: Transaction;
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onInspectForensics?: (tx: Transaction) => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  transaction,
  room,
  isOpen,
  onClose,
  onInspectForensics,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);

  if (!isOpen) return null;

  const isCompleted = transaction.status === 'COMPLETED';
  const isFlagged = transaction.status === 'FLAGGED_MISMATCH' || transaction.status === 'SUSPICIOUS_EDIT';

  const copyRef = () => {
    navigator.clipboard.writeText(transaction.referenceId);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl relative my-6 text-slate-900 border border-slate-100">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Status Icon */}
        <div className="text-center pt-2 pb-4">
          <div className={`flex h-14 w-14 mx-auto items-center justify-center rounded-full ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
            {isCompleted ? (
              <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
            ) : (
              <AlertTriangle className="h-8 w-8 stroke-[2.2]" />
            )}
          </div>

          <p className="text-xs uppercase font-medium text-slate-400 mt-2.5 tracking-wider">
            {isCompleted ? 'Transfer Successful' : 'Transaction Flagged'}
          </p>

          <h3 className="text-3xl font-bold text-slate-900 mt-1 font-sans">
            {formatMoney(transaction.amount, transaction.currency)}
          </h3>

          <p className="text-xs text-slate-500 mt-0.5">
            {transaction.method === 'DIRECT_TRANSFER'
              ? 'Instant P2P Bank Settlement'
              : 'Screenshot Verification & ELA Match'}
          </p>
        </div>

        {/* Transaction Details Card */}
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3 text-xs mb-5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-normal">Reference ID</span>
            <button
              onClick={copyRef}
              className="flex items-center gap-1 font-mono font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <span>{transaction.referenceId}</span>
              {copiedRef ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">Sender</span>
            <span className="font-medium text-slate-800">{transaction.senderName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">Recipient</span>
            <span className="font-medium text-slate-800">{transaction.recipientName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">Time</span>
            <span className="font-medium text-slate-800">{transaction.timestamp}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">Bank Rail</span>
            <span className="font-medium text-slate-800">{room.organizer.payout.bankName}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
            <span className="text-slate-400 font-normal">Ledger Status</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isCompleted
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
              }`}>
              {isCompleted ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {isCompleted ? 'Settled on Room Ledger' : 'Review Required'}
            </span>
          </div>
        </div>

        {/* Forensic Report Notice if uploaded receipt */}
        {transaction.forensics && (
          <div className={`p-3 rounded-2xl border text-xs mb-5 ${transaction.forensics.tamperDetected
              ? 'bg-rose-50 border-rose-100 text-rose-800'
              : 'bg-emerald-50 border-emerald-100 text-emerald-800'
            }`}>
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>
                {transaction.forensics.tamperDetected
                  ? 'Forensic Anomaly Detected'
                  : 'Client-Side Pixel ELA Verified'}
              </span>
            </div>
            <p className="text-[11px] mt-1 text-slate-600">
              {transaction.forensics.mismatchDetails || transaction.forensics.tamperReason || 'Pixel compression artifacts verified authentic.'}
            </p>
          </div>
        )}

        {/* Notes */}
        {transaction.notes && (
          <p className="text-[11px] text-slate-400 text-center mb-5 italic">
            "{transaction.notes}"
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

