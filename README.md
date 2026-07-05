# MakersFlow Web

The web companion to the **MakersFlow** learning platform — an ed-tech app for school-age makers covering Robotics, AI/ML, Electronics, IoT, and Programming.

## Framework

This is a **[TanStack Start](https://tanstack.com/start)** application — not Next.js.

TanStack Start is a full-stack React framework built on top of:

- **TanStack Router** — file-based, type-safe client routing (`src/routes/`)
- **Vite 8** — build tool and dev server (`vite dev` / `vite build`)
- **Nitro** — server engine (Cloudflare Workers-compatible `fetch` handler in `src/server.ts`)
- **`@tanstack/react-start`** — SSR middleware and server entry (`src/start.ts`)

## Tech Stack

| Layer         | Technology                                                    |
| ------------- | ------------------------------------------------------------- |
| Framework     | TanStack Start v1 + TanStack Router v1                        |
| UI            | React 19, Tailwind CSS v4, Radix UI, Framer Motion            |
| Data fetching | TanStack Query v5                                             |
| Auth & DB     | Supabase (shared project — see below)                         |
| Payments      | Razorpay (via Supabase Edge Function `create-razorpay-order`) |
| Forms         | React Hook Form + Zod                                         |
| Charts        | Recharts                                                      |
| Icons         | Lucide React                                                  |
| Deployment    | Cloudflare Workers (via Nitro adapter)                        |

## Shared Supabase Project

This web app shares **the same Supabase project** as the **MakersFlow mobile app** (React Native / Expo).

- Auth, RLS policies, and all tables (`courses`, `products`, `enrollments`, `orders`, `lesson_progress`, `streaks`, `profiles`, …) are **shared**.
- Do not create a new Supabase project for local development — connect to the real project using the credentials below.
- Do not drop or alter existing tables — the mobile app depends on the same schema.
- The live schema baseline is captured in `supabase/migrations/0001_baseline.sql`.

### Shared Supabase Project Auth Session

This application shares the same Supabase project (`oodqutwsljhvuyotuthu`) as the MakersFlow Admin panel.
Since they run on different ports/domains, they maintain separate local storage keys:
- **Website storage key:** `makersflow.auth`
- **Admin storage key:** `sb-oodqutwsljhvuyotuthu-auth-token` (default)

Access to the admin panel is strictly restricted to authenticated users with `role = 'admin'` in the `profiles` table.
To set a user as admin, run the following SQL inside the Supabase SQL editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
```

## Required Environment Variables

Copy `.env.example` to `.env` and fill in the real values:

```
cp .env.example .env
```

| Variable                        | Description                                                   |
| ------------------------------- | ------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Your Supabase project URL (`https://<ref>.supabase.co`)       |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (safe to expose in the browser) |
| `VITE_RAZORPAY_KEY_ID`          | Razorpay publishable key ID (`rzp_live_…` or `rzp_test_…`)    |

> The Supabase **service role key** and **Razorpay secret key** are never used client-side. They belong only in Supabase Edge Function secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`), set via the Supabase dashboard.

## Running Locally

**Prerequisites:** Node.js 20+ and either `npm`, `pnpm`, or `bun`.

```bash
# 1. Install dependencies
npm install          # or: pnpm install / bun install

# 2. Set up environment
cp .env.example .env
# Edit .env with real Supabase + Razorpay credentials

# 3. Start the dev server
npm run dev          # → http://localhost:3000
```

### Other scripts

```bash
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview the production build locally
npm run lint         # ESLint
npm run format       # Prettier
npm test             # Vitest unit tests
```

## Project Structure

```
src/
├── routes/          # File-based pages (TanStack Router)
├── components/      # Reusable UI components, grouped by feature
│   ├── checkout/
│   ├── course/
│   ├── dashboard/
│   ├── learn/
│   ├── profile/
│   ├── progress/
│   └── ...
├── hooks/           # Shared React hooks (useRequireAuth, …)
├── lib/             # Data-fetching helpers, cart logic, utilities
├── integrations/
│   └── supabase/    # Typed Supabase client + auth helpers
├── start.ts         # TanStack Start server entry (middleware)
└── server.ts        # Nitro/Cloudflare Workers fetch handler
supabase/
├── functions/       # Edge Functions (create-razorpay-order, …)
└── migrations/      # Schema baseline (read-only snapshot)
```
