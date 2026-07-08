-- Meadows Selections Portal — schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

create extension if not exists pgcrypto;

create table if not exists buyers (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  community text not null default 'Meadows at Briarcliff',
  lot text not null,
  family_name text not null,
  signer_name text,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists selections (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references buyers(id) on delete cascade,
  category_key text not null,
  option_id text not null,
  updated_at timestamptz not null default now(),
  unique (buyer_id, category_key)
);

create table if not exists upgrade_selections (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references buyers(id) on delete cascade,
  group_id text not null,
  item_ids text[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (buyer_id, group_id)
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references buyers(id) on delete cascade,
  category_id text not null,
  author text not null check (author in ('buyer', 'builder')),
  text text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: enabled with no policies. All access goes through
-- Next.js server code using the service_role key, which bypasses RLS.
-- This means the anon/public API key (if ever exposed to the browser)
-- cannot read or write any of this data.
alter table buyers enable row level security;
alter table selections enable row level security;
alter table upgrade_selections enable row level security;
alter table notes enable row level security;
