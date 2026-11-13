-- ========================================================
-- IPIN DATABASE SCHEMA (Supabase PostgreSQL)
-- Zero-CAC Multiplayer Bill Split & Forensic Verification
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Rooms Table
create table if not exists public.rooms (
  id text primary key,
  title text not null,
  currency text not null default 'USD',
  currency_symbol text not null default '$',
  organizer jsonb not null,
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  service_fee numeric not null default 0,
  delivery_fee numeric not null default 0,
  discount numeric not null default 0,
  grand_total numeric not null default 0,
  receipt_image_url text,
  created_at timestamp with time zone default now()
);

-- 2. Line Items Table
create table if not exists public.line_items (
  id text primary key,
  room_id text references public.rooms(id) on delete cascade,
  raw_name text not null,
  clean_name text not null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  claimed_by text[] not null default '{}',
  created_at timestamp with time zone default now()
);

-- 3. Participants Table
create table if not exists public.participants (
  id text primary key,
  room_id text references public.rooms(id) on delete cascade,
  name text not null,
  avatar_color text not null default 'from-blue-600 to-indigo-700',
  is_organizer boolean not null default false,
  payment_status text not null default 'UNPAID',
  payment_proof jsonb,
  created_at timestamp with time zone default now()
);

-- 4. Transactions Table
create table if not exists public.transactions (
  id text primary key,
  room_id text references public.rooms(id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  recipient_name text not null,
  amount numeric not null,
  currency text not null default 'USD',
  method text not null default 'DIRECT_TRANSFER',
  reference_id text not null,
  timestamp text not null,
  status text not null default 'COMPLETED',
  proof_url text,
  forensics jsonb,
  notes text,
  created_at timestamp with time zone default now()
);

-- Create index on foreign keys for high performance
create index if not exists idx_line_items_room_id on public.line_items(room_id);
create index if not exists idx_participants_room_id on public.participants(room_id);
create index if not exists idx_transactions_room_id on public.transactions(room_id);

-- Enable Row Level Security (RLS)
alter table public.rooms enable row level security;
alter table public.line_items enable row level security;
alter table public.participants enable row level security;
alter table public.transactions enable row level security;

-- Public Access Policies (Zero-Signup Multiplayer Access via Room ID)
drop policy if exists "Public read rooms" on public.rooms;
create policy "Public read rooms" on public.rooms for select using (true);
drop policy if exists "Public insert rooms" on public.rooms;
create policy "Public insert rooms" on public.rooms for insert with check (true);
drop policy if exists "Public update rooms" on public.rooms;
create policy "Public update rooms" on public.rooms for update using (true);

drop policy if exists "Public read line_items" on public.line_items;
create policy "Public read line_items" on public.line_items for select using (true);
drop policy if exists "Public insert line_items" on public.line_items;
create policy "Public insert line_items" on public.line_items for insert with check (true);
drop policy if exists "Public update line_items" on public.line_items;
create policy "Public update line_items" on public.line_items for update using (true);
drop policy if exists "Public delete line_items" on public.line_items;
create policy "Public delete line_items" on public.line_items for delete using (true);

drop policy if exists "Public read participants" on public.participants;
create policy "Public read participants" on public.participants for select using (true);
drop policy if exists "Public insert participants" on public.participants;
create policy "Public insert participants" on public.participants for insert with check (true);
drop policy if exists "Public update participants" on public.participants;
create policy "Public update participants" on public.participants for update using (true);

drop policy if exists "Public read transactions" on public.transactions;
create policy "Public read transactions" on public.transactions for select using (true);
drop policy if exists "Public insert transactions" on public.transactions;
create policy "Public insert transactions" on public.transactions for insert with check (true);
drop policy if exists "Public update transactions" on public.transactions;
create policy "Public update transactions" on public.transactions for update using (true);

-- Enable Supabase Realtime for live WebSocket state sync
do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.line_items;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.participants;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.transactions;
exception when others then null;
end $$;
