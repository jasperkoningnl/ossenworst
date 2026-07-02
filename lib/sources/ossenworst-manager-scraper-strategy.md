# Ossenworst Manager: Scraper Strategy

## Overzicht

Dit document beschrijft de scrapingstrategie voor alle bronnen waar geen werkende RSS-feed beschikbaar is. Het is bedoeld als instructie voor Claude Code bij het bouwen van de aggregatiepipeline.

## Stap 0: Automatische feed-discovery

Voordat we gaan scrapen, draai eerst een automatische feed-discovery op alle bronnen met status "unknown" in `ossenworst-manager-sources.json`. Veel nieuwssites hebben een verborgen RSS-feed op standaard paden.

Probeer per domein de volgende URL-patronen (in volgorde):
- `/feed`
- `/rss`
- `/rss.xml`
- `/feed.xml`
- `/atom.xml`
- `/feeds/posts/default`
- `/blog/feed`
- `/news/feed`
- `/news/rss`
- `/rss/news`

Daarnaast: parse de HTML van de homepage en zoek naar `<link rel="alternate" type="application/rss+xml">` tags in de `<head>`. Veel sites adverteren hun feed daar zonder het prominent te tonen.

Werk het JSON-bronnenbestand bij met de resultaten. Alles wat een werkende feed blijkt te hebben, hoeft niet gescraped te worden.

## Strategie 1: Statische HTML-scraping (Cheerio/Node.js)

### Doelgroep
Nieuwssites die hun artikelenlijst server-side renderen als gewone HTML. De meeste traditionele kranten en sportmedia vallen hieronder.

### Sites
- ajax.nl/nieuws
- ajaxshowtime.com
- at5.nl
- ajaxdaily.com
- headliner.nl (aggregator)
- transferfeed.com/clubs/ajax/475
- newsnow.co.uk/h/Sport/Football/Europe/Netherlands/Ajax
- corrieredellosport.it
- tuttomercatoweb.com
- calciomercato.it
- ole.com.ar
- tycsports.com
- lance.com.br
- kickoff.com
- africanfootball.com
- foot-africa.com
- bold.dk
- tipsbladet.dk
- fanatik.com.tr
- hurriyet.com.tr/sporarena

### Technische aanpak
```
Tool: cheerio + node-fetch (of axios)
Frequentie: elke 15-30 minuten
```

Per site:
1. Fetch de nieuwspagina/overzichtspagina
2. Parse de HTML met Cheerio
3. Extraheer per artikel: titel, URL, publicatiedatum (indien beschikbaar), snippet/lead
4. Vergelijk met eerder opgehaalde artikelen (deduplicatie op URL)
5. Nieuwe artikelen doorsturen naar de categorisatie/merge pipeline

### Articlextractie bij doorklikken
Als de pipeline ook de volledige artikeltekst nodig heeft (voor AI-samenvatting), fetch dan de individuele artikel-URL en extraheer de body text. Gebruik hiervoor een generieke extractie-aanpak:
- Probeer eerst de `<article>` tag
- Fallback: grootste `<div>` met de meeste `<p>` tags
- Of gebruik een library als `@extractus/article-extractor` (Node.js) die dit automatisch doet voor de meeste nieuwssites

### Bot-detectie
Zet een realistische User-Agent header. Voeg een willekeurige delay toe van 1-3 seconden tussen requests naar hetzelfde domein. Respecteer robots.txt voor sites die dat expliciet blokkeren (noteer welke dat zijn en meld het aan de admin).

## Strategie 2: JavaScript-gerenderde sites (Playwright)

### Doelgroep
Sites die hun content volledig client-side renderen via JavaScript/React/Vue, waardoor een simpele HTTP-fetch een lege pagina oplevert.

### Sites (waarschijnlijk)
- voetbalzone.nl (moderne SPA)
- espn.nl
- espn.com/soccer
- goal.com
- onefootball.com
- eredivisie.nl

### Technische aanpak
```
Tool: Playwright (headless Chromium)
Frequentie: elke 30-60 minuten (zwaarder dan statische scraping)
```

