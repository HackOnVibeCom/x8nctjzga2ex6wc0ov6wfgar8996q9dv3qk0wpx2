import React, { useState, useEffect, useCallback } from 'react';
import { Room, Participant, LineItem, Transaction } from './types';
import { calculateProportionalSplit } from './utils/splitMath';
import { LandingHero } from './components/LandingHero';
import { HomeDashboardView } from './components/HomeDashboardView';
import { ClaimItemsTab } from './components/ClaimItemsTab';
import { LiveLedgerTab } from './components/LiveLedgerTab';
import { VerifyAITab } from './components/VerifyAITab';
import { SummaryCardTab } from './components/SummaryCardTab';
import { SettleUpModal } from './components/SettleUpModal';
import { TransactionReceiptModal } from './components/TransactionReceiptModal';
import { BottomNav, NavPage } from './components/BottomNav';
import { AddFriendModal } from './components/AddFriendModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { PollarOffRampExecutionResult } from './services/pollarStellar';
import { Users, X } from 'lucide-react';
import { 
  fetchRoomFromDb, 
  saveNewRoomToDb, 
  updateItemClaimInDb, 
  addParticipantToDb, 
  addCustomItemToDb, 
  recordTransactionToDb,
  updateRoomStellarVaultInDb,
  subscribeToRoom 
} from './services/supabase';

// Helper to resolve route page from pathname
const getPageFromPath = (): NavPage => {
  const p = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  if (p === 'claim') return 'CLAIM';
  if (p === 'ledger') return 'LEDGER';
  if (p === 'verify') return 'VERIFY';
  if (p === 'summary') return 'SUMMARY';
  return 'HOME';
};

