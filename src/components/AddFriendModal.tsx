import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  UserPlus, 
  Check, 
  Share2, 
  MessageCircle, 
  Phone, 
  Users, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';
import { Participant } from '../types';
import { searchRegisteredUsers, RegisteredUser } from '../services/supabase';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomTitle: string;
  existingParticipants: Participant[];
  onAddParticipant: (name: string, phoneOrHandle?: string) => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomTitle,
  existingParticipants,
  onAddParticipant,
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RegisteredUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [manualName, setManualName] = useState('');

  // Search registered users from Supabase directory
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchRegisteredUsers(query.trim());
      setSearchResults(results);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const roomUrl = `${window.location.origin}/claim?r=${roomId}`;

  const handleShareWhatsApp = () => {
    const text = `Hey! I'm splitting the bill for "${roomTitle}" on IPIN. Claim your items and settle here: ${roomUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddFoundUser = (user: RegisteredUser) => {
    onAddParticipant(user.name, user.phone || user.handle);
    onClose();
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    onAddParticipant(manualName.trim(), query.trim() || undefined);
    setManualName('');
    onClose();
  };

  const isUserAlreadyInRoom = (name: string) => {
    return existingParticipants.some(
      (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 font-sans">
      <div className="w-full max-w-md rounded-t-[32px] sm:rounded-3xl bg-white p-6 shadow-2xl text-[#0B2B16] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-[#ECFDC5] text-[#0B2B16] flex items-center justify-center font-bold">
              <UserPlus className="h-4 w-4 text-[#0B2B16]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B2B16]">Add Friend to Split</h3>
              <p className="text-xs text-slate-500">Search registered users or send invite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone or @handle..."
              className="w-full rounded-2xl bg-[#F8FAF6] border border-slate-200/90 py-3 pl-10 pr-4 text-xs font-medium text-[#0B2B16] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B4F32D] focus:border-transparent transition-all"
              autoFocus
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search Results / Directory */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 max-h-[220px]">
          {isSearching ? (
            <div className="py-6 text-center text-xs text-slate-400">Searching directory...</div>
          ) : query && searchResults.length > 0 ? (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Found Users on IPIN
              </span>
              {searchResults.map((user) => {
                const alreadyIn = isUserAlreadyInRoom(user.name);
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAF6] border border-slate-100 hover:border-[#B4F32D] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#ECFDC5] border border-[#B4F32D] text-[#0B2B16] font-bold text-xs flex items-center justify-center">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0B2B16]">{user.name}</h4>
                        <p className="text-[10px] text-slate-500">
                          {user.handle ? `@${user.handle}` : user.phone || 'Registered Member'}
                        </p>
                      </div>
                    </div>

                    {alreadyIn ? (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                        In split
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddFoundUser(user)}
                        className="rounded-full bg-[#0B2B16] hover:bg-[#154625] text-[#B4F32D] px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <UserPlus className="h-3 w-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : query && !isSearching ? (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs space-y-2">
              <p className="font-bold">No user found matching "{query}"</p>
              <p className="text-[11px] text-amber-800">
                They might not have joined IPIN yet. Share a direct invite link with them via WhatsApp or add them as a guest right now!
              </p>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-slate-400">
              Type a friend's name, phone number, or handle to find them.
            </div>
          )}
        </div>

        {/* Invite & Guest Actions */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          
          {/* WhatsApp Direct Share */}
          <button
            onClick={handleShareWhatsApp}
            className="w-full rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#075E54] py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            <span>Invite Friend via WhatsApp</span>
          </button>

          {/* Quick Copy Link */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 rounded-2xl bg-[#F8FAF6] hover:bg-slate-100 border border-slate-200/80 text-[#0B2B16] py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Room Link'}</span>
            </button>
          </div>

          {/* Manual Add as Guest (if friend is not on app yet) */}
          <form onSubmit={handleManualAdd} className="pt-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Or Add as Guest Now
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Enter friend's name..."
                className="flex-1 rounded-2xl bg-[#F8FAF6] border border-slate-200 py-2 px-3 text-xs font-medium text-[#0B2B16] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B4F32D]"
              />
              <button
                type="submit"
                disabled={!manualName.trim()}
                className="rounded-2xl bg-[#0B2B16] text-[#B4F32D] px-4 py-2 text-xs font-bold disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
              >
                + Add
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
