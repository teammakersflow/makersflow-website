-- ============================================================
-- MakersFlow: Fix Web RLS Security Policies
-- Migration: 0011_fix_admin_rls_web.sql
-- Verbatim mobile `public.is_admin()` (language sql, stable, definer),
-- grants to authenticated + anon, replaces fake `auth.uid() is not null`
-- admin checks from 0006-0009, and revokes table write privileges
-- on `payments` & `order_items` for anon & authenticated roles.
-- ============================================================

-- ── 0. Exact Mobile `public.is_admin()` Function ───────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- ── 1. Announcements (0006) ─────────────────────────────────
drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements"
  on public.announcements for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 2. Coupons & Coupon Usage (0007) ────────────────────────
drop policy if exists "Admins can manage coupons" on public.coupons;
create policy "Admins can manage coupons"
  on public.coupons for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Service role manages coupon usage" on public.coupon_usage;
create policy "Admins can manage coupon usage"
  on public.coupon_usage for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 3. Payments (0007) ──────────────────────────────────────
-- Remove ALL write access for authenticated users.
drop policy if exists "Service role manages payments" on public.payments;
revoke insert, update, delete on table public.payments from anon, authenticated;

-- ── 4. Course Purchases (0008) ─────────────────────────────
drop policy if exists "Service role manages course purchases" on public.course_purchases;
create policy "Admins can manage course purchases"
  on public.course_purchases for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 5. Order Items (0008) ───────────────────────────────────
-- Remove ALL write access for authenticated users.
drop policy if exists "Service role manages order items" on public.order_items;
revoke insert, update, delete on table public.order_items from anon, authenticated;

-- ── 6. Refunds (0008) ───────────────────────────────────────
drop policy if exists "Service role manages refunds" on public.refunds;
create policy "Admins can manage refunds"
  on public.refunds for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 7. Invoices (0008) ──────────────────────────────────────
drop policy if exists "Service role manages invoices" on public.invoices;
create policy "Admins can manage invoices"
  on public.invoices for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 8. Settings (0009) ──────────────────────────────────────
drop policy if exists "Admins can manage settings" on public.settings;
create policy "Admins can manage settings"
  on public.settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 9. Schema Reload ────────────────────────────────────────
notify pgrst, 'reload schema';
