export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'SGD' | 'INR' | 'BRL' | 'NGN';

export interface LineItem {
  id: string;
  rawName: string;
  cleanName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  claimedBy: string[]; // participant IDs
}

export type PaymentVerificationStatus =
  | 'UNPAID'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'PARTIAL_OR_MISMATCH'
  | 'SUSPICIOUS_EDIT';

export interface ForensicReport {
  elaScore: number; // 0 - 100 (higher = suspicious tampering)
  elaRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  tamperDetected: boolean;
  tamperReason?: string;
  extractedData?: {
    senderName?: string;
    recipientName?: string;
    amountPaid?: number;
    transactionDate?: string;
    referenceId?: string;
    bankOrProvider?: string;
  };
  mismatchDetails?: string;
  verifiedAt?: string;
}

export interface PaymentProof {
  imageUrl: string;
  uploadedAt: string;
  forensics?: ForensicReport;
}

export interface Participant {
  id: string;
  name: string;
  avatarColor: string; // Tailwind color class or hex
  isOrganizer?: boolean;
  paymentStatus: PaymentVerificationStatus;
  paymentProof?: PaymentProof;
  phone?: string;
  handle?: string;
}

export interface OrganizerPayoutDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  paymentLink?: string;
  note?: string;
}

export interface Transaction {
  id: string;
  senderId: string;
  senderName: string;
  recipientName: string;
  amount: number;
  currency: Currency;
  method: 'DIRECT_TRANSFER' | 'RECEIPT_UPLOAD';
  referenceId: string;
  timestamp: string;
  status: 'COMPLETED' | 'FLAGGED_MISMATCH' | 'SUSPICIOUS_EDIT';
  proofUrl?: string;
  forensics?: ForensicReport;
  notes?: string;
}

export interface Room {
  id: string;
  title: string;
  currency: Currency;
  currencySymbol: string;
  organizer: {
    id: string;
    name: string;
    payout: OrganizerPayoutDetails;
  };
  items: LineItem[];
  subtotal: number;
  tax: number;
  serviceFee: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  participants: Participant[];
  transactions: Transaction[];
  createdAt: string;
  receiptImageUrl?: string;
}

export interface ParticipantShareBreakdown {
  participantId: string;
  participantName: string;
  claimedItems: {
    item: LineItem;
    shareCount: number;
    userPortionPrice: number;
  }[];
  itemSubtotal: number;
  proportionalExtraCharges: number; // proportional tax + fees - discount
  totalOwed: number;
  amountPaid: number;
  amountRemaining: number;
  percentageOfSubtotal: number;
  paymentStatus: PaymentVerificationStatus;
  paymentProof?: PaymentProof;
}

export interface SplitCalculationResult {
  participantBreakdowns: Record<string, ParticipantShareBreakdown>;
  totalClaimedSubtotal: number;
  unclaimedSubtotal: number;
  unclaimedItemsCount: number;
  grandTotal: number;
  extraChargesTotal: number;
  totalCollected: number;
  remainingToCollect: number;
  collectionProgressPercent: number;
  isFullyClaimed: boolean;
  isFullySettled: boolean;
}

