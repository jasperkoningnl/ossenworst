-- Verrijking van raw_items voor de "originele bron"-weergave:
-- - publisher_name: echte publishernaam voor items die via een aggregator
--   (Google News) binnenkomen, zodat de UI "De Telegraaf" toont i.p.v.
--   "Google News: Ajax ES".
-- - enriched_at: markeert dat de eenmalige verrijkingsstap (Google News-URL
--   herleiden naar de originele artikel-URL + artikel-intro ophalen) is
--   uitgevoerd, zodat retries hem niet herhalen.
alter table raw_items add column if not exists publisher_name text;
alter table raw_items add column if not exists enriched_at timestamptz;
