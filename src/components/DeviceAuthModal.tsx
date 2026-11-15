import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Fingerprint, 
  Smartphone, 
  AlertCircle, 
  Loader2, 
  X, 
  ArrowRight,
  RefreshCw,
  Lock
} from 'lucide-react';
import { 
  registerDevicePasskey, 
  verifyDevicePasskey, 
  setStoredDeviceAuth, 
  DeviceAuthData,
  isWebAuthnSupported 
} from '../services/webauthn';

export type AuthMode = 'HOST_REGISTRATION' | 'GUEST_JOIN';

interface DeviceAuthModalProps {
  isOpen: boolean;
  mode: AuthMode;
  roomCode?: string;
  onClose: () => void;
  onSuccess: (authData: DeviceAuthData, roomCode?: string) => void;
}

export const DeviceAuthModal: React.FC<DeviceAuthModalProps> = ({
  isOpen,
  mode,
  roomCode: initialRoomCode = '',
  onClose,
  onSuccess,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  if (!isOpen) return null;

  const isHost = mode === 'HOST_REGISTRATION';
  const hasWebAuthn = isWebAuthnSupported();

  const handleAuthenticate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsCancelled(false);

    try {
      const generatedUserId = 'user_' + Math.random().toString(36).substring(2, 10);
      const label = isHost ? 'IPIN Vault Host' : 'IPIN Dining Member';

      // 1. Trigger native device hardware authentication (WebAuthn Passkey)
      let credentialResult: { credentialId: string; rawIdBase64: string };

      try {
        credentialResult = await registerDevicePasskey(generatedUserId, label);
      } catch (regErr: any) {
        // If registration fails because a passkey exists or user chooses assertion
        if (regErr?.name === 'NotAllowedError') {
          throw regErr; // Explicit cancel, do NOT fallback
        }
        // Try verification assertion as fallback
        const verifyRes = await verifyDevicePasskey();
        credentialResult = { credentialId: verifyRes.credentialId, rawIdBase64: '' };
      }

      // 2. Successful hardware authentication
      const authData: DeviceAuthData = {
        credentialId: credentialResult.credentialId,
        rawIdBase64: credentialResult.rawIdBase64,
        userId: generatedUserId,
        accountLabel: label,
        role: isHost ? 'host' : 'guest',
        verifiedAt: Date.now(),
      };

      setStoredDeviceAuth(authData);
      setIsLoading(false);
      onSuccess(authData, roomCodeInput.trim() || undefined);
    } catch (err: any) {
      setIsLoading(false);

      // STRICT CANCELLATION RULE (NO BYPASS):
      // If user dismisses or cancels, do NOT log in, do NOT navigate away!
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl text-[#0B2B16] border border-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer transition-colors"
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Biometric Shield Header Icon */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-[#0B2B16] text-[#B4F32D] flex items-center justify-center shadow-lg">
              <Fingerprint className="h-9 w-9 stroke-[1.8]" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#B4F32D] text-[#0B2B16] border-2 border-white flex items-center justify-center">
              <Lock className="h-3 w-3 stroke-[2.5]" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-[#0B2B16] tracking-tight">
              {isHost ? 'Secure Vault Creator' : 'Diner Hardware Access'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-[260px] mx-auto">
              {isHost
                ? 'Authenticate with your device screen lock (Face ID, Fingerprint, or Phone PIN) to deploy your bill vault.'
                : 'Confirm your phone PIN or biometric to join this dining split securely.'}
            </p>
          </div>
        </div>

        {/* Guest Input for Room Code if joining from homepage */}
        {!isHost && (
          <div className="mt-5 space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Room Code or Share Link (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. room-abcd123 (or leave blank)"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-[#F8FAF6] px-4 py-2.5 text-xs text-[#0B2B16] font-mono focus:border-[#0B2B16] focus:bg-white focus:outline-none transition-all"
              disabled={isLoading}
            />
          </div>
        )}

        {/* Security Feature Highlights */}
        <div className="mt-4 rounded-2xl bg-[#F4F7F2] p-3 text-[11px] space-y-2 text-[#0B2B16]/80 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Zero passwords or seed phrases required</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Hardware-level protection via Apple / Android passkey</span>
          </div>
        </div>

        {/* STRICT ERROR / CANCELLATION BANNER */}
        {errorMessage && (
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-[11px] text-amber-800 uppercase tracking-wide">
                  {isCancelled ? 'Verification Cancelled' : 'Authentication Error'}
                </p>
                <p className="text-[11px] leading-relaxed text-amber-900 font-medium">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-2.5">
          <button
            onClick={handleAuthenticate}
            disabled={isLoading}
            className="w-full rounded-full bg-[#0B2B16] hover:bg-[#051F10] text-[#B4F32D] py-3.5 px-6 font-bold text-xs uppercase tracking-wider shadow-forest-btn transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Confirm on Phone...</span>
              </>
            ) : isCancelled ? (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Try Again with Phone PIN</span>
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4 stroke-[2.2]" />
                <span>Verify with Phone PIN</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel / Dismiss
          </button>
        </div>

        {!hasWebAuthn && (
          <p className="text-[10px] text-center text-slate-400 mt-3">
            Note: If your browser does not support biometric passkeys, PIN prompt fallback will be used.
          </p>
        )}
      </div>
    </div>
  );
};
