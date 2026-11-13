import { Room, Currency, SplitCalculationResult, ParticipantShareBreakdown } from '../types';

/**
 * Rounds a number to exactly two decimal places (avoiding float IEEE 754 precision issues)
 */
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Currency symbol resolver
 */
export function getCurrencySymbol(currency: Currency): string {
  switch (currency) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'CAD':
      return 'CA$';
    case 'AUD':
      return 'A$';
    case 'SGD':
      return 'S$';
    case 'NGN':
      return '₦';
    default:
      return '$';
  }
}

/**
 * Formats a monetary value cleanly with commas and currency symbol
 */
export function formatMoney(amount: number, currency: Currency = 'USD'): string {
  const symbol = getCurrencySymbol(currency);
  const rounded = roundToTwo(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
  return `${symbol}${formatted}`;
}

/**
 * Core Proportional Split Math Engine
 *
 * Distributes item costs among multiple co-claimers,
 * and distributes tax + service fee + delivery fee - discounts
 * proportionally based on each participant's item subtotal share.
 */
export function calculateProportionalSplit(room: Room): SplitCalculationResult {
  const participantBreakdowns: Record<string, ParticipantShareBreakdown> = {};

  // 1. Initialize participant breakdowns
  for (const participant of room.participants) {
    participantBreakdowns[participant.id] = {
      participantId: participant.id,
      participantName: participant.name,
      claimedItems: [],
      itemSubtotal: 0,
      proportionalExtraCharges: 0,
      totalOwed: 0,
      amountPaid: 0,
      amountRemaining: 0,
      percentageOfSubtotal: 0,
      paymentStatus: participant.paymentStatus,
      paymentProof: participant.paymentProof,
    };
  }

  let totalClaimedSubtotal = 0;
  let unclaimedSubtotal = 0;
  let unclaimedItemsCount = 0;

  // 2. Iterate through line items and divide among co-claimers
  for (const item of room.items) {
    const claimers = item.claimedBy || [];
    if (claimers.length === 0) {
      unclaimedSubtotal += item.totalPrice;
      unclaimedItemsCount++;
      continue;
    }

    const shareCount = claimers.length;
    const pricePerClaimer = item.totalPrice / shareCount;

    for (const claimerId of claimers) {
      if (!participantBreakdowns[claimerId]) {
        // Fallback for an unknown participant ID
        participantBreakdowns[claimerId] = {
          participantId: claimerId,
          participantName: `User ${claimerId.slice(0, 4)}`,
          claimedItems: [],
          itemSubtotal: 0,
          proportionalExtraCharges: 0,
          totalOwed: 0,
          amountPaid: 0,
          amountRemaining: 0,
          percentageOfSubtotal: 0,
          paymentStatus: 'UNPAID',
        };
      }

      participantBreakdowns[claimerId].claimedItems.push({
        item,
        shareCount,
        userPortionPrice: pricePerClaimer,
      });

      participantBreakdowns[claimerId].itemSubtotal += pricePerClaimer;
      totalClaimedSubtotal += pricePerClaimer;
    }
  }

  // 3. Calculate extra charges (tax + serviceFee + deliveryFee - discount)
  const tax = Number(room.tax) || 0;
  const serviceFee = Number(room.serviceFee) || 0;
  const deliveryFee = Number(room.deliveryFee) || 0;
  const discount = Number(room.discount) || 0;
  const extraChargesTotal = tax + serviceFee + deliveryFee - discount;

  // Total bill subtotal reference (from items)
  const billSubtotal = room.items.reduce((acc, it) => acc + it.totalPrice, 0);

  // 4. Distribute extra charges proportionally to each participant
  for (const pId of Object.keys(participantBreakdowns)) {
    const p = participantBreakdowns[pId];
    p.itemSubtotal = roundToTwo(p.itemSubtotal);

    if (billSubtotal > 0 && p.itemSubtotal > 0) {
      // Proportion of their claimed items relative to total bill subtotal
      const ratio = p.itemSubtotal / billSubtotal;
      p.percentageOfSubtotal = roundToTwo(ratio * 100);
      p.proportionalExtraCharges = roundToTwo(extraChargesTotal * ratio);
    } else {
      p.percentageOfSubtotal = 0;
      p.proportionalExtraCharges = 0;
    }

    p.totalOwed = roundToTwo(Math.max(0, p.itemSubtotal + p.proportionalExtraCharges));

    // Calculate actual payments from transactions
    const successfulTx = (room.transactions || []).filter(
      (tx) => tx.senderId === p.participantId && tx.status === 'COMPLETED'
    );
    const paidSum = successfulTx.reduce((acc, tx) => acc + tx.amount, 0);
    p.amountPaid = roundToTwo(paidSum);
    p.amountRemaining = roundToTwo(Math.max(0, p.totalOwed - p.amountPaid));

    if (p.amountRemaining === 0 && p.totalOwed > 0) {
      p.paymentStatus = 'VERIFIED';
    }
  }

  const isFullyClaimed = unclaimedItemsCount === 0 && roundToTwo(unclaimedSubtotal) === 0;

  const totalCollected = roundToTwo(
    (room.transactions || [])
      .filter((tx) => tx.status === 'COMPLETED')
      .reduce((acc, tx) => acc + tx.amount, 0)
  );

  const grandTotal = roundToTwo(room.grandTotal || (billSubtotal + extraChargesTotal));
  const remainingToCollect = roundToTwo(Math.max(0, grandTotal - totalCollected));
  const collectionProgressPercent = grandTotal > 0 ? Math.min(100, Math.round((totalCollected / grandTotal) * 100)) : 0;
  const isFullySettled = remainingToCollect === 0 && isFullyClaimed;

  return {
    participantBreakdowns,
    totalClaimedSubtotal: roundToTwo(totalClaimedSubtotal),
    unclaimedSubtotal: roundToTwo(unclaimedSubtotal),
    unclaimedItemsCount,
    grandTotal,
    extraChargesTotal: roundToTwo(extraChargesTotal),
    totalCollected,
    remainingToCollect,
    collectionProgressPercent,
    isFullyClaimed,
    isFullySettled,
  };
}

