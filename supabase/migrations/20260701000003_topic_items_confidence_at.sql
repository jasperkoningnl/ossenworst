-- De tijdlijn moet de évolutie van betrouwbaarheid tonen (praatprogramma →
-- gerucht → bevestigd), niet alleen de huidige stand. confidence_at legt vast
-- wat topics.confidence was direct na het toevoegen van dit topic_item.

alter table topic_items add column confidence_at confidence_level;

update topic_items ti
set confidence_at = t.confidence
from topics t
where ti.topic_id = t.id and ti.confidence_at is null;

alter table topic_items alter column confidence_at set not null;
