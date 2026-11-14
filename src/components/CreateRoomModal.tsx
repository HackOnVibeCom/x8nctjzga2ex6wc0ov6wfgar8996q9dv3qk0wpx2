import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  Building2, 
  Zap, 
  Sparkles,
  UtensilsCrossed,
  ArrowRight
} from 'lucide-react';
import { Currency, LineItem, Room } from '../types';
import { getCurrencySymbol, formatMoney } from '../utils/splitMath';
import { SUPPORTED_BANKS, resolveBankAccount } from '../utils/bankResolver';
import { createRoomStellarVault } from '../services/pollarStellar';

export interface DraftItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: Partial<Room>) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [organizerName, setOrganizerName] = useState(() => {
    return localStorage.getItem('ipin_user_name') || '';
  });

  // Payout / Bank Resolution
  const [vendorName, setVendorName] = useState('');
  const [bankName, setBankName] = useState('OPay Digital Services');
  const [accountNumber, setAccountNumber] = useState('');
  const [vendorAccountName, setVendorAccountName] = useState('');
  const [isResolvingBank, setIsResolvingBank] = useState(false);
  const [isBankVerified, setIsBankVerified] = useState(false);

  // Dynamic Item Builder (Pieces, Price, Deletion)
  const [items, setItems] = useState<DraftItem[]>([
    { id: 'item-1', name: 'Amala & Gbegiri/Ewedu', quantity: 2, unitPrice: 2500 },
    { id: 'item-2', name: 'Ogunfe (Goat Meat)', quantity: 3, unitPrice: 1500 },
    { id: 'item-3', name: 'Special Chapman Drink', quantity: 2, unitPrice: 2000 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-resolve account name when account number reaches 10 digits
  useEffect(() => {
    const clean = accountNumber.trim().replace(/\s+/g, '');
    if (clean.length >= 10) {
      let isCancelled = false;
      setIsResolvingBank(true);
      resolveBankAccount(bankName, clean, vendorName).then((res) => {
        if (!isCancelled) {
          setIsResolvingBank(false);
          if (res.isVerified) {
            setVendorAccountName(res.accountName);
            setIsBankVerified(true);
          }
        }
      });
      return () => {
        isCancelled = true;
      };
    } else {
      setIsBankVerified(false);
    }
  }, [accountNumber, bankName, vendorName]);

  if (!isOpen) return null;

  // Item Builder handlers
  const handleAddItemRow = () => {
    const newItem: DraftItem = {
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      quantity: 1,
      unitPrice: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof DraftItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      setItems([{ id: `draft-${Date.now()}`, name: '', quantity: 1, unitPrice: 0 }]);
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleStepQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const nextQty = Math.max(1, it.quantity + delta);
          return { ...it, quantity: nextQty };
        }
        return it;
      })
    );
  };

  // Quick Preset Handlers
  const loadNaijaChowPreset = () => {
    setQuickTitle('Iya Said Alamala Hangout');
    setCurrency('NGN');
    if (!organizerName) setOrganizerName('Ibrahim');
    setVendorName('Iya Said Alamala');
    setBankName('OPay Digital Services');
    setAccountNumber('9136447931');
    setVendorAccountName('IBRAHIM S. (OPAY)');
    setIsBankVerified(true);
    setItems([
      { id: 'it-1', name: 'Amala with Abula (Gbegiri & Ewedu)', quantity: 3, unitPrice: 2500 },
      { id: 'it-2', name: 'Ogunfe (Spicy Goat Meat)', quantity: 4, unitPrice: 2000 },
      { id: 'it-3', name: 'Chilled Malt & Chapman', quantity: 3, unitPrice: 1500 },
    ]);
  };

  const loadItalianDinnerPreset = () => {
    setQuickTitle('Bistro Italian Dinner');
    setCurrency('USD');
    if (!organizerName) setOrganizerName('Alex');
    setVendorName('Bistro Cucina');
    setBankName('JPMorgan Chase (USD / ACH)');
    setAccountNumber('4019283746');
    setVendorAccountName('BISTRO CUCINA LLC');
    setIsBankVerified(true);
    setItems([
      { id: 'it-1', name: 'Truffle Tagliatelle', quantity: 2, unitPrice: 24.0 },
      { id: 'it-2', name: 'Woodfired Margherita Pizza', quantity: 2, unitPrice: 18.5 },
      { id: 'it-3', name: 'Barolo Red Wine Bottle', quantity: 1, unitPrice: 38.0 },
      { id: 'it-4', name: 'Classic Tiramisu', quantity: 2, unitPrice: 12.0 },
    ]);
  };

  const loadIzakayaPreset = () => {
    setQuickTitle('Shinjuku Izakaya Night');
    setCurrency('JPY');
    if (!organizerName) setOrganizerName('Kenji');
    setVendorName('Izakaya Shinjuku');
    setBankName('Direct Stellar Web3 Wallet (USDC)');
    setAccountNumber('GD3EP2FQ5EQQQYTFPRBODQ5UUVC35RCFCFZ3TFFGUVRHQBPBWJYZPEXZ');
    setVendorAccountName('IZAKAYA SHINJUKU KK');
    setIsBankVerified(true);
    setItems([
      { id: 'it-1', name: 'Yakitori Skewer Platter', quantity: 2, unitPrice: 2400 },
      { id: 'it-2', name: 'Assorted Sashimi Combo', quantity: 1, unitPrice: 2800 },
      { id: 'it-3', name: 'Junmai Daiginjo Sake', quantity: 1, unitPrice: 3500 },
      { id: 'it-4', name: 'Matcha Gelato', quantity: 2, unitPrice: 1200 },
    ]);
  };

  // Subtotal Calculation
  const subtotal = items.reduce((acc, it) => acc + (it.quantity * (Number(it.unitPrice) || 0)), 0);
  const isZeroDecimal = currency === 'JPY';
  const grandTotal = isZeroDecimal ? Math.round(subtotal) : Math.round(subtotal * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const hostDisplayName = organizerName.trim() || 'Host';
    const organizerId = `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Prepare LineItems
    const parsedLineItems: LineItem[] = items
      .filter((it) => it.name.trim().length > 0 || it.unitPrice > 0)
      .map((it, idx) => {
        const uPrice = Number(it.unitPrice) || 0;
        const tPrice = isZeroDecimal 
          ? Math.round(it.quantity * uPrice) 
          : Math.round(it.quantity * uPrice * 100) / 100;
        return {
          id: `item-${Date.now()}-${idx}`,
          rawName: it.name.trim() || `Item #${idx + 1}`,
          cleanName: it.name.trim() || `Item #${idx + 1}`,
          quantity: it.quantity,
          unitPrice: uPrice,
          totalPrice: tPrice,
          claimedBy: [],
        };
      });

    const finalSubtotal = parsedLineItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const finalGrandTotal = isZeroDecimal ? Math.round(finalSubtotal) : Math.round(finalSubtotal * 100) / 100;

    // Dedicated Stellar Testnet Vault
    const resolvedVendor = vendorName.trim() || quickTitle.trim() || 'Restaurant / Vendor';
    const resolvedBank = bankName.trim() || 'OPay Digital Services';
    const resolvedAccount = accountNumber.trim() || '9136447931';
    const resolvedName = vendorAccountName.trim() || resolvedVendor;

    const stellarVault = createRoomStellarVault({
      vendorName: resolvedVendor,
      bankName: resolvedBank,
      accountNumber: resolvedAccount,
      accountName: resolvedName,
    });

    const newRoom: Partial<Room> = {
      id: `room-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
      title: quickTitle.trim() || 'New Hangout Split',
      currency,
      currencySymbol: getCurrencySymbol(currency),
      organizer: {
        id: organizerId,
        name: hostDisplayName,
        payout: {
          bankName: resolvedBank,
          accountNumber: resolvedAccount,
          accountName: resolvedName,
        },
      },
      items: parsedLineItems,
      subtotal: finalSubtotal,
      tax: 0,
      serviceFee: 0,
      deliveryFee: 0,
      discount: 0,
      grandTotal: finalGrandTotal,
      participants: [
        {
          id: organizerId,
          name: hostDisplayName,
          avatarColor: 'from-emerald-600 to-green-700',
          isOrganizer: true,
          paymentStatus: 'UNPAID',
        },
      ],
      transactions: [],
      createdAt: new Date().toISOString(),
      stellarVault,
    };

    localStorage.setItem('ipin_user_name', hostDisplayName);
    onCreateRoom(newRoom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="w-full max-w-md rounded-[28px] bg-white text-[#0B2B16] shadow-2xl relative my-auto border border-slate-200 overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="bg-[#0B2B16] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#B4F32D] text-[#0B2B16] flex items-center justify-center font-bold">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Create New Split Bill</h3>
              <p className="text-[10px] text-slate-300">Zero-risk escrow pool • Off-ramp to restaurant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* Quick Presets for Demo */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              1-Tap Quick Fill Presets
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={loadNaijaChowPreset}
                className="rounded-full bg-[#F2FCE2] hover:bg-[#E4F8CC] border border-[#DDF3BA] text-[#0B2B16] px-2.5 py-1 text-[10px] font-bold cursor-pointer shrink-0 transition-all active:scale-95 flex items-center gap-1"
              >
                <span>🇳🇬</span>
                <span>+ Sample Naija Chow</span>
              </button>
              <button
                type="button"
                onClick={loadItalianDinnerPreset}
                className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0B2B16] px-2.5 py-1 text-[10px] font-bold cursor-pointer shrink-0 transition-all active:scale-95 flex items-center gap-1"
              >
                <span>🇺🇸</span>
                <span>+ Sample Dinner</span>
              </button>
              <button
                type="button"
                onClick={loadIzakayaPreset}
                className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#0B2B16] px-2.5 py-1 text-[10px] font-bold cursor-pointer shrink-0 transition-all active:scale-95 flex items-center gap-1"
              >
                <span>🇯🇵</span>
                <span>+ Sample Izakaya (¥)</span>
              </button>
            </div>
          </div>

          {/* Hangout Title & Currency */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Bill / Hangout Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Iya Said Alamala / Friday Hangout"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAF6] px-3 py-2 text-xs text-[#0B2B16] focus:border-[#0B2B16] focus:bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAF6] px-2.5 py-2 text-xs font-bold text-[#0B2B16] focus:border-[#0B2B16] focus:bg-white focus:outline-none"
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
          </div>

          {/* Host Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Your Name (Host)</label>
            <input
              type="text"
              required
              placeholder="e.g. Ibrahim / Alex"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAF6] px-3 py-2 text-xs text-[#0B2B16] focus:border-[#0B2B16] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Section: Auto-Resolving Restaurant Payout Bank */}
          <div className="rounded-2xl bg-[#F2FCE2] border border-[#DDF3BA] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B2B16] flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#0B2B16]" />
                <span>Where Money Lands (Restaurant / Vendor Account)</span>
              </span>
              <span className="text-[9px] font-bold bg-[#0B2B16] text-[#B4F32D] px-2 py-0.5 rounded-full">
                Pollar Off-Ramp
              </span>
            </div>
            <p className="text-[10px] text-slate-600 leading-tight">
              Pooled funds will be automatically off-ramped to this account. You never have to front money from your personal pocket!
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#0B2B16]">
                Restaurant / Vendor Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Iya Said Alamala Foods, SoHo Bistro, KFC"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#0B2B16] focus:border-[#0B2B16] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#0B2B16]">
                  Destination Bank <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-[#0B2B16] focus:border-[#0B2B16] focus:outline-none truncate"
                >
                  {SUPPORTED_BANKS.map((b) => (
                    <option key={b.code} value={b.name}>
                      {b.flag} {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#0B2B16]">
                    Account / IBAN # <span className="text-rose-500">*</span>
                  </label>
                  {isResolvingBank && (
                    <span className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      Resolving...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9136447931"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-[#0B2B16] focus:border-[#0B2B16] focus:outline-none"
                />
              </div>
            </div>

            {/* Auto-Loaded Verified Account Name Banner */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#0B2B16]">
                  Account Holder Name
                </label>
                {isBankVerified && (
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                    <span>Auto-Verified with Bank</span>
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Auto-resolving from account number..."
                value={vendorAccountName}
                onChange={(e) => {
                  setVendorAccountName(e.target.value);
                  setIsBankVerified(false);
                }}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                  isBankVerified 
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900' 
                    : 'border-slate-200 bg-white text-[#0B2B16]'
                } focus:outline-none`}
              />
            </div>
          </div>

          {/* Section: Interactive Item Builder (Pieces, Price, Add & Delete) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-extrabold text-[#0B2B16] flex items-center gap-1">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-slate-600" />
                  <span>Line Items & Dishes ({items.length})</span>
                </label>
                <p className="text-[10px] text-slate-500">Set pieces & price for each food or drink</p>
              </div>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1 bg-[#0B2B16] hover:bg-[#051F10] text-[#B4F32D] rounded-full px-2.5 py-1 text-[11px] font-bold transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add Item</span>
              </button>
            </div>

            {/* List of Item Rows */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const rowTotal = item.quantity * (Number(item.unitPrice) || 0);
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-2xl bg-[#F8FAF6] border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 w-4 text-center">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Amala, Pizza, Cocktails"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#0B2B16] font-medium focus:border-[#0B2B16] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pl-6">
                      {/* Pieces Stepper */}
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5">
                        <span className="text-[10px] text-slate-400 font-semibold mr-1">Pieces:</span>
                        <button
                          type="button"
                          onClick={() => handleStepQuantity(item.id, -1)}
                          className="h-5 w-5 rounded bg-slate-100 hover:bg-slate-200 text-[#0B2B16] font-bold flex items-center justify-center text-xs cursor-pointer active:scale-95"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleStepQuantity(item.id, 1)}
                          className="h-5 w-5 rounded bg-slate-100 hover:bg-slate-200 text-[#0B2B16] font-bold flex items-center justify-center text-xs cursor-pointer active:scale-95"
                        >
                          +
                        </button>
                      </div>

                      {/* Unit Price Input */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">@ {getCurrencySymbol(currency)}</span>
                        <input
                          type="number"
                          step={isZeroDecimal ? '1' : '0.01'}
                          placeholder="Price"
                          value={item.unitPrice || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-right font-mono font-bold text-[#0B2B16] focus:outline-none"
                        />
                      </div>

                      {/* Line Total */}
                      <div className="text-right font-mono font-extrabold text-xs text-[#0B2B16]">
                        {formatMoney(rowTotal, currency)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtotal Banner */}
            <div className="flex justify-between items-center rounded-xl bg-[#0B2B16] text-white px-3.5 py-2 text-xs">
              <span className="font-bold">Total Bill Estimate:</span>
              <span className="font-mono text-sm font-black text-[#B4F32D]">
                {formatMoney(grandTotal, currency)}
              </span>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#0B2B16] hover:bg-[#051F10] text-[#B4F32D] font-extrabold text-xs sm:text-sm py-3.5 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            <span>Launch Bill & Deploy Stellar Vault</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
