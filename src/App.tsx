import React, { useState, useEffect, useCallback } from 'react';
import { Room, Participant, LineItem, Transaction } from './types';
import { calculateProportionalSplit } from './utils/splitMath';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { RoomHeader } from './components/RoomHeader';
import { ClaimItemsTab } from './components/ClaimItemsTab';
import { LiveLedgerTab } from './components/LiveLedgerTab';
import { SummaryCardTab } from './components/SummaryCardTab';
import { SettleUpModal } from './components/SettleUpModal';
import { TransactionReceiptModal } from './components/TransactionReceiptModal';
import { BottomNav } from './components/BottomNav';
import { Users, X } from 'lucide-react';
import { 
  fetchRoomFromDb, 
  saveNewRoomToDb, 
  updateItemClaimInDb, 
  addParticipantToDb, 
  addCustomItemToDb, 
  recordTransactionToDb,
  subscribeToRoom 
} from './services/supabase';

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
  const [activeTab, setActiveTab] = useState<'CLAIM' | 'LEDGER' | 'SUMMARY'>('CLAIM');
  const [hasShareCopied, setHasShareCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Dynamic Visitor Join Modal
  const [showVisitorJoinModal, setShowVisitorJoinModal] = useState(false);
  const [visitorName, setVisitorName] = useState('');

  // Modal states
  const [activeModalUser, setActiveModalUser] = useState<Participant | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);

  // Sync state to localStorage as fallback
  useEffect(() => {
    if (room) {
      try {
        localStorage.setItem('ipin_saved_room', JSON.stringify(room));
      } catch {}
    }
  }, [room]);

  // Refresh room from Supabase
  const refreshRoom = useCallback(async (roomId: string) => {
    setIsSyncing(true);
    const dbRoom = await fetchRoomFromDb(roomId);
    if (dbRoom) {
      setRoom(dbRoom);
      
      // Check if user has an existing saved participant ID for this specific room
      const savedUserId = localStorage.getItem(`ipin_user_id_${roomId}`);
      if (savedUserId && dbRoom.participants.some(p => p.id === savedUserId)) {
        setCurrentUserId(savedUserId);
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
    setRoom(null);
    setCurrentUserId('');
    localStorage.removeItem('ipin_saved_room');
    const cleanUrl = window.location.pathname;
    window.history.pushState({}, '', cleanUrl);
  };

  const handleCreateRoom = async (roomData: Partial<Room>) => {
    const fullRoom = roomData as Room;
    setRoom(fullRoom);
    if (fullRoom.participants.length > 0) {
      const hostId = fullRoom.participants[0].id;
      setCurrentUserId(hostId);
      localStorage.setItem(`ipin_user_id_${fullRoom.id}`, hostId);
    }
    setActiveTab('CLAIM');

    // Save to real Supabase PostgreSQL
    await saveNewRoomToDb(fullRoom);

    // Update URL to ?r=<roomId>
    const newUrl = `${window.location.pathname}?r=${fullRoom.id}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
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

  const handleAddParticipant = async (name: string) => {
    if (!room || !name.trim()) return;

    const newParticipant: Participant = {
      id: `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      avatarColor: 'from-emerald-500 to-teal-600',
      paymentStatus: 'UNPAID',
    };

    const updatedParticipants = [...room.participants, newParticipant];
    setRoom({
      ...room,
      participants: updatedParticipants,
    });
    setCurrentUserId(newParticipant.id);
    localStorage.setItem(`ipin_user_id_${room.id}`, newParticipant.id);

    // Real-time DB update
    await addParticipantToDb(room.id, newParticipant);
  };

  const handleVisitorJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !room) return;

    await handleAddParticipant(visitorName.trim());
    setShowVisitorJoinModal(false);
    setVisitorName('');
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

  const handleOpenSettleModal = (participant: Participant) => {
    setActiveModalUser(participant);
    setIsSettleModalOpen(true);
  };

  const handleShare = () => {
    if (navigator.share && room) {
      navigator
        .share({
          title: `Split bill: ${room.title}`,
          text: `Claim your items and settle up on IPIN:`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
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
    <div className="min-h-screen bg-[#051F10] flex flex-col font-sans antialiased text-[#0B2B16]">
      
      {/* Top Mobile Navbar */}
      <Navbar
        onNewBill={handleNewBill}
        isInRoom={!!room}
        roomTitle={room?.title}
      />

      {/* Share Toast Notification */}
      {hasShareCopied && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#0B2B16] border border-[#B4F32D] text-[#B4F32D] px-4 py-1.5 text-xs font-bold shadow-xl flex items-center gap-1.5 animate-bounce">
          <span>✓ Room link copied to clipboard! Share with friends.</span>
        </div>
      )}

      {/* Main Responsive Mobile View */}
      <main className="flex-1 flex flex-col w-full">
        {!room ? (
          <LandingHero
            onCreateRoom={handleCreateRoom}
            onJoinRoomById={(roomId) => {
              const newUrl = `${window.location.pathname}?r=${roomId}`;
              window.history.pushState({ path: newUrl }, '', newUrl);
              refreshRoom(roomId);
            }}
          />
        ) : splitResult && currentUser ? (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full bg-white text-[#0B2B16] shadow-2xl relative min-h-[calc(100vh-3.5rem)]">
            
            {/* Room Header Component (Modeled after Screen 2 Dashboard) */}
            <RoomHeader
              room={room}
              splitResult={splitResult}
              currentUser={currentUser}
              onAddParticipant={handleAddParticipant}
              onSwitchUser={(id) => setCurrentUserId(id)}
              onShare={handleShare}
              onOpenSettleUp={() => handleOpenSettleModal(currentUser)}
              onOpenAddItem={() => setActiveTab('CLAIM')}
              onOpenVerifyAI={() => handleOpenSettleModal(currentUser)}
            />

            {/* Active Tab View */}
            <div className="flex-1 px-4 sm:px-5 pt-3 pb-24">
              {activeTab === 'CLAIM' && (
                <ClaimItemsTab
                  room={room}
                  currentUser={currentUser}
                  onToggleClaim={handleToggleClaim}
                  onAddItem={handleAddCustomItem}
                />
              )}

              {activeTab === 'LEDGER' && (
                <LiveLedgerTab
                  room={room}
                  splitResult={splitResult}
                  currentUser={currentUser}
                  onOpenSettleModal={handleOpenSettleModal}
                  onInspectForensics={(p) => handleOpenSettleModal(p)}
                  onViewTransactionReceipt={(tx) => setSelectedTxForReceipt(tx)}
                />
              )}

              {activeTab === 'SUMMARY' && (
                <SummaryCardTab
                  room={room}
                  splitResult={splitResult}
                  onShare={handleShare}
                />
              )}
            </div>

            {/* Floating Mobile Bottom Navigation Bar (Deep Forest Green with Lime Accents) */}
            <BottomNav
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              onCenterAction={() => {
                if (currentUser) {
                  handleOpenSettleModal(currentUser);
                }
              }}
              itemCount={room.items.length}
              unsettledCount={unsettledParticipantsCount}
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
              Enter your name to join this bill. You will be able to tap the items you ate and settle your share directly.
            </p>

            <form onSubmit={handleVisitorJoinSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="What is your name? (e.g. David)"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-[#F8FAF6] px-4 py-3 text-xs text-[#0B2B16] focus:border-[#0B2B16] focus:bg-white focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="w-full rounded-full bg-[#0B2B16] hover:bg-[#051F10] text-[#B4F32D] py-3.5 text-xs font-bold shadow-forest-btn transition-all cursor-pointer"
              >
                Join Bill Split
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Settle Up & Forensic Verifier Modal (Modeled after Screen 3) */}
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
    </div>
  );
}

export default App;
