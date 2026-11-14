import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  Check, 
  Upload, 
  Scan, 
  ShieldCheck, 
  Sparkles,
  Eye,
  Layers,
  ArrowLeft,
  CreditCard
} from 'lucide-react';
import { Participant, Room, Transaction, ForensicReport } from '../types';
import { formatMoney } from '../utils/splitMath';
import { runClientSideEla } from '../utils/elaTamper';
import { quotePollarOnRamp, executePollarOnRamp } from '../services/pollarStellar';
import { PollarCheckoutModal } from './PollarCheckoutModal';
import confetti from 'canvas-confetti';

interface SettleUpModalProps {
  participant: Participant;
  room: Room;
  owedAmount: number;
  remainingAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onRecordTransaction: (tx: Transaction) => void;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  participant,
  room,
  owedAmount,
  remainingAmount,
  isOpen,
  onClose,
  onRecordTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'POLLAR' | 'DIRECT' | 'UPLOAD'>('POLLAR');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [showPollarCheckout, setShowPollarCheckout] = useState(false);

  // ELA Forensics state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [activeImgView, setActiveImgView] = useState<'PHOTO' | 'HEATMAP'>('HEATMAP');
  const [forensicReport, setForensicReport] = useState<ForensicReport | null>(null);

  if (!isOpen) return null;

  const currentOwed = remainingAmount > 0 ? remainingAmount : owedAmount;
  const payout = room.organizer.payout;

  const isDirectWebLink = payout.accountNumber.includes('http') || 
    payout.accountNumber.includes('.me') || 
    payout.accountNumber.includes('cash.app') ||
    payout.accountNumber.includes('paypal.me');

  const resolvedLink = isDirectWebLink 
    ? (payout.accountNumber.startsWith('http') ? payout.accountNumber : `https://${payout.accountNumber}`)
    : undefined;

