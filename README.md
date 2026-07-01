# Ossenworst Manager

Mobile-first Ajax-nieuwsaggregator gecombineerd met Football Manager-achtige features
(tactiek, transferlijst, verlanglijst). Zie `PLAN.md` voor de volledige architectuur.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Supabase (Postgres, Auth, RLS)
- Claude API (categorisering, merge-logica, vertaling, samenvattingen)
- Vercel (hosting + Cron)

## Setup

1. Kopieer `.env.example` naar `.env.local` en vul de waarden in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — uit je Supabase-project settings.
   - `SUPABASE_SERVICE_ROLE_KEY` — alleen server-side gebruikt (pipeline, admin), nooit naar de client sturen.
   - `ANTHROPIC_API_KEY` — voor merge/categorisering/vertaling/samenvatting.
   - `CRON_SECRET` — willekeurige string; beveiligt de `/api/cron/*` routes tegen ongeautoriseerde aanroepen.
   - `API_FOOTBALL_KEY` — optioneel, voor het bijwerken van de spelersselectie.
2. Installeer dependencies: `npm install`
3. Draai de Supabase-migraties in `supabase/migrations/` tegen je project (via de Supabase CLI of SQL editor).
4. Seed de bronnen: zie `lib/sources/sources.seed.ts`.
5. `npm run dev`

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — ESLint
