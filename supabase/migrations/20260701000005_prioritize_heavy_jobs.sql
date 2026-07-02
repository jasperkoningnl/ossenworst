-- Geeft merge/translate/summarize-jobs voorrang boven fetch_source zodat
-- topics sneller verschijnen in de feed. process_item wordt nu bulk-afgehandeld
-- in de tick-route en hoeft niet meer via deze queue.
create or replace function claim_next_job()
returns setof jobs
language plpgsql
as $$
begin
  return query
    update jobs
    set status = 'running',
        locked_at = now(),
        attempts = attempts + 1
    where id = (
      select id from jobs
      where status = 'queued' and run_after <= now()
      order by
        case type
          when 'summarize' then 0
          when 'merge' then 1
          when 'translate' then 2
          when 'fetch_source' then 3
          else 4
        end,
        run_after asc
      limit 1
      for update skip locked
    )
    returning *;
end;
$$;
