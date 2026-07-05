create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.news enable row level security;

-- Anyone can read published news
create policy "Public can read published news"
  on public.news for select
  using (status = 'published');

-- Only admins can write (via service role from admin panel)
create policy "Admins can manage news"
  on public.news for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
