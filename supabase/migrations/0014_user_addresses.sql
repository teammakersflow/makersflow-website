-- ============================================================
-- MakersFlow: saved shipping addresses
-- Run once in the Supabase SQL Editor.
--
-- SAFE TO RUN if the mobile app already created its own address
-- table under a different name — this creates a NEW table and
-- touches nothing else. The web resolves whichever table exists
-- (see src/lib/addresses.ts → ADDRESS_TABLE_CANDIDATES).
--
-- If your app already stores addresses in a table named
-- `addresses`, `shipping_addresses` or `saved_addresses`, you can
-- skip this file entirely — the web will find it.
-- ============================================================

create table if not exists public.user_addresses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  full_name     text not null,
  phone         text not null,
  email         text,
  address_line1 text not null,
  address_line2 text,
  city          text not null,
  state         text not null,
  pincode       text not null,
  country       text not null default 'India',
  label         text,
  is_default    boolean not null default false,
  created_at    timestamptz not null default timezone('utc'::text, now()),
  updated_at    timestamptz default timezone('utc'::text, now())
);

create index if not exists user_addresses_user_id_idx on public.user_addresses (user_id);

-- ── Row level security: a customer sees only their own addresses ──────────
alter table public.user_addresses enable row level security;

drop policy if exists "Users read own addresses"   on public.user_addresses;
drop policy if exists "Users insert own addresses" on public.user_addresses;
drop policy if exists "Users update own addresses" on public.user_addresses;
drop policy if exists "Users delete own addresses" on public.user_addresses;

create policy "Users read own addresses"
  on public.user_addresses for select
  using (auth.uid() = user_id);

create policy "Users insert own addresses"
  on public.user_addresses for insert
  with check (auth.uid() = user_id);

create policy "Users update own addresses"
  on public.user_addresses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own addresses"
  on public.user_addresses for delete
  using (auth.uid() = user_id);

grant all on public.user_addresses to authenticated, service_role;

-- ── Exactly one default per customer ──────────────────────────────────────
create or replace function public.enforce_single_default_address()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_default then
    update public.user_addresses
       set is_default = false
     where user_id = new.user_id
       and id <> new.id
       and is_default;
  end if;
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists user_addresses_single_default on public.user_addresses;

create trigger user_addresses_single_default
  before insert or update on public.user_addresses
  for each row execute function public.enforce_single_default_address();

notify pgrst, 'reload schema';