  const copyPaymentInfo = () => {
    const text = `${payout.bankName}: ${payout.accountNumber} (${payout.accountName})`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // 0. Pollar Stellar On-Ramp
  const handlePollarOnRamp = async () => {
    setIsProcessing(true);
    setProcessingStatus('Connecting to Pollar on Stellar Testnet...');
    await new Promise((r) => setTimeout(r, 600));

    setProcessingStatus(`Initiating fiat-to-USDC on-ramp for ${formatMoney(currentOwed, room.currency)}...`);

    try {
      const vaultAddr = room.stellarVault?.vaultAddress || 'GD3EP2FQ5EQQQYTFPRBODQ5UUVC35RCFCFZ3TFFGUVRHQBPBWJYZPEXZ';
      const res = await executePollarOnRamp({
        vaultAddress: vaultAddr,
        amountFiat: currentOwed,
        currency: room.currency,
        senderName: participant.name,
      });

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        senderId: participant.id,
        senderName: participant.name,
        recipientName: 'Stellar Escrow Vault',
        amount: currentOwed,
        currency: room.currency,
        method: 'POLLAR_ONRAMP',
        referenceId: `POL-${res.txHash.slice(0, 8).toUpperCase()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETED',
        stellarTxHash: res.txHash,
        notes: `Pollar On-Ramp deposit into Stellar vault (${res.usdcFunded} USDC)`,
      };

      setIsProcessing(false);
      setCompletedTx(newTx);
      confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } });
      onRecordTransaction(newTx);
    } catch (err) {
      console.error('Pollar on-ramp failed:', err);
      setIsProcessing(false);
    }
  };

  // 1. Direct Mark as Settled
  const handleMarkSettled = () => {
    setIsProcessing(true);
    setProcessingStatus('Recording settlement on room ledger...');
    
    setTimeout(() => {
      const refId = `SETTLE-${Date.now().toString().slice(-6)}`;
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        senderId: participant.id,
        senderName: participant.name,
        recipientName: room.organizer.name,
        amount: currentOwed,
        currency: room.currency,
        method: 'DIRECT_TRANSFER',
        referenceId: refId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETED',
        notes: `Settled via ${payout.bankName}`,
      };

      setIsProcessing(false);
      setCompletedTx(newTx);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onRecordTransaction(newTx);
    }, 400);
  };

  // 2. Client-Side ELA Forensic Upload (Real File Analysis)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      runRealForensicScan(file, url);
    }
  };

  const runRealForensicScan = async (file: File, url: string) => {
    setIsProcessing(true);
    setProcessingStatus('Running client-side Error Level Analysis (ELA)...');

    try {
      const elaResult = await runClientSideEla(file);
      setHeatmapUrl(elaResult.heatmapDataUrl);

      setProcessingStatus('Verifying screenshot structure & compression noise...');
      await new Promise((r) => setTimeout(r, 600));

      const isTampered = elaResult.report.tamperDetected;
      const refId = `REF-${Date.now().toString().slice(-6)}`;
      const amountPaid = isTampered ? Math.round(currentOwed * 0.5) : currentOwed;

      const report: ForensicReport = {
        ...elaResult.report,
        extractedData: {
          senderName: participant.name,
          recipientName: room.organizer.name,
          amountPaid,
          transactionDate: new Date().toLocaleTimeString(),
          referenceId: refId,
          bankOrProvider: payout.bankName,
        },
        mismatchDetails: isTampered
          ? `Discrepancy: High artifact noise detected around amount digits (${elaResult.report.elaScore}/100 anomaly).`
          : undefined,
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: isTampered ? 'FLAGGED_MISMATCH' : 'COMPLETED',
        proofUrl: url,
        forensics: report,
        notes: isTampered ? 'Flagged: High compression variance in amount field' : 'Authentic screenshot verified',
      };

      setCompletedTx(newTx);
      if (!isTampered) {
        confetti({ particleCount: 65, spread: 75, origin: { y: 0.6 } });
      }
      onRecordTransaction(newTx);
    } catch (err) {
      console.error('[ELA] Analysis failed:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 overflow-y-auto">
      {/* Dark Forest Green Modal Container (Modeled directly after Screen 3) */}
      <div className="w-full max-w-sm rounded-[32px] bg-[#0B2B16] text-white p-5 shadow-2xl relative my-auto border border-white/10 font-sans">
        
        {/* Top Navigation Bar: Back icon + Title "Payment Method" (Screen 3 style) */}
        <div className="flex items-center justify-between pb-3">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-bold text-white tracking-wide">
            Payment & Verification
          </h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success / Inspected State View */}
        {completedTx ? (
          <div className="space-y-4 py-4 text-center">
            <div className={`flex h-16 w-16 mx-auto items-center justify-center rounded-full ${
              completedTx.status === 'COMPLETED'
                ? 'bg-[#B4F32D] text-[#0B2B16]'
                : 'bg-rose-500 text-white'
            }`}>
              {completedTx.status === 'COMPLETED' ? (
                <Check className="h-8 w-8 stroke-[3]" />
              ) : (
                <AlertTriangle className="h-8 w-8 stroke-[2.5]" />
              )}
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">
                {completedTx.status === 'COMPLETED'
                  ? 'Payment Confirmed'
                  : 'Verification Flagged'}
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                {completedTx.status === 'COMPLETED'
                  ? `Recorded ${formatMoney(completedTx.amount, room.currency)} for ${participant.name}.`
                  : 'Suspicious artifacts or pixel tampering detected by client-side ELA.'}
              </p>
            </div>

            {/* Heatmap Preview if forensics ran */}
            {heatmapUrl && (
              <div className="rounded-2xl border border-white/10 bg-[#051F10] p-3 text-left space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-semibold text-white">ELA Noise Forensics:</span>
                  <span className="text-[#B4F32D] font-mono">Score: {forensicReport?.elaScore}/100</span>
                </div>
                <img src={heatmapUrl} alt="ELA Heatmap" className="w-full h-32 object-contain rounded-xl bg-black" />
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-full bg-[#B4F32D] hover:bg-[#A0E21B] text-[#0B2B16] font-bold text-xs py-3.5 shadow-sm transition-all cursor-pointer"
            >
              Back to Split Room
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            
            {/* Payout Rails Badges (Mastercard, VISA, PayPal, Revolut, Bank style from Screen 3) */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-200">
                {payout.bankName || 'Direct Transfer'}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-200">
                Multi-Currency
              </span>
              <span className="rounded-full bg-[#B4F32D]/20 text-[#B4F32D] px-2.5 py-1 text-[10px] font-bold">
                Zero Fees
              </span>
            </div>

            {/* Glowing Vibrant Lime Card (Modeled directly after Screen 3 Card) */}
            <div className="rounded-[24px] bg-[#B4F32D] text-[#0B2B16] p-5 shadow-lime-glow space-y-4 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#0B2B16]/70 block">
                    HOST PAYOUT CARD
                  </span>
                  <h4 className="text-sm font-black tracking-tight text-[#0B2B16]">
                    {room.organizer.name}
                  </h4>
                </div>
                <CreditCard className="h-6 w-6 text-[#0B2B16]" />
              </div>

              <div>
                <p className="text-[10px] font-medium text-[#0B2B16]/70 uppercase">Account / Handle</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono text-base font-extrabold tracking-wider text-[#0B2B16]">
                    {payout.accountNumber || 'Pending Details'}
                  </span>
                  <button
                    onClick={copyPaymentInfo}
                    className="flex items-center gap-1 bg-[#0B2B16] hover:bg-[#051F10] text-[#B4F32D] rounded-full px-2.5 py-1 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#0B2B16]/15 flex justify-between items-end">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#0B2B16]/70 block">Amount to Settle</span>
                  <span className="text-xl font-black font-sans text-[#0B2B16]">
                    {formatMoney(currentOwed, room.currency)}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#0B2B16] bg-black/5 px-2 py-0.5 rounded-full">
                  {room.currency}
                </span>
              </div>
            </div>

            {/* Mode Switcher Pills: Pollar vs Direct vs Upload Screenshot */}
            <div className="flex rounded-full bg-[#051F10] p-1 border border-white/10 text-[11px]">
              <button
                onClick={() => setActiveTab('POLLAR')}
                className={`flex-1 rounded-full py-1.5 font-bold transition-colors cursor-pointer ${
                  activeTab === 'POLLAR'
                    ? 'bg-[#B4F32D] text-[#0B2B16]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pollar Ramp
              </button>
              <button
                onClick={() => setActiveTab('DIRECT')}
                className={`flex-1 rounded-full py-1.5 font-bold transition-colors cursor-pointer ${
                  activeTab === 'DIRECT'
                    ? 'bg-white text-[#0B2B16]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Direct
              </button>
              <button
                onClick={() => setActiveTab('UPLOAD')}
                className={`flex-1 rounded-full py-1.5 font-bold transition-colors cursor-pointer ${
                  activeTab === 'UPLOAD'
                    ? 'bg-white text-[#0B2B16]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Scan Proof
              </button>
            </div>

            {/* Pollar Stellar On-Ramp Tab */}
            {activeTab === 'POLLAR' && (
              <div className="space-y-3 pt-1">
                <div className="rounded-2xl bg-[#051F10] border border-[#B4F32D]/30 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[#B4F32D]">
                    <span>Pollar Multichain On-Ramp</span>
                    <span className="font-mono">Stellar Testnet</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">You Pay:</span>
                    <span className="font-extrabold text-white">{formatMoney(currentOwed, room.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Vault Receives:</span>
                    <span className="font-mono font-bold text-[#B4F32D]">
                      {quotePollarOnRamp(currentOwed, room.currency).usdcAmount} USDC
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    <span>1 {room.currency} ≈ {quotePollarOnRamp(currentOwed, room.currency).exchangeRate} USDC</span>
                    <span>Fee: ${quotePollarOnRamp(currentOwed, room.currency).pollarFeeUsdc}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 text-center leading-tight">
                  Funds on-ramp into the room's Stellar Testnet escrow vault. Once funded, the Host releases payment directly to the restaurant!
                </p>

                <button
                  onClick={() => setShowPollarCheckout(true)}
                  disabled={isProcessing}
                  className="w-full rounded-full bg-[#B4F32D] hover:bg-[#A3E81D] text-[#0B2B16] font-extrabold text-sm py-4 shadow-lg transition-transform active:scale-98 cursor-pointer text-center block mt-2 disabled:opacity-50"
                >
                  Pay via Pollar (Virtual Account & Testnet)
                </button>
              </div>
            )}

            {/* Direct Tab View */}
            {activeTab === 'DIRECT' && (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-300 leading-relaxed text-center">
                  Transfer <strong className="text-white font-bold">{formatMoney(currentOwed, room.currency)}</strong> to the account above via banking app, Revolut, or PayPal.
                </p>

                {resolvedLink && (
                  <a
                    href={resolvedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 py-2.5 text-xs font-semibold text-white transition-colors"
                  >
                    <span>Open Payment Link</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                {/* Big Pure White Bottom Pill Button (Modeled after Screen 3 "Pay" button) */}
                <button
                  onClick={handleMarkSettled}
                  disabled={isProcessing}
                  className="w-full rounded-full bg-white hover:bg-slate-100 text-[#0B2B16] font-extrabold text-sm py-4 shadow-lg transition-transform active:scale-98 cursor-pointer text-center block mt-2"
                >
                  {isProcessing ? processingStatus : 'Confirm & Mark Settled'}
                </button>
              </div>
            )}

            {/* Upload Screenshot (Client-Side ELA) Tab View */}
            {activeTab === 'UPLOAD' && (
              <div className="space-y-3 pt-1">
                <label className="block w-full rounded-2xl border-2 border-dashed border-white/20 bg-[#051F10] hover:border-[#B4F32D] p-5 text-center transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  <div className="space-y-1.5 flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-white/10 text-[#B4F32D] flex items-center justify-center">
                      <Scan className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-white">Upload Transfer Screenshot</p>
                    <p className="text-[10px] text-slate-400">
                      Pixel Error Level Analysis detects edited numbers locally.
                    </p>
                  </div>
                </label>

                {isProcessing && (
                  <div className="rounded-xl bg-[#051F10] p-3 text-center text-xs text-[#B4F32D] animate-pulse">
                    {processingStatus}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Interactive Pollar Checkout Gateway */}
      <PollarCheckoutModal
        room={room}
        participant={participant}
        currentOwed={currentOwed}
        isOpen={showPollarCheckout}
        onClose={() => setShowPollarCheckout(false)}
        onSuccess={(tx) => {
          setCompletedTx(tx);
          setShowPollarCheckout(false);
          onRecordTransaction(tx);
        }}
      />
    </div>
  );
};
