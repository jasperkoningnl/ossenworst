# Plan van Aanpak — Ossenworst Manager

## Context

Ossenworst Manager wordt een mobile-first webapp die al het Ajax-nieuws aggregeert uit 60+ bronnen in 11 talen, en dit combineert met interactieve Football Manager-achtige features (tactiek, transferlijst, verlanglijst). De kern is niet het losse artikel maar het **topic**: een doorlopend bijgewerkt verhaal (bv. één transfergerucht) dat met elke nieuwe bron een bijgewerkte betrouwbaarheidsscore, AI-samenvatting en tijdlijn krijgt.

**Huidige staat van de repo** (geverifieerd): een schone Next.js 15 App Router baseline — TypeScript strict, Tailwind v4 (CSS-first), React 19, ESLint 9. Er is nog géén Supabase, géén Anthropic SDK, en geen `lib/`, `components/` of API-routes. Dit is dus in de praktijk een greenfield architectuur op een nette basis.

**Beoogd resultaat:** een automatisch draaiende nieuwspipeline + interactieve FM-features, gehost op Vercel met Supabase als database/auth en Claude voor categorisering, merge-logica en vertaling — ontworpen om binnen de 10s serverless-timeout van Vercel te blijven.

---

## Belangrijke architectuurkeuzes (bevestig of corrigeer)

Deze drie forks bepalen de opzet. Ik ga uit van de aanbevolen optie; laat het weten als je een andere wilt.

1. **Pipeline-runtime → Vercel Cron + job-queue in Supabase (fan-out).** Cron triggert een lichte orchestrator die werk opknipt in vele korte (<10s) invocaties, gecoördineerd via een `jobs`-tabel. Blijft binnen de stack (geen extra infra). *Alternatief:* de zwaarste stappen (scraping + Claude-merge) naar Supabase Edge Functions met `pg_cron` verplaatsen als de fan-out te veel invocaties kost.
2. **Auth → Supabase anonymous auth.** Anonieme JWT-sessie; gebruiker kiest optioneel een gebruikersnaam. RLS werkt direct, geen e-mail vereist.
3. **Fasering → Nieuwsaggregator eerst.** De aggregator is de inhoudelijke kern; FM-features daarna. (Zie fasering onderaan.)

---

## 1. Datamodel (Supabase / Postgres)

### Nieuws & bronnen
- **`sources`** — id, name, slug, url, `tier` (1|2|3), `country`, `language`, `fetch_method` (`rss`|`scrape`|`api`), `feed_url`, `scrape_config` (jsonb: selectors), `enabled`, `last_fetched_at`, `last_status`. Geseed vanuit een `sources.seed.ts` met alle 60+ bronnen.
- **`raw_items`** — ruwe binnengehaalde berichten vóór verwerking. id, `source_id`, `external_id` (dedup-hash op url/guid), `url`, `title`, `body`, `published_at`, `language`, `fetched_at`, `processing_status` (`pending`|`processed`|`skipped`|`error`), `topic_id` (nullable, ingevuld na merge). Uniek op `(source_id, external_id)` voor idempotente ingest.
- **`topics`** — het centrale concept. id, `slug`, `title`, `category` (enum: `TRANSFER|STAF|CLUB|EREDIVISIE|EX-SPELER|WEDSTRIJD`), `confidence` (enum: `BEVESTIGD|GERUCHT|PRAATPROGRAMMA`), `summary` (NL, AI-gegenereerd), `summary_updated_at`, `player_id` (nullable, koppeling), `first_seen_at`, `last_activity_at`, `item_count`, `is_published`, `embedding` (vector, voor kandidaat-matching bij merge). `confidence` wordt afgeleid uit de hoogste tier onder de gekoppelde items (tier1→BEVESTIGD, tier2→GERUCHT, tier3→PRAATPROGRAMMA).
- **`topic_items`** — join topic ↔ raw_item met de tijdlijn-info: `topic_id`, `raw_item_id`, `source_id`, `reported_at`, `snippet` (wat déze bron meldde, NL-vertaald), `contribution` (bv. "bevestigt"|"nuanceert"|"nieuw detail"). Vormt de tijdlijn.
- **`translations`** — cache: `raw_item_id`, `target_lang`='nl', `translated_title`, `translated_body`, `model`, `created_at`. Voorkomt dubbele Claude-calls.

