-- ============================================================
-- Challenge programmes: registrations + innovation submissions
--
-- Powers the two public pages:
--   /challenges/30-day      -> challenge_registrations
--   /challenges/innovation  -> challenge_submissions
--
-- Both forms are open to visitors who are NOT signed in, so the
-- insert policies grant `anon`. Reading is deliberately withheld
-- from anon so entrants cannot list each other's details — read
-- them from the Supabase dashboard or an admin client.
-- ============================================================

-- ── 30-Day Innovation Challenge registrations ───────────────────────────────
create table if not exists public.challenge_registrations (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  age              integer,
  email            text not null,
  phone            text not null,
  institution      text not null,
  class_year       text,
  city             text,
  project_category text,
  motivation       text,
  created_at       timestamptz not null default timezone('utc'::text, now())
);

create index if not exists challenge_registrations_email_idx
  on public.challenge_registrations (email);

alter table public.challenge_registrations enable row level security;

drop policy if exists "Anyone can register for the challenge" on public.challenge_registrations;
create policy "Anyone can register for the challenge"
  on public.challenge_registrations for insert
  to anon, authenticated
  with check (true);

-- ── MakersFlow Innovation Challenge 2026 submissions ────────────────────────
create table if not exists public.challenge_submissions (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  age             integer,
  institution     text,
  kit_name        text,
  project_title   text not null,
  description     text not null,
  problem_solved  text,
  inspiration     text,
  video_url       text,
  image_urls      text[] not null default '{}',
  -- Photos are only shown on the Future Innovators Wall with permission.
  feature_consent boolean not null default false,
  status          text not null default 'submitted',
  created_at      timestamptz not null default timezone('utc'::text, now())
);

create index if not exists challenge_submissions_created_idx
  on public.challenge_submissions (created_at desc);

alter table public.challenge_submissions enable row level security;

drop policy if exists "Anyone can submit an innovation" on public.challenge_submissions;
create policy "Anyone can submit an innovation"
  on public.challenge_submissions for insert
  to anon, authenticated
  with check (true);

grant insert on public.challenge_registrations to anon, authenticated;
grant insert on public.challenge_submissions   to anon, authenticated;
grant all    on public.challenge_registrations to service_role;
grant all    on public.challenge_submissions   to service_role;

-- ── Storage for submitted videos and photos ─────────────────────────────────
insert into storage.buckets (id, name, public)
values ('challenge-uploads', 'challenge-uploads', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can upload challenge media" on storage.objects;
create policy "Anyone can upload challenge media"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'challenge-uploads');

drop policy if exists "Challenge media is publicly readable" on storage.objects;
create policy "Challenge media is publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'challenge-uploads');

notify pgrst, 'reload schema';