1. Open de pagina in headless Chromium
2. Wacht tot de content geladen is (wacht op specifiek element of networkidle)
3. Extraheer de gerenderde HTML
4. Parse met Cheerio (zelfde extractielogica als strategie 1)

### Alternatief: API-interceptie
Veel SPA's laden hun data via een interne JSON API. Inspecteer het netwerktabblad in de browser (XHR/Fetch requests) en identificeer de API-endpoint. Als die gevonden wordt, is een directe fetch naar die API veel efficiënter dan Playwright. Dit moet per site onderzocht worden door Claude Code bij de eerste implementatie.

### Vercel-beperkingen
Playwright draait niet binnen Vercel serverless functions (te zwaar, te langzaam). Oplossingen:
- Draai Playwright-scrapers als een apart process (bijv. via een GitHub Action op schema, of een externe service als Render/Railway)
- Sla de resultaten op in Supabase
- De Vercel-app leest alleen uit Supabase

## Strategie 3: Paywalled Nederlandse media (DPG/Mediahuis/TMG)

### Doelgroep
- De Telegraaf (TMG) - Mike Verweij
- Voetbal International (Mediahuis)
- AD Sportwereld (DPG Media)
- De Volkskrant (DPG Media)
- Het Parool (DPG Media)
- Trouw (DPG Media)

### Technische aanpak
Volledige artikelen achter paywall zijn niet toegankelijk zonder abonnement. Maar voor de aggregator is dat ook niet nodig. De strategie:

1. **Koppen en leads scrapen**: De meeste paywalled sites tonen de kop, auteur, publicatiedatum en eerste 1-2 alinea's (de "lead") gratis. Dat is voldoende voor categorisering en merging.
2. **Google News als proxy**: Zoek op Google News naar `site:telegraaf.nl Ajax` of `site:vi.nl Ajax`. Google toont koppen en snippets van paywalled content. Dit kan via de Google News RSS-truc: `https://news.google.com/rss/search?q=site:telegraaf.nl+Ajax&hl=nl&gl=NL&ceid=NL:nl`
3. **Combineer beide**: Scrape de nieuwsoverzichtspagina voor koppen + leads, gebruik Google News als aanvulling/verificatie.

### Per site
- **telegraaf.nl**: Nieuwsoverzicht op telegraaf.nl/sport/voetbal/ajax. Koppen en leads zijn zichtbaar. De volledige tekst is afgeschermd. Scrape de kop, auteur, datum, lead. Link naar het originele artikel.
- **vi.nl**: Vergelijkbaar. Nieuwsoverzicht op vi.nl/clubs/ajax. Paywall na een paar alinea's.
- **AD/VK/Parool/Trouw (DPG)**: Alle DPG-sites delen dezelfde technische structuur. Nieuwsoverzicht en leads zijn publiek toegankelijk. De rest is afgeschermd.

### Google News RSS als vangnet
Voor elke paywalled bron, maak een aanvullende Google News RSS-feed aan:
```
https://news.google.com/rss/search?q=site:telegraaf.nl+"Ajax"&hl=nl&gl=NL&ceid=NL:nl
https://news.google.com/rss/search?q=site:vi.nl+"Ajax"&hl=nl&gl=NL&ceid=NL:nl
https://news.google.com/rss/search?q=site:ad.nl+"Ajax"&hl=nl&gl=NL&ceid=NL:nl
https://news.google.com/rss/search?q=site:volkskrant.nl+"Ajax"&hl=nl&gl=NL&ceid=NL:nl
https://news.google.com/rss/search?q=site:parool.nl+"Ajax"&hl=nl&gl=NL&ceid=NL:nl
https://news.google.com/rss/search?q=site:trouw.nl+"Ajax"&hl=nl&gl=NL&ceid=NL:nl
```

Dit is een aanvulling op directe scraping, niet een vervanging. Google News RSS kan vertraagd zijn en niet alle artikelen oppikken.

## Strategie 4: X/Twitter monitoring (Transfer-specialisten)