### Selectie / FM-data
- **`players`** — id, `external_id` (API-Football/Transfermarkt), `name`, `photo_url`, `shirt_number`, `position`, `birth_date`, `nationality`, `contract_until`, `market_value`, `squad` (`first`|`jong`|`former`), `is_active`, `updated_at`.
- **`formations`** — statische catalogus (4-3-3, 4-2-3-1, …) met posity-slots (jsonb met coördinaten voor het veld).
- **`player_news`** — materialized/afgeleide koppeling player ↔ topics (via `topics.player_id` + naam-matching), voor "klik speler → gerelateerd nieuws".

### Gebruikers & bijdragen
- **`profiles`** — `id` (= auth.uid), `username` (uniek, nullable voor anoniem), `created_at`.
- **`user_lineups`** — `profile_id`, `formation_id`, `slots` (jsonb: positie→player_id), `mode` (`current`|`alltime`), `created_at`. Voor de geaggregeerde opstelling.
- **`transfer_votes`** — `profile_id`, `player_id`, `kind` (`out`|`wish`), max 3 per kind per gebruiker (afgedwongen in API + partial unique/trigger). `wish` kan naar een externe speler wijzen (`external_player_ref`).
- **`comments`** — `profile_id` (nullable/anoniem), `topic_id`, `body`, `created_at`, `status` (`visible`|`hidden`). Moderatie lage prioriteit.

### Pipeline-infra
- **`jobs`** — queue voor de fan-out: `id`, `type` (`fetch_source`|`process_item`|`merge`|`translate`|`summarize`), `payload` (jsonb), `status` (`queued`|`running`|`done`|`error`), `attempts`, `run_after`, `locked_at`. Maakt vele korte invocaties mogelijk binnen de 10s-limiet.

**Relaties:** `sources 1—* raw_items *—* topics` (via `topic_items`); `topics *—1 players`; `profiles 1—* (lineups|votes|comments)`. RLS: publieke lees op gepubliceerde `topics`/`players`; schrijf op `user_*`/`comments` alleen voor eigen `auth.uid`.

---

## 2. API-routestructuur (App Router route handlers)

**Publieke lees-API's (frontend):**
- `GET /api/topics` — feed met filters (`category`, `confidence`, `player`, `cursor` voor infinite scroll).
- `GET /api/topics/[slug]` — detail incl. tijdlijn (`topic_items`) en samenvatting.
- `GET /api/players` — team-overzicht (`?squad=first|jong`).
- `GET /api/players/[id]` — speler + gerelateerd nieuws.
- `GET /api/players/search?q=` — voor verlanglijst/all-time XI (echte spelers).
- `GET /api/formations`.
- `GET /api/aggregates/lineup` · `/api/aggregates/transfers` · `/api/aggregates/wishlist` — geaggregeerde percentages/rankings.

**Gebruikers-schrijf-API's (auth vereist):**
- `POST /api/profile` (username claimen), `GET /api/profile/me`.
- `POST /api/lineups`, `GET /api/lineups/me`.
- `POST /api/votes` (`kind=out|wish`, max-3 validatie).
- `GET/POST /api/topics/[slug]/comments`.

**Pipeline / cron (beschermd met `CRON_SECRET`):**
- `POST /api/cron/enqueue-fetch` — Vercel Cron entrypoint; zet per bron een `fetch_source`-job in de queue.
- `POST /api/cron/worker` — pakt een klein batchje jobs (bv. 3-5) uit de queue, verwerkt ze binnen ~8s en stopt; wordt frequent getriggerd zodat de queue leegloopt.
- `POST /api/admin/*` — correcties (topic mergen/splitsen, confidence override, item herclassificeren). Achter admin-check.

---

## 3. Pipeline-architectuur

Vijf stappen, elk als apart job-type zodat geen enkele invocatie de 10s overschrijdt:

1. **Fetch** (`fetch_source`) — per bron ophalen via de juiste `fetch_method`:
   - *RSS:* feed parsen (bv. `rss-parser`).
   - *Scrape:* HTML halen + selectors uit `scrape_config` (bv. `cheerio`; paywalls → alleen kop/teaser).
   - *API:* API-Football / Transfermarkt-datasets.
   - Nieuwe items → `raw_items` met dedup op `(source_id, external_id)`. Eén bron per job = kort en isoleerbaar bij fouten.
