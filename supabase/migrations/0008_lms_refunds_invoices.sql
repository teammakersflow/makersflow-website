-- ============================================================
-- MakersFlow: LMS Purchases, Refunds, Invoices, Order Items
-- Run in Supabase SQL Editor after 0007_payments_coupons_gst.sql
-- ============================================================

-- ── 1. course_purchases — LMS access tracking ─────────────
create table if not exists public.course_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_id uuid not null,
  order_id uuid,
  payment_id uuid,
  razorpay_payment_id text,
  amount_paid numeric(10,2) not null default 0,
  status text not null default 'active'
    check (status in ('active', 'revoked', 'refunded')),
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, course_id)
);

alter table public.course_purchases enable row level security;
drop policy if exists "Users can read own course purchases" on public.course_purchases;
drop policy if exists "Service role manages course purchases" on public.course_purchases;
create policy "Users can read own course purchases"
  on public.course_purchases for select using (auth.uid() = user_id);
create policy "Service role manages course purchases"
  on public.course_purchases for all
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant all on public.course_purchases to anon, authenticated, service_role;

-- ── 2. order_items — normalized line items ─────────────────
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text,
  course_id text,
  title text not null,
  price numeric(10,2) not null,
  quantity integer not null default 1,
  gst_rate numeric(5,2) not null default 18,
  item_type text not null default 'product' check (item_type in ('product', 'course')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.order_items enable row level security;
drop policy if exists "Users can read own order items" on public.order_items;
create policy "Users can read own order items"
  on public.order_items for select
  using (exists (select 1 from public.orders where id = order_id and user_id = auth.uid()));
create policy "Service role manages order items"
  on public.order_items for all using (auth.uid() is not null) with check (auth.uid() is not null);
grant all on public.order_items to anon, authenticated, service_role;

-- ── 3. refunds table ──────────────────────────────────────
create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id),
  order_id uuid,
  user_id uuid not null,
  razorpay_payment_id text,
  razorpay_refund_id text,
  amount numeric(10,2) not null,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  initiated_by text not null default 'admin' check (initiated_by in ('admin', 'user')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.refunds enable row level security;
drop policy if exists "Users can read own refunds" on public.refunds;
drop policy if exists "Service role manages refunds" on public.refunds;
create policy "Users can read own refunds"
  on public.refunds for select using (auth.uid() = user_id);
create policy "Service role manages refunds"
  on public.refunds for all using (auth.uid() is not null) with check (auth.uid() is not null);
grant all on public.refunds to anon, authenticated, service_role;

-- ── 4. invoices table ─────────────────────────────────────
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  payment_id uuid,
  user_id uuid not null,
  invoice_number text not null unique,
  total_amount numeric(10,2) not null,
  tax_amount numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  status text not null default 'issued' check (status in ('draft', 'issued', 'cancelled')),
  invoice_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.invoices enable row level security;
drop policy if exists "Users can read own invoices" on public.invoices;
create policy "Users can read own invoices"
  on public.invoices for select using (auth.uid() = user_id);
create policy "Service role manages invoices"
  on public.invoices for all using (auth.uid() is not null) with check (auth.uid() is not null);
grant all on public.invoices to anon, authenticated, service_role;

-- ── 5. Add stock column to products if not exists ─────────
alter table public.products
  add column if not exists stock_quantity integer not null default -1; -- -1 = unlimited

-- ── 6. DB function to increment coupon usage ──────────────
create or replace function increment_coupon_usage(coupon_id_param uuid)
returns void language plpgsql security definer as $$
begin
  update public.coupons set used_count = used_count + 1 where id = coupon_id_param;
end;
$$;

-- ── 7. DB function to decrement product stock (no-op if stock = -1 = unlimited) ──
create or replace function decrement_product_stock(product_id_param text, qty_param integer)
returns void language plpgsql security definer as $$
begin
  update public.products
  set stock_quantity = stock_quantity - qty_param
  where id = product_id_param::uuid
    and stock_quantity > 0;  -- -1 = unlimited; never go below 0
end;
$$;

notify pgrst, 'reload schema';
