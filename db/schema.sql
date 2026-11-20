-- Run this whole file once in the Neon SQL Editor (works on any Postgres 13+)

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  lang text check (lang in ('en','ro','ur')),
  currency text not null default 'PKR',
  timezone text not null default 'Asia/Karachi',
  plan text not null default 'free',
  daily_report boolean not null default true,
  last_inbound_at timestamptz,
  pending_action text,
  pending_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  target numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity, -- exact insertion order (undo removes the newest entry)
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('expense','income','saving')),
  amount numeric(14,2) not null check (amount > 0),
  category text,
  note text,
  goal_id uuid references savings_goals(id) on delete set null,
  account text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists tx_user_time on transactions (user_id, occurred_at desc);
create index if not exists tx_user_seq on transactions (user_id, seq desc);

create table if not exists processed_messages (
  wa_message_id text primary key,
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category text not null,
  monthly_limit numeric(14,2) not null check (monthly_limit > 0),
  unique (user_id, category)
);

create table if not exists category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  keyword text not null,
  category text not null,
  unique (user_id, keyword)
);

-- Optional housekeeping: dedupe table only needs recent ids
-- delete from processed_messages where created_at < now() - interval '7 days';
