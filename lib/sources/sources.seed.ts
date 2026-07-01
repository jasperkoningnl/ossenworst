import type { FetchMethod, SourceTier } from "@/lib/types/enums";

export interface SourceSeed {
  name: string;
  slug: string;
  /** Homepage/profiel-URL. Betrouwbaar voor bekende merken; RSS-paden worden bewust niet geraden. */
  url: string;
  tier: SourceTier;
  country: string;
  language: string;
  fetchMethod: FetchMethod;
  /**
   * Bewust null gelaten: exacte RSS-feed-paden verschillen per site en wijzigen
   * regelmatig. Vul aan/verifieer per bron via de admin-interface vóórdat de
   * pipeline voor die bron wordt geactiveerd (`enabled`).
   */
  feedUrl: null;
  enabled: boolean;
}

/**
 * Tier-toewijzing volgt de definitie uit PLAN.md:
 * - tier 1 (BEVESTIGD): officiële club/bond-kanalen en de bekende naam-gebonden
 *   transferinsiders (Romano, Ornstein, Plettenberg, Di Marzio, Moretto, Konur).
 * - tier 2 (GERUCHT): gevestigde nieuwsmedia en aggregatoren.
 * - tier 3 (PRAATPROGRAMMA): fan-/gossip-sites en praatprogramma's.
 *
 * Nuance die hier nog niet is verwerkt: individuele journalisten bij een tier 2
 * outlet (bv. Mike Verweij bij De Telegraaf) kunnen zelf tier 1 zijn. Dit vereist
 * source-granulariteit op journalist-niveau en is uitgesteld naar een latere fase.
 *
 * KNVB, UEFA, Vandaag Inside en Rondo staan in PLAN.md als voorbeeldbronnen voor
 * de betrouwbaarheidsniveaus maar niet in het bronnenoverzicht (geen bruikbare
 * feed/site-structuur) — bewust niet geseed.
 */
