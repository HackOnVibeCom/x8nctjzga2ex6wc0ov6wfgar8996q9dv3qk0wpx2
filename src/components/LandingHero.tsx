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
  Camera
} from 'lucide-react';
import { Currency, Room } from '../types';
import { getCurrencySymbol } from '../utils/splitMath';

interface LandingHeroProps {
  onLoadSample: (currency: 'USD' | 'EUR' | 'JPY') => void;
  onCreateRoom: (roomData: Partial<Room>) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onLoadSample,
  onCreateRoom,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [organizerName, setOrganizerName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [rawItemsText, setRawItemsText] = useState('');
  const [taxPercent, setTaxPercent] = useState('8.875');
  const [serviceFeePercent, setServiceFeePercent] = useState('18.0');

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    buildRoom(quickTitle || 'Dinner with Friends');
  };

  const handleSimulateScanReceipt = () => {
    setQuickTitle('SoHo Trattoria & Wine Bar');
    setOrganizerName('Alex');
    setBankName('PayPal / Revolut');
    setAccountNumber('paypal.me/alexsplits');
    setRawItemsText(
      `Truffle Burrata - 24.00\nWood-Fired Margherita Pizza - 28.00\nPrime Dry-Aged Tagliata - 72.00\nChianti Classico Riserva - 85.00\nValrhona Tiramisu x2 - 18.00`
    );
    setShowSetup(true);
  };

