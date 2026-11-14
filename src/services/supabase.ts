import { createClient } from '@supabase/supabase-js';
import { Room, LineItem, Participant, Transaction } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lnuohtiskhpbxpvrlocc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FkzbFUUtr1TABOY8nZAwJw_mRub8ftA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Transforms Database Records into our application Room interface
 */
export async function fetchRoomFromDb(roomId: string): Promise<Room | null> {
  try {
    // 1. Fetch Room metadata
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !roomData) {
      console.warn(`[Supabase] Room ${roomId} not found or error:`, roomError);
      return null;
    }

    // 2. Fetch Line Items
    const { data: itemsData, error: itemsError } = await supabase
      .from('line_items')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    // 3. Fetch Participants
    const { data: participantsData, error: partError } = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    // 4. Fetch Transactions
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    const items: LineItem[] = (itemsData || []).map((it) => ({
      id: it.id,
      rawName: it.raw_name,
      cleanName: it.clean_name,
      quantity: it.quantity,
      unitPrice: Number(it.unit_price),
      totalPrice: Number(it.total_price),
      claimedBy: it.claimed_by || [],
    }));

    const participants: Participant[] = (participantsData || []).map((p) => {
      const metadata = (p.payment_proof as any)?.userMetadata;
      return {
        id: p.id,
        name: p.name,
        avatarColor: p.avatar_color,
        isOrganizer: p.is_organizer,
        paymentStatus: p.payment_status,
        paymentProof: p.payment_proof || undefined,
        phone: metadata?.phone,
        handle: metadata?.handle,
      };
    });

    const transactions: Transaction[] = (txData || []).map((tx) => ({
      id: tx.id,
      senderId: tx.sender_id,
      senderName: tx.sender_name,
      recipientName: tx.recipient_name,
      amount: Number(tx.amount),
      currency: tx.currency,
      method: tx.method,
      referenceId: tx.reference_id,
      timestamp: tx.timestamp,
      status: tx.status,
      proofUrl: tx.proof_url || undefined,
      forensics: tx.forensics || undefined,
      notes: tx.notes || undefined,
    }));

    return {
      id: roomData.id,
      title: roomData.title,
      currency: roomData.currency,
      currencySymbol: roomData.currency_symbol,
      organizer: roomData.organizer,
      subtotal: Number(roomData.subtotal),
      tax: Number(roomData.tax),
      serviceFee: Number(roomData.service_fee),
      deliveryFee: Number(roomData.delivery_fee),
      discount: Number(roomData.discount),
      grandTotal: Number(roomData.grand_total),
      receiptImageUrl: roomData.receipt_image_url || undefined,
      createdAt: roomData.created_at,
      items,
      participants,
      transactions,
    };
  } catch (err) {
    console.error('[Supabase] Failed to fetch room:', err);
    return null;
  }
}

/**
 * Creates a new Room with items and participants in Supabase
 */
