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
in de database blijven standaard staan — de seed overschrijft alleen naam/url/tier/
taal/fetch-methode, niet je handmatige activaties. Wil je juist dat de
`enabled`-vlaggen uit de seed leidend zijn (bijvoorbeeld omdat bronnen in de seed
zijn aangezet nádat ze al als disabled in de database stonden), vink dan bij
*Run workflow* de optie **overwrite_enabled** aan.

## Nieuwsaggregatiepipeline (Fase 1)

Vercel Cron draait op het Hobby-plan maar 1x per dag (en onnauwkeurig binnen dat
uur) — te traag voor een nieuwsfeed. De pipeline wordt daarom, net als de
bronnen-seed, getriggerd door een **GitHub Action op een schedule** die
`POST /api/cron/tick` aanroept (beveiligd met `CRON_SECRET`). Die route enqueued
zelf due `fetch_source`-jobs en verwerkt de wachtrij binnen een tijdsbudget
(~45s, meerdere jobs parallel). Blijft er werk over, dan **tickt de workflow
zelf in een lus door** tot de queue leeg is (met een iteratieplafond). De route
probeert daarnaast zichzelf opnieuw te triggeren (self-chaining), maar Vercel's
recursie-bescherming kan die self-requests blokkeren — de Action-lus is dus het
primaire mechanisme.

**Status inzien:** GitHub → Actions → workflow **"Pipeline status"** → *Run
workflow* toont in de run-samenvatting de queue-diepte per jobtype, mislukte
jobs, falende bronnen en de nieuwste topics (via `GET
/api/admin/pipeline-status`, beveiligd met `ADMIN_SECRET`).

**Eenmalige setup** (naast wat je al deed voor bronnen seeden):
1. Zet `CRON_SECRET` in Vercel op een willekeurige, geheime waarde (staat al in
   `.env.example`).
2. Zet in GitHub (Settings → Secrets and variables → Actions):
   - Secret `CRON_SECRET` — dezelfde waarde als in Vercel.
   - Variable `APP_URL` — dezelfde als bij de bronnen-seed (je Vercel-URL).

De workflow **"Pipeline tick"** draait vanaf dat moment automatisch elke ~5
minuten (GitHub kan schedules onder hoge load vertragen/overslaan; voor een
nieuwsfeed is dat geen probleem). Handmatig testen kan via *Run workflow* in de
Actions-tab.

**Bronnen met een echte feed_url:** alleen NOS Voetbal
(`https://feeds.nos.nl/nosvoetbal`) is voorlopig geverifieerd en `enabled` in
`lib/sources/sources.seed.ts`. De overige bronnen krijgen pas effect zodra je
zelf een echte `feed_url` toevoegt (in `sources.seed.ts` + opnieuw de
"Seed sources"-workflow draaien, of rechtstreeks in de `sources`-tabel) en
`enabled` op `true` zet.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — ESLint
