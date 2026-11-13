import React, { useState, useEffect, useCallback } from 'react';
import { Room, Participant, LineItem, Transaction } from './types';
import { SAMPLE_ROOM_GLOBAL_USD, SAMPLE_ROOM_GLOBAL_EUR, SAMPLE_ROOM_GLOBAL_JPY } from './data/sampleReceipt';
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
        // Clean out legacy mock transactions if present
        if (parsed.transactions && parsed.transactions.some((t: any) => t.id === 'tx-101' || t.id === 'tx-102')) {
          parsed.transactions = [];
          if (parsed.participants) {
            parsed.participants.forEach((p: any) => { p.paymentStatus = 'UNPAID'; p.paymentProof = undefined; });
          }
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
    }
    setIsSyncing(false);
  }, []);

  // Check URL query on mount (?r=roomId, ?demo=usd, etc.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('r') || params.get('room');
    const demo = params.get('demo');

    if (roomId) {
      // Fetch live room from Supabase
      refreshRoom(roomId);
    } else if (demo === 'eur') {
      loadSampleRoom('EUR');
    } else if (demo === 'jpy') {
      loadSampleRoom('JPY');
    } else if (demo === 'usd') {
      loadSampleRoom('USD');
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

  const loadSampleRoom = async (type: 'USD' | 'EUR' | 'JPY') => {
    const baseSample = type === 'EUR' 
      ? SAMPLE_ROOM_GLOBAL_EUR 
      : type === 'JPY' 
      ? SAMPLE_ROOM_GLOBAL_JPY 
      : SAMPLE_ROOM_GLOBAL_USD;

    const uniqueRoom: Room = {
      ...baseSample,
      id: `room-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      participants: baseSample.participants.map(p => ({
        ...p,
        paymentStatus: 'UNPAID' as const,
        paymentProof: undefined,
      })),
      transactions: [],
      createdAt: new Date().toISOString(),
    };

    setRoom(uniqueRoom);
    if (uniqueRoom.participants.length > 0) {
      setCurrentUserId(uniqueRoom.participants[0].id);
    }
    setActiveTab('CLAIM');

    // Update URL to ?r=<uniqueRoom.id>
    const newUrl = `${window.location.pathname}?r=${uniqueRoom.id}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    // Sync clean room to Supabase PostgreSQL
    saveNewRoomToDb(uniqueRoom).catch(() => {});
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
        return { ...item, claimedBy: updatedClaimers };
      }
      return item;
    });

    setRoom({ ...room, items: updatedItems });

    // Sync to Supabase in background
    updateItemClaimInDb(itemId, updatedClaimers).catch(() => {});
  };

  const handleAddParticipant = (name: string) => {
    if (!room) return;
    const colors = [
      'from-blue-600 to-indigo-700',
      'from-emerald-600 to-teal-700',
      'from-amber-500 to-orange-600',
      'from-sky-500 to-blue-600',
      'from-purple-600 to-indigo-700',
    ];
    const newId = `p-${Date.now()}`;
    const newParticipant: Participant = {
      id: newId,
      name,
      avatarColor: colors[room.participants.length % colors.length],
      paymentStatus: 'UNPAID',
    };

    setRoom({
      ...room,
      participants: [...room.participants, newParticipant],
    });
    setCurrentUserId(newId);

    // Sync to Supabase
    addParticipantToDb(room.id, newParticipant).catch(() => {});
  };

  const handleAddCustomItem = (newItem: Partial<LineItem>) => {
    if (!room) return;
    const fullItem: LineItem = {
      id: `item-${Date.now()}`,
      rawName: newItem.rawName || 'Custom Item',
      cleanName: newItem.cleanName || 'Custom Item',
      quantity: newItem.quantity || 1,
      unitPrice: newItem.unitPrice || 0,
      totalPrice: newItem.totalPrice || 0,
      claimedBy: newItem.claimedBy || [currentUserId],
    };

    const updatedItems = [...room.items, fullItem];
    const newSubtotal = updatedItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const tax = Math.round((newSubtotal * 0.08875) * 100) / 100;
    const serviceFee = Math.round((newSubtotal * 0.18) * 100) / 100;
    const grandTotal = Math.round((newSubtotal + tax + serviceFee) * 100) / 100;

    const newTotals = { subtotal: newSubtotal, tax, serviceFee, grandTotal };

    setRoom({
      ...room,
      items: updatedItems,
      ...newTotals,
    });

    // Sync to Supabase
    addCustomItemToDb(room.id, fullItem, newTotals).catch(() => {});
  };

  // Transaction Recording Engine (1-Tap or ELA Forensic Upload)
  const handleRecordTransaction = (newTx: Transaction) => {
    if (!room) return;
    const updatedTransactions = [newTx, ...(room.transactions || [])];

    let participantUpdate: { participantId: string; status: string; proof?: any } | undefined;

    // Update participant payment status
    const updatedParticipants = room.participants.map((p) => {
      if (p.id === newTx.senderId) {
        const nextStatus = newTx.status === 'COMPLETED' ? ('VERIFIED' as const) : ('PARTIAL_OR_MISMATCH' as const);
        const proof = newTx.proofUrl
          ? {
              imageUrl: newTx.proofUrl,
              uploadedAt: new Date().toISOString(),
              forensics: newTx.forensics,
            }
          : p.paymentProof;

        participantUpdate = {
          participantId: p.id,
          status: nextStatus,
          proof,
        };

        return {
          ...p,
          paymentStatus: nextStatus,
          paymentProof: proof,
        };
      }
      return p;
    });

    setRoom({
      ...room,
      participants: updatedParticipants,
      transactions: updatedTransactions,
    });

    // Sync to Supabase
    recordTransactionToDb(room.id, newTx, participantUpdate).catch(() => {});
  };

  const handleOpenSettleModal = (participant: Participant) => {
    setActiveModalUser(participant);
    setIsSettleModalOpen(true);
  };

  const handleShare = () => {
    // Ensure URL has ?r=<roomId>
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = room?.id ? `${baseUrl}?r=${room.id}` : window.location.href;
    const text = `Hey! Here is our bill split on IPIN for "${room?.title}": ${shareUrl}\nTap your name to claim your items & settle up! 🧾`;
    navigator.clipboard.writeText(text);
    setHasShareCopied(true);
    setTimeout(() => setHasShareCopied(false), 2500);
  };

  const currentUser =
    room?.participants.find((p) => p.id === currentUserId) ||
    room?.participants[0] || {
      id: 'guest',
      name: 'Guest',
      avatarColor: 'from-slate-600 to-slate-700',
      paymentStatus: 'UNPAID',
    };

  const splitResult = room ? calculateProportionalSplit(room) : null;
  const unsettledParticipantsCount = room?.participants.filter(
    (p) => (splitResult?.participantBreakdowns[p.id]?.amountRemaining || 0) > 0
  ).length || 0;

  return (
    <div className="min-h-screen bg-slate-900 sm:bg-slate-950 flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Global Navigation Bar */}
      <Navbar
        onNewBill={() => {
          try { localStorage.removeItem('ipin_saved_room'); } catch {}
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.pushState({}, '', cleanUrl);
          setRoom(null);
        }}
        onTryDemo={(currency) => loadSampleRoom(currency || 'USD')}
        isInRoom={!!room}
        roomTitle={room?.title}
        currentCurrency={room?.currency}
      />

      {/* Main Responsive Body Container */}
      <main className="flex-1 flex flex-col items-center justify-start sm:py-4 sm:px-2">
        {!room ? (
          <div className="flex-1 w-full max-w-4xl mx-auto p-4">
            <LandingHero
              onLoadSample={(currency) => loadSampleRoom(currency)}
              onCreateRoom={handleCreateRoom}
            />
          </div>
        ) : splitResult ? (
          /* Mobile App Viewport: edge-to-edge on phones, centered clean canvas on desktop */
          <div className="w-full sm:max-w-md bg-white sm:rounded-[36px] shadow-2xl flex flex-col min-h-screen sm:min-h-[820px] sm:max-h-[880px] overflow-hidden border border-slate-800/40 relative">
            
            {/* Top Navy Header & Recent Contacts */}
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

            {/* Content Tabs (Claim / Ledger / Summary) */}
            <div className="flex-1 bg-white px-4 pt-3 overflow-y-auto flex flex-col scrollbar-none">
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
