-- TaskBuddy schema — wallet, chat, and calendar subsystems
-- Source of truth: backend/BACKEND_SCHEMA.md §15 (added alongside this migration).
--
-- These three features were originally listed under "Out of Scope" in the
-- schema spec; they are now in scope to back the mobile app's Wallet, Chat, and
-- Calendar screens. This migration is additive — it touches none of the
-- marketplace/recommendation tables.
--
-- Conventions mirror 0001–0003: uuid PKs (gen_random_uuid()), timestamptz with
-- created_at/updated_at, snake_case, RLS enabled on every table (the NestJS API
-- uses the service-role key which bypasses RLS; policies are defense-in-depth).

-- ===========================================================================
-- 1. Enums
-- ===========================================================================
create type wallet_txn_direction as enum ('credit', 'debit');
create type wallet_txn_status    as enum ('pending', 'completed', 'failed');
create type booking_status        as enum ('scheduled', 'completed', 'cancelled');

-- ===========================================================================
-- 2. Wallet — a per-user ledger. There is no real payment gateway; balance is
--    derived from completed transactions (computed in the API, not stored).
-- ===========================================================================
create table wallet_transactions (
    id          uuid primary key default gen_random_uuid(),
    profile_id  uuid not null references profiles (id) on delete cascade,
    direction   wallet_txn_direction not null,
    status      wallet_txn_status not null default 'completed',
    amount      numeric(12,2) not null check (amount > 0),   -- always positive; direction carries the sign
    title       text not null check (char_length(title) between 1 and 120),
    -- Optional link to the job that produced this transaction (job payment,
    -- provider payout, platform fee, etc.). Kept nullable for top-ups/withdrawals.
    job_id      uuid references jobs (id) on delete set null,
    created_at  timestamptz not null default now()
);

create index idx_wallet_transactions_profile
    on wallet_transactions (profile_id, created_at desc);

-- ===========================================================================
-- 3. Chat — one conversation per job, between its client and (assigned) provider.
-- ===========================================================================
create table conversations (
    id          uuid primary key default gen_random_uuid(),
    job_id      uuid not null unique references jobs (id) on delete cascade,
    client_id   uuid not null references profiles (id) on delete cascade,
    provider_id uuid not null references profiles (id) on delete cascade,
    last_message_at timestamptz,                 -- for ordering the conversation list
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    constraint chk_conversation_participants check (client_id <> provider_id)
);

create index idx_conversations_client   on conversations (client_id, last_message_at desc);
create index idx_conversations_provider on conversations (provider_id, last_message_at desc);

create table messages (
    id              uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references conversations (id) on delete cascade,
    sender_id       uuid not null references profiles (id) on delete cascade,
    body            text not null check (char_length(body) between 1 and 1000),
    read_at         timestamptz,                 -- set when the recipient reads it
    created_at      timestamptz not null default now()
);

create index idx_messages_conversation on messages (conversation_id, created_at);

-- Keep conversations.last_message_at in sync so the list can order by recency.
create or replace function bump_conversation_last_message()
returns trigger
language plpgsql as $$
begin
    update conversations
       set last_message_at = new.created_at,
           updated_at = now()
     where id = new.conversation_id;
    return new;
end;
$$;

create trigger trg_messages_bump_conversation
    after insert on messages
    for each row execute function bump_conversation_last_message();

-- ===========================================================================
-- 4. Calendar — a provider's scheduled bookings for assigned jobs.
--    The base marketplace treats jobs as ASAP; a booking adds an explicit
--    date/time + duration so the provider's calendar has something to show.
-- ===========================================================================
create table bookings (
    id          uuid primary key default gen_random_uuid(),
    job_id      uuid not null unique references jobs (id) on delete cascade,
    provider_id uuid not null references profiles (id) on delete cascade,
    client_id   uuid not null references profiles (id) on delete cascade,
    status      booking_status not null default 'scheduled',
    scheduled_at     timestamptz not null,
    duration_minutes integer not null default 120 check (duration_minutes > 0),
    notes       text check (char_length(notes) <= 500),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index idx_bookings_provider on bookings (provider_id, scheduled_at);
create index idx_bookings_client   on bookings (client_id, scheduled_at);

-- ===========================================================================
-- 5. updated_at triggers (reuse set_updated_at() from 0002)
-- ===========================================================================
create trigger trg_conversations_updated_at
    before update on conversations
    for each row execute function set_updated_at();

create trigger trg_bookings_updated_at
    before update on bookings
    for each row execute function set_updated_at();

-- ===========================================================================
-- 6. Row Level Security (defense-in-depth; API uses service-role key)
-- ===========================================================================
alter table wallet_transactions enable row level security;

create policy wallet_txn_owner_read on wallet_transactions
    for select using (profile_id = auth.uid());

alter table conversations enable row level security;

create policy conversations_participant_read on conversations
    for select using (client_id = auth.uid() or provider_id = auth.uid());

alter table messages enable row level security;

create policy messages_participant_read on messages
    for select using (
        exists (
            select 1 from conversations c
             where c.id = conversation_id
               and (c.client_id = auth.uid() or c.provider_id = auth.uid())
        )
    );

create policy messages_participant_insert on messages
    for insert with check (
        sender_id = auth.uid()
        and exists (
            select 1 from conversations c
             where c.id = conversation_id
               and (c.client_id = auth.uid() or c.provider_id = auth.uid())
        )
    );

alter table bookings enable row level security;

create policy bookings_participant_read on bookings
    for select using (provider_id = auth.uid() or client_id = auth.uid());
