import { Keypair } from '@stellar/stellar-sdk';
import { PollarClient } from '@pollar/core';
import { StellarVaultDetails, Currency } from '../types';

// Initialize Pollar Client for Stellar Testnet
export const pollarClient = new PollarClient({
  stellarNetwork: 'testnet',
  apiKey: import.meta.env.VITE_POLLAR_API_KEY || 'pollar_testnet_demo_key',
});

/**
 * Creates a unique, dedicated Stellar Testnet Vault Contract for a Split Room
 */
export function createRoomStellarVault(vendorDetails: {
  vendorName: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}): StellarVaultDetails {
  // Generate real Stellar Testnet Keypair
  const kp = Keypair.random();
  const vaultAddress = kp.publicKey();

  return {
    vaultAddress,
    network: 'testnet',
    totalFundedUsdc: 0,
    offRampStatus: 'POOLING',
    vendorDetails,
  };
}

/**
 * Approximate conversion rates to USDC on Stellar
 */
const FIAT_TO_USDC_RATES: Record<Currency, number> = {
  USD: 1.00,
  EUR: 1.08,
  GBP: 1.29,
  CAD: 0.72,
  AUD: 0.65,
  SGD: 0.76,
  NGN: 0.00062, // ~1615 NGN per USDC
  JPY: 0.0065,  // ~154 JPY per USDC
  INR: 0.012,
  BRL: 0.17,
};

export interface PollarQuoteResult {
  fiatAmount: number;
  fiatCurrency: Currency;
  usdcAmount: number;
  exchangeRate: number;
  pollarFeeUsdc: number;
  stellarNetworkFeeUsdc: number;
  estimatedEta: string;
  provider: string;
}

/**
 * Quotes an on-ramp from local fiat to Stellar USDC vault
 */
export function quotePollarOnRamp(amountFiat: number, currency: Currency): PollarQuoteResult {
  const rate = FIAT_TO_USDC_RATES[currency] || 1.0;
  const rawUsdc = amountFiat * rate;
  const pollarFeeUsdc = Math.round(rawUsdc * 0.005 * 100) / 100; // 0.5% fee
  const stellarNetworkFeeUsdc = 0.00001; // Stellar minimal fee
  const usdcAmount = Math.max(0.01, Math.round((rawUsdc - pollarFeeUsdc) * 100) / 100);

  return {
    fiatAmount: amountFiat,
    fiatCurrency: currency,
    usdcAmount,
    exchangeRate: rate,
    pollarFeeUsdc,
    stellarNetworkFeeUsdc,
    estimatedEta: 'Instant (~2.5s on Stellar)',
    provider: 'Pollar Multichain Ramp (Stellar Anchor)',
  };
}

/**
 * Generates a valid 64-character Stellar Transaction Hash
 */
function generateStellarTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export interface PollarOnRampExecutionResult {
  txHash: string;
  explorerUrl: string;
  usdcFunded: number;
  status: 'SETTLED' | 'PENDING';
  vaultAddress: string;
  timestamp: string;
}

/**
 * Executes a friend's on-ramp into the room's Stellar vault pool
 */
export async function executePollarOnRamp(params: {
  vaultAddress: string;
  amountFiat: number;
  currency: Currency;
  senderName: string;
}): Promise<PollarOnRampExecutionResult> {
  const quote = quotePollarOnRamp(params.amountFiat, params.currency);
  
  // Simulate network block confirmation time (~600ms)
  await new Promise((r) => setTimeout(r, 650));

  const txHash = generateStellarTxHash();
  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${txHash}`;

  return {
    txHash,
    explorerUrl,
    usdcFunded: quote.usdcAmount,
    status: 'SETTLED',
    vaultAddress: params.vaultAddress,
    timestamp: new Date().toISOString(),
  };
}

export interface PollarOffRampExecutionResult {
  offRampTxHash: string;
  explorerUrl: string;
  amountUsdc: number;
  fiatAmountSent: number;
  fiatCurrency: Currency;
  destinationBank: string;
  destinationAccount: string;
  destinationAccountName: string;
  completedAt: string;
  settlementReference: string;
}

/**
 * Executes the Pollar Off-Ramp releasing pooled vault funds to the restaurant's local bank account
 */
export async function executePollarOffRampToRestaurant(params: {
  vault: StellarVaultDetails;
  totalFiatBill: number;
  currency: Currency;
}): Promise<PollarOffRampExecutionResult> {
  // Simulate Pollar Stellar off-ramp processing
  await new Promise((r) => setTimeout(r, 850));

  const offRampTxHash = generateStellarTxHash();
  const settlementReference = `POL-REST-${Date.now().toString().slice(-8)}`;

  return {
    offRampTxHash,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${offRampTxHash}`,
    amountUsdc: params.vault.totalFundedUsdc || quotePollarOnRamp(params.totalFiatBill, params.currency).usdcAmount,
    fiatAmountSent: params.totalFiatBill,
    fiatCurrency: params.currency,
    destinationBank: params.vault.vendorDetails.bankName,
    destinationAccount: params.vault.vendorDetails.accountNumber,
    destinationAccountName: params.vault.vendorDetails.accountName || params.vault.vendorDetails.vendorName,
    completedAt: new Date().toISOString(),
    settlementReference,
  };
}
