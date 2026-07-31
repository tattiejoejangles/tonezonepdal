-- ---------------------------------------------------------------------------
-- A clone can copy more than one original.
--
-- A TC Electronic Sub 'N' Up is a credible alternative to an EHX POG and to a
-- Boss OC-5; a Behringer compact is often a copy of one BOSS pedal but a
-- reasonable stand-in for another. The catalogue could only say one of those,
-- because `alternatives.original_id` is a single column, so the second pairing
-- simply did not exist and the clone was invisible on the other pedal's page.
--
-- WHY A JOIN TABLE RATHER THAN AN ARRAY COLUMN
--
-- The pairing carries its own data. How close a clone gets depends on WHICH
-- original you are holding it against - the same box might be a 92% match for
-- the pedal it was reverse-engineered from and a 70% match for the one it
-- merely resembles. `match_quality` therefore belongs on the pairing, not on
-- the clone. An array of ids could not hold it.
--
-- `alternatives.original_id` STAYS, and stays authoritative for one thing: it
-- is the *primary* original, which decides the clone's category (a clone has no
-- category of its own - it is whatever it copies) and which pedal its own page
-- leads with. Everything in this table beyond that row is an additional
-- pairing. Keeping the column means nothing that reads it had to change, and
-- the site still works if this table is empty.
--
-- Safe to run twice.
-- ---------------------------------------------------------------------------

create table if not exists public.alternative_originals (
  alternative_id text not null,
  original_id text not null,
  -- Display order of the "copies" row on a clone page. The primary is 0.
  position int not null default 0,
  -- How close this clone gets to THIS original. Null falls back to the clone's
  -- own `match_quality`, which is what every existing row does.
  match_quality int check (match_quality between 0 and 100),
  created_at timestamptz not null default now(),
  primary key (alternative_id, original_id)
);

create index if not exists alternative_originals_original_idx
  on public.alternative_originals (original_id);

alter table public.alternative_originals enable row level security;

drop policy if exists "pairings are public" on public.alternative_originals;
create policy "pairings are public"
  on public.alternative_originals for select
  to anon, authenticated
  using (true);

-- Backfill: every clone's existing single original becomes its primary pairing,
-- so the join table is complete from the moment it exists and the read path
-- never has to fall back to the column.
insert into public.alternative_originals (alternative_id, original_id, position)
select id, original_id, 0 from public.alternatives
where original_id is not null
on conflict (alternative_id, original_id) do nothing;