export const sourceSeeds: SourceSeed[] = [
  // --- Nederland ---
  { name: "Ajax.nl", slug: "ajax-nl", url: "https://www.ajax.nl", tier: 1, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "NOS Sport", slug: "nos-sport", url: "https://nos.nl/sport", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Voetbal International", slug: "vi", url: "https://www.vi.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "De Telegraaf", slug: "de-telegraaf", url: "https://www.telegraaf.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "AD Sportwereld", slug: "ad-sportwereld", url: "https://www.ad.nl/sport", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "ESPN NL", slug: "espn-nl", url: "https://www.espn.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Voetbalzone", slug: "voetbalzone", url: "https://www.voetbalzone.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Soccernews", slug: "soccernews", url: "https://www.soccernews.nl", tier: 3, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Voetbalprimeur", slug: "voetbalprimeur", url: "https://www.voetbalprimeur.nl", tier: 3, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Ajax Showtime", slug: "ajax-showtime", url: "https://www.ajaxshowtime.com", tier: 3, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Headliner.nl", slug: "headliner", url: "https://www.headliner.nl", tier: 3, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "AT5", slug: "at5", url: "https://www.at5.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "De Volkskrant", slug: "volkskrant", url: "https://www.volkskrant.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Trouw", slug: "trouw", url: "https://www.trouw.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Het Parool", slug: "het-parool", url: "https://www.parool.nl", tier: 2, country: "NL", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Ajax Daily", slug: "ajax-daily", url: "https://www.ajaxdaily.nl", tier: 3, country: "NL", language: "nl", fetchMethod: "scrape", feedUrl: null, enabled: false },

  // --- Engeland / internationaal Engels ---
  { name: "The Guardian", slug: "the-guardian", url: "https://www.theguardian.com/football", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "BBC Sport", slug: "bbc-sport", url: "https://www.bbc.com/sport/football", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Sky Sports", slug: "sky-sports", url: "https://www.skysports.com/football", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "TalkSPORT", slug: "talksport", url: "https://talksport.com/football", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Football365", slug: "football365", url: "https://www.football365.com", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "The Athletic", slug: "the-athletic", url: "https://www.nytimes.com/athletic", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "FourFourTwo", slug: "fourfourtwo", url: "https://www.fourfourtwo.com", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Goal.com", slug: "goal-com", url: "https://www.goal.com", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "ESPN FC", slug: "espn-fc", url: "https://www.espn.com/soccer", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "90min", slug: "90min", url: "https://www.90min.com", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
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
  { name: "NewsNow Ajax", slug: "newsnow-ajax", url: "https://www.newsnow.co.uk/h/Sport/Football/Clubs/Ajax", tier: 2, country: "GB", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Spanje ---
  { name: "Marca", slug: "marca", url: "https://www.marca.com", tier: 2, country: "ES", language: "es", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "AS", slug: "as", url: "https://as.com", tier: 2, country: "ES", language: "es", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Sport", slug: "sport-es", url: "https://www.sport.es", tier: 2, country: "ES", language: "es", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Mundo Deportivo", slug: "mundo-deportivo", url: "https://www.mundodeportivo.com", tier: 2, country: "ES", language: "es", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Football Espana", slug: "football-espana", url: "https://www.footballespana.net", tier: 2, country: "ES", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Italië ---
  { name: "La Gazzetta dello Sport", slug: "gazzetta", url: "https://www.gazzetta.it", tier: 2, country: "IT", language: "it", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Corriere dello Sport", slug: "corriere-dello-sport", url: "https://www.corrieredellosport.it", tier: 2, country: "IT", language: "it", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Tuttosport", slug: "tuttosport", url: "https://www.tuttosport.com", tier: 2, country: "IT", language: "it", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "TuttoMercatoWeb", slug: "tuttomercatoweb", url: "https://www.tuttomercatoweb.com", tier: 2, country: "IT", language: "it", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Calciomercato.it", slug: "calciomercato", url: "https://www.calciomercato.it", tier: 2, country: "IT", language: "it", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Football Italia", slug: "football-italia", url: "https://football-italia.net", tier: 2, country: "IT", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Duitsland ---
  { name: "Kicker", slug: "kicker", url: "https://www.kicker.de", tier: 2, country: "DE", language: "de", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Sport Bild", slug: "sport-bild", url: "https://www.sportbild.bild.de", tier: 2, country: "DE", language: "de", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Transfermarkt.de", slug: "transfermarkt-de", url: "https://www.transfermarkt.de", tier: 2, country: "DE", language: "de", fetchMethod: "scrape", feedUrl: null, enabled: false },

  // --- Frankrijk ---
  { name: "L'Équipe", slug: "lequipe", url: "https://www.lequipe.fr", tier: 2, country: "FR", language: "fr", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Foot Mercato", slug: "foot-mercato", url: "https://www.footmercato.net", tier: 2, country: "FR", language: "fr", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Le 10 Sport", slug: "le-10-sport", url: "https://www.le10sport.com", tier: 2, country: "FR", language: "fr", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Le Parisien Sport", slug: "le-parisien-sport", url: "https://www.leparisien.fr/sports", tier: 2, country: "FR", language: "fr", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "RMC Sport", slug: "rmc-sport", url: "https://rmcsport.bfmtv.com", tier: 2, country: "FR", language: "fr", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Portugal ---
  { name: "A Bola", slug: "a-bola", url: "https://www.abola.pt", tier: 2, country: "PT", language: "pt", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Record", slug: "record", url: "https://www.record.pt", tier: 2, country: "PT", language: "pt", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "O Jogo", slug: "o-jogo", url: "https://www.ojogo.pt", tier: 2, country: "PT", language: "pt", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Turkije ---
  { name: "Fanatik", slug: "fanatik", url: "https://www.fanatik.com.tr", tier: 2, country: "TR", language: "tr", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Hürriyet Spor", slug: "hurriyet-spor", url: "https://www.hurriyet.com.tr/spor", tier: 2, country: "TR", language: "tr", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- België ---
  { name: "HLN Sport", slug: "hln-sport", url: "https://www.hln.be/sport", tier: 2, country: "BE", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Voetbalkrant", slug: "voetbalkrant", url: "https://www.voetbalkrant.com", tier: 2, country: "BE", language: "nl", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "RTBF Sport", slug: "rtbf-sport", url: "https://www.rtbf.be/sport", tier: 2, country: "BE", language: "fr", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Scandinavië ---
  { name: "Bold.dk", slug: "bold-dk", url: "https://www.bold.dk", tier: 2, country: "DK", language: "da", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Tipsbladet", slug: "tipsbladet", url: "https://www.tipsbladet.dk", tier: 2, country: "DK", language: "da", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Zuid-Amerika ---
  { name: "Olé", slug: "ole", url: "https://www.ole.com.ar", tier: 2, country: "AR", language: "es", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "TyC Sports", slug: "tyc-sports", url: "https://www.tycsports.com", tier: 2, country: "AR", language: "es", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Globo Esporte", slug: "globo-esporte", url: "https://ge.globo.com", tier: 2, country: "BR", language: "pt-BR", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Lance!", slug: "lance", url: "https://www.lance.com.br", tier: 2, country: "BR", language: "pt-BR", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "UOL Esporte", slug: "uol-esporte", url: "https://www.uol.com.br/esporte", tier: 2, country: "BR", language: "pt-BR", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Azië ---
  { name: "Japan Times Soccer", slug: "japan-times-soccer", url: "https://www.japantimes.co.jp/sports/soccer", tier: 2, country: "JP", language: "ja", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Afrika ---
  { name: "Foot Africa", slug: "foot-africa", url: "https://footafrique.com", tier: 2, country: "CI", language: "fr", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "AfricanFootball.com", slug: "africanfootball-com", url: "https://africanfootball.com", tier: 2, country: "ZA", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "KickOff", slug: "kickoff", url: "https://www.kickoff.com", tier: 2, country: "ZA", language: "en", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Rusland ---
  { name: "Sport Express", slug: "sport-express", url: "https://www.sport-express.ru", tier: 2, country: "RU", language: "ru", fetchMethod: "rss", feedUrl: null, enabled: false },
  { name: "Championat", slug: "championat", url: "https://www.championat.com", tier: 2, country: "RU", language: "ru", fetchMethod: "rss", feedUrl: null, enabled: false },

  // --- Data-API's ---
  { name: "API-Football", slug: "api-football", url: "https://www.api-football.com", tier: 2, country: "GLOBAL", language: "en", fetchMethod: "api", feedUrl: null, enabled: false },
  { name: "Transfermarkt Datasets (GitHub)", slug: "transfermarkt-datasets", url: "https://github.com/dcaribou/transfermarkt-datasets", tier: 2, country: "GLOBAL", language: "en", fetchMethod: "api", feedUrl: null, enabled: false },
];
