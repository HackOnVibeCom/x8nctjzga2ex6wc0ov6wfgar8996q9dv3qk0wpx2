import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  CreditCard,
  Check,
  Delete,
  ShieldCheck,
  Building2,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Room, Participant, Transaction, Currency } from '../types';
import { formatMoney } from '../utils/splitMath';
import confetti from 'canvas-confetti';

interface TransferKeypadScreenProps {
  room: Room;
  currentUser: Participant;
  recipientUser?: Participant;
  owedAmount: number;
  remainingAmount: number;
  onBack: () => void;
  onCompleteTransfer: (tx: Transaction) => void;
}

export const TransferKeypadScreen: React.FC<TransferKeypadScreenProps> = ({
  room,
  currentUser,
  recipientUser,
  owedAmount,
  remainingAmount,
  onBack,
  onCompleteTransfer,
}) => {
  // Target recipient defaults to room organizer or selected recipient
  const targetRecipient = recipientUser || room.participants.find(p => p.isOrganizer) || room.participants[0];

  // Default amount is remaining amount or owed amount
  const initialAmount = remainingAmount > 0 ? remainingAmount : (owedAmount > 0 ? owedAmount : 25);
  const [amountStr, setAmountStr] = useState<string>(initialAmount.toFixed(2));
  const [selectedMethod, setSelectedMethod] = useState<'CHASE' | 'APPLE_CASH' | 'REVOLUT' | 'VENMO'>('CHASE');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authStep, setAuthStep] = useState('');

  // Handle keypad taps
  const handleKeyTap = (key: string) => {
    if (key === 'BACKSPACE') {
      if (amountStr.length <= 1) {
        setAmountStr('0');
      } else {
        setAmountStr(amountStr.slice(0, -1));
      }
      return;
    }

    if (key === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr(amountStr + '.');
      }
      return;
    }

    // Number keys
    if (amountStr === '0') {
      setAmountStr(key);
    } else {
      // Limit to 2 decimal places
      const parts = amountStr.split('.');
      if (parts.length > 1 && parts[1].length >= 2) {
        return; // Already 2 decimals
      }
      if (amountStr.length < 8) {
        setAmountStr(amountStr + key);
      }
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmountStr(val.toFixed(2));
  };

  const parsedAmount = parseFloat(amountStr) || 0;

  const handleSendMoney = async () => {
    if (parsedAmount <= 0) return;

    setIsAuthorizing(true);
    setAuthStep('Authenticating payment biometric...');
    await new Promise((r) => setTimeout(r, 500));

    setAuthStep(`Sending via ${selectedMethod === 'CHASE' ? 'Chase QuickPay / Zelle' : selectedMethod === 'APPLE_CASH' ? 'Apple Cash' : selectedMethod === 'REVOLUT' ? 'Revolut Instant' : 'Venmo'}...`);
    await new Promise((r) => setTimeout(r, 600));

    setAuthStep('Settling group ledger & generating verified slip...');
    await new Promise((r) => setTimeout(r, 450));

    const refId = `IPIN-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      recipientName: targetRecipient.name,
      amount: parsedAmount,
      currency: room.currency,
      method: 'DIRECT_TRANSFER',
      referenceId: refId,
      timestamp: 'Just now',
      status: 'COMPLETED',
      notes: `Direct P2P transfer sent to ${room.organizer.payout.bankName} (${room.organizer.payout.accountNumber})`,
    };

    setIsAuthorizing(false);
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
    onCompleteTransfer(newTx);
  };

  return (
    <div className="min-h-full flex flex-col bg-white text-slate-900 pb-8">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-semibold text-slate-900">Send Money</h2>
          <p className="text-[10px] text-slate-400">Zero-Fee P2P Transfer</p>
        </div>
        <div className="w-9" /> {/* spacer */}
      </div>

      <div className="flex-1 px-4 sm:px-6 py-4 flex flex-col justify-between max-w-sm mx-auto w-full">
        {/* Recipient Card (Template 3 Style) */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm shadow-xs">
              {targetRecipient.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-semibold text-slate-900">
                  {targetRecipient.name}
                </span>
                {targetRecipient.isOrganizer && (
                  <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">
                    Host / Collector
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {room.organizer.payout.accountNumber}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-medium text-slate-400 block">Bank Rail</span>
            <span className="text-[11px] font-medium text-slate-700">{room.organizer.payout.bankName}</span>
          </div>
        </div>

        {/* Enter Amount Display (Template 3 Style) */}
        <div className="text-center py-6">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
            Enter Amount
          </p>
          <div className="flex items-center justify-center font-sans tracking-tight">
            <span className="text-2xl sm:text-3xl font-light text-slate-400 mr-1">
              {room.currencySymbol}
            </span>
            <span className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              {amountStr}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            $0 Transfer Commission • Instant Settlement
          </p>

          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {remainingAmount > 0 && (
              <button
                onClick={() => handleQuickAmount(remainingAmount)}
                className="rounded-full bg-blue-50 border border-blue-200/80 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                Exact Share ({formatMoney(remainingAmount, room.currency)})
              </button>
            )}
            <button
              onClick={() => handleQuickAmount(20)}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              $20
            </button>
            <button
              onClick={() => handleQuickAmount(50)}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              $50
            </button>
          </div>
        </div>

        {/* Payment Rail Card Selector */}
        <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-soft mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {selectedMethod === 'CHASE' ? 'Chase QuickPay / Zelle' : selectedMethod === 'APPLE_CASH' ? 'Apple Cash Balance' : selectedMethod === 'REVOLUT' ? 'Revolut Instant' : 'Venmo'}
                </p>
                <p className="text-[10px] text-slate-400">Available: $2,450.00 • Instant</p>
              </div>
            </div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as any)}
              className="bg-slate-800 text-white text-[11px] rounded-lg px-2 py-1 border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="CHASE">Chase Zelle</option>
              <option value="APPLE_CASH">Apple Cash</option>
              <option value="REVOLUT">Revolut</option>
              <option value="VENMO">Venmo</option>
            </select>
          </div>
        </div>

        {/* Send Action Button */}
        <button
          onClick={handleSendMoney}
          disabled={isAuthorizing || parsedAmount <= 0}
          className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3.5 text-sm font-semibold shadow-blue-btn transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mb-5"
        >
          {isAuthorizing ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-xs">{authStep}</span>
            </div>
          ) : (
            <>
              <span>Send {formatMoney(parsedAmount, room.currency)}</span>
              <Sparkles className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Numeric Keypad (Template 3 Style) */}
        <div className="grid grid-cols-3 gap-2 pb-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACKSPACE'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKeyTap(key)}
              className="flex h-12 items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 text-lg font-medium transition-colors cursor-pointer select-none"
            >
              {key === 'BACKSPACE' ? (
                <Delete className="h-5 w-5 text-slate-500" />
              ) : (
                key
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