### Doelgroep
- Fabrizio Romano (@FabrizioRomano)
- David Ornstein (@David_Ornstein)
- Florian Plettenberg (@Plettigoal)
- Matteo Moretto (@MatteMoretto)
- Ekrem Konur (@Ekremkonur)
- Mike Verweij (@MikeVerweij)

### Technische aanpak
De X/Twitter API (v2) is de officiële manier, maar is duur geworden (Basic tier: $100/maand, Pro: $5000/maand). Alternatieven:

**Optie A: Nitter-instanties (gratis, fragiel)**
Nitter is een open-source Twitter-frontend die RSS-feeds per gebruiker aanbiedt. Er zijn publieke instanties, maar die gaan regelmatig offline. Feed-URLs:
```
https://nitter.net/{username}/rss
```
Probleem: Nitter-instanties zijn instabiel en worden actief geblokkeerd door X. Niet betrouwbaar als primaire bron.

**Optie B: X API Basic ($100/maand)**
Biedt 10.000 tweets/maand lezen. Voor 7 accounts die elk ~5-20 tweets/dag posten is dat ruim voldoende. Gebruik filtered stream of recent search endpoint met query:
```
from:FabrizioRomano OR from:David_Ornstein OR from:Plettigoal OR from:MatteMoretto OR from:Ekremkonur OR from:MikeVerweij (Ajax OR Amsterdam OR Eredivisie)
```
Voordeel: betrouwbaar, real-time.
Nadeel: kost $100/maand.

**Optie C: Scrape via third-party diensten**
Diensten als Apify, PhantomBuster of SocialData bieden X-scraping aan. Kosten variëren maar zijn doorgaans goedkoper dan de officiële API.

**Optie D: Handmatige monitoring (tijdelijk)**
Start zonder X-integratie. De tweets van deze journalisten worden binnen minuten opgepikt door nieuwssites (Voetbalzone, Soccernews, etc.) die we al scrapen. De vertraging is klein. Bouw X-integratie later als de rest draait.

### Aanbeveling
Start met Optie D. De transfer-specialisten worden zo snel geciteerd door andere bronnen dat directe X-monitoring niet essentieel is voor een eerste versie. Voeg X API later toe als de site traction heeft en het budget rechtvaardigt.

## Strategie 5: Internationale bronnen zonder feed (bulk-aanpak)

### Doelgroep
Alle internationale bronnen (Spanje, Italië, Duitsland, Frankrijk, Portugal, Turkije, Zuid-Amerika, Rusland, Azië, Afrika) waar geen RSS gevonden is.

### Technische aanpak
Voor deze bronnen is de kans dat ze schrijven over Ajax op enig moment veel kleiner dan voor de Nederlandse bronnen. Ze zijn pas relevant als er een concreet transfergerucht speelt dat die markt raakt (bijv. Speler X van Sevilla naar Ajax). Daarom:

**Google News RSS per taal/land als vangnet**
Maak voor elke relevante taal een Google News RSS-feed:
```
https://news.google.com/rss/search?q="Ajax+Amsterdam"&hl=es&gl=ES&ceid=ES:es
https://news.google.com/rss/search?q="Ajax+Amsterdam"&hl=it&gl=IT&ceid=IT:it
https://news.google.com/rss/search?q="Ajax+Amsterdam"&hl=de&gl=DE&ceid=DE:de
https://news.google.com/rss/search?q="Ajax+Amsterdam"&hl=fr&gl=FR&ceid=FR:fr
https://news.google.com/rss/search?q="Ajax+Amsterdam"&hl=pt&gl=PT&ceid=PT:pt
https://news.google.com/rss/search?q="Ajax+Amsterdam"&hl=pt-BR&gl=BR&ceid=BR:pt-419
https://news.google.com/rss/search?q="Ajax+Amsterdam"&hl=tr&gl=TR&ceid=TR:tr
https://news.google.com/rss/search?q="Ajax+Amsterdam"&hl=ru&gl=RU&ceid=RU:ru
https://news.google.com/rss/search?q="Ajax+Amsterdam"&hl=ja&gl=JP&ceid=JP:ja
https://news.google.com/rss/search?q="Ajax+Amsterdam"&hl=ko&gl=KR&ceid=KR:ko
https://news.google.com/rss/search?q="Ajax+Amsterdam"&hl=ar&gl=EG&ceid=EG:ar
```