2. **Filter/relevance** — is het item Ajax-gerelateerd? Snelle keyword/entity-check (goedkoop, zonder Claude) vóór dure stappen; niet-relevant → `skipped`.
3. **Translate** (`translate`) — niet-NL items via Claude naar NL, resultaat in `translations`-cache. Batchen per taal om calls te beperken.
4. **Merge** (`merge`) — hoort het item bij een bestaand topic? Kandidaten eerst vernauwen met **embeddings/vector-similarity + tijdvenster + categorie** (goedkoop), daarna de top-N kandidaten aan **Claude** voorleggen voor de finale ja/nee + welk topic. Nieuw topic indien geen match.
5. **Summarize/classify** (`summarize`) — Claude werkt de NL-samenvatting bij in de stijl "Volgens De Telegraaf…", bepaalt/bevestigt `category`, en het systeem herberekent `confidence` uit de tiers van de gekoppelde bronnen. Tijdlijn-entry (`topic_items`) toegevoegd.

**Orchestratie:** `enqueue-fetch` (Vercel Cron, bv. elke 15 min) vult de queue; `worker` draait frequent (bv. elke minuut) en verwerkt kleine batches. Idempotentie via dedup-keys en job-locking (`locked_at`). Retries met `attempts` + exponential backoff via `run_after`.

---

## 4. Omgaan met de Vercel 10s-timeout

- **Nooit de hele pipeline in één request.** Werk is opgeknipt in kleine job-eenheden (één bron / één item per job).
- **Queue-gedreven fan-out:** cron enqueued, worker verwerkt N jobs per run en stopt ruim vóór 10s (harde budget-guard, bv. stop bij 8s).
- **Zelf-doorschakelen:** als de queue nog vol is, kan de worker aan het eind een volgende worker-run triggeren (fire-and-forget fetch naar zichzelf) i.p.v. door te werken.
- **Claude-calls kort houden:** merge/summarize per item, niet per batch-van-alles; streaming niet nodig want het is server-side.
- **Escape hatch:** mocht fan-out te duur worden in invocatie-aantallen, dan verhuizen de zwaarste job-types (scrape + Claude) naar **Supabase Edge Functions + `pg_cron`** (geen 10s-limiet); de queue-tabel blijft dan het contract tussen beide werelden.

---

## 5. Claude API-integratie

- **SDK:** `@anthropic-ai/sdk`, server-side only (key in env, nooit client). Wrapper in `lib/claude/`.
- **Model:** default `claude-opus-4-8` voor merge/samenvatting-kwaliteit; `claude-haiku-4-5` overwegen voor goedkope vertaling/relevance om kosten te drukken.
- **Merge-logica:** structured output (tool use / JSON-schema) — input: nieuw item + top-N kandidaat-topics (titel+samenvatting); output: `{ matched_topic_id | null, category, confidence_signal, reason }`. Voorfilter met embeddings houdt de prompt klein en de call goedkoop.
- **Categorisering:** onderdeel van dezelfde merge/summarize-call (categorie-enum in het schema).
- **Samenvatting:** aparte prompt die de bestaande samenvatting + nieuwe bron krijgt en een bijgewerkte NL-tekst teruggeeft in de gevraagde "Volgens X…"-stijl.
- **Vertaling:** losse, goedkope call met caching in `translations`.
- **Kostenbeheersing:** prompt caching op het systeem-/instructiedeel, embeddings-voorfilter, translation-cache, en relevance-gate vóór elke Claude-call.

---

## 6. Selectiedata (spelers, formaties) bijhouden

- **Bron:** API-Football (live squad, contract, waarde) en/of de Transfermarkt-datasets (GitHub `dcaribou/transfermarkt-datasets`) voor verrijking.
- **Sync-job:** apart cron/job-type `sync_squad` (bv. dagelijks) dat `players` upsert op `external_id`; `is_active`/`squad` bijwerkt zodat vertrokken spelers uit de selectie vallen.
- **Formaties:** statische seed (`formations`) met veld-coördinaten per slot; geen externe sync nodig.
- **Koppeling nieuws↔speler:** `topics.player_id` gezet tijdens merge (naam-/entity-match), zodat spelerdetail direct gerelateerde topics toont.
- **Aggregaties:** percentages/rankings voor opstelling/transfer/wish via SQL-views of on-demand aggregatie-queries op `user_lineups`/`transfer_votes` (eventueel gecachet).

