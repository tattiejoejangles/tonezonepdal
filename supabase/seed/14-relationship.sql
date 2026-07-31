-- ---------------------------------------------------------------------------
-- Clone, or merely an alternative?
--
-- Every budget pedal on the site was called a "clone", which is wrong often
-- enough to matter. A Behringer TO800 really is a Tube Screamer circuit in a
-- plastic box - same op-amp, same clipping, same mid-hump. A Wampler Tumnus is
-- a Klon circuit reworked with a proper EQ. A Boss BD-2 is not a Tube Screamer
-- at all; it does the same job by other means, and telling somebody it is a
-- clone sets them up to be disappointed by the thing it does differently.
--
-- Three values rather than two, because two cannot hold that middle case, and
-- the middle case is where most of the interesting pedals live.
--
-- It goes on the PAIRING, not on the pedal: the same box can be a straight copy
-- of the pedal it was reverse-engineered from and a loose alternative to
-- another one it merely resembles.
--
-- Safe to run twice.
-- ---------------------------------------------------------------------------

alter table public.alternative_originals
  add column if not exists relationship text not null default 'alternative'
    check (relationship in ('clone', 'alternative', 'inspired'));

comment on column public.alternative_originals.relationship is
  'clone = a copy of the same circuit; inspired = built on it but changed; alternative = does the same job by other means.';

-- Seeded from the tonal match already on the data, so the distinction is useful
-- immediately rather than after 124 manual edits. A 90%+ match is, in practice,
-- what a circuit copy scores. Correct any of them in /admin - the edit form asks
-- the question directly.
update public.alternative_originals ao
   set relationship = 'clone'
  from public.alternatives a
 where a.id = ao.alternative_id
   and coalesce(ao.match_quality, a.match_quality) >= 90;

update public.alternative_originals ao
   set relationship = 'inspired'
  from public.alternatives a
 where a.id = ao.alternative_id
   and coalesce(ao.match_quality, a.match_quality) between 80 and 89;
