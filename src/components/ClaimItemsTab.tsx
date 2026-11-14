import React, { useState } from 'react';
import { 
  Check, 
  Plus, 
  AlertCircle,
  Utensils,
  Receipt,
  X,
  ArrowLeft
} from 'lucide-react';
import { Room, LineItem, Participant } from '../types';
import { formatMoney } from '../utils/splitMath';

interface ClaimItemsTabProps {
  room: Room;
  currentUser: Participant;
  onToggleClaim: (itemId: string, participantId: string) => void;
  onAddItem: (item: Partial<LineItem>) => void;
  onBackToHome?: () => void;
}

export const ClaimItemsTab: React.FC<ClaimItemsTabProps> = ({
  room,
  currentUser,
  onToggleClaim,
  onAddItem,
  onBackToHome,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'MINE' | 'UNCLAIMED'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);

  const currencySymbol = room.currencySymbol || (room.currency === 'NGN' ? '₦' : room.currency === 'EUR' ? '€' : room.currency === 'GBP' ? '£' : room.currency === 'JPY' ? '¥' : '$');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;
    const unitPrice = parseFloat(newItemPrice) || 0;
    const qty = Math.max(1, newItemQuantity);
    const totalPrice = unitPrice * qty;
    onAddItem({
      cleanName: newItemName.trim(),
      rawName: newItemName.trim(),
      quantity: qty,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      claimedBy: [currentUser.id],
    });
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQuantity(1);
    setShowAddModal(false);
  };

  const filteredItems = room.items.filter((item) => {
    if (filter === 'MINE') return (item.claimedBy || []).includes(currentUser.id);
    if (filter === 'UNCLAIMED') return (item.claimedBy || []).length === 0;
    return true;
  });

  return (
    <div className="space-y-3 pb-28 text-[#0B2B16] font-sans">
      
      {/* Subpage Header with Back to Home & Add Item */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        {onBackToHome ? (
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0B2B16] transition-colors cursor-pointer py-1 px-2 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#0B2B16]">Claim Items</span>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-full bg-[#0B2B16] hover:bg-[#154625] text-[#B4F32D] px-3 py-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
          >
            <Plus className="h-3 w-3 stroke-[2.5]" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills (Modeled after Screen 2) */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setFilter('ALL')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-[#0B2B16] text-[#B4F32D] shadow-xs'
                : 'bg-[#F2FCE2] text-[#0B2B16] hover:bg-[#E4F8CC]'
            }`}
          >
            All ({room.items.length})
          </button>
          <button
            onClick={() => setFilter('MINE')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              filter === 'MINE'
                ? 'bg-[#0B2B16] text-[#B4F32D] shadow-xs'
                : 'bg-[#F2FCE2] text-[#0B2B16] hover:bg-[#E4F8CC]'
            }`}
          >
            My Share
          </button>
          <button
            onClick={() => setFilter('UNCLAIMED')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              filter === 'UNCLAIMED'
                ? 'bg-[#0B2B16] text-[#B4F32D] shadow-xs'
                : 'bg-[#F2FCE2] text-[#0B2B16] hover:bg-[#E4F8CC]'
            }`}
          >
            Unclaimed
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-xs text-[#0B2B16] font-bold hover:underline shrink-0 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Item List (Modeled after "Recent Transactions" in Screen 2) */}
      <div className="space-y-2.5 pt-1">
        {room.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#DDF3BA] bg-[#F8FAF6] p-7 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ECFDC5] text-[#0B2B16]">
              <Utensils className="h-6 w-6 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#0B2B16]">No Items Added Yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Add what you and your friends ordered so everyone can claim their exact portion.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0B2B16] hover:bg-[#051F10] px-5 py-2.5 text-xs font-bold text-[#B4F32D] shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add First Item</span>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-xs text-slate-500">
            No items matching this filter.
          </div>
        ) : (
          filteredItems.map((item) => {
            const claimers = item.claimedBy || [];
            const isClaimedByMe = claimers.includes(currentUser.id);
            const claimCount = claimers.length;
            const sharePrice = claimCount > 0 ? item.totalPrice / claimCount : item.totalPrice;

            return (
              <div
                key={item.id}
                onClick={() => onToggleClaim(item.id, currentUser.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isClaimedByMe
                    ? 'bg-[#F4FDE5] border-[#B4F32D] shadow-soft ring-1 ring-[#B4F32D]'
                    : 'bg-white border-slate-100 hover:border-slate-200 shadow-soft'
                }`}
              >
                {/* Left Icon + Description */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                      isClaimedByMe
                        ? 'bg-[#0B2B16] text-[#B4F32D] shadow-xs'
                        : 'bg-[#F2FCE2] text-[#0B2B16]'
                    }`}
                  >
                    {isClaimedByMe ? (
                      <Check className="h-5 w-5 stroke-[2.5]" />
                    ) : (
                      <Utensils className="h-4 w-4 stroke-[2]" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-[#0B2B16] leading-tight">
                        {item.cleanName}
                      </h4>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-slate-400">×{item.quantity}</span>
                      )}
                    </div>

                    {/* Claim Status Label */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      {claimCount === 0 ? (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Tap to claim
                        </span>
                      ) : claimCount === 1 ? (
                        <span className="text-slate-600 font-medium">
                          Claimed by {room.participants.find(p => p.id === claimers[0])?.name || '1 person'}
                        </span>
                      ) : (
                        <span className="text-[#0B2B16] font-semibold">
                          Split {claimCount} ways ({formatMoney(sharePrice, room.currency)} each)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Price */}
                <div className="text-right shrink-0">
                  <p className="text-xs sm:text-sm font-bold text-[#0B2B16] font-sans">
                    {formatMoney(item.totalPrice, room.currency)}
                  </p>
                  {isClaimedByMe && claimCount > 1 && (
                    <p className="text-[10px] font-bold text-[#0B2B16]">
                      Your share: {formatMoney(sharePrice, room.currency)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-[#0B2B16]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B4F32D] text-[#0B2B16] text-[11px] font-black">+</span>
                <h3 className="text-sm font-bold text-[#0B2B16]">Add Bill Item to Room</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="h-7 w-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Ordered extra drinks or pepper soup mid-meal? Add it to this active split room so friends can claim it.
            </p>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#0B2B16]">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapman Cocktail, Suya Platter, Extra Rice"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-[#F8FAF6] px-4 py-3 text-xs text-[#0B2B16] focus:border-[#0B2B16] focus:bg-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Quantity / Pieces Stepper */}
                <div>
                  <label className="text-xs font-semibold text-[#0B2B16]">Quantity / Pieces</label>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#F8FAF6] px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setNewItemQuantity(Math.max(1, newItemQuantity - 1))}
                      className="h-7 w-7 rounded-xl bg-white text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center shadow-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-[#0B2B16]">{newItemQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setNewItemQuantity(newItemQuantity + 1)}
                      className="h-7 w-7 rounded-xl bg-white text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center shadow-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price per item */}
                <div>
                  <label className="text-xs font-semibold text-[#0B2B16]">
                    Unit Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 2500"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-[#F8FAF6] px-4 py-2.5 text-xs text-[#0B2B16] focus:border-[#0B2B16] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Calculation Badge */}
              {newItemPrice && parseFloat(newItemPrice) > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-[#F2FCE2] px-3 py-2 text-xs font-bold text-[#0B2B16]">
                  <span>Total for {newItemQuantity} item{newItemQuantity > 1 ? 's' : ''}:</span>
                  <span className="text-sm font-black text-[#0B2B16]">
                    {currencySymbol}{(parseFloat(newItemPrice) * newItemQuantity).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0B2B16] text-[#B4F32D] px-5 py-2 text-xs font-bold hover:bg-[#051F10] cursor-pointer shadow-sm"
                >
                  Add & Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
