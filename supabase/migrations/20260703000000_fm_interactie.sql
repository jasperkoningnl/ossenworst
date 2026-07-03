-- FM-interactie (opstelling, transferlijst, verlanglijst) echt maken.

-- Spelers-seed upsert op naam (geen stabiele external_id zolang sync_squad nog niet draait).
create unique index if not exists idx_players_name_unique on players (name);

-- Geaggregeerde percentages (meest weggestemd, consensus-opstelling) worden
-- client-side berekend en vereisen publieke leesrechten. Er staat geen
-- persoonlijke data in deze tabellen behalve het profile_id (uuid).
create policy "stemmen zijn publiek leesbaar voor aggregatie" on transfer_votes
  for select using (true);

create policy "opstellingen zijn publiek leesbaar voor aggregatie" on user_lineups
  for select using (true);

-- Stem intrekken moet kunnen (max-3-lijstje beheren).
-- De bestaande "for all"-policy dekt delete al; niets extra nodig voor eigen rijen.
