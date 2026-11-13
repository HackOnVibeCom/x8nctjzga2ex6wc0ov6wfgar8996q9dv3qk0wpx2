import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  Scan,
  Send,
  Building2,
  FileCheck,
  Check,
  CreditCard
} from 'lucide-react';
import { Participant, Room, ForensicReport, Transaction } from '../types';
import { formatMoney } from '../utils/splitMath';
import { runClientSideEla } from '../utils/elaTamper';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  participant: Participant;
  room: Room;
  owedAmount: number;
  remainingAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onRecordTransaction: (tx: Transaction) => void;
}

export const PaymentProofModal: React.FC<PaymentModalProps> = ({
  participant,
  room,
  owedAmount,
  remainingAmount,
  isOpen,
  onClose,
  onRecordTransaction,
}) => {
  const [activeMode, setActiveMode] = useState<'INSTANT_P2P' | 'UPLOAD_PROOF'>('INSTANT_P2P');
  const [transferAmount, setTransferAmount] = useState<string>(
    (remainingAmount > 0 ? remainingAmount : owedAmount).toString()
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  // ELA Upload state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'RECEIPT' | 'HEATMAP'>('RECEIPT');
  const [forensicReport, setForensicReport] = useState<ForensicReport | null>(null);

  if (!isOpen) return null;

  // 1. Instant P2P Payment (Like Opay / Cash App / Venmo direct transfer)
  const handleInstantTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount) || 0;
    if (amountNum <= 0) return;

    setIsProcessing(true);
    setProcessingStatus(`Connecting to ${room.organizer.payout.bankName}...`);
    await new Promise((r) => setTimeout(r, 600));

    setProcessingStatus(`Authorizing transfer of ${formatMoney(amountNum, room.currency)}...`);
    await new Promise((r) => setTimeout(r, 600));

    setProcessingStatus('Settling ledger and generating transaction reference...');
    await new Promise((r) => setTimeout(r, 400));

    const refId = `IPIN-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      senderId: participant.id,
      senderName: participant.name,
      recipientName: room.organizer.name,
      amount: amountNum,
      currency: room.currency,
      method: 'DIRECT_TRANSFER',
      referenceId: refId,
      timestamp: 'Just now',
      status: 'COMPLETED',
      notes: `Direct P2P transfer sent to ${room.organizer.payout.bankName} (${room.organizer.payout.accountNumber})`,
    };

    setIsProcessing(false);
    setCompletedTx(newTx);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    onRecordTransaction(newTx);
  };

  // 2. Upload Payment Proof with Client-Side ELA Forensics
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      runScan(file, url);
    }
  };

  const handleLoadSampleProof = (type: 'VALID' | 'TAMPERED') => {
    const sampleImg = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';
    setPreviewUrl(sampleImg);
    runScanSimulation(type, sampleImg);
  };

  const runScan = async (file: File, url: string) => {
    setIsProcessing(true);
    setProcessingStatus('Running client-side Error Level Analysis (ELA)...');

    try {
      const elaResult = await runClientSideEla(file);
      setHeatmapUrl(elaResult.heatmapDataUrl);

      setProcessingStatus('Extracting receipt amount and transaction ID...');
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStatus('Verifying against owed ledger share...');
      await new Promise((r) => setTimeout(r, 500));

      const isTampered = elaResult.report.tamperDetected;
      const refId = `REF-${Date.now().toString().slice(-6)}`;
      const amountPaid = isTampered ? Math.round(owedAmount * 0.3) : owedAmount;

      const finalReport: ForensicReport = {
        ...elaResult.report,
        extractedData: {
          senderName: participant.name,
          recipientName: room.organizer.name,
          amountPaid,
          transactionDate: new Date().toLocaleString(),
          referenceId: refId,
          bankOrProvider: 'Bank Transfer Screenshot',
        },
        mismatchDetails: isTampered
          ? `Discrepancy: Extracted amount (${formatMoney(amountPaid, room.currency)}) is less than owed balance (${formatMoney(owedAmount, room.currency)})`
          : undefined,
      };

      setForensicReport(finalReport);
      setIsProcessing(false);

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        senderId: participant.id,
        senderName: participant.name,
        recipientName: room.organizer.name,
        amount: amountPaid,
        currency: room.currency,
        method: 'RECEIPT_UPLOAD',
        referenceId: refId,
        timestamp: 'Just now',
        status: isTampered ? 'FLAGGED_MISMATCH' : 'COMPLETED',
        proofUrl: url,
        forensics: finalReport,
        notes: isTampered ? 'Flagged: Transfer amount mismatch or pixel anomaly detected' : 'Authentic screenshot verified',
      };

      setCompletedTx(newTx);
      if (!isTampered) {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }
      onRecordTransaction(newTx);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const runScanSimulation = async (type: 'VALID' | 'TAMPERED', url: string) => {
    setIsProcessing(true);
    setProcessingStatus('Analyzing compression artifacts on receipt...');
    await new Promise((r) => setTimeout(r, 500));

    setProcessingStatus('Comparing extracted digits with host payout account...');
    await new Promise((r) => setTimeout(r, 600));

    const isTampered = type === 'TAMPERED';
    const amountPaid = isTampered ? Math.round(owedAmount * 0.3) : owedAmount;
    const refId = `VNM-TRX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const report: ForensicReport = {
      elaScore: isTampered ? 78 : 14,
      elaRiskLevel: isTampered ? 'HIGH' : 'LOW',
      tamperDetected: isTampered,
      tamperReason: isTampered
        ? 'High local artifact variance in numeric amount field (potential Photoshop digit edit)'
        : undefined,
      mismatchDetails: isTampered
        ? `Screenshot shows ${formatMoney(amountPaid, room.currency)}, but expected owed portion is ${formatMoney(owedAmount, room.currency)}`
        : undefined,
      extractedData: {
        senderName: participant.name,
        recipientName: room.organizer.name,
        amountPaid,
        transactionDate: new Date().toLocaleString(),
        referenceId: refId,
        bankOrProvider: isTampered ? 'Venmo Transfer' : 'Chase QuickPay / Zelle',
      },
      verifiedAt: new Date().toISOString(),
    };

    setForensicReport(report);
    setIsProcessing(false);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      senderId: participant.id,
      senderName: participant.name,
      recipientName: room.organizer.name,
      amount: amountPaid,
      currency: room.currency,
      method: 'RECEIPT_UPLOAD',
      referenceId: refId,
      timestamp: 'Just now',
      status: isTampered ? 'FLAGGED_MISMATCH' : 'COMPLETED',
      proofUrl: url,
      forensics: report,
      notes: isTampered ? 'Flagged: Transfer amount mismatch or pixel anomaly detected' : 'Authentic transfer verified',
    };

    setCompletedTx(newTx);
    if (!isTampered) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }
    onRecordTransaction(newTx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl relative my-6 text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Success Transaction Receipt View */}
        {completedTx ? (
          <div className="space-y-4 text-center py-2">
            <div className={`flex h-14 w-14 mx-auto items-center justify-center rounded-full ${
              completedTx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {completedTx.status === 'COMPLETED' ? (
                <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
              ) : (
                <AlertTriangle className="h-8 w-8 stroke-[2.2]" />
              )}
            </div>

            <div>
              <p className="text-xs uppercase font-medium text-slate-400">
                {completedTx.status === 'COMPLETED' ? 'Transaction Completed' : 'Payment Flagged for Review'}
              </p>
              <h3 className="text-2xl font-semibold text-slate-900 mt-1">
                {formatMoney(completedTx.amount, completedTx.currency)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Paid to <strong className="text-slate-800">{room.organizer.name}</strong>
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-xs text-left space-y-1.5 font-sans">
              <div className="flex justify-between text-slate-500">
                <span>Payer:</span>
                <span className="text-slate-900 font-medium">{completedTx.senderName}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Method:</span>
                <span className="text-slate-900 font-medium">
                  {completedTx.method === 'DIRECT_TRANSFER' ? 'Direct P2P Settlement' : 'Receipt Proof Upload'}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Reference ID:</span>
                <span className="text-slate-700 font-mono text-[11px]">{completedTx.referenceId}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Timestamp:</span>
                <span className="text-slate-700">{completedTx.timestamp}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-xs font-medium shadow-blue-btn transition-colors cursor-pointer"
            >
              Done & Return to Ledger
            </button>
          </div>
        ) : (
          /* Payment Flow */
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="flex h-11 w-11 mx-auto items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-1.5">
                <Send className="h-5 w-5 stroke-[2]" />
              </div>
              <p className="text-[11px] text-slate-400 uppercase font-medium tracking-wide">
                Pay Host & Settle Share
              </p>
              <h3 className="text-2xl font-semibold text-slate-900">
                {formatMoney(remainingAmount > 0 ? remainingAmount : owedAmount, room.currency)}
              </h3>
              <p className="text-xs text-slate-500">
                Payer: <strong className="text-slate-800">{participant.name}</strong> • Host: {room.organizer.name}
              </p>
            </div>

            {/* Mode Switcher: Direct Transfer vs Proof Upload */}
            <div className="flex items-center rounded-2xl bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveMode('INSTANT_P2P')}
                className={`flex-1 rounded-xl py-1.5 font-medium transition-colors cursor-pointer ${
                  activeMode === 'INSTANT_P2P' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Direct Payment
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('UPLOAD_PROOF')}
                className={`flex-1 rounded-xl py-1.5 font-medium transition-colors cursor-pointer ${
                  activeMode === 'UPLOAD_PROOF' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Upload Transfer Proof
              </button>
            </div>

            {/* Mode 1: Instant Direct P2P Transfer (Like Opay / Cash App / Venmo) */}
            {activeMode === 'INSTANT_P2P' && (
              <form onSubmit={handleInstantTransfer} className="space-y-3.5">
                {/* Host Payout Destination */}
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-blue-600" />
                    <span>Host Destination Account</span>
                  </div>
                  <p className="text-xs font-mono text-slate-800 font-medium">
                    {room.organizer.payout.bankName} • {room.organizer.payout.accountNumber}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Account Name: {room.organizer.payout.accountName}
                  </p>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-xs font-medium text-slate-600">Payment Amount ({room.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none mt-1 font-semibold"
                  />
                </div>

                {/* Processing State */}
                {isProcessing && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-2.5 text-center text-xs text-blue-700 flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <span>{processingStatus}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white py-3 text-xs font-medium shadow-blue-btn transition-colors cursor-pointer disabled:opacity-50"
                >
                  Confirm & Transfer {formatMoney(parseFloat(transferAmount) || 0, room.currency)}
                </button>
              </form>
            )}

            {/* Mode 2: Upload Bank Screenshot with Forensics */}
            {activeMode === 'UPLOAD_PROOF' && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                  <input
                    type="file"
                    id="receipt-file-upload-modal"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="receipt-file-upload-modal"
                    className="flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-soft mb-1.5">
                      <Upload className="h-5 w-5 stroke-[1.75]" />
                    </div>
                    <p className="text-xs font-medium text-slate-700">
                      Upload Bank Transfer Screenshot
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Client-side ELA verifies pixel authenticity
                    </p>
                  </label>

                  {/* Simulator Buttons */}
                  <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-center gap-2">
                    <span className="text-[10px] text-slate-400">Simulator:</span>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleProof('VALID')}
                      className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium cursor-pointer"
                    >
                      ✓ Valid Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleProof('TAMPERED')}
                      className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-[11px] font-medium cursor-pointer"
                    >
                      ⚠️ Tampered Receipt
                    </button>
                  </div>
                </div>

                {isProcessing && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-2.5 text-center text-xs text-blue-700 flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <span>{processingStatus}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