export async function saveNewRoomToDb(room: Room): Promise<boolean> {
  try {
    // 1. Insert room record
    const { error: roomErr } = await supabase.from('rooms').upsert({
      id: room.id,
      title: room.title,
      currency: room.currency,
      currency_symbol: room.currencySymbol,
      organizer: room.organizer,
      subtotal: room.subtotal,
      tax: room.tax,
      service_fee: room.serviceFee,
      delivery_fee: room.deliveryFee,
      discount: room.discount,
      grand_total: room.grandTotal,
      receipt_image_url: room.receiptImageUrl || null,
      created_at: room.createdAt || new Date().toISOString(),
    });

    if (roomErr) throw roomErr;

    // 2. Insert items
    if (room.items && room.items.length > 0) {
      const itemsPayload = room.items.map((it) => ({
        id: it.id,
        room_id: room.id,
        raw_name: it.rawName,
        clean_name: it.cleanName,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        total_price: it.totalPrice,
        claimed_by: it.claimedBy || [],
      }));

      const { error: itemsErr } = await supabase.from('line_items').upsert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }

    // 3. Insert participants
    if (room.participants && room.participants.length > 0) {
      const partsPayload = room.participants.map((p) => ({
        id: p.id,
        room_id: room.id,
        name: p.name,
        avatar_color: p.avatarColor,
        is_organizer: !!p.isOrganizer,
        payment_status: p.paymentStatus,
        payment_proof: p.paymentProof || null,
      }));

      const { error: partErr } = await supabase.from('participants').upsert(partsPayload);
      if (partErr) throw partErr;
    }

    // 4. Insert transactions if any
    if (room.transactions && room.transactions.length > 0) {
      const txPayload = room.transactions.map((tx) => ({
        id: tx.id,
        room_id: room.id,
        sender_id: tx.senderId,
        sender_name: tx.senderName,
        recipient_name: tx.recipientName,
        amount: tx.amount,
        currency: tx.currency,
        method: tx.method,
        reference_id: tx.referenceId,
        timestamp: tx.timestamp,
        status: tx.status,
        proof_url: tx.proofUrl || null,
        forensics: tx.forensics || null,
        notes: tx.notes || null,
      }));

      const { error: txErr } = await supabase.from('transactions').upsert(txPayload);
      if (txErr) throw txErr;
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Failed to save room:', err);
    return false;
  }
}

/**
 * Updates an item's claimed_by array
 */
export async function updateItemClaimInDb(itemId: string, claimedBy: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('line_items')
      .update({ claimed_by: claimedBy })
      .eq('id', itemId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to update item claim:', err);
    return false;
  }
}

/**
 * Adds a new participant to a room
 */
export async function addParticipantToDb(roomId: string, participant: Participant): Promise<boolean> {
  try {
    const existingProof = (participant.paymentProof as any) || {};
    const updatedProof = {
      ...existingProof,
      userMetadata: {
        phone: participant.phone || '',
        handle: participant.handle || '',
      },
    };

    const { error } = await supabase.from('participants').insert({
      id: participant.id,
      room_id: roomId,
      name: participant.name,
      avatar_color: participant.avatarColor,
      is_organizer: !!participant.isOrganizer,
      payment_status: participant.paymentStatus,
      payment_proof: updatedProof,
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to add participant:', err);
    return false;
  }
}

export interface RegisteredUser {
  id: string;
  name: string;
  phone?: string;
  handle?: string;
  avatarColor: string;
}

/**
 * Searches the Supabase participant directory for existing registered friends
 */
export async function searchRegisteredUsers(query: string): Promise<RegisteredUser[]> {
  try {
    const cleanQuery = query.trim().replace(/^@/, '');
    if (!cleanQuery) return [];

    const { data, error } = await supabase
      .from('participants')
      .select('id, name, avatar_color, payment_proof')
      .ilike('name', `%${cleanQuery}%`)
      .limit(15);

    if (error || !data) return [];

    const seen = new Set<string>();
    const users: RegisteredUser[] = [];

    for (const row of data) {
      const norm = row.name.toLowerCase().trim();
      if (!seen.has(norm)) {
        seen.add(norm);
        const metadata = (row.payment_proof as any)?.userMetadata;
        users.push({
          id: row.id,
          name: row.name,
          avatarColor: row.avatar_color || 'from-emerald-500 to-teal-600',
          phone: metadata?.phone || undefined,
          handle: metadata?.handle || undefined,
        });
      }
    }

    return users;
  } catch (err) {
    console.error('[Supabase] searchRegisteredUsers error:', err);
    return [];
  }
}

/**
 * Adds a custom line item to a room and updates room totals
 */
export async function addCustomItemToDb(
  roomId: string,
  item: LineItem,
  updatedTotals: { subtotal: number; tax: number; serviceFee: number; grandTotal: number }
): Promise<boolean> {
  try {
    // 1. Insert item
    const { error: itemErr } = await supabase.from('line_items').insert({
      id: item.id,
      room_id: roomId,
      raw_name: item.rawName,
      clean_name: item.cleanName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      claimed_by: item.claimedBy || [],
    });

    if (itemErr) throw itemErr;

    // 2. Update room totals
    const { error: roomErr } = await supabase
      .from('rooms')
      .update({
        subtotal: updatedTotals.subtotal,
        tax: updatedTotals.tax,
        service_fee: updatedTotals.serviceFee,
        grand_total: updatedTotals.grandTotal,
      })
      .eq('id', roomId);

    if (roomErr) throw roomErr;
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to add custom item:', err);
    return false;
  }
}

/**
 * Records a transaction and updates participant payment status
 */
export async function recordTransactionToDb(
  roomId: string,
  tx: Transaction,
  participantUpdate?: { participantId: string; status: string; proof?: any }
): Promise<boolean> {
  try {
    // 1. Insert transaction
    const { error: txErr } = await supabase.from('transactions').insert({
      id: tx.id,
      room_id: roomId,
      sender_id: tx.senderId,
      sender_name: tx.senderName,
      recipient_name: tx.recipientName,
      amount: tx.amount,
      currency: tx.currency,
      method: tx.method,
      reference_id: tx.referenceId,
      timestamp: tx.timestamp,
      status: tx.status,
      proof_url: tx.proofUrl || null,
      forensics: tx.forensics || null,
      notes: tx.notes || null,
    });

    if (txErr) throw txErr;

    // 2. Update participant if specified
    if (participantUpdate) {
      const { error: partErr } = await supabase
        .from('participants')
        .update({
          payment_status: participantUpdate.status,
          payment_proof: participantUpdate.proof || null,
        })
        .eq('id', participantUpdate.participantId)
        .eq('room_id', roomId);

      if (partErr) throw partErr;
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Failed to record transaction:', err);
    return false;
  }
}

/**
 * Subscribes to live multiplayer updates via Supabase Realtime Channels
 */
export function subscribeToRoom(roomId: string, onUpdate: () => void) {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'line_items', filter: `room_id=eq.${roomId}` },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions', filter: `room_id=eq.${roomId}` },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      () => onUpdate()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

