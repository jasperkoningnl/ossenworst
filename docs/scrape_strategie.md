Ik heb een onderzoeksagent gestart die de scraper-code, git-historie en documentatie doorzoekt naar aanpak, gemaakte fouten/oplossingen, en eventuele Google News-referenties. Ik laat je weten zodra de resultaten binnen zijn.

## Scraper-aanpak in dit project

**Architectuur**: de eigenlijke scraping-logica zit niet in de API route, maar in `src/lib/fetch-feeds.ts`. De route handlers (`/api/fetch-feeds`, `/api/cron/fetch-feeds`) zijn dunne wrappers eromheen. Dat is een patroon dat je in het nieuwe project kunt overnemen: houd de scraper-logica als losse, testbare library-functies, en laat routes alleen auth/rate-limiting/response-formatting doen.

**Pipeline**:
1. **Feed discovery** (`src/lib/feed-discovery.ts`) — als je alleen een website-URL hebt, geen feed-URL: haal de HTML op, zoek `<link rel="alternate" type="application/rss+xml">`/`atom+xml` tags, en als dat niets oplevert probeer je bekende paden (`/feed`, `/rss`, `/rss.xml`, `/atom.xml`, `/feeds/posts/default`, etc.). Lukt niks, dan valt de UI terug op handmatige feed-URL-invoer.
2. **Fetch & parse** — `rss-parser` (npm) voor RSS/Atom, met custom fields voor `media:content`/`media:thumbnail`. Timeout 8s. Batches draaien parallel via `Promise.allSettled`, in stukjes geknipt zodat je onder de 10s-limiet van Vercel serverless functions blijft.
3. **Opslag met dedup** — uniek `url`-constraint in de database + Drizzle's `.onConflictDoNothing()`. Simpel en effectief, geen aparte dedup-laag nodig.
4. **Image-extractie**: fallback-keten `media:content` → `media:thumbnail` → enclosure → `thumbnail`-veld → regex `<img src>` uit de content.

## Belangrijkste lessen (uit git-historie, dus echt tegen problemen aangelopen)

- **SSRF is een reëel risico bij scrapers**: als je een endpoint hebt dat "geef een URL, wij fetchen 'm" doet, kan iemand die laten wijzen naar `127.0.0.1` of interne IP's — óók via een redirect (public URL die 302't naar intern adres). Los op met een `assertSafePublicUrl()`-check die *bij elke redirect-hop opnieuw* controleert, niet alleen bij de initiële URL. Dit project had dat aanvankelijk gemist (commit `db0f4a5`) en moest het achteraf repareren.
- **HTML-entities in feeds zijn een aanhoudend probleem**: RSS-feeds (zeker niet-Engelstalige) bevatten entities als `&eacute;`, `&ndash;`, `&euro;`. Een kleine hardcoded lijst (6 entries) bleek niet genoeg — er is een tabel van ~70 entities nodig plus numerieke/hex-referentie-decoding. Sommige feeds hebben ook rauwe HTML-tags in title/description die je moet strippen.
- **Kapotte bronnen moeten zichzelf uitschakelen**: bronnen met een dode feed-URL of site-herstructurering blijven anders elke cron-run mislukken. Oplossing: `consecutive_failures`-teller per bron, na 3 mislukkingen automatisch `active = 0`. Een succesvolle fetch reset de teller.
- **Elke externe fetch-endpoint heeft rate limiting en same-origin/CSRF-bescherming nodig** — vooral relevant omdat dit een single-user app zonder auth is: het risico is niet accountmisbruik maar dat iemand je fetch/discovery-endpoint als open SSRF-proxy misbruikt.
- **User-Agent doet ertoe**: bij het toevoegen van Reddit als bron bleek de generieke UA geblokkeerd te worden — oplossing was de officiële `.rss`-endpoint gebruiken plus een verplichte, beschrijvende `REDDIT_USER_AGENT` env var (volgens Reddit's "Responsible Builder Policy"). Les: generiek scrapen zonder duidelijke UA loopt tegen blokkades aan bij grotere platforms.
- **Cron-jobs moeten idempotent zijn** — vooral de curatiestap (die op basis van gescrapete artikelen een "editie" genereert) is zo gebouwd dat een dubbele trigger geen dubbele editie oplevert.
- **Cron-limieten van je hostingplatform zijn een echte beperking**: Reddit-ingest is later van Vercel cron naar GitHub Actions verplaatst, vermoedelijk vanwege cron/duration-limieten op het Hobby-plan.
- **Herbruikbare utility-modules**: `net-safety.ts` (SSRF-guard), `html-text.ts` (entity/tag-cleanup), `rate-limit.ts` (in-memory token bucket, geen Redis nodig voor single-user schaal), `url-normalize.ts` (tracking-parameters als `utm_*`/`fbclid` strippen voor cross-platform dedup). Alle scraping-code loopt door deze vier kleine, dependency-vrije modules i.p.v. dat elke feature zijn eigen safety/cleanup-logica uitvindt.

## Google News als bron

**Geen spoor van Google News** in code, ARCHITECTURE.md, README, commit-historie of profile.md. Het is nooit overwogen of geïmplementeerd. De aanpak in dit project leunt volledig op **directe RSS-feeds per uitgever** (via feed-discovery hierboven), aangevuld met Reddit en Bluesky als aparte "signal"-bronnen (niet als artikel-bron, maar als signaal voor relevantie/scoring).

Waarom Google News waarschijnlijk geen goede keuze is voor zo'n project (eigen redenering, niet uit deze codebase):
- Google News heeft geen officiële, stabiele publieke API meer — je bent aangewezen op het scrapen van `news.google.com/rss/search?q=...`, wat fragiel is (HTML/markup wijzigt, geen SLA, risico op blokkade).
- De teruggegeven artikel-URL's zijn vaak Google-redirect-links (`news.google.com/rss/articles/...`) in plaats van de originele publisher-URL, wat dedup op `url` (zoals hier met de unique constraint) lastiger maakt — je zou eerst moeten resolven naar de echte bron-URL.
- Het levert geen directe controle over welke bronnen je volgt — dat past niet goed bij een smaakprofiel-gestuurde curator die juist per bron wil kunnen bijhouden (categorie, betrouwbaarheid, paywall-status, failure-tracking) zoals dit project doet via de `sources`-tabel.

Voor een nieuw scraping-project zou ik dezelfde directe-RSS-aanpak aanraden boven Google News, tenzij je specifiek breed nieuws-aggregatie zonder brongranulariteit nodig hebt.