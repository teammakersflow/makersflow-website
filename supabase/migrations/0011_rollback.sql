-- ============================================================
-- MakersFlow: Rollback Web RLS Security Policies Migration
-- Rollback Migration: 0011_rollback.sql
-- Restores prior 0006-0009 policies while preserving `is_admin()`
-- grants for authenticated and anon.
-- ============================================================

-- ── 0. Preserve `public.is_admin()` Grants ──────────────────
grant execute on function public.is_admin() to authenticated, anon;

-- ── 1. Announcements (0006) ─────────────────────────────────
drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements"
  on public.announcements for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── 2. Coupons & Coupon Usage (0007) ────────────────────────
drop policy if exists "Admins can manage coupons" on public.coupons;
create policy "Admins can manage coupons"
  on public.coupons for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Admins can manage coupon usage" on public.coupon_usage;
drop policy if exists "Service role manages coupon usage" on public.coupon_usage;
create policy "Service role manages coupon usage"
  on public.coupon_usage for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── 3. Payments (0007) ──────────────────────────────────────
grant insert, update, delete on table public.payments to authenticated;
drop policy if exists "Service role manages payments" on public.payments;
create policy "Service role manages payments"
  on public.payments for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── 4. Course Purchases (0008) ─────────────────────────────
drop policy if exists "Admins can manage course purchases" on public.course_purchases;
drop policy if exists "Service role manages course purchases" on public.course_purchases;
create policy "Service role manages course purchases"
  on public.course_purchases for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── 5. Order Items (0008) ───────────────────────────────────
grant insert, update, delete on table public.order_items to authenticated;
drop policy if exists "Service role manages order items" on public.order_items;
create policy "Service role manages order items"
  on public.order_items for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── 6. Refunds (0008) ───────────────────────────────────────
drop policy if exists "Admins can manage refunds" on public.refunds;
drop policy if exists "Service role manages refunds" on public.refunds;
create policy "Service role manages refunds"
  on public.refunds for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── 7. Invoices (0008) ──────────────────────────────────────
drop policy if exists "Admins can manage invoices" on public.invoices;
drop policy if exists "Service role manages invoices" on public.invoices;
create policy "Service role manages invoices"
  on public.invoices for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── 8. Settings (0009) ──────────────────────────────────────
drop policy if exists "Admins can manage settings" on public.settings;
create policy "Admins can manage settings"
  on public.settings for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ── 9. Schema Reload ────────────────────────────────────────
notify pgrst, 'reload schema';
