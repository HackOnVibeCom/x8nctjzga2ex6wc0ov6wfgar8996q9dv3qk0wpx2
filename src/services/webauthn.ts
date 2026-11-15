/**
 * WebAuthn Passkeys & Hardware Device Authentication Service
 * Implements W3C Web Authentication API (navigator.credentials)
 * Supports:
 * - Android: Fingerprint / Screen PIN / Pattern
 * - iOS / macOS: Face ID / Touch ID / Device Passcode
 * - Windows: Windows Hello PIN / Fingerprint
 */

export interface DeviceAuthData {
  credentialId: string;
  userId: string;
  accountLabel: string;
  role: 'host' | 'guest';
  verifiedAt: number;
  rawIdBase64?: string;
  roomId?: string;
}

const STORAGE_KEY = 'ipin_device_auth';

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Checks if the browser supports native WebAuthn
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    typeof navigator !== 'undefined' &&
    !!navigator.credentials
  );
}

/**
 * Registers a new hardware device passkey (Face ID / Fingerprint / Device PIN)
 * Generic labels only — NEVER hardcodes demo names!
 */
export async function registerDevicePasskey(
  userId: string,
  accountLabel: string = 'IPIN Account'
): Promise<{ credentialId: string; rawIdBase64: string }> {
  if (!isWebAuthnSupported()) {
    throw new Error('Device biometric / PIN authentication is not supported on this browser.');
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  // Clean, generic label without dummy/fake names
  const cleanLabel = accountLabel.trim() || 'IPIN Dining Account';

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'IPIN Chow Split',
          id: window.location.hostname || 'localhost',
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: cleanLabel,
          displayName: cleanLabel,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256 (P-256)
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Hardware device screen lock / biometrics
          userVerification: 'preferred',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('No credential returned by device.');
    }

    const rawIdBase64 = bufferToBase64(credential.rawId);
    const credentialId = credential.id;

    return { credentialId, rawIdBase64 };
  } catch (err: any) {
    // STRICT SECURITY RULE: Catch cancellation and fail explicitly
    if (
      err?.name === 'NotAllowedError' ||
      err?.name === 'AbortError' ||
      err?.message?.toLowerCase().includes('cancel') ||
      err?.message?.toLowerCase().includes('not allowed') ||
      err?.message?.toLowerCase().includes('declined')
    ) {
      const cancelError = new Error('Device verification was cancelled. Please confirm your phone PIN or fingerprint to proceed.');
      cancelError.name = 'NotAllowedError';
      throw cancelError;
    }
    throw err;
  }
}

/**
 * Verifies an existing hardware device passkey via navigator.credentials.get
 */
export async function verifyDevicePasskey(
  existingRawIdBase64?: string
): Promise<{ verified: boolean; credentialId: string }> {
  if (!isWebAuthnSupported()) {
    throw new Error('Device biometric / PIN authentication is not supported on this browser.');
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const getOptions: CredentialRequestOptions = {
    publicKey: {
      challenge,
      rpId: window.location.hostname || 'localhost',
      userVerification: 'preferred',
      timeout: 60000,
      ...(existingRawIdBase64
        ? {
            allowCredentials: [
              {
                id: (base64ToBuffer(existingRawIdBase64) as unknown as BufferSource),
                type: 'public-key' as const,
                transports: ['internal' as AuthenticatorTransport],
              },
            ],
          }
        : {}),
    },
  };

  try {
    const assertion = (await navigator.credentials.get(getOptions)) as PublicKeyCredential | null;

    if (!assertion) {
      throw new Error('Device verification returned empty response.');
    }

    return {
      verified: true,
      credentialId: assertion.id,
    };
  } catch (err: any) {
    // STRICT SECURITY RULE: Explicitly fail on cancel - NEVER bypass!
    if (
      err?.name === 'NotAllowedError' ||
      err?.name === 'AbortError' ||
      err?.message?.toLowerCase().includes('cancel') ||
      err?.message?.toLowerCase().includes('not allowed') ||
      err?.message?.toLowerCase().includes('declined')
    ) {
      const cancelError = new Error('Device verification was cancelled. Please confirm your phone PIN or fingerprint to proceed.');
      cancelError.name = 'NotAllowedError';
      throw cancelError;
    }
    throw err;
  }
}

/**
 * Local device authentication persistence helpers
 */
export function getStoredDeviceAuth(): DeviceAuthData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredDeviceAuth(data: DeviceAuthData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to store device auth in localStorage:', err);
  }
}

export function clearStoredDeviceAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function isDeviceAuthenticated(targetRoomId?: string): boolean {
  const auth = getStoredDeviceAuth();
  if (!auth || !auth.credentialId) return false;
  
  // If targetRoomId is specified, check if authenticated for this room or generally as host/guest
  if (targetRoomId && auth.roomId && auth.roomId !== targetRoomId) {
    // Check if room-specific auth exists
    const roomAuth = localStorage.getItem(`${STORAGE_KEY}_${targetRoomId}`);
    return !!roomAuth;
  }
  
  return true;
}

export function markRoomAuthenticated(roomId: string, authData: DeviceAuthData): void {
  try {
    setStoredDeviceAuth({ ...authData, roomId });
    localStorage.setItem(`${STORAGE_KEY}_${roomId}`, JSON.stringify({ ...authData, roomId }));
  } catch {}
}
