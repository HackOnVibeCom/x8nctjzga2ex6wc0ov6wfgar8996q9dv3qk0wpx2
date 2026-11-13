import React, { useState, useEffect } from 'react';
import { Room, Participant, LineItem, Transaction } from './types';
import { SAMPLE_ROOM_GLOBAL_USD, SAMPLE_ROOM_GLOBAL_EUR } from './data/sampleReceipt';
import { calculateProportionalSplit } from './utils/splitMath';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { RoomHeader } from './components/RoomHeader';
import { ClaimItemsTab } from './components/ClaimItemsTab';
import { LiveLedgerTab } from './components/LiveLedgerTab';
import { TransferKeypadScreen } from './components/TransferKeypadScreen';
import { SummaryCardTab } from './components/SummaryCardTab';
import { PaymentProofModal } from './components/PaymentProofModal';
import { TransactionReceiptModal } from './components/TransactionReceiptModal';
import { BottomNav } from './components/BottomNav';

export function App() {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'CLAIM' | 'TRANSFER' | 'SUMMARY'>('LEDGER');
  const [hasShareCopied, setHasShareCopied] = useState(false);
  
  // Modal states
  const [activeModalUser, setActiveModalUser] = useState<Participant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);

  // Check URL query on mount (e.g. ?demo=usd or ?demo=eur)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');

    if (demo === 'eur') {
      loadSampleRoom('EUR');
    } else {
      // Default to global USD sample
      loadSampleRoom('USD');
    }
  }, []);

  const loadSampleRoom = (type: 'USD' | 'EUR') => {
    const sample = type === 'EUR' ? SAMPLE_ROOM_GLOBAL_EUR : SAMPLE_ROOM_GLOBAL_USD;
    setRoom(sample);
    if (sample.participants.length > 0) {
      // Default to Jordan (unpaid user) or Alex
      const unpaid = sample.participants.find(p => p.paymentStatus === 'UNPAID');
      setCurrentUserId(unpaid ? unpaid.id : sample.participants[0].id);
    }
    setActiveTab('LEDGER');
  };

  const handleCreateRoom = (roomData: Partial<Room>) => {
    const fullRoom = roomData as Room;
    setRoom(fullRoom);
    if (fullRoom.participants.length > 0) {
      setCurrentUserId(fullRoom.participants[0].id);
    }
    setActiveTab('LEDGER');
  };

  const handleToggleClaim = (itemId: string, participantId: string) => {
    if (!room) return;
    const updatedItems = room.items.map((item) => {
      if (item.id === itemId) {
        const currentClaimers = item.claimedBy || [];
        const isClaimed = currentClaimers.includes(participantId);
        const newClaimers = isClaimed
          ? currentClaimers.filter((id) => id !== participantId)
          : [...currentClaimers, participantId];
        return { ...item, claimedBy: newClaimers };
      }
      return item;
    });

    setRoom({ ...room, items: updatedItems });
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

    setRoom({
      ...room,
      items: updatedItems,
      subtotal: newSubtotal,
      tax,
      serviceFee,
      grandTotal,
    });
  };

  // Live Transaction Recording Engine
  const handleRecordTransaction = (newTx: Transaction) => {
    if (!room) return;
    const updatedTransactions = [newTx, ...(room.transactions || [])];

    // Update participant payment status
    const updatedParticipants = room.participants.map((p) => {
      if (p.id === newTx.senderId) {
        if (newTx.status === 'COMPLETED') {
          return {
            ...p,
            paymentStatus: 'VERIFIED' as const,
            paymentProof: newTx.proofUrl
              ? {
                  imageUrl: newTx.proofUrl,
                  uploadedAt: new Date().toISOString(),
                  forensics: newTx.forensics,
                }
              : p.paymentProof,
          };
        } else if (newTx.status === 'FLAGGED_MISMATCH') {
          return {
            ...p,
            paymentStatus: 'PARTIAL_OR_MISMATCH' as const,
            paymentProof: newTx.proofUrl
              ? {
                  imageUrl: newTx.proofUrl,
                  uploadedAt: new Date().toISOString(),
                  forensics: newTx.forensics,
                }
              : p.paymentProof,
          };
        }
      }
      return p;
    });

    setRoom({
      ...room,
      participants: updatedParticipants,
      transactions: updatedTransactions,
    });

    // Show transaction receipt slip immediately
    setSelectedTxForReceipt(newTx);
  };

  const handleOpenUploadProof = (participantId: string) => {
    const target = room?.participants.find((p) => p.id === participantId);
    if (target) {
      setActiveModalUser(target);
      setIsModalOpen(true);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `Hey! Here is our bill split on IPIN for "${room?.title}": ${url}\nTap the items you ordered to claim your share & settle up! 🧾`;
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
  const userBreakdown = splitResult?.participantBreakdowns[currentUser.id];

  return (
    <div className="min-h-screen bg-slate-900 sm:bg-slate-950 flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Global Navigation Bar */}
      <Navbar
        onNewBill={() => setRoom(null)}
        onTryDemo={() => loadSampleRoom('USD')}
        isInRoom={!!room}
        roomTitle={room?.title}
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
          /* Mobile Frame: edge-to-edge on phones, sleek centered iPhone canvas on desktop */
          <div className="w-full sm:max-w-md bg-white sm:rounded-[36px] shadow-2xl flex flex-col min-h-screen sm:min-h-[820px] sm:max-h-[880px] overflow-hidden border border-slate-800/40 relative">
            
            {/* Top Navy Header & Recent Contacts (Template 3 Style) */}
            <RoomHeader
              room={room}
              splitResult={splitResult}
              currentUser={currentUser}
              onAddParticipant={handleAddParticipant}
              onSwitchUser={(id) => setCurrentUserId(id)}
              onShare={handleShare}
              onOpenTransferKeypad={() => setActiveTab('TRANSFER')}
              onOpenAddItem={() => setActiveTab('CLAIM')}
            />

            {/* Content Tabs (Ledger / Claim / Transfer / Summary) */}
            <div className="flex-1 bg-white px-4 pt-3 overflow-y-auto flex flex-col scrollbar-none">
              {activeTab === 'LEDGER' && (
                <LiveLedgerTab
                  room={room}
                  splitResult={splitResult}
                  currentUser={currentUser}
                  onOpenUploadProof={handleOpenUploadProof}
                  onOpenTransferKeypad={(p) => {
                    if (p) setCurrentUserId(p.id);
                    setActiveTab('TRANSFER');
                  }}
                  onInspectForensics={(p) => {
                    setActiveModalUser(p);
                    setIsModalOpen(true);
                  }}
                  onViewTransactionReceipt={(tx) => setSelectedTxForReceipt(tx)}
                />
              )}

              {activeTab === 'CLAIM' && (
                <ClaimItemsTab
                  room={room}
                  currentUser={currentUser}
                  onToggleClaim={handleToggleClaim}
                  onAddItem={handleAddCustomItem}
                />
              )}

              {activeTab === 'TRANSFER' && (
                <TransferKeypadScreen
                  room={room}
                  currentUser={currentUser}
                  recipientUser={room.participants.find((p) => p.isOrganizer)}
                  owedAmount={userBreakdown?.totalOwed || 0}
                  remainingAmount={userBreakdown?.amountRemaining || 0}
                  onBack={() => setActiveTab('LEDGER')}
                  onCompleteTransfer={(tx) => {
                    handleRecordTransaction(tx);
                    setActiveTab('LEDGER');
                  }}
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

            {/* Docked / Floating Mobile Bottom Navigation Bar (Template 3 Style) */}
            {activeTab !== 'TRANSFER' && (
              <BottomNav
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                onCenterAction={() => {
                  if (currentUser) {
                    setActiveModalUser(currentUser);
                    setIsModalOpen(true);
                  }
                }}
                itemCount={room.items.length}
                transactionCount={room.transactions?.length || 0}
              />
            )}
          </div>
        ) : null}
      </main>

      {/* Forensic Verification Modal (Engine B) */}
      {isModalOpen && activeModalUser && room && splitResult && (
        <PaymentProofModal
          isOpen={isModalOpen}
          participant={activeModalUser}
          room={room}
          owedAmount={
            splitResult.participantBreakdowns[activeModalUser.id]?.totalOwed || 0
          }
          remainingAmount={
            splitResult.participantBreakdowns[activeModalUser.id]?.amountRemaining || 0
          }
          onClose={() => {
            setIsModalOpen(false);
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
