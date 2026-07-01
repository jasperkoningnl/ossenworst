-- Concurrency-veilig job-claimen voor de pipeline-worker (Fase 1). SKIP LOCKED
-- voorkomt dat overlappende invocaties (self-chaining + externe GitHub Action
-- tick) hetzelfde job-record oppikken.

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
      order by run_after asc
      limit 1
      for update skip locked
    )
    returning *;
end;
$$;
