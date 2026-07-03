# Ossenworst Manager

Mobile-first Ajax-nieuwsaggregator gecombineerd met Football Manager-achtige features
(tactiek, transferlijst, verlanglijst). Zie `PLAN.md` voor de volledige architectuur.

## Vormgeving

Licht thema is de standaard: rood/wit als hoofdkleuren met een knipoog naar
Championship Manager 01/02 (rode titelbalken, zebra-tabellen, condensed
kapitalen). Donker blijft beschikbaar via Profiel → Weergave. De thema-tokens
staan in `app/globals.css`; componenten gebruiken ze als CSS-variabelen.

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

**Topics opschonen:** workflow **"Cleanup topics"** laat Claude alle bestaande
topics beoordelen en verwijdert de topics zonder Ajax-connectie (wedtips,
algemeen voetbalnieuws, niet-voetbal) — handig na filterwijzigingen.

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

## FM-features (opstelling, transferlijst, verlanglijst, reacties)

De interactieve schermen schrijven rechtstreeks (met RLS) naar Supabase via een
anonieme sessie — geen e-mail of wachtwoord nodig. Eenmalige setup:

1. Draai de migratie `supabase/migrations/20260703000000_fm_interactie.sql`
   (publieke leesrechten voor aggregaties + unieke index op spelersnamen).
2. Zet in Supabase **Authentication → Sign In / Providers → Anonymous
   sign-ins** aan. Zonder deze instelling tonen de schermen een nette melding
   maar kan er niet gestemd/gereageerd worden.
3. Draai de **"Seed sources"**-workflow opnieuw: die seedt nu ook de selectie
   naar de `players`-tabel (nodig voor stemmen en opstellingen). Zolang de
   tabel leeg is, tonen Team/Tactiek/Transfers de statische seed-selectie en
   staat insturen uit.

De selectie staat in `lib/players/squad.seed.ts` en wordt bij elke seed-run
geüpsert op naam; later vervangt de `sync_squad`-job (API-Football /
Transfermarkt-datasets) dit handwerk.

## Claude-kosten

- Vertaling en samenvatting draaien op Haiku 4.5; alleen merge/classificatie
  (tool use) draait op Sonnet, omdat Haiku-tool-use-calls in deze omgeving
  eerder stelselmatig faalden (zie notitie in `lib/claude/cleanup.ts`).
- Artikelteksten worden vóór de vertaal-/merge-calls afgekapt (1500-2000
  tekens) en het gratis keyword-relevantiefilter draait vóór elke betaalde call.
- De vertalingen worden gecachet in de `translations`-tabel.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — ESLint
