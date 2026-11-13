import { describe, it, expect } from 'vitest';
import { 
  calculateProportionalSplit, 
  formatMoney, 
  roundToTwo, 
  splitAmountEqually,
  getCurrencySymbol 
} from './splitMath';
import { Room } from '../types';

describe('splitMath proportional calculation engine', () => {
  it('correctly formats money with international currency symbols', () => {
    expect(formatMoney(150.5, 'USD')).toBe('$150.50');
    expect(formatMoney(42.5, 'EUR')).toBe('€42.50');
    expect(formatMoney(10.99, 'GBP')).toBe('£10.99');
    expect(formatMoney(88.0, 'CAD')).toBe('CA$88.00');
    expect(formatMoney(2500, 'JPY')).toBe('¥2,500');
    expect(formatMoney(1250.75, 'INR')).toBe('₹1,250.75');
    expect(formatMoney(85.5, 'BRL')).toBe('R$85.50');
  });

  it('resolves correct currency symbols', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('EUR')).toBe('€');
    expect(getCurrencySymbol('GBP')).toBe('£');
    expect(getCurrencySymbol('JPY')).toBe('¥');
    expect(getCurrencySymbol('INR')).toBe('₹');
    expect(getCurrencySymbol('BRL')).toBe('R$');
  });

  it('splits uneven amounts with exact penny balancing (no lost cents)', () => {
    // $10 split 3 ways: should be [3.33, 3.33, 3.34]
    const shares3 = splitAmountEqually(10.0, 3);
    expect(shares3).toHaveLength(3);
    const sum3 = roundToTwo(shares3.reduce((a, b) => a + b, 0));
    expect(sum3).toBe(10.0);

    // $100 split 7 ways: sum must be exactly 100.00
    const shares7 = splitAmountEqually(100.0, 7);
    expect(shares7).toHaveLength(7);
    const sum7 = roundToTwo(shares7.reduce((a, b) => a + b, 0));
    expect(sum7).toBe(100.0);

    // JPY zero-decimal split: 10,000 yen split 3 ways => [3334, 3333, 3333]
    const sharesJpy = splitAmountEqually(10000, 3, true);
    expect(sharesJpy).toHaveLength(3);
    const sumJpy = sharesJpy.reduce((a, b) => a + b, 0);
    expect(sumJpy).toBe(10000);
  });

  it('splits shared items equally among co-claimers', () => {
    const mockRoom: Room = {
      id: 'test-1',
      title: 'SoHo Team Dinner',
      currency: 'USD',
      currencySymbol: '$',
      organizer: {
        id: 'user-1',
        name: 'Alex',
        payout: {
          bankName: 'PayPal',
          accountNumber: 'paypal.me/alex',
          accountName: 'Alex Miller',
        },
      },
      items: [
        {
          id: 'item-1',
          rawName: 'LRG WOOD-FIRED PIZZA',
          cleanName: 'Artisanal Truffle & Mushroom Pizza',
          quantity: 1,
          unitPrice: 36,
          totalPrice: 36,
          claimedBy: ['user-1', 'user-2', 'user-3'], // split 3 ways
        },
      ],
      subtotal: 36,
      tax: 0,
      serviceFee: 0,
      deliveryFee: 0,
      discount: 0,
      grandTotal: 36,
      participants: [
        { id: 'user-1', name: 'Alex', avatarColor: '#6366f1', paymentStatus: 'UNPAID' },
        { id: 'user-2', name: 'Elena', avatarColor: '#10b981', paymentStatus: 'UNPAID' },
        { id: 'user-3', name: 'Marcus', avatarColor: '#f59e0b', paymentStatus: 'UNPAID' },
      ],
      transactions: [],
      createdAt: new Date().toISOString(),
    };

    const result = calculateProportionalSplit(mockRoom);

    expect(result.participantBreakdowns['user-1'].totalOwed).toBe(12);
    expect(result.participantBreakdowns['user-2'].totalOwed).toBe(12);
    expect(result.participantBreakdowns['user-3'].totalOwed).toBe(12);
    expect(result.unclaimedSubtotal).toBe(0);
    expect(result.isFullyClaimed).toBe(true);
  });

  it('distributes tax, service fee, and tip proportionally according to item subtotal with zero penny drift', () => {
    // User 1 orders steak worth $90 (75% of bill)
    // User 2 orders pasta worth $30 (25% of bill)
    // Total subtotal = $120
    // Tax = $10.65 (8.875% NYC tax)
    // Tip/Service = $24.00 (20% Tip)
    // Grand Total = $154.65
    const mockRoom: Room = {
      id: 'test-2',
      title: 'Bistro Outing',
      currency: 'USD',
      currencySymbol: '$',
      organizer: {
        id: 'user-1',
        name: 'Alex',
        payout: {
          bankName: 'Venmo',
          accountNumber: '@alex-splits',
          accountName: 'Alex Miller',
        },
      },
      items: [
        {
          id: 'item-1',
          rawName: 'DRY-AGED RIBEYE',
          cleanName: 'Dry-Aged Prime Ribeye 16oz',
          quantity: 1,
          unitPrice: 90,
          totalPrice: 90,
          claimedBy: ['user-1'],
        },
        {
          id: 'item-2',
          rawName: 'TRUFFLE TAGLIATELLE',
          cleanName: 'Handmade Truffle Tagliatelle',
          quantity: 1,
          unitPrice: 30,
          totalPrice: 30,
          claimedBy: ['user-2'],
        },
      ],
      subtotal: 120,
      tax: 10.65,
      serviceFee: 24.0,
      deliveryFee: 0,
      discount: 0,
      grandTotal: 154.65,
      participants: [
        { id: 'user-1', name: 'Alex', avatarColor: '#6366f1', paymentStatus: 'UNPAID' },
        { id: 'user-2', name: 'Elena', avatarColor: '#10b981', paymentStatus: 'UNPAID' },
      ],
      transactions: [],
      createdAt: new Date().toISOString(),
    };

    const result = calculateProportionalSplit(mockRoom);

    // Sum of user 1 and user 2 total owed must equal EXACT grandTotal
    const totalDistributed = roundToTwo(
      result.participantBreakdowns['user-1'].totalOwed + 
      result.participantBreakdowns['user-2'].totalOwed
    );
    expect(totalDistributed).toBe(154.65);
    expect(result.participantBreakdowns['user-1'].percentageOfSubtotal).toBe(75);
    expect(result.participantBreakdowns['user-2'].percentageOfSubtotal).toBe(25);
  });

  it('correctly tracks unclaimed items when not all items have been claimed', () => {
    const mockRoom: Room = {
      id: 'test-3',
      title: 'Coffee & Pastries',
      currency: 'USD',
      currencySymbol: '$',
      organizer: {
        id: 'user-1',
        name: 'Alex',
        payout: {
          bankName: 'CashApp',
          accountNumber: '$alexcashtag',
          accountName: 'Alex Miller',
        },
      },
      items: [
        {
          id: 'item-1',
          rawName: 'CAPPUCCINO',
          cleanName: 'Oat Cappuccino',
          quantity: 1,
          unitPrice: 6.5,
          totalPrice: 6.5,
          claimedBy: ['user-1'],
        },
        {
          id: 'item-2',
          rawName: 'CROISSANT',
          cleanName: 'Almond Croissant',
          quantity: 1,
          unitPrice: 5.5,
          totalPrice: 5.5,
          claimedBy: [], // UNCLAIMED!
        },
      ],
      subtotal: 12.0,
      tax: 1.07,
      serviceFee: 0,
      deliveryFee: 0,
      discount: 0,
      grandTotal: 13.07,
      participants: [
        { id: 'user-1', name: 'Alex', avatarColor: '#6366f1', paymentStatus: 'UNPAID' },
        { id: 'user-2', name: 'Elena', avatarColor: '#10b981', paymentStatus: 'UNPAID' },
      ],
      transactions: [],
      createdAt: new Date().toISOString(),
    };

    const result = calculateProportionalSplit(mockRoom);

    expect(result.unclaimedSubtotal).toBe(5.5);
    expect(result.unclaimedItemsCount).toBe(1);
    expect(result.isFullyClaimed).toBe(false);
    expect(result.participantBreakdowns['user-2'].itemSubtotal).toBe(0);
    expect(result.participantBreakdowns['user-2'].totalOwed).toBe(0);
  });

  it('handles participants who have claimed nothing gracefully (zero owed, no NaN)', () => {
    const mockRoom: Room = {
      id: 'test-4',
      title: 'Dinner',
      currency: 'USD',
      currencySymbol: '$',
      organizer: {
        id: 'user-1',
        name: 'Alex',
        payout: { bankName: 'Zelle', accountNumber: 'alex@me.com', accountName: 'Alex' },
      },
      items: [
        {
          id: 'item-1',
          rawName: 'Burger',
          cleanName: 'Burger',
          quantity: 1,
          unitPrice: 20,
          totalPrice: 20,
          claimedBy: ['user-1'],
        },
      ],
      subtotal: 20,
      tax: 2,
      serviceFee: 0,
      deliveryFee: 0,
      discount: 0,
      grandTotal: 22,
      participants: [
        { id: 'user-1', name: 'Alex', avatarColor: '#6366f1', paymentStatus: 'UNPAID' },
        { id: 'user-2', name: 'Guest', avatarColor: '#10b981', paymentStatus: 'UNPAID' },
      ],
      transactions: [],
      createdAt: new Date().toISOString(),
    };

    const result = calculateProportionalSplit(mockRoom);
    expect(result.participantBreakdowns['user-2'].totalOwed).toBe(0);
    expect(result.participantBreakdowns['user-2'].percentageOfSubtotal).toBe(0);
    expect(result.participantBreakdowns['user-2'].amountRemaining).toBe(0);
    expect(Number.isNaN(result.participantBreakdowns['user-2'].totalOwed)).toBe(false);
  });

  it('updates remaining balances, collection progress, and settlement status from transactions', () => {
    const mockRoom: Room = {
      id: 'test-5',
      title: 'Tacos',
      currency: 'USD',
      currencySymbol: '$',
      organizer: {
        id: 'user-1',
        name: 'Alex',
        payout: { bankName: 'Zelle', accountNumber: 'alex@me.com', accountName: 'Alex' },
      },
      items: [
        {
          id: 'item-1',
          rawName: 'Tacos',
          cleanName: 'Taco Platter',
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50,
          claimedBy: ['user-1', 'user-2'], // $25 each
        },
      ],
      subtotal: 50,
      tax: 0,
      serviceFee: 0,
      deliveryFee: 0,
      discount: 0,
      grandTotal: 50,
      participants: [
        { id: 'user-1', name: 'Alex', avatarColor: '#6366f1', paymentStatus: 'UNPAID' },
        { id: 'user-2', name: 'Jordan', avatarColor: '#10b981', paymentStatus: 'UNPAID' },
      ],
      transactions: [
        {
          id: 'tx-1',
          senderId: 'user-2',
          senderName: 'Jordan',
          recipientName: 'Alex',
          amount: 25.0,
          currency: 'USD',
          method: 'DIRECT_TRANSFER',
          referenceId: 'SETTLE-101',
          timestamp: 'Just now',
          status: 'COMPLETED',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = calculateProportionalSplit(mockRoom);

    // Jordan paid $25 of $25
    expect(result.participantBreakdowns['user-2'].amountPaid).toBe(25);
    expect(result.participantBreakdowns['user-2'].amountRemaining).toBe(0);
    expect(result.participantBreakdowns['user-2'].paymentStatus).toBe('VERIFIED');

    // Alex hasn't paid yet
    expect(result.participantBreakdowns['user-1'].amountPaid).toBe(0);
    expect(result.participantBreakdowns['user-1'].amountRemaining).toBe(25);

    // Total collected
    expect(result.totalCollected).toBe(25);
    expect(result.remainingToCollect).toBe(25);
    expect(result.collectionProgressPercent).toBe(50);
    expect(result.isFullySettled).toBe(false);
  });

  it('marks room as fully settled when all participants have paid and all items are claimed', () => {
    const mockRoom: Room = {
      id: 'test-6',
      title: 'Full Settlement Test',
      currency: 'USD',
      currencySymbol: '$',
      organizer: {
        id: 'user-1',
        name: 'Alex',
        payout: { bankName: 'Zelle', accountNumber: 'alex@me.com', accountName: 'Alex' },
      },
      items: [
        {
          id: 'item-1',
          rawName: 'Item',
          cleanName: 'Item',
          quantity: 1,
          unitPrice: 40,
          totalPrice: 40,
          claimedBy: ['user-1'],
        },
      ],
      subtotal: 40,
      tax: 0,
      serviceFee: 0,
      deliveryFee: 0,
      discount: 0,
      grandTotal: 40,
      participants: [
        { id: 'user-1', name: 'Alex', avatarColor: '#6366f1', paymentStatus: 'UNPAID' },
      ],
      transactions: [
        {
          id: 'tx-1',
          senderId: 'user-1',
          senderName: 'Alex',
          recipientName: 'Alex',
          amount: 40.0,
          currency: 'USD',
          method: 'DIRECT_TRANSFER',
          referenceId: 'SETTLE-200',
          timestamp: 'Just now',
          status: 'COMPLETED',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = calculateProportionalSplit(mockRoom);
    expect(result.isFullyClaimed).toBe(true);
    expect(result.remainingToCollect).toBe(0);
    expect(result.collectionProgressPercent).toBe(100);
    expect(result.isFullySettled).toBe(true);
  });

  it('handles JPY zero-decimal calculations accurately', () => {
    const mockRoom: Room = {
      id: 'test-jpy',
      title: 'Tokyo Ramen Night',
      currency: 'JPY',
      currencySymbol: '¥',
      organizer: {
        id: 'user-1',
        name: 'Kenji',
        payout: { bankName: 'PayPay', accountNumber: 'kenji.tokyo', accountName: 'Kenji Sato' },
      },
      items: [
        {
          id: 'item-1',
          rawName: 'Tonkotsu Ramen x3',
          cleanName: 'Tonkotsu Special Ramen (x3)',
          quantity: 3,
          unitPrice: 1200,
          totalPrice: 3600,
          claimedBy: ['user-1', 'user-2', 'user-3'], // ¥1200 each
        },
      ],
      subtotal: 3600,
      tax: 360, // 10% tax
      serviceFee: 0,
      deliveryFee: 0,
      discount: 0,
      grandTotal: 3960,
      participants: [
        { id: 'user-1', name: 'Kenji', avatarColor: '#6366f1', paymentStatus: 'UNPAID' },
        { id: 'user-2', name: 'Aoi', avatarColor: '#10b981', paymentStatus: 'UNPAID' },
        { id: 'user-3', name: 'Hiro', avatarColor: '#f59e0b', paymentStatus: 'UNPAID' },
      ],
      transactions: [],
      createdAt: new Date().toISOString(),
    };

    const result = calculateProportionalSplit(mockRoom);
    expect(result.participantBreakdowns['user-1'].totalOwed).toBe(1320);
    expect(result.participantBreakdowns['user-2'].totalOwed).toBe(1320);
    expect(result.participantBreakdowns['user-3'].totalOwed).toBe(1320);
    const totalOwed = 1320 + 1320 + 1320;
    expect(totalOwed).toBe(3960);
  });
});
