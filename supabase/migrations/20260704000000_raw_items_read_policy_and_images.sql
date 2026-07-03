-- 1. DE fix voor "bronnen zijn niet aanklikbaar": raw_items heeft RLS aan
--    maar had géén select-policy, waardoor de frontend-join
--    topic_items -> raw_items (url, intro, publishernaam, afbeelding) voor de
--    anonieme client stilletjes null opleverde. Zelfde valkuil als eerder bij
--    sources (zie 20260701000004_sources_read_policy.sql). Alleen items van
--    gepubliceerde topics zijn leesbaar; losse/geskipte items blijven intern.
create policy "raw_items zijn leesbaar als hun topic gepubliceerd is" on raw_items
  for select using (exists (
    select 1 from topics t where t.id = raw_items.topic_id and t.is_published = true
  ));

-- 2. Afbeelding bij het artikel (uit de feed of van de artikelpagina),
--    voor thumbnails in de feed en de intro-kaart.
alter table raw_items add column if not exists image_url text;
