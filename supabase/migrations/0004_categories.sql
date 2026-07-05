create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

create policy "Public can read categories"
  on public.categories for select using (true);

create policy "Admins can manage categories"
  on public.categories for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
