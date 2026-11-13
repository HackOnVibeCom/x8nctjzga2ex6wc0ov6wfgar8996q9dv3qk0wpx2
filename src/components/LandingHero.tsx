import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Users, 
  Scan, 
  ShieldCheck, 
  Receipt,
  Plus
} from 'lucide-react';
import { Currency, Room } from '../types';

interface LandingHeroProps {
  onLoadSample: (currency: 'USD' | 'EUR') => void;
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
    buildRoom(quickTitle || 'Friday Dinner');
  };

  const buildRoom = (titleToUse: string) => {
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
          unitPrice: price,
          totalPrice: price,
          claimedBy: [],
        };
      }
      return {
        id: `item-${Date.now()}-${idx}`,
        rawName: line.trim(),
        cleanName: line.trim(),
        quantity: 1,
        unitPrice: 20,
        totalPrice: 20,
        claimedBy: [],
      };
    });

    const items = parsedItems.length > 0 ? parsedItems : [
      {
        id: `item-1`,
        rawName: 'PRIME DRY-AGED T-BONE',
        cleanName: 'Prime Dry-Aged T-Bone Steak 24oz',
        quantity: 1,
        unitPrice: 84.0,
        totalPrice: 84.0,
        claimedBy: [],
      },
      {
        id: `item-2`,
        rawName: 'PAN-SEARED CHILEAN SEABASS',
        cleanName: 'Pan-Seared Chilean Seabass',
        quantity: 1,
        unitPrice: 46.0,
        totalPrice: 46.0,
        claimedBy: [],
      },
      {
        id: `item-3`,
        rawName: 'NAPA CABERNET BOTTLE',
        cleanName: 'Napa Valley Cabernet Sauvignon',
        quantity: 1,
        unitPrice: 95.0,
        totalPrice: 95.0,
        claimedBy: [],
      },
    ];

    const subtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
    const tax = Math.round(subtotal * (parseFloat(taxPercent) || 0)) / 100;
    const serviceFee = Math.round(subtotal * (parseFloat(serviceFeePercent) || 0)) / 100;
    const grandTotal = Math.round((subtotal + tax + serviceFee) * 100) / 100;

    const organizerId = `user-${Date.now()}`;
    const newRoom: Partial<Room> = {
      id: `room-${Math.random().toString(36).substring(2, 9)}`,
      title: titleToUse,
      currency,
      currencySymbol: currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$',
      organizer: {
        id: organizerId,
        name: organizerName || 'Alex',
        payout: {
          bankName: bankName || 'Chase / Zelle',
          accountNumber: accountNumber || 'alex.miller@chase.com',
          accountName: organizerName || 'Alex Miller',
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
          name: organizerName || 'Alex',
          avatarColor: 'from-blue-600 to-indigo-700',
          isOrganizer: true,
          paymentStatus: 'VERIFIED',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    onCreateRoom(newRoom);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#060b24]">
      {/* Top Deep Blue Section (Template 3 Style) */}
      <div className="px-5 pt-8 pb-10 text-white space-y-5">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-normal text-blue-200">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span>Zero-Signup Multiplayer Bill Settlement</span>
        </div>

        {/* Clean, Non-chunky Headline */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-white">
            Smart bill splitting for everyday outings.
          </h1>
          <p className="text-sm text-slate-300 font-normal leading-relaxed">
            Snap any bill. Share one live link where friends tap their items in real time, and verify payment transfer screenshots with client-side pixel forensics.
          </p>
        </div>

        {/* Quick Launch / Action Buttons (Template 3 Screen 1 Style) */}
        <div className="pt-2 space-y-2.5">
          <button
            onClick={() => onLoadSample('USD')}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-5 py-3.5 text-sm font-medium text-white shadow-blue-btn transition-colors cursor-pointer"
          >
            <span>Explore Live Demo ($ USD)</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLoadSample('EUR')}
              className="flex-1 rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-3 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              Berlin Demo (€ EUR)
            </button>
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="flex-1 rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-3 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              {showSetup ? 'Hide Setup' : '+ Create Custom'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Crisp White Card Sheet (Template 3 Signature Element) */}
      <div className="flex-1 rounded-t-[36px] bg-white px-5 pt-7 pb-24 shadow-card text-slate-900 space-y-6">
        {/* Expandable Custom Form */}
        {showSetup ? (
          <form onSubmit={handleQuickCreate} className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Create a New Split Room</h3>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Bill Title</label>
              <input
                type="text"
                required
                placeholder="e.g. SoHo Bistro Dinner"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Host Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Payout Details (Where friends pay)</label>
              <input
                type="text"
                placeholder="Bank or Handle (e.g. Chase / Zelle: alex@chase.com)"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Line Items & Prices (1 per line)</label>
              <textarea
                rows={3}
                placeholder="Truffle Pizza - 32.00&#10;Ribeye Steak - 68.00&#10;Wine Bottle - 75.00"
                value={rawItemsText}
                onChange={(e) => setRawItemsText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-medium text-white shadow-blue-btn transition-colors cursor-pointer"
            >
              Launch Live Split Link
            </button>
          </form>
        ) : (
          /* 3 Clean Minimalist Feature Rows (Template 3 Style) */
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Core Capabilities
            </h3>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-slate-900">Live Item Claiming</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  4–10 friends tap what they ordered. Shared items split equally with proportional sales tax and tip.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Scan className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-slate-900">Client-Side ELA Forensics</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Error Level Analysis inspects compression variance on transfer screenshots to detect edited amounts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-slate-900">Zero-CAC Viral Growth</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Every bill split link naturally brings 5–10 new users who can host their next group outing in 1 tap.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
