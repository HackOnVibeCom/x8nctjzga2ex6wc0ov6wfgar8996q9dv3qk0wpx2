import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Fingerprint, 
  Lock, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Receipt,
  UtensilsCrossed,
  ArrowRight,
  Smartphone
} from 'lucide-react';
import { Room } from '../types';
import { formatMoney, getCurrencySymbol } from '../utils/splitMath';
import { 
  registerDevicePasskey, 
  verifyDevicePasskey, 
  markRoomAuthenticated,
  DeviceAuthData,
  isWebAuthnSupported 
} from '../services/webauthn';

interface DeviceSecurityGateProps {
  room: Room;
  onUnlocked: (authData: DeviceAuthData) => void;
}

export const DeviceSecurityGate: React.FC<DeviceSecurityGateProps> = ({
  room,
  onUnlocked,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  const hasWebAuthn = isWebAuthnSupported();
  const totalAmount = room.items.reduce((sum, item) => sum + item.unitPrice * (item.quantity || 1), 0);
  const currencySymbol = getCurrencySymbol(room.currency);

  const handleUnlock = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsCancelled(false);

    try {
      const generatedUserId = 'guest_' + Math.random().toString(36).substring(2, 9);
      const label = 'IPIN Dining Member';

      // 1. Invoke native WebAuthn hardware authentication
      let credentialResult: { credentialId: string; rawIdBase64: string };

      try {
        credentialResult = await registerDevicePasskey(generatedUserId, label);
      } catch (regErr: any) {
        if (regErr?.name === 'NotAllowedError') {
          throw regErr; // Explicit cancel, do NOT fallback
        }
        const verifyRes = await verifyDevicePasskey();
        credentialResult = { credentialId: verifyRes.credentialId, rawIdBase64: '' };
      }

      // 2. Hardware confirmed
      const authData: DeviceAuthData = {
        credentialId: credentialResult.credentialId,
        rawIdBase64: credentialResult.rawIdBase64,
        userId: generatedUserId,
        accountLabel: label,
        role: 'guest',
        verifiedAt: Date.now(),
        roomId: room.id,
      };

      markRoomAuthenticated(room.id, authData);
      setIsLoading(false);
      onUnlocked(authData);
    } catch (err: any) {
      setIsLoading(false);

      // STRICT CANCELLATION RULE (NO BYPASS):
      // When cancelled, do NOT unlock room, display clear warning
      const isUserCancel =
        err?.name === 'NotAllowedError' ||
        err?.name === 'AbortError' ||
        err?.message?.toLowerCase().includes('cancel') ||
        err?.message?.toLowerCase().includes('not allowed') ||
        err?.message?.toLowerCase().includes('declined');

      if (isUserCancel) {
        setIsCancelled(true);
        setErrorMessage('Device verification was cancelled. Please confirm your phone PIN or fingerprint to proceed.');
      } else {
        setErrorMessage(err?.message || 'Biometric authentication failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B2B16] text-white flex flex-col justify-between max-w-md mx-auto p-6 font-sans relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#B4F32D]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between z-10 pt-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#B4F32D] text-[#0B2B16] flex items-center justify-center font-bold shadow-md">
            <Receipt className="h-4 w-4 stroke-[2.5]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            IPIN Chow
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#B4F32D] border border-white/15">
          <Lock className="h-3 w-3 stroke-[2.2]" />
          <span>Security Gate</span>
        </div>
      </div>

      {/* Main Center Content: Room Context & Hardware Auth Prompt */}
      <div className="my-auto py-8 space-y-6 z-10">
        {/* Biometric Shield Animation Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-3xl bg-[#B4F32D] text-[#0B2B16] flex items-center justify-center shadow-2xl animate-pulse">
              <Fingerprint className="h-11 w-11 stroke-[1.8]" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white text-[#0B2B16] flex items-center justify-center shadow-md">
              <ShieldCheck className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Device Hardware Verification
          </h2>
          <p className="text-xs text-white/70 max-w-xs mx-auto leading-relaxed">
            This dining bill is cryptographically locked. Verify with your phone's native screen lock (Face ID, Touch ID, Fingerprint, or PIN) to access.
          </p>
        </div>

        {/* Room Summary Card */}
        <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-5 space-y-3.5 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B4F32D]">
                Dining Venue
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <UtensilsCrossed className="h-4 w-4 text-[#B4F32D]" />
                <span>{room.title || 'Group Restaurant Bill'}</span>
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                Total Bill
              </span>
              <p className="text-base font-extrabold text-[#B4F32D] font-mono">
                {currencySymbol}{formatMoney(totalAmount)}
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs text-white/80">
            <span>Bill Line Items</span>
            <span className="font-semibold text-white">{room.items.length} dishes ordered</span>
          </div>

          {room.stellarVault && (
            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[11px] text-white/70 font-mono">
              <span>Stellar Vault</span>
              <span className="text-[#B4F32D]">
                {room.stellarVault.vaultAddress.slice(0, 6)}...{room.stellarVault.vaultAddress.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {/* STRICT ERROR / CANCELLATION BANNER */}
        {errorMessage && (
          <div className="rounded-2xl bg-amber-500/20 border border-amber-400/40 p-4 text-xs text-amber-200 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-xs uppercase tracking-wide text-amber-300">
                  {isCancelled ? 'Verification Cancelled' : 'Access Denied'}
                </p>
                <p className="text-xs leading-relaxed text-amber-100 font-medium">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA Actions */}
      <div className="space-y-3 z-10 pb-4">
        <button
          onClick={handleUnlock}
          disabled={isLoading}
          className="w-full rounded-full bg-[#B4F32D] hover:bg-[#a2dc26] text-[#0B2B16] py-4 px-6 font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#0B2B16]" />
              <span>Confirm on Device Screen...</span>
            </>
          ) : isCancelled ? (
            <>
              <RefreshCw className="h-4 w-4 stroke-[2.2]" />
              <span>Try Again with Phone PIN</span>
            </>
          ) : (
            <>
              <Fingerprint className="h-5 w-5 stroke-[2.2]" />
              <span>Verify with Phone PIN & Access</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/50 text-center">
          <Smartphone className="h-3.5 w-3.5" />
          <span>Uses native Apple Touch ID / Face ID, Android Fingerprint, or Windows PIN</span>
        </div>
      </div>
    </div>
  );
};
