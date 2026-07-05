-- Admin-broadcast announcements table
-- Separate from per-user notifications table

create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  message    text not null,
  type       text not null default 'info' check (type in ('info','success','warning','announcement')),
  link_url   text,
  status     text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamp with time zone default timezone('utc', now()) not null,
  updated_at timestamp with time zone
);

alter table public.announcements enable row level security;

-- Anyone can read published announcements
drop policy if exists "Public can read published announcements" on public.announcements;
create policy "Public can read published announcements"
  on public.announcements for select
  using (status = 'published');

-- Any logged-in user can manage (admin is the only one who logs in)
drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements"
  on public.announcements for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

grant all on public.announcements to anon, authenticated, service_role;
notify pgrst, 'reload schema';
