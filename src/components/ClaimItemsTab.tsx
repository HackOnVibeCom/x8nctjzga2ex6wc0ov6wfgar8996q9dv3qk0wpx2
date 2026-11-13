import React, { useState } from 'react';
import { 
  Check, 
  Plus, 
  AlertCircle,
  Utensils
} from 'lucide-react';
import { Room, LineItem, Participant } from '../types';
import { formatMoney } from '../utils/splitMath';

interface ClaimItemsTabProps {
  room: Room;
  currentUser: Participant;
  onToggleClaim: (itemId: string, participantId: string) => void;
  onAddItem: (item: Partial<LineItem>) => void;
}

export const ClaimItemsTab: React.FC<ClaimItemsTabProps> = ({
  room,
  currentUser,
  onToggleClaim,
  onAddItem,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'MINE' | 'UNCLAIMED'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;
    const price = parseFloat(newItemPrice) || 0;
    onAddItem({
      cleanName: newItemName.trim(),
      rawName: newItemName.trim(),
      quantity: 1,
      unitPrice: price,
      totalPrice: price,
      claimedBy: [currentUser.id],
    });
    setNewItemName('');
    setNewItemPrice('');
    setShowAddModal(false);
  };

  const filteredItems = room.items.filter((item) => {
    if (filter === 'MINE') return (item.claimedBy || []).includes(currentUser.id);
    if (filter === 'UNCLAIMED') return (item.claimedBy || []).length === 0;
    return true;
  });

  return (
    <div className="space-y-3 pb-28 text-slate-900">
      {/* Category Filter Pills (Template 3 Style) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setFilter('ALL')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({room.items.length})
          </button>
          <button
            onClick={() => setFilter('MINE')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              filter === 'MINE'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            My Share
          </button>
          <button
            onClick={() => setFilter('UNCLAIMED')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              filter === 'UNCLAIMED'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unclaimed
          </button>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline shrink-0 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Item List (Template 3 "Transactions" list style) */}
      <div className="space-y-2 pt-1">
        {room.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Utensils className="h-5 w-5 stroke-[1.8]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-800">No Items Added Yet</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Add what you and your friends ordered to start splitting accurately.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-blue-btn transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
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
                  ? 'bg-blue-50/50 border-blue-200 shadow-soft'
                  : 'bg-white border-slate-100 hover:border-slate-200 shadow-soft'
              }`}
            >
              {/* Left Icon + Description */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isClaimedByMe
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isClaimedByMe ? (
                    <Check className="h-5 w-5 stroke-[2.2]" />
                  ) : (
                    <Utensils className="h-4 w-4 stroke-[1.75]" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-medium text-slate-900 leading-tight">
                      {item.cleanName}
                    </h4>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-slate-400">×{item.quantity}</span>
                    )}
                  </div>

                  {/* Claim Status Label */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    {claimCount === 0 ? (
                      <span className="text-amber-500 font-normal flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Unclaimed
                      </span>
                    ) : claimCount === 1 ? (
                      <span>Claimed by {room.participants.find(p => p.id === claimers[0])?.name || '1 person'}</span>
                    ) : (
                      <span className="text-blue-600 font-normal">
                        Split {claimCount} ways ({formatMoney(sharePrice, room.currency)} each)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Price */}
              <div className="text-right shrink-0">
                <p className="text-xs sm:text-sm font-medium text-slate-900 font-sans">
                  {formatMoney(item.totalPrice, room.currency)}
                </p>
                {isClaimedByMe && claimCount > 1 && (
                  <p className="text-[10px] font-normal text-blue-600">
                    Your share: {formatMoney(sharePrice, room.currency)}
                  </p>
                )}
              </div>
            </div>
          );
        }))}
      </div>

      {/* Add Custom Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl text-slate-900">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Add Bill Item</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add any missed drink, dish, or fee to the bill.
            </p>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Craft Cocktail Pitcher"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  Item Price ({room.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 28.50"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer"
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
