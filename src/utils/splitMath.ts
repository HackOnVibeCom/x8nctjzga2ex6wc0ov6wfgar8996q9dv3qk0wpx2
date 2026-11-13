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
    case 'JPY':
      return '¥';
    case 'INR':
      return '₹';
    case 'BRL':
      return 'R$';
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
  const isZeroDecimal = currency === 'JPY';
  const rounded = isZeroDecimal ? Math.round(amount) : roundToTwo(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(rounded);
  return `${symbol}${formatted}`;
}

/**
 * Distributes an item cost evenly among N claimers with exact penny balancing
 * e.g., $10 / 3 => [$3.33, $3.33, $3.34]
 */
export function splitAmountEqually(total: number, count: number, isZeroDecimal = false): number[] {
  if (count <= 0) return [];
  if (count === 1) return [isZeroDecimal ? Math.round(total) : roundToTwo(total)];

  if (isZeroDecimal) {
    const base = Math.floor(total / count);
    const remainder = total - (base * count);
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      result.push(base + (i < remainder ? 1 : 0));
    }
    return result;
  }

  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents - (baseCents * count);

  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const shareCents = baseCents + (i >= count - remainderCents ? 1 : 0);
    result.push(roundToTwo(shareCents / 100));
  }
  return result;
}

/**
 * Core Proportional Split Math Engine
 *
 * Distributes item costs among multiple co-claimers with zero penny loss,
 * and distributes tax + service fee + delivery fee - discounts
 * proportionally based on each participant's item subtotal share.
 */
export function calculateProportionalSplit(room: Room): SplitCalculationResult {
  const isZeroDecimal = room.currency === 'JPY';
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

  // 2. Iterate through line items and divide among co-claimers with penny balancing
  for (const item of room.items) {
    const claimers = item.claimedBy || [];
    if (claimers.length === 0) {
      unclaimedSubtotal += item.totalPrice;
      unclaimedItemsCount++;
      continue;
    }

    const shareCount = claimers.length;
    const splitShares = splitAmountEqually(item.totalPrice, shareCount, isZeroDecimal);

    claimers.forEach((claimerId, index) => {
      const pricePerClaimer = splitShares[index];

      if (!participantBreakdowns[claimerId]) {
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
    });
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
  const participantIds = Object.keys(participantBreakdowns);
  let totalDistributedExtraCharges = 0;

  for (const pId of participantIds) {
    const p = participantBreakdowns[pId];
    p.itemSubtotal = isZeroDecimal ? Math.round(p.itemSubtotal) : roundToTwo(p.itemSubtotal);

    if (billSubtotal > 0 && p.itemSubtotal > 0) {
      const ratio = p.itemSubtotal / billSubtotal;
      p.percentageOfSubtotal = roundToTwo(ratio * 100);
      const share = extraChargesTotal * ratio;
      p.proportionalExtraCharges = isZeroDecimal ? Math.round(share) : roundToTwo(share);
      totalDistributedExtraCharges += p.proportionalExtraCharges;
    } else {
      p.percentageOfSubtotal = 0;
      p.proportionalExtraCharges = 0;
    }

    p.totalOwed = isZeroDecimal
      ? Math.max(0, Math.round(p.itemSubtotal + p.proportionalExtraCharges))
      : roundToTwo(Math.max(0, p.itemSubtotal + p.proportionalExtraCharges));
  }

  // 5. Penny balancing on extra charges if ALL items are claimed
  const isFullyClaimed = unclaimedItemsCount === 0 && roundToTwo(unclaimedSubtotal) === 0;
  const grandTotal = isZeroDecimal
    ? Math.max(0, Math.round(room.grandTotal || (billSubtotal + extraChargesTotal)))
    : roundToTwo(Math.max(0, room.grandTotal || (billSubtotal + extraChargesTotal)));

  if (isFullyClaimed && participantIds.length > 0) {
    const currentTotalOwed = participantIds.reduce((sum, id) => sum + participantBreakdowns[id].totalOwed, 0);
    const roundingDiff = isZeroDecimal
      ? grandTotal - currentTotalOwed
      : roundToTwo(grandTotal - currentTotalOwed);

    // If there is a small rounding drift (e.g. ±$0.01 or ±$0.02) from independent roundings, absorb into the largest consumer
    if (roundingDiff !== 0 && Math.abs(roundingDiff) <= 0.05) {
      // Find participant with highest owed amount
      const highestP = participantIds.reduce((maxId, currId) =>
        participantBreakdowns[currId].totalOwed > participantBreakdowns[maxId].totalOwed ? currId : maxId,
        participantIds[0]
      );
      if (highestP) {
        participantBreakdowns[highestP].totalOwed = isZeroDecimal
          ? Math.round(participantBreakdowns[highestP].totalOwed + roundingDiff)
          : roundToTwo(participantBreakdowns[highestP].totalOwed + roundingDiff);
        participantBreakdowns[highestP].proportionalExtraCharges = isZeroDecimal
          ? Math.round(participantBreakdowns[highestP].proportionalExtraCharges + roundingDiff)
          : roundToTwo(participantBreakdowns[highestP].proportionalExtraCharges + roundingDiff);
      }
    }
  }

  // 6. Calculate settlement status for each participant
  for (const pId of participantIds) {
    const p = participantBreakdowns[pId];
    const successfulTx = (room.transactions || []).filter(
      (tx) => tx.senderId === p.participantId && tx.status === 'COMPLETED'
    );
    const paidSum = successfulTx.reduce((acc, tx) => acc + tx.amount, 0);
    p.amountPaid = isZeroDecimal ? Math.round(paidSum) : roundToTwo(paidSum);
    p.amountRemaining = isZeroDecimal
      ? Math.max(0, Math.round(p.totalOwed - p.amountPaid))
      : roundToTwo(Math.max(0, p.totalOwed - p.amountPaid));

    if (p.amountRemaining === 0 && p.totalOwed > 0) {
      p.paymentStatus = 'VERIFIED';
    }
  }

  const totalCollected = isZeroDecimal
    ? Math.round((room.transactions || []).filter((tx) => tx.status === 'COMPLETED').reduce((acc, tx) => acc + tx.amount, 0))
    : roundToTwo((room.transactions || []).filter((tx) => tx.status === 'COMPLETED').reduce((acc, tx) => acc + tx.amount, 0));

  const remainingToCollect = isZeroDecimal
    ? Math.max(0, Math.round(grandTotal - totalCollected))
    : roundToTwo(Math.max(0, grandTotal - totalCollected));

  const collectionProgressPercent = grandTotal > 0
    ? Math.min(100, Math.round((totalCollected / grandTotal) * 100))
    : 0;

  const isFullySettled = remainingToCollect === 0 && isFullyClaimed;

  return {
    participantBreakdowns,
    totalClaimedSubtotal: isZeroDecimal ? Math.round(totalClaimedSubtotal) : roundToTwo(totalClaimedSubtotal),
    unclaimedSubtotal: isZeroDecimal ? Math.round(unclaimedSubtotal) : roundToTwo(unclaimedSubtotal),
    unclaimedItemsCount,
    grandTotal,
    extraChargesTotal: isZeroDecimal ? Math.round(extraChargesTotal) : roundToTwo(extraChargesTotal),
    totalCollected,
    remainingToCollect,
    collectionProgressPercent,
    isFullyClaimed,
    isFullySettled,
  };
}
