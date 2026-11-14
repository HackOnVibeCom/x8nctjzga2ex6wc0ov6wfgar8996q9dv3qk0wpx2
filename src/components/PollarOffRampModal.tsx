import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Coins, 
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { Room } from '../types';
import { formatMoney } from '../utils/splitMath';
import { executePollarOffRampToRestaurant, PollarOffRampExecutionResult } from '../services/pollarStellar';
import confetti from 'canvas-confetti';

interface PollarOffRampModalProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
  onOffRampSuccess: (result: PollarOffRampExecutionResult) => void;
}

export const PollarOffRampModal: React.FC<PollarOffRampModalProps> = ({
  room,
  isOpen,
  onClose,
  onOffRampSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepStatus, setStepStatus] = useState('');
  const [result, setResult] = useState<PollarOffRampExecutionResult | null>(null);

  if (!isOpen) return null;

  const vault = room.stellarVault;
  const vendor = vault?.vendorDetails || {
    vendorName: room.organizer.payout.accountName || 'Restaurant / Vendor',
    bankName: room.organizer.payout.bankName || 'Local Bank',
    accountNumber: room.organizer.payout.accountNumber || '0123456789',
    accountName: room.organizer.payout.accountName || 'Restaurant Account',
  };

  const handleExecuteOffRamp = async () => {
    setIsProcessing(true);
    setStepStatus('Locking Stellar Testnet Escrow Vault...');
    await new Promise((r) => setTimeout(r, 600));

    setStepStatus('Quoting best liquidity route via Pollar Multichain Ramp...');
    await new Promise((r) => setTimeout(r, 700));

    setStepStatus('Executing USDC off-ramp to restaurant local bank account...');

    try {
      const res = await executePollarOffRampToRestaurant({
        vault: vault || {
          vaultAddress: 'GD3EP2FQ5EQQQYTFPRBODQ5UUVC35RCFCFZ3TFFGUVRHQBPBWJYZPEXZ',
          network: 'testnet',
          totalFundedUsdc: room.grandTotal,
          offRampStatus: 'POOLING',
          vendorDetails: vendor,
        },
        totalFiatBill: room.grandTotal,
        currency: room.currency,
      });

      setResult(res);
      setIsProcessing(false);
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      onOffRampSuccess(res);
    } catch (err) {
      console.error('Off-ramp failed:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-sm rounded-[32px] bg-[#0B2B16] text-white p-6 shadow-2xl relative my-auto border border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#B4F32D] text-[#0B2B16] flex items-center justify-center font-bold text-xs">
              <Zap className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Pollar Stellar Off-Ramp</h3>
              <p className="text-[10px] text-slate-300">Direct-to-Restaurant Settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {!result ? (
          <div className="py-4 space-y-4">
            
            {/* Amount to Off-Ramp Card */}
            <div className="rounded-2xl bg-[#051F10] border border-[#B4F32D]/30 p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B4F32D]">
                Total Pooled in Stellar Vault
              </span>
              <div className="text-3xl font-extrabold tracking-tight text-white font-sans">
                {formatMoney(room.grandTotal, room.currency)}
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                Vault: {vault?.vaultAddress || 'Stellar Testnet Contract'}
              </p>
            </div>

            {/* Destination: Restaurant Local Account */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                <Building2 className="h-3.5 w-3.5 text-[#B4F32D]" />
                <span>Restaurant Bank Destination</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{vendor.vendorName}</h4>
                <p className="text-xs font-mono text-[#B4F32D] font-semibold mt-0.5">
                  {vendor.bankName} • {vendor.accountNumber}
                </p>
                <p className="text-[10px] text-slate-400">Account: {vendor.accountName}</p>
              </div>
            </div>

            {/* Protocol Flow Route */}
            <div className="p-3 rounded-2xl bg-black/20 border border-white/5 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Stellar Vault (USDC)</span>
                <span>Pollar Ramp</span>
                <span>Restaurant Bank</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <span>Pooled Funds</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#B4F32D]" />
                <span>Pollar Anchor</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#B4F32D]" />
                <span className="text-[#B4F32D]">Direct Fiat</span>
              </div>
              <p className="text-[10px] text-slate-400 pt-1 leading-tight">
                Host touches zero money. The contract releases the pool directly to the restaurant's local bank.
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={handleExecuteOffRamp}
              disabled={isProcessing}
              className="w-full rounded-full bg-[#B4F32D] hover:bg-[#A3E81D] text-[#0B2B16] font-extrabold text-sm py-4 shadow-lg transition-transform active:scale-95 cursor-pointer text-center block disabled:opacity-50"
            >
              {isProcessing ? stepStatus : `Release ${formatMoney(room.grandTotal, room.currency)} to Restaurant`}
            </button>

          </div>
        ) : (
          /* Success Result View */
          <div className="py-4 space-y-4 text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-[#B4F32D] text-[#0B2B16] flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-white">Off-Ramp Settled to Restaurant!</h4>
              <p className="text-xs text-slate-300">
                Pollar converted the Stellar vault USDC and dispatched fiat to the restaurant account.
              </p>
            </div>

            <div className="rounded-2xl bg-[#051F10] border border-[#B4F32D]/30 p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Sent:</span>
                <span className="font-extrabold text-white">
                  {formatMoney(result.fiatAmountSent, result.fiatCurrency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Restaurant Bank:</span>
                <span className="font-bold text-[#B4F32D]">
                  {result.destinationBank} ({result.destinationAccount})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Settlement Ref:</span>
                <span className="font-mono text-slate-300">{result.settlementReference}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Stellar Testnet:</span>
                <a
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#B4F32D] hover:underline flex items-center gap-1 font-mono font-bold"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-full bg-white hover:bg-slate-100 text-[#0B2B16] font-bold text-xs py-3.5 cursor-pointer active:scale-95 transition-all"
            >
              Done & Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