---

## 7. Componentstructuur (hoofdlijnen)

Retro FM/CM 01-02 sfeer: donkere achtergrond, informatiedicht, strakke typografie, Ajax-rood accent. Het aparte Claude Design-bestand stuurt de uiteindelijke styling; houd componenten daarom dun en presentatie-agnostisch.

```
app/
  (feed)/            → nieuwsfeed (home), topic-detail
  team/              → eerste elftal & Jong Ajax
  tactiek/           → formatie kiezen + aggregatie, all-time XI mode
  transfers/         → transferlijst + verlanglijst + aggregaties
  profiel/           → username, opgeslagen data
  admin/             → correctie-interface
  api/               → route handlers (zie §2)
components/
  layout/            AppShell, BottomNav (mobile-first), Header
  topic/             TopicCard, ConfidenceBadge, CategoryTag, Timeline, SourceStamp, SummaryBlock
  player/            PlayerCard, SquadList, PlayerNews
  tactics/           Pitch, FormationPicker, PositionSlot (tik-en-kies, géén drag&drop), LineupAggregate
  transfers/         VoteList (max-3), WishlistSearch, AggregateRanking
  comments/          CommentList, CommentForm
  ui/                Badge, Card, Tabs, SearchInput, Skeleton  (retro-thema tokens)
lib/
  supabase/          server- & client-clients
  claude/            merge, summarize, translate, classify wrappers
  pipeline/          fetchers (rss|scrape|api), jobs-queue, relevance, confidence-berekening
  sources/           sources.seed.ts
  types/             gedeelde TypeScript types (enums voor category/confidence/tier)
```

---

## 8. Fasering

**Fase 0 — Fundament**
Supabase project + client (`lib/supabase`), Anthropic SDK, env-setup (`.env.example`, `CRON_SECRET`), datamodel-migraties, `sources.seed.ts`, retro-thema tokens in Tailwind, AppShell + BottomNav.

**Fase 1 — Nieuwsaggregator (MVP-kern)**
Jobs-queue + `enqueue-fetch`/`worker` routes met tijdsbudget-guard; RSS-fetcher voor de bronnen mét feeds; relevance-gate; Claude merge+summarize+classify; confidence-berekening; feed + topic-detail UI met tijdlijn en badges. → eerste werkende, automatisch gevulde feed.

**Fase 2 — Aggregator verbreden**
Scrape- en API-fetchers, vertaling + cache voor niet-NL bronnen, embeddings-voorfilter voor merge, admin-correctie-interface.

**Fase 3 — FM-features**
`sync_squad`-job + team-overzicht, tactiekscherm (tik-en-kies) + aggregatie, all-time XI, transferlijst + verlanglijst + aggregatie-rankings, speler↔nieuws-koppeling.

**Fase 4 — Sociale laag & polish**
Profiel/username (Supabase anonymous auth), reacties op topics, lichte moderatie, integratie van het definitieve Claude Design-bestand, performance/caching, Vercel Cron-config (`vercel.json`).

---

## Verificatie

- **Pipeline:** lokaal `worker`-route met een handvol echte RSS-bronnen draaien; controleren dat `raw_items` gededupliceerd binnenkomen, topics correct gemerged worden en `confidence` klopt met de tier van de bron. Job-budget-guard testen (stopt <10s).
- **Claude:** merge-call met twee duidelijk gerelateerde items → moeten in één topic landen; twee ongerelateerde → twee topics. Samenvatting bevat "Volgens X…"-stijl.
- **FM-features:** twee testprofielen stemmen → aggregatie-percentages kloppen; max-3-limiet afgedwongen; RLS blokkeert schrijven op andermans data.
- **E2E op mobiel viewport:** feed → topic-detail → speler → tactiek → stemmen, allemaal zonder drag&drop.
- **Deploy:** Vercel preview met Cron actief; controleren dat geen enkele functie de 10s overschrijdt (Vercel runtime-logs).
```
