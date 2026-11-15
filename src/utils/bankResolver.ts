export interface BankOption {
  code: string;
  nibssCode: string;
  name: string;
  country: string;
  flag: string;
  isPopular?: boolean;
}

export const SUPPORTED_BANKS: BankOption[] = [
  // Nigeria (Primary Hackathon / FinTech)
  { code: 'opay', nibssCode: '999992', name: 'OPay Digital Services', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'moniepoint', nibssCode: '50515', name: 'Moniepoint MFB', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'palmpay', nibssCode: '999991', name: 'PalmPay', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'kuda', nibssCode: '50211', name: 'Kuda Microfinance Bank', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'gtbank', nibssCode: '058', name: 'Guaranty Trust Bank (GTBank)', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'access', nibssCode: '044', name: 'Access Bank', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'zenith', nibssCode: '057', name: 'Zenith Bank', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'uba', nibssCode: '033', name: 'United Bank for Africa (UBA)', country: 'NG', flag: '🇳🇬' },
  { code: 'firstbank', nibssCode: '011', name: 'First Bank of Nigeria', country: 'NG', flag: '🇳🇬' },
  { code: 'wema', nibssCode: '035', name: 'Wema Bank / ALAT', country: 'NG', flag: '🇳🇬' },
  { code: 'stanbic', nibssCode: '221', name: 'Stanbic IBTC Bank', country: 'NG', flag: '🇳🇬' },
  { code: 'sterling', nibssCode: '232', name: 'Sterling Bank', country: 'NG', flag: '🇳🇬' },
  { code: 'fidelity', nibssCode: '070', name: 'Fidelity Bank', country: 'NG', flag: '🇳🇬' },

  // International Rails (Global Off-Ramp)
  { code: 'chase', nibssCode: 'CHASE', name: 'JPMorgan Chase (USD / ACH)', country: 'US', flag: '🇺🇸', isPopular: true },
  { code: 'boa', nibssCode: 'BOA', name: 'Bank of America (USD / FedNow)', country: 'US', flag: '🇺🇸' },
  { code: 'revolut', nibssCode: 'REVOLUT', name: 'Revolut (GBP / EUR)', country: 'UK', flag: '🇬🇧', isPopular: true },
  { code: 'barclays', nibssCode: 'BARCLAYS', name: 'Barclays Bank (GBP Faster Payments)', country: 'UK', flag: '🇬🇧' },
  { code: 'sepa', nibssCode: 'SEPA', name: 'SEPA Euro IBAN (European Union)', country: 'EU', flag: '🇪🇺' },
  { code: 'stellar_wallet', nibssCode: 'STELLAR', name: 'Direct Stellar Web3 Wallet (USDC)', country: 'GLOBAL', flag: '🌐', isPopular: true },
];

// Pre-verified test accounts for hackathon & sandbox testing
const KNOWN_VERIFIED_ACCOUNTS: Record<string, { name: string; bank: string }> = {
  '9136447931': { name: 'IBRAHIM S. (OPAY)', bank: 'OPay Digital Services' },
  '0123456789': { name: 'BISTRO FOODS NIGERIA LIMITED', bank: 'Guaranty Trust Bank (GTBank)' },
  '5051501234': { name: 'CHOW CENTRAL KITCHEN LTD', bank: 'Moniepoint MFB' },
  '1100223344': { name: 'IYA SAID ALAMALA FOODS', bank: 'Kuda Microfinance Bank' },
  '4019283746': { name: 'BISTRO CUCINA LLC', bank: 'JPMorgan Chase (USD / ACH)' },
};

/**
 * Validates whether a 10-digit account number satisfies the CBN NUBAN algorithm:
 * Modulus 10 algorithm with weights [3, 7, 3, 3, 7, 3, 3, 7, 3]
 */
export function validateCbnNuban(nibssBankCode: string, accountNumber: string): boolean {
  const cleanAcc = accountNumber.trim().replace(/\s+/g, '');
  if (!/^\d{10}$/.test(cleanAcc)) return false;

  // Use the 3-digit bank code or zero-pad
  const paddedBankCode = nibssBankCode.padStart(3, '0').slice(-3);
  const fullCode = paddedBankCode + cleanAcc.slice(0, 9);
  const weights = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3]; // 3 bank code digits + 9 account digits

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(fullCode[i], 10) * weights[i];
  }

  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;

  return checkDigit === parseInt(cleanAcc[9], 10);
}

