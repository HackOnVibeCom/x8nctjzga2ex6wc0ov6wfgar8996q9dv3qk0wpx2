import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Users, 
  Scan, 
  ShieldCheck, 
  Receipt,
  Plus,
  Globe,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { Currency, Room } from '../types';
import { getCurrencySymbol } from '../utils/splitMath';

interface LandingHeroProps {
  onCreateRoom: (roomData: Partial<Room>) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onCreateRoom,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [organizerName, setOrganizerName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [rawItemsText, setRawItemsText] = useState('');
  const [taxPercent, setTaxPercent] = useState('');
  const [serviceFeePercent, setServiceFeePercent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isZeroDecimal = currency === 'JPY';
    const lines = rawItemsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsedItems = lines.map((line, idx) => {
      const match = line.match(/^(.*?)[-–:\s]+([0-9.,]+)$/);
      if (match) {
        const name = match[1].trim();
        const price = parseFloat(match[2].replace(/,/g, '')) || 0;
        return {
          id: `item-${Date.now()}-${idx}`,
          rawName: name,
          cleanName: name,
          quantity: 1,
          unitPrice: isZeroDecimal ? Math.round(price) : price,
          totalPrice: isZeroDecimal ? Math.round(price) : price,
          claimedBy: [],
        };
      }
      return {
        id: `item-${Date.now()}-${idx}`,
        rawName: line,
        cleanName: line,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        claimedBy: [],
      };
    });

    const subtotal = parsedItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const tax = taxPercent ? Math.round(subtotal * (parseFloat(taxPercent) || 0)) / 100 : 0;
    const serviceFee = serviceFeePercent ? Math.round(subtotal * (parseFloat(serviceFeePercent) || 0)) / 100 : 0;
    const grandTotal = isZeroDecimal 
      ? Math.round(subtotal + tax + serviceFee) 
      : Math.round((subtotal + tax + serviceFee) * 100) / 100;

    const organizerId = `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const hostDisplayName = organizerName.trim() || 'Host';

    const newRoom: Partial<Room> = {
      id: `room-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
      title: quickTitle.trim() || 'New Bill Split',
      currency,
      currencySymbol: getCurrencySymbol(currency),
      organizer: {
        id: organizerId,
        name: hostDisplayName,
        payout: {
          bankName: bankName.trim() || 'Direct Transfer',
          accountNumber: accountNumber.trim() || '',
          accountName: hostDisplayName,
        },
      },
      items: parsedItems,
      subtotal,
      tax,
      serviceFee,
      deliveryFee: 0,
      discount: 0,
      grandTotal,
      participants: [
        {
          id: organizerId,
          name: hostDisplayName,
          avatarColor: 'from-blue-600 to-indigo-700',
          isOrganizer: true,
          paymentStatus: 'UNPAID',
        },
      ],
      transactions: [],
      createdAt: new Date().toISOString(),
    };

    onCreateRoom(newRoom);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#060b24]">
      {/* Top Deep Blue Section */}
      <div className="px-5 pt-8 pb-8 text-white space-y-4 max-w-lg mx-auto w-full">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-normal text-blue-200">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span>Zero-CAC Universal Bill Splitter</span>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-white">
            Smart bill splitting for everyday outings.
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
            Create a live split link in seconds. Friends claim items in real time, math calculates proportional tax and tip, and anti-fraud forensics verifies payment proofs.
          </p>
        </div>
      </div>

      {/* Bottom Clean White Form Sheet */}
      <div className="flex-1 rounded-t-[32px] bg-white px-5 pt-6 pb-20 shadow-card text-slate-900">
        <div className="max-w-lg mx-auto space-y-5">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-600" />
                <span>Create New Split Room</span>
              </h3>
              <span className="text-[11px] text-slate-400">No sign-up required</span>
            </div>

            {/* Bill Title */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">
                Bill / Event Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Friday Dinner, Groceries, Team Lunch"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {/* Currency & Host Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none cursor-pointer transition-all"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="JPY">JPY (¥) - Japanese Yen</option>
                  <option value="CAD">CAD (CA$) - Canadian Dollar</option>
                  <option value="AUD">AUD (A$) - Australian Dollar</option>
                  <option value="NGN">NGN (₦) - Nigerian Naira</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="BRL">BRL (R$) - Brazilian Real</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Your Name (Host) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Your Name"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Payout Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Payment Rail</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Transfer, Revolut, PayPal"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Handle / Account #</label>
                <input
                  type="text"
                  placeholder="e.g. Account number, username"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none font-mono transition-all"
                />
              </div>
            </div>

            {/* Optional Initial Line Items */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-600">
                  Line Items & Prices (Optional - 1 per line)
                </label>
                <span className="text-[10px] text-slate-400">Can also add inside room</span>
              </div>
              <textarea
                rows={3}
                placeholder={"Pasta Carbonara - 18.50\nSparkling Water - 4.00"}
                value={rawItemsText}
                onChange={(e) => setRawItemsText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {/* Tax and Tip % */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Tax (%) Optional</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">Tip / Service Fee (%) Optional</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={serviceFeePercent}
                  onChange={(e) => setServiceFeePercent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 py-3.5 text-xs font-semibold text-white shadow-blue-btn transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{isSubmitting ? 'Creating Room...' : 'Start Split Room'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* 3 Core Value Pillars */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Zero-Signup Multiplayer</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Anyone who opens your link joins instantly. Friends tap what they ordered with real-time sync.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Zero-Drift Penny Balancing</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Taxes, service fees, and shared items split proportionally down to the exact single penny.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Scan className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Pixel Error Level Analysis (ELA)</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Detects digitally altered amounts and pasted text in transfer screenshots right inside your browser.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
