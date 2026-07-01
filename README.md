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
   - `ADMIN_SECRET` — willekeurige string; beveiligt de `/api/admin/*` routes (o.a. bronnen seeden).
   - `API_FOOTBALL_KEY` — optioneel, voor het bijwerken van de spelersselectie.
2. Installeer dependencies: `npm install`
3. Draai de Supabase-migraties in `supabase/migrations/` tegen je project (via de Supabase CLI of SQL editor).
4. `npm run dev`

## Bronnen seeden

De 60+ bronnen staan als data in `lib/sources/sources.seed.ts`. Deze worden naar de
`sources`-tabel gesynchroniseerd via `POST /api/admin/seed-sources` (beveiligd met
`ADMIN_SECRET`), niet via een los script — zo hoef je npm niet lokaal te draaien.

**Eenmalige setup:**
1. Zet `ADMIN_SECRET` in Vercel (Project → Settings → Environment Variables) op een
   willekeurige, geheime waarde.
2. Zet in de GitHub-repo (Settings → Secrets and variables → Actions):
   - Secret `ADMIN_SECRET` — dezelfde waarde als in Vercel.
   - Variable `APP_URL` — je Vercel-productie-URL (bv. `https://ossenworst.vercel.app`).

**Seeden/bijwerken:** GitHub → Actions → workflow **"Seed sources"** → *Run workflow*.
Dit is nodig na het opzetten van de database en telkens wanneer `sources.seed.ts`
wijzigt (nieuwe bron toegevoegd, tier aangepast, etc.). Bestaande `enabled`-vlaggen
in de database blijven staan — de seed overschrijft alleen naam/url/tier/taal/
fetch-methode, niet je handmatige activaties.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — ESLint
