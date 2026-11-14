export interface BankOption {
  code: string;
  name: string;
  country: string;
  flag: string;
  isPopular?: boolean;
}

export const SUPPORTED_BANKS: BankOption[] = [
  // Nigeria (Primary Hackathon / FinTech)
  { code: 'opay', name: 'OPay Digital Services', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'moniepoint', name: 'Moniepoint MFB', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'palmpay', name: 'PalmPay', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'kuda', name: 'Kuda Microfinance Bank', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'gtbank', name: 'Guaranty Trust Bank (GTBank)', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'access', name: 'Access Bank', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'zenith', name: 'Zenith Bank', country: 'NG', flag: '🇳🇬', isPopular: true },
  { code: 'uba', name: 'United Bank for Africa (UBA)', country: 'NG', flag: '🇳🇬' },
  { code: 'firstbank', name: 'First Bank of Nigeria', country: 'NG', flag: '🇳🇬' },
  { code: 'wema', name: 'Wema Bank / ALAT', country: 'NG', flag: '🇳🇬' },
  { code: 'stanbic', name: 'Stanbic IBTC Bank', country: 'NG', flag: '🇳🇬' },
  { code: 'sterling', name: 'Sterling Bank', country: 'NG', flag: '🇳🇬' },
  { code: 'fidelity', name: 'Fidelity Bank', country: 'NG', flag: '🇳🇬' },

  // International Rails (Global Off-Ramp)
  { code: 'chase', name: 'JPMorgan Chase (USD / ACH)', country: 'US', flag: '🇺🇸', isPopular: true },
  { code: 'boa', name: 'Bank of America (USD / FedNow)', country: 'US', flag: '🇺🇸' },
  { code: 'revolut', name: 'Revolut (GBP / EUR)', country: 'UK', flag: '🇬🇧', isPopular: true },
  { code: 'barclays', name: 'Barclays Bank (GBP Faster Payments)', country: 'UK', flag: '🇬🇧' },
  { code: 'sepa', name: 'SEPA Euro IBAN (European Union)', country: 'EU', flag: '🇪🇺' },
  { code: 'stellar_wallet', name: 'Direct Stellar Web3 Wallet (USDC)', country: 'GLOBAL', flag: '🌐', isPopular: true },
];

/**
 * Simulates high-speed NIBSS / Paystack / OpenBanking account resolution.
 * Takes 10-digit NUBAN (or standard account), returns verified account name.
 */
export async function resolveBankAccount(
  bankName: string,
  accountNumber: string,
  hintVendorName?: string
): Promise<{ accountName: string; isVerified: boolean }> {
  const cleanAcc = accountNumber.trim().replace(/\s+/g, '');

  // Simulate network roundtrip latency for realistic banking feel
  await new Promise((resolve) => setTimeout(resolve, 320));

  if (cleanAcc.length < 9) {
    return { accountName: '', isVerified: false };
  }

  // Pre-configured real test cases
  if (cleanAcc === '9136447931') {
    return {
      accountName: 'IBRAHIM S. (OPAY)',
      isVerified: true,
    };
  }

  if (cleanAcc === '0123456789' || cleanAcc === '4019283746') {
    return {
      accountName: hintVendorName ? `${hintVendorName.toUpperCase()} LTD` : 'VERIFIED VENDOR HOLDINGS',
      isVerified: true,
    };
  }

  if (bankName.toLowerCase().includes('stellar') || cleanAcc.startsWith('G')) {
    return {
      accountName: `STELLAR VAULT (${cleanAcc.slice(0, 4)}...${cleanAcc.slice(-4)})`,
      isVerified: true,
    };
  }

  // Realistic dynamic name resolution
  if (hintVendorName && hintVendorName.trim()) {
    return {
      accountName: `${hintVendorName.trim().toUpperCase()} VENTURES`,
      isVerified: true,
    };
  }

  return {
    accountName: `RESTAURANT ACC - ${cleanAcc.slice(-4)}`,
    isVerified: true,
  };
}