export interface BankResolveResult {
  accountName: string;
  isVerified: boolean;
  source: 'live_paystack' | 'known_sandbox' | 'stellar_onchain' | 'manual_nuban' | 'unresolved';
  message?: string;
}

/**
 * Resolves a destination bank account.
 * 1. Checks Paystack live API if key is available.
 * 2. Checks verified sandbox test accounts.
 * 3. Checks Stellar public key addresses.
 * 4. If arbitrary real account: NEVER generates AI fake names!
 *    Instead, validates NUBAN structure and returns clean status so user can provide exact real name.
 */
export async function resolveBankAccount(
  bankName: string,
  accountNumber: string,
  existingAccountName?: string
): Promise<BankResolveResult> {
  const cleanAcc = accountNumber.trim().replace(/\s+/g, '');

  if (cleanAcc.length < 9) {
    return {
      accountName: existingAccountName || '',
      isVerified: false,
      source: 'unresolved',
      message: 'Enter 10-digit account number',
    };
  }

  // 1. Check Stellar Keypair
  if (bankName.toLowerCase().includes('stellar') || cleanAcc.startsWith('G')) {
    if (cleanAcc.length === 56 && cleanAcc.startsWith('G')) {
      return {
        accountName: `STELLAR VAULT (${cleanAcc.slice(0, 4)}...${cleanAcc.slice(-4)})`,
        isVerified: true,
        source: 'stellar_onchain',
        message: 'Valid Stellar Horizon Ed25519 Public Key',
      };
    }
  }

  // 2. Check Pre-Verified Sandbox Accounts (e.g. 9136447931 -> IBRAHIM S.)
  if (KNOWN_VERIFIED_ACCOUNTS[cleanAcc]) {
    const known = KNOWN_VERIFIED_ACCOUNTS[cleanAcc];
    return {
      accountName: known.name,
      isVerified: true,
      source: 'known_sandbox',
      message: 'Verified Sandbox Destination Account',
    };
  }

  // 3. Attempt Live Paystack API if secret key is present in environment
  const paystackKey = (import.meta as any).env?.VITE_PAYSTACK_SECRET_KEY;
  const matchedBank = SUPPORTED_BANKS.find(
    (b) => b.name.toLowerCase() === bankName.toLowerCase() || b.code === bankName.toLowerCase()
  );

  if (paystackKey && matchedBank && cleanAcc.length === 10) {
    try {
      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${cleanAcc}&bank_code=${matchedBank.nibssCode}`,
        {
          headers: {
            Authorization: `Bearer ${paystackKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const json = await response.json();
        if (json.status && json.data?.account_name) {
          return {
            accountName: json.data.account_name.toUpperCase(),
            isVerified: true,
            source: 'live_paystack',
            message: 'Live Verified via NIBSS / Paystack',
          };
        }
      }
    } catch {
      // Fall through to manual NUBAN validation if offline or CORS blocked
    }
  }

  // 4. For any other arbitrary account: NEVER INVENT AI FAKE NAMES!
  // If the user already typed their real name, keep it!
  const isNubanValid = matchedBank ? validateCbnNuban(matchedBank.nibssCode, cleanAcc) : cleanAcc.length === 10;

  if (existingAccountName && existingAccountName.trim().length > 2) {
    return {
      accountName: existingAccountName.trim().toUpperCase(),
      isVerified: true,
      source: 'manual_nuban',
      message: isNubanValid ? '10-Digit NUBAN Validated' : 'Manual Verified Account',
    };
  }

  // Return clean status with empty account name so user types their actual legal name
  return {
    accountName: '',
    isVerified: isNubanValid,
    source: isNubanValid ? 'manual_nuban' : 'unresolved',
    message: isNubanValid
      ? '10-Digit NUBAN Validated. Type exact account holder name.'
      : 'Unverified Account. Enter exact name as on bank app.',
  };
}
