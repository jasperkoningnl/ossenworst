-- Ossenworst Manager — initial schema
-- Zie PLAN.md voor de volledige architectuurbeschrijving.

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type topic_category as enum ('TRANSFER', 'STAF', 'CLUB', 'EREDIVISIE', 'EX-SPELER', 'WEDSTRIJD');
create type confidence_level as enum ('BEVESTIGD', 'GERUCHT', 'PRAATPROGRAMMA');
create type fetch_method as enum ('rss', 'scrape', 'api');
create type processing_status as enum ('pending', 'processed', 'skipped', 'error');
create type job_type as enum ('fetch_source', 'process_item', 'translate', 'merge', 'summarize', 'sync_squad');
create type job_status as enum ('queued', 'running', 'done', 'error');
create type squad_type as enum ('first', 'jong', 'former');
create type lineup_mode as enum ('current', 'alltime');
create type vote_kind as enum ('out', 'wish');
create type comment_status as enum ('visible', 'hidden');

-- ---------------------------------------------------------------------------
-- Nieuws & bronnen
-- ---------------------------------------------------------------------------

create table sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  url text not null,
  tier smallint not null check (tier in (1, 2, 3)),
  country text not null,
  language text not null,
  fetch_method fetch_method not null,
  feed_url text,
  scrape_config jsonb,
  enabled boolean not null default true,
  last_fetched_at timestamptz,
  last_status text
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category topic_category not null,
  confidence confidence_level not null default 'PRAATPROGRAMMA',
  summary text,
  summary_updated_at timestamptz,
  player_id uuid, -- FK toegevoegd na players-tabel
  first_seen_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  item_count integer not null default 0,
  is_published boolean not null default true,
  embedding vector(1536)
);

create table raw_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  external_id text not null,
  url text not null,
  title text not null,
  body text,
  published_at timestamptz,
  language text not null,
  fetched_at timestamptz not null default now(),
  processing_status processing_status not null default 'pending',
  topic_id uuid references topics(id) on delete set null,
  unique (source_id, external_id)
);

create table topic_items (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  raw_item_id uuid not null references raw_items(id) on delete cascade,
  source_id uuid not null references sources(id) on delete cascade,
  reported_at timestamptz not null default now(),
  snippet text,
  contribution text,
  unique (topic_id, raw_item_id)
);

create table translations (
  id uuid primary key default gen_random_uuid(),
  raw_item_id uuid not null references raw_items(id) on delete cascade,
  target_lang text not null default 'nl',
  translated_title text not null,
  translated_body text,
  model text not null,
  created_at timestamptz not null default now(),
  unique (raw_item_id, target_lang)
);

-- ---------------------------------------------------------------------------
-- Selectie / FM-data
-- ---------------------------------------------------------------------------

create table players (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  photo_url text,
  shirt_number smallint,
  position text,
  birth_date date,
  nationality text,
  contract_until date,
  market_value bigint,
  squad squad_type not null default 'first',
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table topics
  add constraint topics_player_id_fkey foreign key (player_id) references players(id) on delete set null;

create table formations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slots jsonb not null
);

-- Gerelateerd nieuws per speler: afgeleid van topics.player_id, geen aparte opslag nodig.
create view player_news as
  select t.player_id, t.id as topic_id, t.title, t.category, t.confidence, t.last_activity_at
  from topics t
  where t.player_id is not null and t.is_published = true;

-- ---------------------------------------------------------------------------
-- Gebruikers & bijdragen
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz not null default now()
);

create table user_lineups (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  formation_id uuid not null references formations(id),
  slots jsonb not null,
  mode lineup_mode not null default 'current',
  created_at timestamptz not null default now()
);

create table transfer_votes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  external_player_ref text,
  kind vote_kind not null,
  created_at timestamptz not null default now(),
  check (
    (kind = 'out' and player_id is not null and external_player_ref is null)
    or (kind = 'wish')
  )
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  topic_id uuid not null references topics(id) on delete cascade,
  body text not null,
  status comment_status not null default 'visible',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pipeline-infra
-- ---------------------------------------------------------------------------

create table jobs (
  id uuid primary key default gen_random_uuid(),
  type job_type not null,
  payload jsonb not null default '{}'::jsonb,
  status job_status not null default 'queued',
  attempts smallint not null default 0,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexen
-- ---------------------------------------------------------------------------

create index idx_raw_items_processing_status on raw_items(processing_status);
create index idx_raw_items_source_id on raw_items(source_id);
create index idx_topics_last_activity on topics(last_activity_at desc);
create index idx_topics_category on topics(category);
create index idx_topics_player_id on topics(player_id);
create index idx_topic_items_topic_id on topic_items(topic_id);
create index idx_jobs_status_run_after on jobs(status, run_after);
create index idx_comments_topic_id on comments(topic_id) where status = 'visible';
create index idx_transfer_votes_profile on transfer_votes(profile_id, kind);
create index idx_topics_embedding on topics using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Houdt topics.item_count / last_activity_at bij als er nieuwe tijdlijn-items bijkomen.
create function touch_topic_on_item() returns trigger as $$
begin
  update topics
    set item_count = item_count + 1,
        last_activity_at = greatest(last_activity_at, new.reported_at)
    where id = new.topic_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_touch_topic_on_item
  after insert on topic_items
  for each row execute function touch_topic_on_item();

-- Beperkt transfer_votes tot maximaal 3 per profiel per kind (transferlijst / verlanglijst).
create function enforce_vote_limit() returns trigger as $$
begin
  if (select count(*) from transfer_votes where profile_id = new.profile_id and kind = new.kind) >= 3 then
    raise exception 'Maximaal 3 spelers toegestaan voor kind=%', new.kind;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_enforce_vote_limit
  before insert on transfer_votes
  for each row execute function enforce_vote_limit();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table sources enable row level security;
alter table raw_items enable row level security;
alter table translations enable row level security;
alter table jobs enable row level security;
-- Geen policies: deze tabellen zijn alleen bereikbaar via de service-role client (pipeline/admin).

alter table topics enable row level security;
create policy "topics zijn publiek leesbaar indien gepubliceerd" on topics
  for select using (is_published = true);

alter table topic_items enable row level security;
create policy "topic_items zijn leesbaar als het topic gepubliceerd is" on topic_items
  for select using (exists (
    select 1 from topics t where t.id = topic_items.topic_id and t.is_published = true
  ));

alter table players enable row level security;
create policy "players zijn publiek leesbaar" on players for select using (true);

alter table formations enable row level security;
create policy "formations zijn publiek leesbaar" on formations for select using (true);

alter table profiles enable row level security;
create policy "profiles zijn publiek leesbaar" on profiles for select using (true);
create policy "gebruiker kan eigen profiel aanmaken" on profiles
  for insert with check (auth.uid() = id);
create policy "gebruiker kan eigen profiel bewerken" on profiles
  for update using (auth.uid() = id);

alter table user_lineups enable row level security;
create policy "gebruiker beheert eigen opstellingen" on user_lineups
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

alter table transfer_votes enable row level security;
create policy "gebruiker beheert eigen stemmen" on transfer_votes
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

alter table comments enable row level security;
create policy "zichtbare reacties zijn publiek leesbaar" on comments
  for select using (status = 'visible');
create policy "gebruiker kan reageren" on comments
  for insert with check (profile_id is null or auth.uid() = profile_id);
create policy "gebruiker kan eigen reactie verwijderen" on comments
  for delete using (auth.uid() = profile_id);
