-- ============================================================
-- MakersFlow: Payment, Coupon & GST migration
-- Run once in Supabase SQL Editor
-- ============================================================

-- ── 1. Add gst_rate to products (default 18%) ─────────────
alter table public.products
  add column if not exists gst_rate numeric(5,2) not null default 18;

-- ── 2. Add gst_rate to courses (default 18%) ──────────────
alter table public.courses
  add column if not exists gst_rate numeric(5,2) not null default 18;

-- ── 3. Coupons table ──────────────────────────────────────
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null default 'percentage'
    check (discount_type in ('percentage', 'flat')),
  discount_value numeric(10,2) not null,
  min_order_amount numeric(10,2) not null default 0,
  max_discount_amount numeric(10,2),       -- cap for percentage coupons
  expiry_date timestamp with time zone,
  usage_limit integer,                      -- null = unlimited
  used_count integer not null default 0,
  is_active boolean not null default true,
  applicable_product_ids text[] default '{}',
  applicable_course_ids  text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.coupons enable row level security;

drop policy if exists "Admins can manage coupons" on public.coupons;
drop policy if exists "Public can read active coupons" on public.coupons;

create policy "Public can read active coupons"
  on public.coupons for select
  using (is_active = true);

create policy "Admins can manage coupons"
  on public.coupons for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

grant all on public.coupons to anon, authenticated, service_role;

-- ── 4. Coupon usage table ─────────────────────────────────
create table if not exists public.coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid not null,
  order_id uuid,
  discount_amount numeric(10,2) not null,
  used_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.coupon_usage enable row level security;

drop policy if exists "Users can read own coupon usage" on public.coupon_usage;
drop policy if exists "Service role manages coupon usage" on public.coupon_usage;

create policy "Users can read own coupon usage"
  on public.coupon_usage for select
  using (auth.uid() = user_id);

create policy "Service role manages coupon usage"
  on public.coupon_usage for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

grant all on public.coupon_usage to anon, authenticated, service_role;

-- ── 5. Payments table ─────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  order_id uuid,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric(10,2) not null,
  currency text not null default 'INR',
  status text not null default 'pending'
    check (status in ('pending', 'captured', 'failed', 'refunded')),
  coupon_code text,
  discount_amount numeric(10,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  notes jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.payments enable row level security;

drop policy if exists "Users can read own payments" on public.payments;
drop policy if exists "Service role manages payments" on public.payments;

create policy "Users can read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Service role manages payments"
  on public.payments for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

grant all on public.payments to anon, authenticated, service_role;

-- ── 6. Add payment_id & coupon fields to orders ───────────
alter table public.orders
  add column if not exists payment_id uuid references public.payments(id),
  add column if not exists coupon_code text,
  add column if not exists discount_amount numeric(10,2) not null default 0,
  add column if not exists tax_amount numeric(10,2) not null default 0,
  add column if not exists invoice_url text;

grant all on public.orders to anon, authenticated, service_role;

-- ── 7. Reload schema ──────────────────────────────────────
notify pgrst, 'reload schema';
