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
  Eye,
  Receipt
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
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto font-sans"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl relative my-6 text-[#0B2B16] border border-slate-100"
      >
        
        {/* Close Button */}
        <button
          id="close-receipt-modal-x-btn"
          onClick={onClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Stamp */}
        <div className="flex items-center justify-center gap-1.5 text-[#0B2B16] mb-3">
          <div className="h-7 w-7 rounded-xl bg-[#0B2B16] text-[#B4F32D] flex items-center justify-center font-bold text-xs">
            <Receipt className="h-4 w-4 stroke-[2.5]" />
          </div>
          <span className="text-sm font-extrabold tracking-tight uppercase">IPIN OFFICIAL RECEIPT</span>
        </div>

        {/* Status Badge */}
        <div className="text-center py-2 space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-[#F2FCE2] text-[#0B2B16]">
            {isCompleted ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Settlement Verified</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                <span>Under Review / Flagged</span>
              </>
            )}
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-[#0B2B16] font-sans pt-1">
            {formatMoney(transaction.amount, transaction.currency)}
          </div>
          <p className="text-xs text-slate-500 font-medium">{room.title}</p>
        </div>

        {/* Digital Slip Body */}
        <div className="my-4 rounded-2xl bg-[#F8FAF6] p-4 text-xs space-y-2.5 border border-[#DDF3BA]">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Reference Code</span>
            <div className="flex items-center gap-1">
              <span className="font-mono font-bold text-[#0B2B16]">{transaction.referenceId}</span>
              <button 
                onClick={copyRef} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                title="Copy reference code"
              >
                {copiedRef ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Payer (Friend)</span>
            <span className="font-bold text-[#0B2B16]">{transaction.senderName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Recipient (Host)</span>
            <span className="font-bold text-[#0B2B16]">{transaction.recipientName}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Method</span>
            <span className="font-bold text-[#0B2B16]">
              {transaction.method === 'POLLAR_ONRAMP'
                ? 'Pollar Stellar On-Ramp'
                : transaction.method === 'POLLAR_OFFRAMP'
                ? 'Pollar Stellar Off-Ramp'
                : transaction.method === 'DIRECT_TRANSFER'
                ? 'Direct P2P Settle'
                : 'AI Verified Proof'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Timestamp</span>
            <span className="font-mono text-slate-700">{transaction.timestamp}</span>
          </div>

          {transaction.stellarTxHash && (
            <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-medium">Stellar Testnet Tx</span>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${transaction.stellarTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-800 hover:underline flex items-center gap-1 font-mono font-bold"
              >
                <span>{transaction.stellarTxHash.slice(0, 8)}...{transaction.stellarTxHash.slice(-6)}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={copyFullReceiptText}
            className="w-full flex items-center justify-center gap-1.5 rounded-full bg-[#F2FCE2] hover:bg-[#E4F8CC] text-[#0B2B16] py-3 text-xs font-bold transition-colors cursor-pointer"
          >
            {copiedReceipt ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedReceipt ? 'Receipt Copied' : 'Copy Full Receipt Slip'}</span>
          </button>
          
          <button
            id="close-receipt-modal-done-btn"
            onClick={onClose}
            className="w-full rounded-full bg-[#0B2B16] hover:bg-[#051F10] text-[#B4F32D] py-3.5 text-xs font-bold shadow-forest-btn transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
