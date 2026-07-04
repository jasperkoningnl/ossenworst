import type { FetchMethod, SourceTier } from "@/lib/types/enums";
import type { ScrapeConfig } from "@/lib/pipeline/fetchers/scrape";

export interface SourceSeed {
  name: string;
  slug: string;
  url: string;
  tier: SourceTier;
  country: string;
  language: string;
  fetchMethod: FetchMethod;
  feedUrl: string | null;
  scrapeConfig?: ScrapeConfig;
  enabled: boolean;
}

export const sourceSeeds: SourceSeed[] = [
  // --- Nederland ---
  {
    name: "Ajax.nl", slug: "ajax-nl", url: "https://www.ajax.nl", tier: 1, country: "NL", language: "nl", fetchMethod: "scrape", feedUrl: null, enabled: true,
    scrapeConfig: { listUrl: "https://www.ajax.nl/club/pers/persberichten/", articleSelector: "article.card", titleSelector: "a.card__title-link", linkSelector: "a.card__title-link", snippetSelector: ".card__subtext .ellipsis" },
  },
  { name: "NOS Sport", slug: "nos-sport", url: "https://nos.nl/sport", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: "https://feeds.nos.nl/nossportalgemeen", enabled: true },
  { name: "Ajax Supporters", slug: "ajax-supporters", url: "https://ajax.supporters.nl", tier: 3, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: "https://ajax.supporters.nl/nieuws/rss.xml", enabled: true },
  { name: "Voetbal International", slug: "vi", url: "https://www.vi.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "De Telegraaf", slug: "de-telegraaf", url: "https://www.telegraaf.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "AD Sportwereld", slug: "ad-sportwereld", url: "https://www.ad.nl/sport", tier: 2, country: "NL", language: "nl", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "ESPN NL", slug: "espn-nl", url: "https://www.espn.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "Voetbalzone", slug: "voetbalzone", url: "https://www.voetbalzone.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "Soccernews", slug: "soccernews", url: "https://www.soccernews.nl", tier: 3, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: "https://www.soccernews.nl/feed", enabled: true },
  { name: "Voetbalprimeur", slug: "voetbalprimeur", url: "https://www.voetbalprimeur.nl", tier: 3, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: "https://www.voetbalprimeur.nl/feed/news.xml?tag=ajax", enabled: true },
  // Google News-sitemap i.p.v. RSS: titel/datum/afbeelding uit de sitemap, intro via verrijking.
  { name: "Ajax Showtime", slug: "ajax-showtime", url: "https://www.ajaxshowtime.com", tier: 3, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: "https://www.ajaxshowtime.com/sitemap/news.xml", enabled: true },
  { name: "Ajax Freaks", slug: "ajax-freaks", url: "https://www.ajaxfreaks.nl", tier: 3, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: "https://www.ajaxfreaks.nl/page/rss", enabled: false },
  { name: "Headliner.nl", slug: "headliner", url: "https://www.headliner.nl", tier: 3, country: "NL", language: "nl", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "AT5", slug: "at5", url: "https://www.at5.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "De Volkskrant", slug: "volkskrant", url: "https://www.volkskrant.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "Trouw", slug: "trouw", url: "https://www.trouw.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "Het Parool", slug: "het-parool", url: "https://www.parool.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "Ajax Daily", slug: "ajax-daily", url: "https://www.ajaxdaily.nl", tier: 3, country: "NL", language: "nl", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "KNVB", slug: "knvb", url: "https://knvb.com", tier: 1, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: "https://knvb.com/knvb_node/rss/news", enabled: true },
  { name: "Football Oranje", slug: "football-oranje", url: "https://football-oranje.com", tier: 3, country: "NL", language: "en", fetchMethod: "rss", feedUrl: "https://football-oranje.com/feed", enabled: true },
  { name: "Reddit r/AjaxAmsterdam", slug: "reddit-ajax", url: "https://www.reddit.com/r/AjaxAmsterdam", tier: 3, country: "NL", language: "en", fetchMethod: "rss", feedUrl: "https://www.reddit.com/r/AjaxAmsterdam/.rss?format=xml", enabled: true },

  // --- Engeland / internationaal Engels ---
  { name: "The Guardian", slug: "the-guardian", url: "https://www.theguardian.com/football", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: "https://www.theguardian.com/football/rss", enabled: true },
  { name: "BBC Sport", slug: "bbc-sport", url: "https://www.bbc.com/sport/football", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: "https://feeds.bbci.co.uk/sport/football/rss.xml", enabled: true },
  { name: "Sky Sports", slug: "sky-sports", url: "https://www.skysports.com/football", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: "https://www.skysports.com/rss/12040", enabled: true },
  { name: "TalkSPORT", slug: "talksport", url: "https://talksport.com/football", tier: 3, country: "GB", language: "en", fetchMethod: "rss", feedUrl: "https://talksport.com/football/transfers/", enabled: false },
  { name: "Football365", slug: "football365", url: "https://www.football365.com", tier: 3, country: "GB", language: "en", fetchMethod: "rss", feedUrl: "https://www.football365.com/f365-features/feed", enabled: true },
  { name: "The Athletic", slug: "the-athletic", url: "https://www.nytimes.com/athletic", tier: 1, country: "GB", language: "en", fetchMethod: "rss", feedUrl: "https://nytimes.com/athletic/rss/news", enabled: true },
  { name: "FourFourTwo", slug: "fourfourtwo", url: "https://www.fourfourtwo.com", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Goal.com", slug: "goal-com", url: "https://www.goal.com", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "ESPN FC", slug: "espn-fc", url: "https://www.espn.com/soccer", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "90min", slug: "90min", url: "https://www.90min.com", tier: 3, country: "GB", language: "en", fetchMethod: "rss", feedUrl: "https://www.90min.com/posts.rss", enabled: false },
  { name: "SoccerNews.com", slug: "soccernews-com", url: "https://www.soccernews.com", tier: 3, country: "GB", language: "en", fetchMethod: "rss", feedUrl: "https://www.soccernews.com/feed", enabled: true },
  { name: "Football Italia", slug: "football-italia", url: "https://football-italia.net", tier: 2, country: "IT", language: "en", fetchMethod: "rss", feedUrl: "https://football-italia.net/rss.xml", enabled: true },
  { name: "Football Espana", slug: "football-espana", url: "https://www.footballespana.net", tier: 2, country: "ES", language: "en", fetchMethod: "rss", feedUrl: "https://football-espana.net/feed", enabled: true },
  { name: "TEAMtalk", slug: "teamtalk", url: "https://www.teamtalk.com", tier: 3, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "CaughtOffside", slug: "caughtoffside", url: "https://www.caughtoffside.com", tier: 3, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Transfer-specialisten (naam-gebonden insiders) ---
  { name: "Fabrizio Romano", slug: "fabrizio-romano", url: "https://x.com/FabrizioRomano", tier: 1, country: "IT", language: "en", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "David Ornstein", slug: "david-ornstein", url: "https://www.nytimes.com/athletic", tier: 1, country: "GB", language: "en", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "Florian Plettenberg", slug: "florian-plettenberg", url: "https://x.com/Plettigoal", tier: 1, country: "DE", language: "de", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "Gianluca Di Marzio", slug: "gianluca-di-marzio", url: "https://www.gianlucadimarzio.com", tier: 1, country: "IT", language: "it", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Matteo Moretto", slug: "matteo-moretto", url: "https://x.com/MatteMoretto", tier: 1, country: "IT", language: "es", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "Ekrem Konur", slug: "ekrem-konur", url: "https://x.com/ekrempresent", tier: 1, country: "TR", language: "en", fetchMethod: "scrape", feedUrl: null, enabled: false },

  // --- Transfer-aggregatoren ---
  { name: "TransferFeed", slug: "transferfeed", url: "https://www.transferfeed.com", tier: 2, country: "GB", language: "en", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "Transfermarkt", slug: "transfermarkt", url: "https://www.transfermarkt.com", tier: 2, country: "DE", language: "en", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "NewsNow Ajax", slug: "newsnow-ajax", url: "https://www.newsnow.co.uk/h/Sport/Football/Clubs/Ajax", tier: 2, country: "GB", language: "en", fetchMethod: "scrape", feedUrl: null, enabled: false },

  // --- Spanje ---
  { name: "Marca", slug: "marca", url: "https://www.marca.com", tier: 2, country: "ES", language: "es", fetchMethod: "rss", feedUrl: "https://e00-marca.uecdn.es/rss/portada.xml", enabled: true },
  { name: "Marca English", slug: "marca-en", url: "https://www.marca.com/en", tier: 2, country: "ES", language: "en", fetchMethod: "rss", feedUrl: "https://e00-marca.uecdn.es/rss/en/index.xml", enabled: false },
  { name: "AS", slug: "as", url: "https://as.com", tier: 2, country: "ES", language: "es", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Sport", slug: "sport-es", url: "https://www.sport.es", tier: 2, country: "ES", language: "es", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Mundo Deportivo", slug: "mundo-deportivo", url: "https://www.mundodeportivo.com", tier: 2, country: "ES", language: "es", fetchMethod: "rss", feedUrl: "https://www.mundodeportivo.com/feed/rss/", enabled: false },

  // --- Italië ---
  { name: "La Gazzetta dello Sport", slug: "gazzetta", url: "https://www.gazzetta.it", tier: 2, country: "IT", language: "it", fetchMethod: "rss", feedUrl: "https://www.gazzetta.it/rss/home.xml", enabled: false },
  { name: "Corriere dello Sport", slug: "corriere-dello-sport", url: "https://www.corrieredellosport.it", tier: 2, country: "IT", language: "it", fetchMethod: "rss", feedUrl: "https://www.corrieredellosport.it/rss/rss.shtml", enabled: false },
  { name: "Tuttosport", slug: "tuttosport", url: "https://www.tuttosport.com", tier: 2, country: "IT", language: "it", fetchMethod: "rss", feedUrl: "https://www.tuttosport.com/rss/calcio", enabled: true },
  { name: "TuttoMercatoWeb", slug: "tuttomercatoweb", url: "https://www.tuttomercatoweb.com", tier: 2, country: "IT", language: "it", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Calciomercato.com", slug: "calciomercato", url: "https://www.calciomercato.com", tier: 2, country: "IT", language: "it", fetchMethod: "rss", feedUrl: "https://feeds.footballco.com/calcio/", enabled: true },

  // --- Duitsland ---
  { name: "Kicker", slug: "kicker", url: "https://www.kicker.de", tier: 2, country: "DE", language: "de", fetchMethod: "rss", feedUrl: "https://newsfeed.kicker.de/news/aktuell", enabled: true },
  { name: "Kicker Fussball", slug: "kicker-fussball", url: "https://www.kicker.de/fussball", tier: 2, country: "DE", language: "de", fetchMethod: "rss", feedUrl: "https://newsfeed.kicker.de/news/fussball", enabled: true },
  { name: "Sport Bild", slug: "sport-bild", url: "https://www.sportbild.bild.de", tier: 2, country: "DE", language: "de", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "Transfermarkt.de", slug: "transfermarkt-de", url: "https://www.transfermarkt.de", tier: 2, country: "DE", language: "de", fetchMethod: "scrape", feedUrl: null, enabled: false },

  // --- Frankrijk ---
  { name: "L'Équipe", slug: "lequipe", url: "https://www.lequipe.fr", tier: 2, country: "FR", language: "fr", fetchMethod: "rss", feedUrl: "https://dwh.lequipe.fr/api/edito/rss?path=/Football/", enabled: true },
  { name: "Foot Mercato", slug: "foot-mercato", url: "https://www.footmercato.net", tier: 2, country: "FR", language: "fr", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Le 10 Sport", slug: "le-10-sport", url: "https://www.le10sport.com", tier: 2, country: "FR", language: "fr", fetchMethod: "rss", feedUrl: "https://le10sport.com/fr/rss/football/", enabled: true },
  { name: "Le 10 Sport Mercato", slug: "le-10-sport-mercato", url: "https://www.le10sport.com/mercato", tier: 2, country: "FR", language: "fr", fetchMethod: "rss", feedUrl: "https://le10sport.com/fr/rss/football/mercato/", enabled: true },
  { name: "France 24 Sport", slug: "france-24-sport", url: "https://www.france24.com/en/sport", tier: 2, country: "FR", language: "en", fetchMethod: "rss", feedUrl: "https://www.france24.com/en/sport/rss", enabled: true },
  { name: "Le Parisien Sport", slug: "le-parisien-sport", url: "https://www.leparisien.fr/sports", tier: 2, country: "FR", language: "fr", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "RMC Sport", slug: "rmc-sport", url: "https://rmcsport.bfmtv.com", tier: 2, country: "FR", language: "fr", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Portugal ---
  { name: "A Bola", slug: "a-bola", url: "https://www.abola.pt", tier: 2, country: "PT", language: "pt", fetchMethod: "rss", feedUrl: "https://www.abola.pt/rss/index.aspx", enabled: false },
  { name: "Record", slug: "record", url: "https://www.record.pt", tier: 2, country: "PT", language: "pt", fetchMethod: "rss", feedUrl: "https://www.record.pt/rss/rss.asp", enabled: false },
  { name: "O Jogo", slug: "o-jogo", url: "https://www.ojogo.pt", tier: 2, country: "PT", language: "pt", fetchMethod: "rss", feedUrl: "https://www.ojogo.pt/rss/Noticias.rss", enabled: true },

  // --- Turkije ---
  { name: "Fanatik", slug: "fanatik", url: "https://www.fanatik.com.tr", tier: 2, country: "TR", language: "tr", fetchMethod: "scrape", feedUrl: null, enabled: false },
  { name: "Hürriyet Spor", slug: "hurriyet-spor", url: "https://www.hurriyet.com.tr/spor", tier: 2, country: "TR", language: "tr", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- België ---
  { name: "HLN Sport", slug: "hln-sport", url: "https://www.hln.be/sport", tier: 2, country: "BE", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Voetbalkrant", slug: "voetbalkrant", url: "https://www.voetbalkrant.com", tier: 2, country: "BE", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "RTBF Sport", slug: "rtbf-sport", url: "https://www.rtbf.be/sport", tier: 2, country: "BE", language: "fr", fetchMethod: "rss", feedUrl: "https://rss.rtbf.be/article/rss/highlight_rtbf_sport-football-jupiler-pro-league.xml?source=internal", enabled: true },

  // --- Scandinavië ---
  { name: "Bold.dk", slug: "bold-dk", url: "https://www.bold.dk", tier: 2, country: "DK", language: "da", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Tipsbladet", slug: "tipsbladet", url: "https://www.tipsbladet.dk", tier: 2, country: "DK", language: "da", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Zuid-Amerika ---
  { name: "Olé", slug: "ole", url: "https://www.ole.com.ar", tier: 2, country: "AR", language: "es", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "TyC Sports", slug: "tyc-sports", url: "https://www.tycsports.com", tier: 2, country: "AR", language: "es", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Globo Esporte", slug: "globo-esporte", url: "https://ge.globo.com", tier: 2, country: "BR", language: "pt-BR", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Gazeta Esportiva", slug: "gazeta-esportiva", url: "https://www.gazetaesportiva.com", tier: 2, country: "BR", language: "pt-BR", fetchMethod: "rss", feedUrl: "https://www.gazetaesportiva.com/feedrss/", enabled: true },
  { name: "Lance!", slug: "lance", url: "https://www.lance.com.br", tier: 2, country: "BR", language: "pt-BR", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "UOL Esporte", slug: "uol-esporte", url: "https://www.uol.com.br/esporte", tier: 2, country: "BR", language: "pt-BR", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "FutbolRed", slug: "futbolred", url: "https://www.futbolred.com", tier: 3, country: "CO", language: "es", fetchMethod: "rss", feedUrl: "https://www.futbolred.com/rss", enabled: true },

  // --- Rusland ---
  { name: "Sport Express", slug: "sport-express", url: "https://www.sport-express.ru", tier: 2, country: "RU", language: "ru", fetchMethod: "rss", feedUrl: "https://www.sport-express.ru/services/materials/news/se/football/rss/", enabled: false },
  { name: "Sports.ru", slug: "sports-ru", url: "https://www.sports.ru", tier: 2, country: "RU", language: "ru", fetchMethod: "rss", feedUrl: "https://www.sports.ru/docs/rss/", enabled: false },
  { name: "Championat", slug: "championat", url: "https://www.championat.com", tier: 2, country: "RU", language: "ru", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Azië ---
  { name: "Japan Times Soccer", slug: "japan-times-soccer", url: "https://www.japantimes.co.jp/sports/soccer", tier: 2, country: "JP", language: "ja", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Yonhap News Sports", slug: "yonhap-sports", url: "https://en.yna.co.kr/sports", tier: 3, country: "KR", language: "en", fetchMethod: "rss", feedUrl: "https://en.yna.co.kr/RSS/sports.xml", enabled: true },

  // --- Afrika ---
  { name: "Foot Africa", slug: "foot-africa", url: "https://footafrique.com", tier: 2, country: "CI", language: "fr", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "AfricanFootball.com", slug: "africanfootball-com", url: "https://africanfootball.com", tier: 2, country: "ZA", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "KickOff", slug: "kickoff", url: "https://www.kickoff.com", tier: 2, country: "ZA", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Data-API's ---
  { name: "API-Football", slug: "api-football", url: "https://www.api-football.com", tier: 2, country: "GLOBAL", language: "en", fetchMethod: "api", feedUrl: null, enabled: false },
  { name: "Transfermarkt Datasets (GitHub)", slug: "transfermarkt-datasets", url: "https://github.com/dcaribou/transfermarkt-datasets", tier: 2, country: "GLOBAL", language: "en", fetchMethod: "api", feedUrl: null, enabled: false },

  // --- Google News RSS (paywall-proxy + internationaal vangnet) ---
  // `when:7d` in de query beperkt de resultaten tot de laatste week: zonder die
  // filter serveert Google News ook jaren oude archiefstukken en jubileum-
  // artikelen (wedstrijden uit 2009/2018) die de actuele feed vervuilen.
  { name: "Google News: Telegraaf Ajax", slug: "gnews-telegraaf", url: "https://www.telegraaf.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: "https://news.google.com/rss/search?q=site:telegraaf.nl+Ajax+when:7d&hl=nl&gl=NL&ceid=NL:nl", enabled: false },
  { name: "Google News: VI Ajax", slug: "gnews-vi", url: "https://www.vi.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: "https://news.google.com/rss/search?q=site:vi.nl+Ajax+when:7d&hl=nl&gl=NL&ceid=NL:nl", enabled: false },
  { name: "Google News: AD Ajax", slug: "gnews-ad", url: "https://www.ad.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: "https://news.google.com/rss/search?q=site:ad.nl+Ajax+when:7d&hl=nl&gl=NL&ceid=NL:nl", enabled: false },
  { name: "Google News: Volkskrant Ajax", slug: "gnews-volkskrant", url: "https://www.volkskrant.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: "https://news.google.com/rss/search?q=site:volkskrant.nl+Ajax+when:7d&hl=nl&gl=NL&ceid=NL:nl", enabled: false },
  { name: "Google News: Parool Ajax", slug: "gnews-parool", url: "https://www.parool.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: "https://news.google.com/rss/search?q=site:parool.nl+Ajax+when:7d&hl=nl&gl=NL&ceid=NL:nl", enabled: false },
  { name: "Google News: Ajax ES", slug: "gnews-ajax-es", url: "https://news.google.com", tier: 3, country: "ES", language: "es", fetchMethod: "rss", feedUrl: "https://news.google.com/rss/search?q=%22Ajax+Amsterdam%22+when:7d&hl=es&gl=ES&ceid=ES:es", enabled: false },
  { name: "Google News: Ajax IT", slug: "gnews-ajax-it", url: "https://news.google.com", tier: 3, country: "IT", language: "it", fetchMethod: "rss", feedUrl: "https://news.google.com/rss/search?q=%22Ajax+Amsterdam%22+when:7d&hl=it&gl=IT&ceid=IT:it", enabled: false },
  { name: "Google News: Ajax DE", slug: "gnews-ajax-de", url: "https://news.google.com", tier: 3, country: "DE", language: "de", fetchMethod: "rss", feedUrl: "https://news.google.com/rss/search?q=%22Ajax+Amsterdam%22+when:7d&hl=de&gl=DE&ceid=DE:de", enabled: false },
  { name: "Google News: Ajax FR", slug: "gnews-ajax-fr", url: "https://news.google.com", tier: 3, country: "FR", language: "fr", fetchMethod: "rss", feedUrl: "https://news.google.com/rss/search?q=%22Ajax+Amsterdam%22+when:7d&hl=fr&gl=FR&ceid=FR:fr", enabled: false },
  { name: "Google News: Ajax PT", slug: "gnews-ajax-pt", url: "https://news.google.com", tier: 3, country: "PT", language: "pt", fetchMethod: "rss", feedUrl: "https://news.google.com/rss/search?q=%22Ajax+Amsterdam%22+when:7d&hl=pt&gl=PT&ceid=PT:pt", enabled: false },
  { name: "Google News: Ajax BR", slug: "gnews-ajax-br", url: "https://news.google.com", tier: 3, country: "BR", language: "pt-BR", fetchMethod: "rss", feedUrl: "https://news.google.com/rss/search?q=%22Ajax+Amsterdam%22+when:7d&hl=pt-BR&gl=BR&ceid=BR:pt-419", enabled: false },
  { name: "Google News: Ajax TR", slug: "gnews-ajax-tr", url: "https://news.google.com", tier: 3, country: "TR", language: "tr", fetchMethod: "rss", feedUrl: "https://news.google.com/rss/search?q=%22Ajax+Amsterdam%22+when:7d&hl=tr&gl=TR&ceid=TR:tr", enabled: false },
];