export function App() {
  const [room, setRoom] = useState<Room | null>(() => {
    try {
      const saved = localStorage.getItem('ipin_saved_room');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Purge legacy mock data / demo rooms
        const isLegacyMock = 
          parsed.id?.includes('shinjuku') || 
          parsed.id?.includes('soho') || 
          parsed.id?.includes('berlin') ||
          parsed.participants?.some((p: any) => 
            p.name === 'Kenji' || p.name === 'Alex' || p.name === 'Elena' || p.name === 'Marcus' || p.name === 'Hiro' || p.name === 'Aoi'
          );
        if (isLegacyMock) {
          localStorage.removeItem('ipin_saved_room');
          return null;
        }
        return parsed;
      }
    } catch {}
    return null;
  });

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activePage, setActivePage] = useState<NavPage>(() => getPageFromPath());
  const [hasShareCopied, setHasShareCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Dynamic Visitor Join Modal
  const [showVisitorJoinModal, setShowVisitorJoinModal] = useState(false);
  const [visitorName, setVisitorName] = useState(() => {
    return localStorage.getItem('ipin_user_name') || '';
  });
  const [visitorPhone, setVisitorPhone] = useState(() => {
    return localStorage.getItem('ipin_user_phone') || '';
  });

  // Modal states
  const [activeModalUser, setActiveModalUser] = useState<Participant | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);

  // Sync state to localStorage as fallback
  useEffect(() => {
    if (room) {
      try {
        localStorage.setItem('ipin_saved_room', JSON.stringify(room));
      } catch {}
    }
  }, [room]);

  // Sync route on popstate (browser back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getPageFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Safe navigation that updates the browser URL to /page?r=...
  const handleNavigate = (page: NavPage) => {
    setActivePage(page);
    const path = page === 'HOME' ? '/' : `/${page.toLowerCase()}`;
    const roomId = room?.id || new URLSearchParams(window.location.search).get('r');
    const query = roomId ? `?r=${roomId}` : '';
    window.history.pushState({ page }, '', `${path}${query}`);
  };

  // Refresh room from Supabase
  const refreshRoom = useCallback(async (roomId: string) => {
    setIsSyncing(true);
    const dbRoom = await fetchRoomFromDb(roomId);
    if (dbRoom) {
      setRoom(dbRoom);
      
      // Check if user has an existing saved participant ID for this specific room
      const savedUserId = localStorage.getItem(`ipin_user_id_${roomId}`);
      const savedUserName = localStorage.getItem('ipin_user_name');

      if (savedUserId && dbRoom.participants.some(p => p.id === savedUserId)) {
        setCurrentUserId(savedUserId);
      } else if (savedUserName && dbRoom.participants.some(p => p.name.toLowerCase() === savedUserName.toLowerCase())) {
        const matched = dbRoom.participants.find(p => p.name.toLowerCase() === savedUserName.toLowerCase());
        if (matched) {
          setCurrentUserId(matched.id);
          localStorage.setItem(`ipin_user_id_${roomId}`, matched.id);
        }
      } else if (!currentUserId) {
        // If visitor arrives at room link without an identity, prompt them to join dynamically
        setShowVisitorJoinModal(true);
      }
    }
    setIsSyncing(false);
  }, [currentUserId]);

  // Check URL query on mount (?r=roomId)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('r') || params.get('room');

    if (roomId) {
      refreshRoom(roomId);
    }
  }, [refreshRoom]);

  // Subscribe to real-time updates when a room is active
  useEffect(() => {
    if (!room?.id) return;

    const unsubscribe = subscribeToRoom(room.id, () => {
      refreshRoom(room.id);
    });

    return () => {
      unsubscribe();
    };
  }, [room?.id, refreshRoom]);

  const handleNewBill = () => {
    setIsCreateRoomModalOpen(true);
  };

  const handleCreateRoom = async (roomData: Partial<Room>) => {
    const fullRoom = roomData as Room;
    setRoom(fullRoom);
    setIsCreateRoomModalOpen(false);
    if (fullRoom.participants.length > 0) {
      const host = fullRoom.participants[0];
      setCurrentUserId(host.id);
      localStorage.setItem(`ipin_user_id_${fullRoom.id}`, host.id);
      localStorage.setItem('ipin_user_name', host.name);
    }

    // Save to real Supabase PostgreSQL
    await saveNewRoomToDb(fullRoom);

    // Update URL to /?r=<roomId>
    const newUrl = `/?r=${fullRoom.id}`;
    window.history.pushState({ page: 'HOME' }, '', newUrl);
    setActivePage('HOME');
  };

  const handleToggleClaim = (itemId: string, participantId: string) => {
    if (!room) return;
    let updatedClaimers: string[] = [];

    const updatedItems = room.items.map((item) => {
      if (item.id === itemId) {
        const currentClaimers = item.claimedBy || [];
        const isClaimed = currentClaimers.includes(participantId);
        updatedClaimers = isClaimed
          ? currentClaimers.filter((id) => id !== participantId)
          : [...currentClaimers, participantId];
        return {
          ...item,
          claimedBy: updatedClaimers,
        };
      }
      return item;
    });

    setRoom({
      ...room,
      items: updatedItems,
    });

    // Real-time DB update
    updateItemClaimInDb(itemId, updatedClaimers).catch(() => {});
  };

  const handleAddParticipant = async (name: string, phoneOrHandle?: string) => {
    if (!room || !name.trim()) return;

    const newParticipant: Participant = {
      id: `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      avatarColor: 'from-emerald-500 to-teal-600',
      paymentStatus: 'UNPAID',
      phone: phoneOrHandle?.startsWith('@') ? undefined : phoneOrHandle,
      handle: phoneOrHandle?.startsWith('@') ? phoneOrHandle.replace(/^@/, '') : undefined,
    };

    const updatedParticipants = [...room.participants, newParticipant];
    setRoom({
      ...room,
      participants: updatedParticipants,
    });

    // Real-time DB update
    await addParticipantToDb(room.id, newParticipant);
  };

  const handleVisitorJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !room) return;

    // Save identity locally for zero-friction return
    localStorage.setItem('ipin_user_name', visitorName.trim());
    if (visitorPhone.trim()) {
      localStorage.setItem('ipin_user_phone', visitorPhone.trim());
    }

    // Check if a participant with this name already exists in the room
    const existing = room.participants.find(
      (p) => p.name.trim().toLowerCase() === visitorName.trim().toLowerCase()
    );

    if (existing) {
      setCurrentUserId(existing.id);
      localStorage.setItem(`ipin_user_id_${room.id}`, existing.id);
    } else {
      const newParticipant: Participant = {
        id: `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        name: visitorName.trim(),
        avatarColor: 'from-emerald-500 to-teal-600',
        paymentStatus: 'UNPAID',
        phone: visitorPhone.trim() || undefined,
      };

      const updatedParticipants = [...room.participants, newParticipant];
      setRoom({
        ...room,
        participants: updatedParticipants,
      });
      setCurrentUserId(newParticipant.id);
      localStorage.setItem(`ipin_user_id_${room.id}`, newParticipant.id);

      await addParticipantToDb(room.id, newParticipant);
    }

    setShowVisitorJoinModal(false);
  };

  const handleAddCustomItem = async (itemData: Partial<LineItem>) => {
    if (!room) return;
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      rawName: itemData.rawName || 'Item',
      cleanName: itemData.cleanName || 'Item',
      quantity: itemData.quantity || 1,
      unitPrice: itemData.unitPrice || 0,
      totalPrice: itemData.totalPrice || 0,
      claimedBy: itemData.claimedBy || [currentUserId || room.participants[0]?.id || 'host'],
    };

    const newItems = [...room.items, newItem];
    const newSubtotal = newItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const isZeroDecimal = room.currency === 'JPY';
    const newGrandTotal = isZeroDecimal ? Math.round(newSubtotal) : Math.round(newSubtotal * 100) / 100;

    const updatedRoom: Room = {
      ...room,
      items: newItems,
      subtotal: newSubtotal,
      grandTotal: newGrandTotal,
    };

    setRoom(updatedRoom);

    // Real-time DB updates
    await addCustomItemToDb(room.id, newItem, {
      subtotal: newSubtotal,
      tax: 0,
      serviceFee: 0,
      grandTotal: newGrandTotal,
    });
  };

  const handleRecordTransaction = async (tx: Transaction) => {
    if (!room) return;

    let newStatus: Participant['paymentStatus'] = 'VERIFIED';
    if (tx.status === 'SUSPICIOUS_EDIT') newStatus = 'SUSPICIOUS_EDIT';
    if (tx.status === 'FLAGGED_MISMATCH') newStatus = 'PARTIAL_OR_MISMATCH';

    const updatedParticipants = room.participants.map((p) => {
      if (p.id === tx.senderId) {
        return {
          ...p,
          paymentStatus: newStatus,
          paymentProof: tx.proofUrl
            ? {
                imageUrl: tx.proofUrl,
                uploadedAt: new Date().toISOString(),
                forensics: tx.forensics,
              }
            : undefined,
        };
      }
      return p;
    });

    const updatedTransactions = [tx, ...(room.transactions || [])];

    setRoom({
      ...room,
      participants: updatedParticipants,
      transactions: updatedTransactions,
    });

    // Real-time DB sync
    await recordTransactionToDb(room.id, tx, {
      participantId: tx.senderId,
      status: newStatus,
      proof: tx.proofUrl ? { imageUrl: tx.proofUrl, forensics: tx.forensics } : undefined,
    });

    // Trigger official receipt slip modal
    setSelectedTxForReceipt(tx);
  };

  const handleOffRampSuccess = async (result: PollarOffRampExecutionResult) => {
    if (!room) return;

    const offRampTx: Transaction = {
      id: `tx-offramp-${Date.now()}`,
      senderId: room.organizer.id,
      senderName: 'Stellar Escrow Vault',
      recipientName: result.destinationAccountName || 'Restaurant Account',
      amount: result.fiatAmountSent,
      currency: result.fiatCurrency,
      method: 'POLLAR_OFFRAMP',
      referenceId: result.settlementReference,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'COMPLETED',
      stellarTxHash: result.offRampTxHash,
      notes: `Pollar off-ramp released to restaurant (${result.destinationBank} - ${result.destinationAccount})`,
    };

    const updatedVault = room.stellarVault
      ? {
          ...room.stellarVault,
          offRampStatus: 'OFFRAMPED_TO_RESTAURANT' as const,
          offRampTxHash: result.offRampTxHash,
          offRampedAt: result.completedAt,
        }
      : undefined;

    const updatedRoom: Room = {
      ...room,
      stellarVault: updatedVault,
      transactions: [offRampTx, ...(room.transactions || [])],
    };

    setRoom(updatedRoom);
    await recordTransactionToDb(room.id, offRampTx);
    if (updatedVault) {
      await updateRoomStellarVaultInDb(room.id, updatedVault);
    }
    setSelectedTxForReceipt(offRampTx);
  };

  const handleOpenSettleModal = (participant: Participant) => {
    setActiveModalUser(participant);
    setIsSettleModalOpen(true);
  };

  const handleShare = () => {
    const fullUrl = `${window.location.origin}/?r=${room?.id || ''}`;
    if (navigator.share && room) {
      navigator
        .share({
          title: `Split bill: ${room.title}`,
          text: `Claim your items and settle up on IPIN:`,
          url: fullUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(fullUrl);
      setHasShareCopied(true);
      setTimeout(() => setHasShareCopied(false), 2000);
    }
  };

  // Math Engine Calculation
  const splitResult = room ? calculateProportionalSplit(room) : null;
  const currentUser = room?.participants.find((p) => p.id === currentUserId) || room?.participants[0];
  const unsettledParticipantsCount = room?.participants.filter(
    (p) => p.paymentStatus !== 'VERIFIED'
  ).length || 0;

  return (
    <div className="min-h-screen bg-[#051F10] flex flex-col justify-center items-center font-sans antialiased text-[#0B2B16]">
      
      {/* Share Toast Notification */}
      {hasShareCopied && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#0B2B16] border border-[#B4F32D] text-[#B4F32D] px-4 py-1.5 text-xs font-bold shadow-xl flex items-center gap-1.5 animate-bounce">
          <span>✓ Room link copied to clipboard! Share with friends.</span>
        </div>
      )}

      {/* Main Pure Mobile Container (Zero desktop headers) */}
      <main className="w-full max-w-md min-h-screen bg-white relative flex flex-col shadow-2xl overflow-hidden">
        {!room ? (
          <LandingHero
            onCreateRoom={handleCreateRoom}
            onJoinRoomById={(roomId) => {
              const newUrl = `/?r=${roomId}`;
              window.history.pushState({ page: 'HOME' }, '', newUrl);
              refreshRoom(roomId);
            }}
          />
        ) : splitResult && currentUser ? (
          <div className="flex-1 flex flex-col w-full bg-white text-[#0B2B16] relative min-h-screen">
            
            {/* View Switching: Only HOME has the Total Bill Card + 4 Action Tiles */}
            {activePage === 'HOME' && (
              <HomeDashboardView
                room={room}
                splitResult={splitResult}
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onOpenAddFriend={() => setIsAddFriendModalOpen(true)}
                onOpenSettleModal={handleOpenSettleModal}
                onSwitchUser={(id) => setCurrentUserId(id)}
                onShare={handleShare}
                onNewBill={handleNewBill}
                onOffRampSuccess={handleOffRampSuccess}
              />
            )}

            {activePage === 'CLAIM' && (
              <div className="flex-1 px-4 sm:px-5 pt-3 pb-24">
                <ClaimItemsTab
                  room={room}
                  currentUser={currentUser}
                  onToggleClaim={handleToggleClaim}
                  onAddItem={handleAddCustomItem}
                  onBackToHome={() => handleNavigate('HOME')}
                />
              </div>
            )}

            {activePage === 'LEDGER' && (
              <div className="flex-1 px-4 sm:px-5 pt-3 pb-24">
                <LiveLedgerTab
                  room={room}
                  splitResult={splitResult}
                  currentUser={currentUser}
                  onOpenSettleModal={handleOpenSettleModal}
                  onInspectForensics={(p) => handleOpenSettleModal(p)}
                  onViewTransactionReceipt={(tx) => setSelectedTxForReceipt(tx)}
                  onBackToHome={() => handleNavigate('HOME')}
                />
              </div>
            )}

            {activePage === 'VERIFY' && (
              <div className="flex-1 px-4 sm:px-5 pt-3 pb-24">
                <VerifyAITab
                  room={room}
                  splitResult={splitResult}
                  currentUser={currentUser}
                  onBackToHome={() => handleNavigate('HOME')}
                  onRecordTransaction={handleRecordTransaction}
                  onViewTransactionReceipt={(tx) => setSelectedTxForReceipt(tx)}
                />
              </div>
            )}

            {activePage === 'SUMMARY' && (
              <div className="flex-1 px-4 sm:px-5 pt-3 pb-24">
                <SummaryCardTab
                  room={room}
                  splitResult={splitResult}
                  onShare={handleShare}
                  onBackToHome={() => handleNavigate('HOME')}
                />
              </div>
            )}

            {/* Floating Mobile Bottom Navigation Bar (5 equal items) */}
            <BottomNav
              activePage={activePage}
              onSelectPage={handleNavigate}
              itemCount={room.items.length}
              unsettledCount={unsettledParticipantsCount}
            />

            {/* Real Friend Search Modal */}
            <AddFriendModal
              isOpen={isAddFriendModalOpen}
              onClose={() => setIsAddFriendModalOpen(false)}
              roomId={room.id}
              roomTitle={room.title}
              existingParticipants={room.participants}
              onAddParticipant={handleAddParticipant}
            />
          </div>
        ) : null}
      </main>

      {/* Dynamic Visitor Join Bottom Sheet */}
      {showVisitorJoinModal && room && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 font-sans">
          <div className="w-full max-w-md rounded-t-[32px] sm:rounded-3xl bg-white p-6 shadow-2xl text-[#0B2B16] animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#ECFDC5] text-[#0B2B16] flex items-center justify-center font-bold">
                  <Users className="h-4 w-4 stroke-[2.2]" />
                </div>
                <h3 className="text-base font-bold text-[#0B2B16]">Join Split: {room.title}</h3>
              </div>
              <button
                onClick={() => setShowVisitorJoinModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-4">
              Enter your name to join this bill. No passwords or registration needed — just claim what you ate and settle!
            </p>

            <form onSubmit={handleVisitorJoinSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="What is your name? (e.g. David)"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-[#F8FAF6] px-4 py-3 text-xs text-[#0B2B16] focus:border-[#0B2B16] focus:bg-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number or @Handle (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 08012345678 or @david"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-[#F8FAF6] px-4 py-3 text-xs text-[#0B2B16] focus:border-[#0B2B16] focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#0B2B16] hover:bg-[#051F10] text-[#B4F32D] py-3.5 text-xs font-bold shadow-forest-btn transition-all cursor-pointer mt-2"
              >
                Join Bill Split
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settle Up & Forensic Verifier Modal */}
      {isSettleModalOpen && activeModalUser && room && splitResult && (
        <SettleUpModal
          isOpen={isSettleModalOpen}
          participant={activeModalUser}
          room={room}
          owedAmount={
            splitResult.participantBreakdowns[activeModalUser.id]?.totalOwed || 0
          }
          remainingAmount={
            splitResult.participantBreakdowns[activeModalUser.id]?.amountRemaining || 0
          }
          onClose={() => {
            setIsSettleModalOpen(false);
            setActiveModalUser(null);
          }}
          onRecordTransaction={handleRecordTransaction}
        />
      )}

      {/* Official Transaction Receipt Slip Modal */}
      {selectedTxForReceipt && room && (
        <TransactionReceiptModal
          transaction={selectedTxForReceipt}
          room={room}
          isOpen={!!selectedTxForReceipt}
          onClose={() => setSelectedTxForReceipt(null)}
        />
      )}

      {/* In-App Create Split Room Modal (Keeps user inside app) */}
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
}

export default App;
