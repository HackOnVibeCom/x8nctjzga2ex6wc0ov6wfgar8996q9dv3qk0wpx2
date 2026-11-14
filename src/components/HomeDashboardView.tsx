import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Receipt, 
  Zap, 
  Scan, 
  UserPlus, 
  ShieldCheck, 
  ChevronRight, 
  Users, 
  Info, 
  Bell, 
  CheckCircle2,
  Copy,
  Check,
  X,
  Building2,
  ExternalLink
} from 'lucide-react';
import { Room, SplitCalculationResult, Participant } from '../types';
import { formatMoney } from '../utils/splitMath';
import { PollarOffRampModal } from './PollarOffRampModal';

interface HomeDashboardViewProps {
  room: Room;
  splitResult: SplitCalculationResult;
  currentUser: Participant;
  onNavigate: (page: 'HOME' | 'CLAIM' | 'LEDGER' | 'VERIFY' | 'SUMMARY') => void;
  onOpenAddFriend: () => void;
  onOpenSettleModal: (participant: Participant) => void;
  onSwitchUser: (participantId: string) => void;
  onShare: () => void;
  onNewBill: () => void;
  onOffRampSuccess?: (result: any) => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  room,
  splitResult,
  currentUser,
  onNavigate,
  onOpenAddFriend,
  onOpenSettleModal,
  onSwitchUser,
  onShare,
  onNewBill,
  onOffRampSuccess,
}) => {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showAllUsersModal, setShowAllUsersModal] = useState(false);
  const [showOffRampModal, setShowOffRampModal] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const copyBankDetails = () => {
    const text = `${room.organizer.payout.bankName} - ${room.organizer.payout.accountNumber} (${room.organizer.payout.accountName})`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return room.participants;
    const q = searchQuery.toLowerCase();
    return room.participants.filter((p) => p.name.toLowerCase().includes(q));
  }, [room.participants, searchQuery]);

  const myBreakdown = splitResult.participantBreakdowns[currentUser.id];
  const myRemaining = myBreakdown?.amountRemaining || 0;

  return (
    <div className="w-full bg-white text-[#0B2B16] px-5 pt-4 pb-28 space-y-4 font-sans">
      
      {/* 1. Mobile Top Bar: User Profile & Quick In-App Actions */}
      <div className="flex items-center justify-between">
        <div 
          onClick={() => setShowAllUsersModal(true)}
          className="flex items-center gap-3 cursor-pointer group"
          title="Switch Active Profile"
        >
          <div className="h-10 w-10 rounded-full bg-[#ECFDC5] border-2 border-[#B4F32D] text-[#0B2B16] font-bold text-sm flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-[#0B2B16] leading-tight">
                {currentUser.name}
              </h3>
              {currentUser.isOrganizer ? (
                <span className="rounded-full bg-[#0B2B16] text-[#B4F32D] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  Host
                </span>
              ) : (
                <span className="rounded-full bg-[#F2FCE2] text-[#0B2B16] px-2 py-0.5 text-[9px] font-bold">
                  You
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">
              {room.title}
            </p>
          </div>
        </div>

        {/* Right In-App Buttons: In-App New Split + Share Bell */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewBill}
            title="Start New Split"
            className="h-10 px-3 rounded-full bg-[#F8FAF6] hover:bg-[#F2FCE2] text-[#0B2B16] text-xs font-bold flex items-center gap-1.5 border border-slate-200/80 transition-colors cursor-pointer active:scale-95 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New Split</span>
          </button>

          <button
            onClick={onShare}
            title="Share room link"
            className="h-10 w-10 rounded-full bg-[#F2FCE2] hover:bg-[#E2F7C2] text-[#0B2B16] flex items-center justify-center transition-colors cursor-pointer border border-[#DDF3BA] shadow-xs active:scale-95"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Vibrant Lime Green Balance Card (Exclusively on Home) */}
      <div className="rounded-[26px] bg-gradient-to-br from-[#B4F32D] via-[#A8F01D] to-[#88D61A] p-5 text-[#0B2B16] shadow-sm space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B2B16]/80 uppercase tracking-wider">
            <Receipt className="h-4 w-4" />
            <span>Total Bill</span>
          </div>
          <button
            onClick={() => setShowPayoutModal(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#0B2B16] bg-black/5 hover:bg-black/10 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
          >
            <Info className="h-3 w-3" />
            <span>Payout Info</span>
          </button>
        </div>

        <div className="relative z-10">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B2B16] font-sans">
            {formatMoney(room.grandTotal, room.currency)}
          </div>
          <p className="text-xs font-semibold text-[#0B2B16]/80 mt-1">
            Collected: {formatMoney(splitResult.totalCollected, room.currency)} •{' '}
            <span className={splitResult.remainingToCollect > 0 ? 'text-[#0B2B16]' : 'text-[#0B2B16] font-bold'}>
              {splitResult.remainingToCollect > 0
                ? `${formatMoney(splitResult.remainingToCollect, room.currency)} remaining`
                : 'All Settled'}
            </span>
          </p>
        </div>

        <div className="pt-1 flex items-center justify-between border-t border-[#0B2B16]/10 relative z-10">
          <span className="text-[11px] font-mono font-medium text-[#0B2B16]/70">
            •••• {room.currency}
          </span>
          <button
            onClick={() => onNavigate('CLAIM')}
            className="rounded-full bg-white hover:bg-slate-50 text-[#0B2B16] px-4 py-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* 3. 4-Tile Quick Action Grid (Exclusively on Home) */}
      <div className="grid grid-cols-4 gap-2.5 pt-1">
        
        {/* Tile 1: Claim -> /claim */}
        <button
          onClick={() => onNavigate('CLAIM')}
          className="rounded-2xl bg-[#F2FCE2] hover:bg-[#E4F8CC] text-[#0B2B16] p-3 flex flex-col items-center justify-center gap-1.5 border border-[#DDF3BA] shadow-soft transition-all cursor-pointer group active:scale-95"
        >
          <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-[#0B2B16] shadow-2xs group-hover:bg-[#B4F32D] transition-colors">
            <Receipt className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold">Claim</span>
        </button>

        {/* Tile 2: Settle -> Settle modal */}
        <button
          onClick={() => onOpenSettleModal(currentUser)}
          className="rounded-2xl bg-[#F2FCE2] hover:bg-[#E4F8CC] text-[#0B2B16] p-3 flex flex-col items-center justify-center gap-1.5 border border-[#DDF3BA] shadow-soft transition-all cursor-pointer group active:scale-95"
        >
          <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-[#0B2B16] shadow-2xs group-hover:bg-[#B4F32D] transition-colors">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold">Settle</span>
        </button>

        {/* Tile 3: Verify AI -> /verify */}
        <button
          onClick={() => onNavigate('VERIFY')}
          className="rounded-2xl bg-[#F2FCE2] hover:bg-[#E4F8CC] text-[#0B2B16] p-3 flex flex-col items-center justify-center gap-1.5 border border-[#DDF3BA] shadow-soft transition-all cursor-pointer group active:scale-95"
        >
          <div className="h-9 w-9 rounded-xl bg-[#0B2B16] text-[#B4F32D] flex items-center justify-center shadow-xs">
            <Scan className="h-4 w-4 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold">Verify AI</span>
        </button>

        {/* Tile 4: Add Friend -> Add Friend Modal */}
        <button
          onClick={onOpenAddFriend}
          className="rounded-2xl bg-[#F2FCE2] hover:bg-[#E4F8CC] text-[#0B2B16] p-3 flex flex-col items-center justify-center gap-1.5 border border-[#DDF3BA] shadow-soft transition-all cursor-pointer group active:scale-95"
        >
          <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center text-[#0B2B16] shadow-2xs group-hover:bg-[#B4F32D] transition-colors">
            <UserPlus className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold">Add Friend</span>
        </button>

      </div>

      {/* 4. Deep Forest Green Fairness Banner */}
      <div 
        onClick={() => setShowPayoutModal(true)}
        className="rounded-2xl bg-[#0B2B16] text-white p-3.5 flex items-center justify-between gap-3 shadow-sm cursor-pointer hover:bg-[#051F10] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-[#B4F32D] text-[#0B2B16] flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Zero-Drift Fair Split Math</span>
            </h4>
            <p className="text-[10px] text-slate-300 font-normal">
              Exact penny balancing • Proportional tax & gratuity
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-[#B4F32D] shrink-0" />
      </div>

      {/* 4.5. Pollar Stellar Testnet Escrow Vault Card */}
      <div className="rounded-2xl bg-[#0B2B16] text-white p-4 space-y-3 shadow-md border border-[#B4F32D]/30 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#B4F32D] text-[#0B2B16] flex items-center justify-center font-bold text-xs">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Stellar Testnet Escrow Vault</span>
                <span className="text-[9px] font-bold bg-[#B4F32D] text-[#0B2B16] px-1.5 py-0.2 rounded-full">Pollar</span>
              </h4>
              <p className="text-[10px] text-slate-300">
                Destination: {room.stellarVault?.vendorDetails.vendorName || room.organizer.payout.accountName} ({room.stellarVault?.vendorDetails.bankName || room.organizer.payout.bankName})
              </p>
            </div>
          </div>
          
          <a
            href={`https://stellar.expert/explorer/testnet/account/${room.stellarVault?.vaultAddress || 'GD3EP2FQ5EQQQYTFPRBODQ5UUVC35RCFCFZ3TFFGUVRHQBPBWJYZPEXZ'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#B4F32D] hover:underline text-[10px] font-mono flex items-center gap-1"
          >
            <span>Explorer</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Vault Pool Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-semibold">
            <span className="text-slate-300">Vault Pool Balance:</span>
            <span className="text-[#B4F32D] font-mono font-bold">
              {formatMoney(splitResult.totalCollected, room.currency)} / {formatMoney(room.grandTotal, room.currency)}
            </span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-[#B4F32D] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${splitResult.collectionProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Button to Trigger Off-Ramp to Restaurant (Guarded by Vault Pool Balance) */}
        {splitResult.totalCollected > 0 ? (
          <button
            onClick={() => setShowOffRampModal(true)}
            className="w-full rounded-xl bg-[#B4F32D] hover:bg-[#A3E81D] text-[#0B2B16] font-extrabold text-xs py-2.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Release {formatMoney(splitResult.totalCollected, room.currency)} to Restaurant via Pollar</span>
          </button>
        ) : (
          <div className="rounded-xl bg-white/5 border border-white/10 p-2 text-center space-y-1">
            <button
              disabled
              className="w-full rounded-xl bg-white/10 text-slate-400 font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Vault Empty — Awaiting Friend On-Ramps</span>
            </button>
            <p className="text-[10px] text-slate-400">
              Friends must first on-ramp their share. Once funded, you can release payment to {room.stellarVault?.vendorDetails.vendorName || 'the restaurant'}.
            </p>
          </div>
        )}
      </div>

      {/* 5. Scalable Participants Section (Handles 1 to 50+ users smoothly) */}
      <div className="pt-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-[#0B2B16] uppercase tracking-wider">
              Participants ({room.participants.length})
            </h4>
            {room.participants.length > 5 && (
              <button
                onClick={() => setShowAllUsersModal(true)}
                className="text-[10px] text-slate-500 font-semibold hover:text-[#0B2B16] underline cursor-pointer"
              >
                View all
              </button>
            )}
          </div>
          <button
            onClick={onOpenAddFriend}
            className="flex items-center gap-1 text-xs text-[#0B2B16] font-bold hover:underline cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Dynamic preview row */}
        {room.participants.length <= 1 ? (
          <div className="rounded-2xl border border-dashed border-[#DDF3BA] bg-[#F8FAF6] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-[#ECFDC5] text-[#0B2B16] font-bold text-xs flex items-center justify-center">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0B2B16]">Only you (Host) are here</p>
                <p className="text-[10px] text-slate-500">Add friends or share your room link so they can claim their items!</p>
              </div>
            </div>
            <button
              onClick={onOpenAddFriend}
              className="rounded-full bg-[#0B2B16] text-[#B4F32D] px-3 py-1.5 text-xs font-bold shrink-0 cursor-pointer hover:bg-[#051F10]"
            >
              + Friend
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {room.participants.slice(0, 7).map((p) => {
              const breakdown = splitResult.participantBreakdowns[p.id];
              const owed = breakdown?.totalOwed || 0;
              const isSelected = p.id === currentUser.id;

              return (
                <button
                  key={p.id}
                  onClick={() => onSwitchUser(p.id)}
                  className={`flex flex-col items-center gap-1 shrink-0 p-1.5 rounded-2xl transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-[#0B2B16] bg-[#F2FCE2]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-[#ECFDC5] border border-[#B4F32D] text-[#0B2B16] font-bold text-xs flex items-center justify-center">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    {p.paymentStatus === 'VERIFIED' && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#0B2B16] border-2 border-white flex items-center justify-center text-[7px] text-[#B4F32D] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-[#0B2B16] max-w-[60px] truncate">
                    {p.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {p.paymentStatus === 'VERIFIED' ? 'Paid' : formatMoney(owed, room.currency)}
                  </span>
                </button>
              );
            })}

            {room.participants.length > 7 && (
              <button
                onClick={() => setShowAllUsersModal(true)}
                className="flex flex-col items-center justify-center gap-1 shrink-0 p-1.5 rounded-2xl bg-[#F8FAF6] border border-[#DDF3BA] hover:bg-[#F2FCE2] transition-colors cursor-pointer w-14 h-16"
              >
                <Users className="h-4 w-4 text-[#0B2B16]" />
                <span className="text-[9px] font-bold text-[#0B2B16]">
                  +{room.participants.length - 7} more
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 6. Quick Activity & Items Snapshot */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#0B2B16] uppercase tracking-wider">
            Bill Items Overview ({room.items.length})
          </h4>
          <button
            onClick={() => onNavigate('CLAIM')}
            className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {room.items.slice(0, 3).map((item) => {
            const isMine = (item.claimedBy || []).includes(currentUser.id);
            const claimCount = (item.claimedBy || []).length;

            return (
              <div
                key={item.id}
                onClick={() => onNavigate('CLAIM')}
                className="p-3.5 rounded-2xl bg-[#F8FAF6] border border-slate-100 hover:border-[#B4F32D] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                    isMine ? 'bg-[#0B2B16] text-[#B4F32D]' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {isMine ? '✓' : item.quantity}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#0B2B16]">{item.cleanName}</h5>
                    <p className="text-[10px] text-slate-500">
                      {claimCount > 0 ? `Split ${claimCount} ways` : 'Unclaimed'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-[#0B2B16]">
                    {formatMoney(item.totalPrice, room.currency)}
                  </span>
                  {isMine && (
                    <div className="text-[9px] text-[#0B2B16] font-bold">
                      Your share: {formatMoney(item.totalPrice / (claimCount || 1), room.currency)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 50+ Users Searchable Sheet */}
      {showAllUsersModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 font-sans">
          <div className="w-full max-w-md rounded-t-[32px] sm:rounded-3xl bg-white p-6 shadow-2xl text-[#0B2B16] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#ECFDC5] text-[#0B2B16] flex items-center justify-center font-bold text-xs">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0B2B16]">Room Roster ({room.participants.length})</h3>
                  <p className="text-xs text-slate-500">Tap a member to switch active profile</p>
                </div>
              </div>
              <button
                onClick={() => setShowAllUsersModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member name..."
                className="w-full rounded-2xl bg-[#F8FAF6] border border-slate-200 py-2.5 px-3.5 text-xs font-medium text-[#0B2B16] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B4F32D]"
              />
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2 mt-2">
              {filteredParticipants.map((p) => {
                const b = splitResult.participantBreakdowns[p.id];
                const owed = b?.totalOwed || 0;
                const isSelected = p.id === currentUser.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSwitchUser(p.id);
                      setShowAllUsersModal(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#F2FCE2] border-2 border-[#B4F32D]' : 'bg-[#F8FAF6] hover:bg-slate-100 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#ECFDC5] border border-[#B4F32D] text-[#0B2B16] font-bold text-xs flex items-center justify-center">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[#0B2B16]">{p.name}</h4>
                          {p.isOrganizer && (
                            <span className="rounded-full bg-[#0B2B16] text-[#B4F32D] px-1.5 py-0.2 text-[8px] font-bold uppercase">
                              Host
                            </span>
                          )}
                          {isSelected && (
                            <span className="rounded-full bg-[#B4F32D] text-[#0B2B16] px-1.5 py-0.2 text-[8px] font-bold">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {p.paymentStatus === 'VERIFIED' ? '✓ Paid' : `Owed: ${formatMoney(owed, room.currency)}`}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Payout Info Sheet */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 font-sans">
          <div className="w-full max-w-md rounded-t-[32px] sm:rounded-3xl bg-white p-6 shadow-2xl text-[#0B2B16] animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#ECFDC5] text-[#0B2B16] flex items-center justify-center font-bold text-xs">
                  <Info className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-[#0B2B16]">Host Payout Information</h3>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="rounded-2xl bg-[#F8FAF6] border border-[#DDF3BA] p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-500">Bank / Payment Provider</div>
                <div className="text-base font-extrabold text-[#0B2B16]">
                  {room.organizer.payout.bankName}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Account / Phone / Tag</div>
                    <div className="text-sm font-mono font-bold text-[#0B2B16]">
                      {room.organizer.payout.accountNumber}
                    </div>
                  </div>
                  <button
                    onClick={copyBankDetails}
                    className="flex items-center gap-1 rounded-full bg-[#0B2B16] hover:bg-[#154625] text-[#B4F32D] px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer active:scale-95"
                  >
                    {copiedBank ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedBank ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="text-xs text-slate-600">
                  Account Name: <strong className="text-[#0B2B16]">{room.organizer.payout.accountName}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pollar Stellar Off-Ramp Modal */}
      <PollarOffRampModal
        room={room}
        isOpen={showOffRampModal}
        onClose={() => setShowOffRampModal(false)}
        onOffRampSuccess={(res) => {
          if (onOffRampSuccess) onOffRampSuccess(res);
        }}
      />

    </div>
  );
};