Dit vangt berichten op van bronnen als Marca, AS, Gazzetta, L'Équipe, Olé, etc. wanneer ze over Ajax schrijven, zonder dat we elke site apart hoeven te scrapen. De Google News RSS bevat de bronnaam, kop, snippet en link.

**Directe scraping alleen voor de belangrijkste transfersites**
Sites als TuttoMercatoWeb, Calciomercato, Foot Mercato en Le 10 Sport publiceren dagelijks over internationale transfers. Deze zijn het waard om direct te scrapen met Strategie 1 (statische HTML). De rest kan via Google News RSS.

## Strategie 6: Sport Bild en andere geblokkeerde sites

Sommige sites (Sport Bild/Bild.de, Transfermarkt) blokkeren bots actief. Voor deze sites:
- Gebruik de Transfermarkt datasets van GitHub (github.com/dcaribou/transfermarkt-datasets) voor selectiedata, marktwaarden en transferhistorie. Dit is gratis en wekelijks bijgewerkt.
- Sport Bild: niet essentieel. Kicker dekt de Duitse markt al af met werkende RSS-feeds.
- Transfermarkt nieuws: de nieuwsberichten zijn minder relevant dan de data. Gebruik de GitHub-datasets voor data en andere bronnen voor nieuws.

## Pipeline-architectuur

### Frequentie per categorie
| Categorie | Methode | Interval |
|-----------|---------|----------|
| RSS-feeds (NOS, Kicker, Marca, etc.) | RSS polling | 10-15 min |
| Statische HTML scrapers (ajax.nl, etc.) | HTTP fetch + Cheerio | 15-30 min |
| Google News RSS (paywall-proxy + internationaal) | RSS polling | 15-30 min |
| JS-gerenderde sites (Voetbalzone, ESPN) | Playwright of API-interceptie | 30-60 min |
| X/Twitter (later toe te voegen) | API polling | 5-15 min |
| Transfermarkt datasets | GitHub download | dagelijks |

### Deduplicatie
Elke opgehaalde URL wordt opgeslagen in Supabase. Bij elke fetch-run wordt gecheckt of de URL al bekend is. Alleen nieuwe URLs worden doorgestuurd naar de verwerkingspipeline.

### Verwerking per nieuw bericht
1. Taaldetectie (via Claude API of een lightweight library als franc)
2. Vertaling naar Nederlands (indien niet-NL, via Claude API)
3. Categorisering (TRANSFER/STAF/CLUB/etc.) via Claude API
4. Topic-matching (hoort dit bij een bestaand topic?) via Claude API
5. Betrouwbaarheidsbeoordeling (op basis van bron-tier)
6. Opslaan in Supabase

### Vercel timeout-oplossing
De scraping-pipeline draait NIET als Vercel serverless function (10-seconden timeout). Gebruik in plaats daarvan:
- **Vercel Cron Jobs**: voor lichte taken (RSS polling, enkele HTTP fetches). Max executietijd: 60 seconden op Pro plan.
- **Externe worker**: voor zwaardere taken (Playwright, bulk scraping). Opties: Render background worker, Railway, of een GitHub Action op cron schedule. Resultaten worden naar Supabase geschreven. De Vercel-app leest alleen uit Supabase.
- **Supabase Edge Functions**: als alternatief voor externe workers. Deno-based, max 150 seconden executietijd.

## Juridische overwegingen

- Scrape alleen publiek toegankelijke informatie (koppen, leads, metadata)
- Reproduceer geen volledige artikelteksten
- Link altijd naar het originele artikel
- Respecteer robots.txt
- Voeg een duidelijke User-Agent toe die de site identificeert (bijv. "OssenworstManager/1.0")
- Houd verzoekfrequentie redelijk (niet vaker dan 1 request per 2 seconden per domein)
