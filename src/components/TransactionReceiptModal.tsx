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
  ExternalLink,
  Eye
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
}) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [showProofImage, setShowProofImage] = useState(false);

  if (!isOpen) return null;

  const isCompleted = transaction.status === 'COMPLETED';
  const isFlagged = transaction.status === 'FLAGGED_MISMATCH' || transaction.status === 'SUSPICIOUS_EDIT';

  const copyRef = () => {
    navigator.clipboard.writeText(transaction.referenceId);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const copyFullReceiptText = () => {
    const text = `🧾 IPIN SETTLEMENT RECEIPT
Ref: ${transaction.referenceId}
Event: ${room.title}
Amount: ${formatMoney(transaction.amount, transaction.currency)}
From: ${transaction.senderName}
To: ${transaction.recipientName}
Method: ${transaction.method === 'DIRECT_TRANSFER' ? 'Direct P2P Settle' : 'AI Verified Screenshot'}
Date: ${transaction.timestamp}
Status: ${isCompleted ? 'VERIFIED SETTLED' : 'FLAGGED FOR REVIEW'}`;
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl relative my-6 text-slate-900 border border-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Status Icon */}
        <div className="text-center pt-1 pb-3">
          <div className={`flex h-13 w-13 mx-auto items-center justify-center rounded-full ${
            isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="h-7 w-7 stroke-[2.2]" />
            ) : (
              <AlertTriangle className="h-7 w-7 stroke-[2.2]" />
            )}
          </div>

          <p className="text-[10px] uppercase font-semibold text-slate-400 mt-2 tracking-wider">
            {isCompleted ? 'Settlement Slip' : 'Payment Flagged'}
          </p>

          <h3 className="text-3xl font-bold text-slate-900 mt-0.5 font-sans">
            {formatMoney(transaction.amount, transaction.currency)}
          </h3>

          <p className="text-[11px] text-slate-500 mt-0.5">
            {transaction.method === 'DIRECT_TRANSFER' 
              ? 'Instant Ledger Settlement' 
              : 'Screenshot Verification & ELA Scan'}
          </p>
        </div>

        {/* Transaction Details Card */}
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 space-y-2.5 text-xs mb-4">
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
            <span className="text-slate-400 font-normal">Payer</span>
            <span className="font-semibold text-slate-800">{transaction.senderName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">Beneficiary</span>
            <span className="font-semibold text-slate-800">{transaction.recipientName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">Timestamp</span>
            <span className="font-medium text-slate-700">{transaction.timestamp}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400 font-normal">Payout Rail</span>
            <span className="font-medium text-slate-700">{room.organizer.payout.bankName}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
            <span className="text-slate-400 font-normal">Ledger Status</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              isCompleted 
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
          <div className={`p-3 rounded-2xl border text-xs mb-4 ${
            transaction.forensics.tamperDetected 
              ? 'bg-rose-50 border-rose-100 text-rose-800' 
              : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}>
            <div className="flex items-center justify-between font-semibold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {transaction.forensics.tamperDetected 
                    ? 'Forensic Anomaly Detected' 
                    : 'Client-Side Pixel ELA Verified'}
                </span>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/5">
                Score: {transaction.forensics.elaScore}/100
              </span>
            </div>
            <p className="text-[11px] mt-1 text-slate-600">
              {transaction.forensics.mismatchDetails || transaction.forensics.tamperReason || 'Pixel compression artifacts verified authentic.'}
            </p>

            {transaction.proofUrl && (
              <button
                type="button"
                onClick={() => setShowProofImage(!showProofImage)}
                className="mt-2 text-[11px] text-blue-600 font-medium underline flex items-center gap-1 cursor-pointer"
              >
                <Eye className="h-3 w-3" />
                <span>{showProofImage ? 'Hide Proof Screenshot' : 'View Proof Screenshot'}</span>
              </button>
            )}

            {showProofImage && transaction.proofUrl && (
              <div className="mt-2 rounded-xl overflow-hidden border border-black/10">
                <img 
                  src={transaction.proofUrl} 
                  alt="Proof Screenshot" 
                  className="w-full max-h-48 object-cover" 
                />
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={copyFullReceiptText}
            className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 text-xs font-medium transition-colors cursor-pointer"
          >
            {copiedReceipt ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedReceipt ? 'Receipt Copied' : 'Copy Full Receipt Slip'}</span>
          </button>
          
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
