-- ============================================================
-- MakersFlow: Configurable Settings Table
-- Run in Supabase SQL Editor
-- ============================================================

create table if not exists public.settings (
  key   text primary key,
  value text not null,
  label text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Default shipping settings
insert into public.settings (key, value, label) values
  ('shipping_fee',             '49',  'Standard shipping fee (₹)'),
  ('shipping_fee_remote',      '149', 'Remote area shipping fee (₹) — NE India, Islands, J&K'),
  ('free_shipping_threshold',  '999', 'Free shipping above this amount (₹)')
on conflict (key) do nothing;

-- RLS
alter table public.settings enable row level security;

drop policy if exists "Public can read settings" on public.settings;
drop policy if exists "Admins can manage settings" on public.settings;

create policy "Public can read settings"
  on public.settings for select using (true);

create policy "Admins can manage settings"
  on public.settings for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

grant all on public.settings to anon, authenticated, service_role;

notify pgrst, 'reload schema';
