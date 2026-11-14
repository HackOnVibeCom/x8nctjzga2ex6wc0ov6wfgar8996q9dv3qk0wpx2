import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft, 
  Copy, 
  Check, 
  Zap, 
  Building2, 
  CreditCard, 
  Smartphone, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  Globe
} from 'lucide-react';
import { Room, Participant, Transaction } from '../types';
import { formatMoney } from '../utils/splitMath';
import { quotePollarOnRamp, executePollarOnRamp } from '../services/pollarStellar';
import confetti from 'canvas-confetti';

interface PollarCheckoutModalProps {
  room: Room;
  participant: Participant;
  currentOwed: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: Transaction) => void;
}

type PaymentRail = 'BANK_TRANSFER' | 'CARD' | 'STELLAR_WALLET';

export const PollarCheckoutModal: React.FC<PollarCheckoutModalProps> = ({
  room,
  participant,
  currentOwed,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedRail, setSelectedRail] = useState<PaymentRail>('BANK_TRANSFER');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 5-minute checkout session
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'IDLE' | 'VERIFYING_FIAT' | 'STELLAR_MINTING' | 'DONE'>('IDLE');

  const quote = quotePollarOnRamp(currentOwed, room.currency);

  // Dedicated transient Pollar Virtual Account details
  const virtualAccount = {
    bankName: room.currency === 'NGN' ? 'Wema Bank (Pollar Anchor)' : 'JPMorgan Chase (Pollar US)',
    accountNumber: room.currency === 'NGN' ? '8109384729' : '401928374619',
    accountName: `POLLAR ESCROW - ${room.title.toUpperCase().slice(0, 16)}`,
    referenceCode: `POL-${Date.now().toString().slice(-6)}`,
  };

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(300);
      setIsProcessing(false);
      setProcessingStage('IDLE');
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setProcessingStage('VERIFYING_FIAT');

    try {
      // Step 1: Simulate bank fiat transfer verification
      await new Promise((res) => setTimeout(res, 900));

      // Step 2: Call real Pollar SDK & Stellar testnet vault deposit
      setProcessingStage('STELLAR_MINTING');
      const rampResult = await executePollarOnRamp({
        amountFiat: currentOwed,
        currency: room.currency,
        vaultAddress: room.stellarVault?.vaultAddress || 'GD3EP2FQ5EQQQYTFPRBODQ5UUVC35RCFCFZ3TFFGUVRHQBPBWJYZPEXZ',
        senderName: participant.name,
      });

      setProcessingStage('DONE');
      await new Promise((res) => setTimeout(res, 400));

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        senderId: participant.id,
        senderName: participant.name,
        recipientName: 'Stellar Escrow Vault',
        amount: currentOwed,
        currency: room.currency,
        method: 'POLLAR_ONRAMP',
        referenceId: virtualAccount.referenceCode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETED',
        stellarTxHash: rampResult.txHash,
        notes: `Pollar On-Ramp deposit into Stellar vault (${rampResult.usdcFunded} USDC)`,
      };

      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      onSuccess(newTx);
      onClose();
    } catch (err) {
      console.error('Pollar checkout failed:', err);
      setIsProcessing(false);
      setProcessingStage('IDLE');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="w-full max-w-sm rounded-[32px] bg-[#0B2B16] text-white p-5 shadow-2xl relative my-auto border border-[#B4F32D]/30 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#B4F32D] text-[#0B2B16] flex items-center justify-center font-bold">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>Pollar Checkout Gateway</span>
                <span className="text-[9px] bg-[#B4F32D] text-[#0B2B16] font-extrabold px-1.5 py-0.2 rounded-full">
                  Stellar
                </span>
              </h3>
              <p className="text-[10px] text-slate-300">
                Payer: <strong className="text-white">{participant.name}</strong> • Testnet Mode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Amount & Quote Banner */}
        <div className="my-3 rounded-2xl bg-[#051F10] border border-[#B4F32D]/30 p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300">You Send (Local Fiat):</span>
            <span className="text-base font-black text-white font-mono">
              {formatMoney(currentOwed, room.currency)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300">Vault Receives (Stellar USDC):</span>
            <span className="text-sm font-black text-[#B4F32D] font-mono">
              {quote.usdcAmount} USDC
            </span>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 border-t border-white/10">
            <span>Rate: 1 {room.currency} ≈ {quote.exchangeRate} USDC</span>
            <span className="flex items-center gap-1">
              <Globe className="h-2.5 w-2.5 text-[#B4F32D]" />
              <span>Multi-Currency On-Ramp</span>
            </span>
          </div>
        </div>

        {/* Payment Rail Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#051F10] p-1 rounded-2xl border border-white/10 text-xs mb-3">
          <button
            type="button"
            onClick={() => setSelectedRail('BANK_TRANSFER')}
            className={`py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              selectedRail === 'BANK_TRANSFER'
                ? 'bg-[#B4F32D] text-[#0B2B16] shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Building2 className="h-3 w-3" />
            <span>Bank</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRail('CARD')}
            className={`py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              selectedRail === 'CARD'
                ? 'bg-[#B4F32D] text-[#0B2B16] shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <CreditCard className="h-3 w-3" />
            <span>Card</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRail('STELLAR_WALLET')}
            className={`py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              selectedRail === 'STELLAR_WALLET'
                ? 'bg-[#B4F32D] text-[#0B2B16] shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>Web3</span>
          </button>
        </div>

        {/* Rail 1: Dedicated Bank Transfer (Virtual Account) */}
        {selectedRail === 'BANK_TRANSFER' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
                <span className="text-[10px] text-slate-300 uppercase font-bold">Pollar Anchor Virtual Bank</span>
                <span className="text-[10px] font-mono font-bold text-[#B4F32D] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#B4F32D] animate-ping" />
                  Expires in {formatCountdown(secondsRemaining)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Bank Name</span>
                <span className="font-bold text-white text-xs">{virtualAccount.bankName}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Virtual Account Number</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono text-sm font-extrabold text-[#B4F32D] tracking-wider">
                    {virtualAccount.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(virtualAccount.accountNumber, 'accountNumber')}
                    className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-lg px-2 py-0.5 text-[10px] cursor-pointer"
                  >
                    {copiedField === 'accountNumber' ? <Check className="h-3 w-3 text-[#B4F32D]" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedField === 'accountNumber' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Account Name</span>
                <span className="font-semibold text-white text-xs">{virtualAccount.accountName}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Payment Reference</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono text-xs text-slate-300">{virtualAccount.referenceCode}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(virtualAccount.referenceCode, 'refCode')}
                    className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white rounded-lg px-2 py-0.5 text-[10px] cursor-pointer"
                  >
                    {copiedField === 'refCode' ? <Check className="h-3 w-3 text-[#B4F32D]" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedField === 'refCode' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 text-center leading-tight">
              Transfer <strong className="text-white">{formatMoney(currentOwed, room.currency)}</strong> to the account above via your banking app (OPay, Kuda, GTB, or any local bank).
            </p>
          </div>
        )}

        {/* Rail 2: Card / Apple Pay */}
        {selectedRail === 'CARD' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Debit / Credit Card Gateway</span>
              <span>Visa / Mastercard</span>
            </div>
            <input
              type="text"
              readOnly
              value="•••• •••• •••• 4242 (Demo Card)"
              className="w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-xs font-mono text-white"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                readOnly
                value="12/28"
                className="rounded-xl bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-mono text-center text-white"
              />
              <input
                type="text"
                readOnly
                value="CVC: 888"
                className="rounded-xl bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-mono text-center text-white"
              />
            </div>
            <p className="text-[10px] text-slate-300 text-center">
              Global cards accepted in USD, EUR, GBP, and NGN.
            </p>
          </div>
        )}

        {/* Rail 3: Direct Stellar Web3 Wallet */}
        {selectedRail === 'STELLAR_WALLET' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#B4F32D] uppercase">
              <span>Stellar Testnet Deposit</span>
              <a
                href={`https://stellar.expert/explorer/testnet/account/${room.stellarVault?.vaultAddress || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                <span>View Vault</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <span className="text-[10px] text-slate-400 block">Stellar Vault Destination Address:</span>
            <div className="p-2 rounded-xl bg-[#051F10] border border-white/10 font-mono text-[10px] break-all text-slate-200">
              {room.stellarVault?.vaultAddress || 'GD3EP2FQ5EQQQYTFPRBODQ5UUVC35RCFCFZ3TFFGUVRHQBPBWJYZPEXZ'}
            </div>
            <p className="text-[10px] text-slate-300 text-center">
              Send <strong className="text-white font-mono">{quote.usdcAmount} USDC</strong> directly from Freighter, Lobstr, or any Stellar wallet.
            </p>
          </div>
        )}

        {/* Interactive Payment Trigger Button */}
        <div className="pt-3">
          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={isProcessing}
            className="w-full rounded-2xl bg-[#B4F32D] hover:bg-[#A3E81D] text-[#0B2B16] font-extrabold text-xs sm:text-sm py-3.5 shadow-lg transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {processingStage === 'VERIFYING_FIAT' && 'Verifying Inbound Bank Transfer...'}
                  {processingStage === 'STELLAR_MINTING' && 'Minting USDC & Depositing into Stellar Vault...'}
                  {processingStage === 'DONE' && 'Settlement Verified!'}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {selectedRail === 'BANK_TRANSFER' 
                    ? 'I Have Sent Bank Transfer (Simulate Inbound)' 
                    : `Confirm Payment of ${formatMoney(currentOwed, room.currency)}`}
                </span>
              </>
            )}
          </button>
          
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mt-2">
            <ShieldCheck className="h-3 w-3 text-[#B4F32D]" />
            <span>Secured by Pollar Protocol & Stellar Testnet</span>
          </div>
        </div>

      </div>
    </div>
  );
};
