-- Adds a per-buyer house size, used to compute prices for options
-- that are priced per square foot.
-- Run in the Supabase SQL editor (Project → SQL Editor → New query).

alter table buyers add column if not exists sqft integer;
