-- ---------------------------------------------------------------------------
-- Community reviews: dimensional ratings plus the rig it was tested on.
--
-- Extends the existing `clone_ratings` rather than replacing it. Every new
-- column is NULLABLE and the overall `rating` column is untouched, so the votes
-- already cast survive and someone can still give a one-tap overall score
-- without filling in a form. That progressive path matters: a five-field
-- review nobody completes is worth less than a single star somebody does.
--
-- Run in the Supabase SQL editor. Safe to run twice.
-- ---------------------------------------------------------------------------

-- 1. Dimensional scores, 1-5, all optional --------------------------------

alter table public.clone_ratings
  -- Frequency balance. Does it sit where the original sits - the mid-hump
  -- question that decides whether a Tube Screamer clone is a Tube Screamer.
  add column if not exists voicing smallint check (voicing between 1 and 5),
  -- How it clips and breaks up, independent of where it's voiced.
  add column if not exists gain_character smallint check (gain_character between 1 and 5),
  -- Touch response: does it clean up off the guitar's volume knob, does it
  -- react to pick attack. The thing budget clones most often flatten.
  add column if not exists dynamics smallint check (dynamics between 1 and 5),
  -- Noise floor. 5 is DEAD QUIET, 1 is hissy - scored so that high is always
  -- good, like every other dimension, rather than making one of the five
  -- read backwards.
  add column if not exists noise_floor smallint check (noise_floor between 1 and 5),
  -- Not sonic, but the single most common real-world complaint about the cheap
  -- option, so it is worth its own axis instead of hiding in the prose.
  add column if not exists build_quality smallint check (build_quality between 1 and 5);

-- 2. The rig it was tested on ---------------------------------------------
-- Short and free-text on purpose. "Strat into a clean Fender Deluxe" carries
-- more than any set of dropdowns would, and a rating with no context is the
-- thing people distrust about community scores.

alter table public.clone_ratings
  add column if not exists rig text check (rig is null or length(rig) <= 160),
  add column if not exists settings text check (settings is null or length(settings) <= 160),
  -- One-click kill switch for the free text, used from /admin/reviews. Scores
  -- keep counting; only the prose disappears.
  add column if not exists text_hidden boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- 3. Aggregate ------------------------------------------------------------
-- Replaces the old two-column view. Each dimension averages only the rows that
-- actually answered it, which is why the counts are per-dimension rather than
-- one shared `votes`: "4.2 from 3 people" and "4.2 from 40" are different
-- claims and the UI needs to be able to tell them apart.

drop view if exists public.clone_rating_summary;

create view public.clone_rating_summary as
select
  alternative_id,
  round(avg(rating)::numeric, 2)            as average,
  count(rating)                             as votes,
  round(avg(voicing)::numeric, 2)           as voicing_avg,
  count(voicing)                            as voicing_votes,
  round(avg(gain_character)::numeric, 2)    as gain_character_avg,
  count(gain_character)                     as gain_character_votes,
  round(avg(dynamics)::numeric, 2)          as dynamics_avg,
  count(dynamics)                           as dynamics_votes,
  round(avg(noise_floor)::numeric, 2)       as noise_floor_avg,
  count(noise_floor)                        as noise_floor_votes,
  round(avg(build_quality)::numeric, 2)     as build_quality_avg,
  count(build_quality)                      as build_quality_votes
from public.clone_ratings
group by alternative_id;

-- 4. Row level security ---------------------------------------------------
-- Unchanged in spirit: anyone may read, and may write only their own row,
-- identified by the random voter id their browser generated. `text_hidden` is
-- deliberately NOT writable by anon - see the column-level grant below, which
-- is what stops someone un-hiding their own hidden prose.

alter table public.clone_ratings enable row level security;

drop policy if exists "anyone can read ratings" on public.clone_ratings;
create policy "anyone can read ratings"
  on public.clone_ratings for select
  to anon, authenticated using (true);

drop policy if exists "insert own rating" on public.clone_ratings;
create policy "insert own rating"
  on public.clone_ratings for insert
  to anon, authenticated with check (text_hidden = false);

drop policy if exists "update own rating" on public.clone_ratings;
create policy "update own rating"
  on public.clone_ratings for update
  to anon, authenticated
  using (true)
  with check (text_hidden = false);

-- Column privileges: anon may write everything except the moderation flag.
revoke update on public.clone_ratings from anon;
grant update (
  rating, voicing, gain_character, dynamics, noise_floor, build_quality,
  rig, settings, updated_at
) on public.clone_ratings to anon;

grant select on public.clone_rating_summary to anon, authenticated;

-- Reviews with prose, newest first - what the page lists under the scores.
create index if not exists clone_ratings_prose_idx
  on public.clone_ratings (alternative_id, updated_at desc)
  where rig is not null or settings is not null;