  const buildRoom = (titleToUse: string) => {
    const isZeroDecimal = currency === 'JPY';
    const lines = rawItemsText.split('\n').filter((l) => l.trim().length > 0);
    const parsedItems = lines.map((line, idx) => {
      const match = line.match(/^(.*?)[-–:\s]+([0-9.,]+)$/);
      if (match) {
        const name = match[1].trim();
        const price = parseFloat(match[2].replace(/,/g, '')) || 25;
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
        rawName: line.trim(),
        cleanName: line.trim(),
        quantity: 1,
        unitPrice: isZeroDecimal ? 2000 : 20,
        totalPrice: isZeroDecimal ? 2000 : 20,
        claimedBy: [],
      };
    });

    const items = parsedItems.length > 0 ? parsedItems : [
      {
        id: `item-1`,
        rawName: 'PRIME DRY-AGED T-BONE',
        cleanName: 'Prime Dry-Aged T-Bone Steak 24oz',
        quantity: 1,
        unitPrice: isZeroDecimal ? 8500 : 84.0,
        totalPrice: isZeroDecimal ? 8500 : 84.0,
        claimedBy: [],
      },
      {
        id: `item-2`,
        rawName: 'PAN-SEARED CHILEAN SEABASS',
        cleanName: 'Pan-Seared Chilean Seabass',
        quantity: 1,
        unitPrice: isZeroDecimal ? 4500 : 46.0,
        totalPrice: isZeroDecimal ? 4500 : 46.0,
        claimedBy: [],
      },
      {
        id: `item-3`,
        rawName: 'NAPA CABERNET BOTTLE',
        cleanName: 'Napa Valley Cabernet Sauvignon',
        quantity: 1,
        unitPrice: isZeroDecimal ? 9500 : 95.0,
        totalPrice: isZeroDecimal ? 9500 : 95.0,
        claimedBy: [],
      },
    ];

    const subtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
    const tax = Math.round(subtotal * (parseFloat(taxPercent) || 0)) / 100;
    const serviceFee = Math.round(subtotal * (parseFloat(serviceFeePercent) || 0)) / 100;
    const grandTotal = isZeroDecimal ? Math.round(subtotal + tax + serviceFee) : Math.round((subtotal + tax + serviceFee) * 100) / 100;

    const organizerId = `user-${Date.now()}`;
    const newRoom: Partial<Room> = {
      id: `room-${Math.random().toString(36).substring(2, 9)}`,
      title: titleToUse,
      currency,
      currencySymbol: getCurrencySymbol(currency),
      organizer: {
        id: organizerId,
        name: organizerName || 'Host',
        payout: {
          bankName: bankName || 'PayPal / Revolut',
          accountNumber: accountNumber || 'paypal.me/host',
          accountName: organizerName || 'Organizer',
        },
      },
      items,
      subtotal,
      tax,
      serviceFee,
      deliveryFee: 0,
      discount: 0,
      grandTotal,
      participants: [
        {
          id: organizerId,
          name: organizerName || 'Host',
          avatarColor: 'from-blue-600 to-indigo-700',
          isOrganizer: true,
          paymentStatus: 'VERIFIED',
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
      <div className="px-5 pt-7 pb-8 text-white space-y-4">
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
            Snap any bill. Share one live link where friends tap their items in real time, and verify payment transfer screenshots with client-side pixel forensics.
          </p>
        </div>

        {/* 3 Instant Demo Rooms for Judges */}
        <div className="pt-2 space-y-2">
          <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Test Live International Demos (1-Click)
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onLoadSample('USD')}
              className="rounded-2xl bg-white/10 hover:bg-white/20 p-2.5 text-center transition-colors cursor-pointer border border-white/5"
            >
              <span className="text-base block">🇺🇸</span>
              <span className="text-xs font-medium text-white block mt-0.5">USD ($)</span>
              <span className="text-[10px] text-slate-300 block">SoHo NYC</span>
            </button>

            <button
              onClick={() => onLoadSample('EUR')}
              className="rounded-2xl bg-white/10 hover:bg-white/20 p-2.5 text-center transition-colors cursor-pointer border border-white/5"
            >
              <span className="text-base block">🇪🇺</span>
              <span className="text-xs font-medium text-white block mt-0.5">EUR (€)</span>
              <span className="text-[10px] text-slate-300 block">Berlin</span>
            </button>

            <button
              onClick={() => onLoadSample('JPY')}
              className="rounded-2xl bg-white/10 hover:bg-white/20 p-2.5 text-center transition-colors cursor-pointer border border-white/5"
            >
              <span className="text-base block">🇯🇵</span>
              <span className="text-xs font-medium text-white block mt-0.5">JPY (¥)</span>
              <span className="text-[10px] text-slate-300 block">Tokyo</span>
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-semibold text-white shadow-blue-btn transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showSetup ? 'Hide Custom Setup' : 'Create Custom Bill'}</span>
            </button>
            <button
              onClick={handleSimulateScanReceipt}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/15 px-3.5 py-3 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              title="Simulate scanning a bill"
            >
              <Camera className="h-3.5 w-3.5 text-blue-400" />
              <span>Auto-Fill Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Crisp White Card Sheet */}
      <div className="flex-1 rounded-t-[32px] bg-white px-5 pt-6 pb-20 shadow-card text-slate-900 space-y-5">
        {/* Expandable Custom Form */}
        {showSetup ? (
          <form onSubmit={handleQuickCreate} className="space-y-3.5">
            <h3 className="text-sm font-semibold text-slate-900">Create a New Split Room</h3>
            
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Bill or Event Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Saturday Rooftop Brunch"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD (CA$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="BRL">BRL (R$)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">Host Display Name</label>
                <input
                  type="text"
                  placeholder="Your Name (Host)"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">Payment Rail</label>
                <input
                  type="text"
                  placeholder="e.g. PayPal, Revolut, CashApp, IBAN"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">Handle or Link</label>
                <input
                  type="text"
                  placeholder="e.g. paypal.me/alex"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">
                Line Items & Prices (1 per line: "Item - Price")
              </label>
              <textarea
                rows={3}
                placeholder="Truffle Pizza - 28.00&#10;Crispy Calamari - 19.50&#10;Pinot Noir Bottle - 65.00"
                value={rawItemsText}
                onChange={(e) => setRawItemsText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">Tax (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">Gratuity / Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={serviceFeePercent}
                  onChange={(e) => setServiceFeePercent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-semibold text-white shadow-blue-btn transition-colors cursor-pointer"
            >
              Generate Live Room URL
            </button>
          </form>
        ) : (
          /* 3 Core Value Pillars */
          <div className="space-y-3.5">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Zero-Signup Multiplayer</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Anyone who receives your link joins in 1 second. Each friend simply taps what they ordered.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Proportional Tax & Tip Math</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Tax, tips, and delivery fees are distributed mathematically according to each person's exact percentage of the bill.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Scan className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Client-Side ELA Pixel Forensics</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Detects edited digits and manipulated font layers in bank transfer receipts without uploading to external servers.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
