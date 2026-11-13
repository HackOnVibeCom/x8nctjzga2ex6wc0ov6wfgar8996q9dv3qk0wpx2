import { describe, it, expect } from 'vitest';
import { calculateProportionalSplit, formatMoney } from './splitMath';
import { Room } from '../types';

describe('splitMath proportional calculation engine', () => {
  it('correctly formats money with international currency symbols', () => {
    expect(formatMoney(150.5, 'USD')).toBe('$150.50');
    expect(formatMoney(42.5, 'EUR')).toBe('€42.50');
    expect(formatMoney(10.99, 'GBP')).toBe('£10.99');
    expect(formatMoney(88.0, 'CAD')).toBe('CA$88.00');
  });

  it('splits shared items equally among 3 co-claimers', () => {
    const mockRoom: Room = {
      id: 'test-1',
      title: 'SoHo Team Dinner',
      currency: 'USD',
      currencySymbol: '$',
      organizer: {
        id: 'user-1',
        name: 'Alex',
        payout: {
          bankName: 'Chase Bank / Zelle',
          accountNumber: 'alex.miller@example.com',
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
        { id: 'user-1', name: 'Alex', avatarColor: '#6366f1', paymentStatus: 'VERIFIED' },
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

  it('distributes tax, service fee, and tip proportionally according to item subtotal', () => {
    // User 1 orders steak worth $90 (75% of bill)
    // User 2 orders pasta worth $30 (25% of bill)
    // Total subtotal = $120
    // Tax = $10.65 (8.875% NYC tax)
    // Tip/Service = $24.00 (20% Tip)
    // Total extra charges = $34.65
    // User 1 extra = 75% of 34.65 = 25.99 -> Total = 115.99
    // User 2 extra = 25% of 34.65 = 8.66 -> Total = 38.66
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
      serviceFee: 24.00,
      deliveryFee: 0,
      discount: 0,
      grandTotal: 154.65,
      participants: [
        { id: 'user-1', name: 'Alex', avatarColor: '#6366f1', paymentStatus: 'UNPAID' },
        { id: 'user-2', name: 'Sarah', avatarColor: '#ec4899', paymentStatus: 'UNPAID' },
      ],
      transactions: [],
      createdAt: new Date().toISOString(),
    };

    const result = calculateProportionalSplit(mockRoom);

    expect(result.participantBreakdowns['user-1'].itemSubtotal).toBe(90);
    expect(result.participantBreakdowns['user-1'].proportionalExtraCharges).toBe(25.99);
    expect(result.participantBreakdowns['user-1'].totalOwed).toBe(115.99);

    expect(result.participantBreakdowns['user-2'].itemSubtotal).toBe(30);
    expect(result.participantBreakdowns['user-2'].proportionalExtraCharges).toBe(8.66);
    expect(result.participantBreakdowns['user-2'].totalOwed).toBe(38.66);

    expect(Math.round((result.participantBreakdowns['user-1'].totalOwed + result.participantBreakdowns['user-2'].totalOwed) * 100) / 100).toBe(154.65);
  });

  it('correctly tracks unclaimed items when not everyone has claimed yet', () => {
    const mockRoom: Room = {
      id: 'test-3',
      title: 'Drinks Bill',
      currency: 'USD',
      currencySymbol: '$',
      organizer: {
        id: 'user-1',
        name: 'Alex',
        payout: {
          bankName: 'Revolut',
          accountNumber: 'revolut.me/alexsplits',
          accountName: 'Alex Miller',
        },
      },
      items: [
        {
          id: 'item-1',
          rawName: 'CRAFT COCKTAILS X2',
          cleanName: 'Smoked Mezcal Old Fashioned (x2)',
          quantity: 2,
          unitPrice: 20,
          totalPrice: 40,
          claimedBy: ['user-1'],
        },
        {
          id: 'item-2',
          rawName: 'ARTISANAL CHEESE BOARD',
          cleanName: 'Artisanal Cheese & Charcuterie Board',
          quantity: 1,
          unitPrice: 28,
          totalPrice: 28,
          claimedBy: [], // UNCLAIMED
        },
      ],
      subtotal: 68,
      tax: 6,
      serviceFee: 12,
      deliveryFee: 0,
      discount: 0,
      grandTotal: 86,
      participants: [
        { id: 'user-1', name: 'Alex', avatarColor: '#6366f1', paymentStatus: 'UNPAID' },
      ],
      transactions: [],
      createdAt: new Date().toISOString(),
    };

    const result = calculateProportionalSplit(mockRoom);

    expect(result.unclaimedSubtotal).toBe(28);
    expect(result.unclaimedItemsCount).toBe(1);
    expect(result.isFullyClaimed).toBe(false);
  });

  it('correctly tracks real transactions, deducts paid amounts, and marks settlement', () => {
    const mockRoom: Room = {
      id: 'test-tx',
      title: 'Settlement Test',
      currency: 'USD',
      currencySymbol: '$',
      organizer: {
        id: 'user-1',
        name: 'Alex',
        payout: {
          bankName: 'Chase',
          accountNumber: '123456789',
          accountName: 'Alex Miller',
        },
      },
      items: [
        {
          id: 'item-1',
          rawName: 'STEAK',
          cleanName: 'Prime Steak',
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50,
          claimedBy: ['user-2'],
        },
      ],
      subtotal: 50,
      tax: 0,
      serviceFee: 0,
      deliveryFee: 0,
      discount: 0,
      grandTotal: 50,
      participants: [
        { id: 'user-1', name: 'Alex', avatarColor: '#6366f1', paymentStatus: 'VERIFIED' },
        { id: 'user-2', name: 'Elena', avatarColor: '#10b981', paymentStatus: 'UNPAID' },
      ],
      transactions: [
        {
          id: 'tx-1',
          senderId: 'user-2',
          senderName: 'Elena',
          recipientName: 'Alex Miller',
          amount: 50,
          currency: 'USD',
          method: 'DIRECT_TRANSFER',
          referenceId: 'CHASE-12345',
          timestamp: 'Just now',
          status: 'COMPLETED',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = calculateProportionalSplit(mockRoom);

    expect(result.participantBreakdowns['user-2'].amountPaid).toBe(50);
    expect(result.participantBreakdowns['user-2'].amountRemaining).toBe(0);
    expect(result.participantBreakdowns['user-2'].paymentStatus).toBe('VERIFIED');
    expect(result.totalCollected).toBe(50);
    expect(result.remainingToCollect).toBe(0);
    expect(result.collectionProgressPercent).toBe(100);
    expect(result.isFullySettled).toBe(true);
  });
});
