import { Room, Currency } from '../types';
import { getCurrencySymbol } from '../utils/splitMath';

/**
 * Clean Room Factory for Production
 * Creates fresh rooms with zero mocked data, zero fake transactions, and clean initial states.
 */
export function createEmptyRoom(
  title: string,
  currency: Currency = 'USD',
  hostName: string = 'Host',
  bankName: string = '',
  accountNumber: string = ''
): Room {
  const hostId = `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const roomId = `room-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  return {
    id: roomId,
    title: title.trim() || 'New Bill Split',
    currency,
    currencySymbol: getCurrencySymbol(currency),
    organizer: {
      id: hostId,
      name: hostName.trim() || 'Host',
      payout: {
        bankName: bankName.trim() || 'Direct Transfer',
        accountNumber: accountNumber.trim() || '',
        accountName: hostName.trim() || 'Host',
      },
    },
    items: [],
    subtotal: 0,
    tax: 0,
    serviceFee: 0,
    deliveryFee: 0,
    discount: 0,
    grandTotal: 0,
    participants: [
      {
        id: hostId,
        name: hostName.trim() || 'Host',
        avatarColor: 'from-blue-600 to-indigo-700',
        isOrganizer: true,
        paymentStatus: 'UNPAID',
      },
    ],
    transactions: [],
    createdAt: new Date().toISOString(),
  };
}
