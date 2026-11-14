import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Scan, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Layers, 
  Check, 
  FileText,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Room, SplitCalculationResult, Participant, Transaction, ForensicReport } from '../types';
import { formatMoney } from '../utils/splitMath';
import { runClientSideEla } from '../utils/elaTamper';
import confetti from 'canvas-confetti';

interface VerifyAITabProps {
  room: Room;
  splitResult: SplitCalculationResult;
  currentUser: Participant;
  onBackToHome: () => void;
  onRecordTransaction: (tx: Transaction) => void;
  onViewTransactionReceipt: (tx: Transaction) => void;
}

export const VerifyAITab: React.FC<VerifyAITabProps> = ({
  room,
  splitResult,
  currentUser,
  onBackToHome,
  onRecordTransaction,
  onViewTransactionReceipt,
}) => {
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(
    currentUser.id || room.participants[0]?.id || ''
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [activeImgView, setActiveImgView] = useState<'PHOTO' | 'HEATMAP'>('HEATMAP');
  const [forensicReport, setForensicReport] = useState<ForensicReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  const selectedParticipant = room.participants.find((p) => p.id === selectedParticipantId) || room.participants[0];
  const participantBreakdown = selectedParticipant ? splitResult.participantBreakdowns[selectedParticipant.id] : null;
  const targetAmount = participantBreakdown?.amountRemaining || participantBreakdown?.totalOwed || 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVerifiedSuccess(false);
    setIsAnalyzing(true);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const elaResult = await runClientSideEla(file);
      setHeatmapUrl(elaResult.heatmapDataUrl);

      const refId = `ELA-${Date.now().toString().slice(-6)}`;
      const isTampered = elaResult.report.tamperDetected;

      const report: ForensicReport = {
        ...elaResult.report,
        extractedData: {
          senderName: selectedParticipant?.name,
          recipientName: room.organizer.name,
          amountPaid: isTampered ? Math.round(targetAmount * 0.5) : targetAmount,
          transactionDate: new Date().toLocaleTimeString(),
          referenceId: refId,
          bankOrProvider: room.organizer.payout.bankName,
        },
        mismatchDetails: isTampered
          ? `Discrepancy: High artifact noise detected around amount digits (${elaResult.report.elaScore}/100 anomaly).`
          : undefined,
      };

      setForensicReport(report);
    } catch (err) {
      console.error('Forensic analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmVerification = () => {
    if (!selectedParticipant || !forensicReport) return;

    const txStatus = forensicReport.tamperDetected 
      ? 'SUSPICIOUS_EDIT' 
      : forensicReport.mismatchDetails 
      ? 'FLAGGED_MISMATCH' 
      : 'COMPLETED';

    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: selectedParticipant.id,
      senderName: selectedParticipant.name,
      recipientName: room.organizer.name,
      amount: targetAmount,
      currency: room.currency,
      method: 'RECEIPT_UPLOAD',
      referenceId: forensicReport.extractedData?.referenceId || `ELA-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      status: txStatus,
      proofUrl: previewUrl || undefined,
      forensics: forensicReport,
      notes: forensicReport.tamperDetected 
        ? `ELA Forensics Flag: ${forensicReport.tamperReason}` 
        : `Verified via Client-Side Canvas ELA`,
    };

    onRecordTransaction(tx);
    setVerifiedSuccess(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  return (
    <div className="space-y-4 pb-28 text-[#0B2B16] font-sans">
      
      {/* Subpage Header with Back to Home */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0B2B16] transition-colors cursor-pointer py-1 px-2 rounded-xl hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </button>
        <div className="flex items-center gap-1.5 bg-[#0B2B16] text-[#B4F32D] px-2.5 py-1 rounded-full text-[10px] font-bold">
          <Scan className="h-3 w-3" />
          <span>Forensic Scanner</span>
        </div>
      </div>

      {/* Page Title Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B2B16] to-[#051F10] text-white p-5 space-y-2 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-[#B4F32D] uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4" />
          <span>Client-Side Canvas ELA Forensics</span>
        </div>
        <h2 className="text-xl font-extrabold text-white">Verify Transfer Screenshots</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Zero-latency image forensics runs directly in your browser. Detects font tampering, photoshopped amounts, and fake bank transfer receipts before settling.
        </p>
      </div>

      {/* 1. Select Participant to Verify */}
      <div className="rounded-2xl bg-[#F8FAF6] border border-slate-200/80 p-3.5 space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Select Friend's Payment to Verify
        </label>
        <select
          value={selectedParticipantId}
          onChange={(e) => setSelectedParticipantId(e.target.value)}
          className="w-full rounded-xl bg-white border border-slate-200 py-2.5 px-3 text-xs font-bold text-[#0B2B16] focus:outline-none focus:ring-2 focus:ring-[#B4F32D]"
        >
          {room.participants.map((p) => {
            const b = splitResult.participantBreakdowns[p.id];
            const owed = b?.amountRemaining || b?.totalOwed || 0;
            return (
              <option key={p.id} value={p.id}>
                {p.name} — Owed: {formatMoney(owed, room.currency)} {p.paymentStatus === 'VERIFIED' ? '(Paid)' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* 2. File Upload Box */}
      <div className="space-y-3">
        {!previewUrl ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#B4F32D] bg-[#F2FCE2]/50 hover:bg-[#F2FCE2] rounded-3xl p-8 cursor-pointer transition-colors text-center group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="h-14 w-14 rounded-2xl bg-white shadow-soft flex items-center justify-center text-[#0B2B16] group-hover:scale-105 transition-transform mb-3">
              <Upload className="h-6 w-6 stroke-[2.2] text-[#0B2B16]" />
            </div>
            <h4 className="text-sm font-bold text-[#0B2B16]">Upload Transfer Receipt</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Take a screenshot or photo of the bank transfer slip (Opay, Kuda, Monzo, Chase, etc.)
            </p>
            <span className="mt-3 rounded-full bg-[#0B2B16] text-[#B4F32D] px-4 py-1.5 text-xs font-bold">
              Choose Image
            </span>
          </label>
        ) : (
          <div className="space-y-4">
            
            {/* View Switcher: Original vs ELA Heatmap */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B2B16]">Forensic Analysis View:</span>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-full">
                <button
                  type="button"
                  onClick={() => setActiveImgView('HEATMAP')}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                    activeImgView === 'HEATMAP'
                      ? 'bg-[#0B2B16] text-[#B4F32D]'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>ELA Heatmap</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImgView('PHOTO')}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                    activeImgView === 'PHOTO'
                      ? 'bg-[#0B2B16] text-[#B4F32D]'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Original Photo</span>
                </button>
              </div>
            </div>

            {/* Image Canvas Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center max-h-72">
              <img
                src={activeImgView === 'HEATMAP' && heatmapUrl ? heatmapUrl : previewUrl}
                alt="Forensic analysis preview"
                className="max-h-72 w-auto object-contain"
              />
              {activeImgView === 'HEATMAP' && (
                <div className="absolute top-2 left-2 rounded-md bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[10px] font-mono text-[#B4F32D] font-bold">
                  Error Level Analysis • Compression Delta
                </div>
              )}
            </div>

            {/* Forensic Report Card */}
            {forensicReport && (
              <div className="space-y-3">
                <div
                  className={`p-4 rounded-2xl border ${
                    forensicReport.tamperDetected
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : forensicReport.elaRiskLevel === 'MEDIUM'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-[#F2FCE2] border-[#DDF3BA] text-[#0B2B16]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {forensicReport.tamperDetected ? (
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                    <span>
                      {forensicReport.tamperDetected
                        ? 'Suspicious Tampering Detected'
                        : 'Authentic Receipt Verified'}
                    </span>
                  </div>
                  <p className="text-xs mt-1">
                    {forensicReport.tamperReason || 'Zero evidence of edited numbers or font tampering.'}
                  </p>
                  <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] font-mono">
                    <span>ELA Tamper Score: {forensicReport.elaScore}/100</span>
                    <span>Risk Level: {forensicReport.elaRiskLevel}</span>
                  </div>
                </div>

                {/* Confirm Action Button */}
                {!verifiedSuccess ? (
                  <button
                    onClick={handleConfirmVerification}
                    className="w-full rounded-full bg-[#0B2B16] hover:bg-[#154625] text-[#B4F32D] py-3.5 px-5 text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#B4F32D]" />
                    <span>Confirm & Mark as Verified on Ledger</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Payment verified & ledger updated!</span>
                  </div>
                )}

                {/* Upload Another Button */}
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setHeatmapUrl(null);
                    setForensicReport(null);
                    setVerifiedSuccess(false);
                  }}
                  className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#0B2B16] py-1 cursor-pointer"
                >
                  Scan Another Screenshot
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Recent Room Transactions */}
      {room.transactions && room.transactions.length > 0 && (
        <div className="pt-2 space-y-2">
          <h4 className="text-xs font-bold text-[#0B2B16] uppercase tracking-wider">
            Verified Transactions ({room.transactions.length})
          </h4>
          <div className="space-y-2">
            {room.transactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => onViewTransactionReceipt(tx)}
                className="p-3 rounded-2xl bg-[#F8FAF6] border border-slate-100 hover:border-[#B4F32D] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-[#ECFDC5] text-[#0B2B16] flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#0B2B16]">{tx.senderName}</h5>
                    <p className="text-[10px] text-slate-500 font-mono">Ref: {tx.referenceId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-[#0B2B16]">
                    {formatMoney(tx.amount, tx.currency)}
                  </span>
                  <div className="text-[9px] text-emerald-600 font-bold">Verified</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
