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
      if (dbRoom.participants.length > 0 && !currentUserId) {
        setCurrentUserId(dbRoom.participants[0].id);
      }
    }
    setIsSyncing(false);
  }, [currentUserId]);

  // Check URL query on mount (?r=roomId)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('r') || params.get('room');

    if (roomId) {
      // Fetch live room from Supabase PostgreSQL
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
      setCurrentUserId(fullRoom.participants[0].id);
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

    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-purple-500 to-violet-600',
      'from-cyan-500 to-blue-600',
    ];
    const randomColor = colors[room.participants.length % colors.length];

    const newParticipant: Participant = {
      id: `user-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      avatarColor: randomColor,
      paymentStatus: 'UNPAID',
    };

    setRoom({
      ...room,
      participants: [...room.participants, newParticipant],
    });
    setCurrentUserId(newParticipant.id);

    // Real-time DB update
    await addParticipantToDb(room.id, newParticipant);
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
    const tax = Math.round(newSubtotal * 0.08875 * 100) / 100;
    const serviceFee = Math.round(newSubtotal * 0.18 * 100) / 100;
    const isZeroDecimal = room.currency === 'JPY';
    const newGrandTotal = isZeroDecimal 
      ? Math.round(newSubtotal + tax + serviceFee) 
      : Math.round((newSubtotal + tax + serviceFee) * 100) / 100;

    const updatedRoom: Room = {
      ...room,
      items: newItems,
      subtotal: newSubtotal,
      tax: isZeroDecimal ? Math.round(tax) : tax,
      serviceFee: isZeroDecimal ? Math.round(serviceFee) : serviceFee,
      grandTotal: newGrandTotal,
    };

    setRoom(updatedRoom);

    // Real-time DB updates
    await addCustomItemToDb(room.id, newItem, {
      subtotal: newSubtotal,
      tax: isZeroDecimal ? Math.round(tax) : tax,
      serviceFee: isZeroDecimal ? Math.round(serviceFee) : serviceFee,
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

    // Automatically trigger official receipt slip modal
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
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans antialiased text-slate-100">
      {/* Top Universal Navbar */}
      <Navbar
        onNewBill={handleNewBill}
        isInRoom={!!room}
        roomTitle={room?.title}
      />

      {/* Share Toast Notification */}
      {hasShareCopied && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xl flex items-center gap-1.5 animate-bounce">
          <span>✓ Room link copied to clipboard! Share with friends.</span>
        </div>
      )}

      {/* Main Responsive Content */}
      <main className="flex-1 flex flex-col w-full">
        {!room ? (
          <LandingHero
            onCreateRoom={handleCreateRoom}
          />
        ) : splitResult && currentUser ? (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full bg-white text-slate-900 shadow-2xl relative min-h-[calc(100vh-3.5rem)]">
            
            {/* Room Header Component (Total Bill, Participants, Host Info) */}
            <RoomHeader
              room={room}
              splitResult={splitResult}
              currentUser={currentUser}
              onAddParticipant={handleAddParticipant}
              onSwitchUser={(id) => setCurrentUserId(id)}
              onShare={handleShare}
              onOpenSettleUp={() => handleOpenSettleModal(currentUser)}
              onOpenAddItem={() => setActiveTab('CLAIM')}
            />

            {/* Active Tab View */}
            <div className="flex-1 px-4 sm:px-6 pt-4 pb-24">
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

            {/* Floating Mobile Bottom Navigation Bar (4 Equal Buttons) */}
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
    </div>
  );
}

export default App;
