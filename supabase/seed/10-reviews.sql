-- ---------------------------------------------------------------------------
-- Community reviews, v2: one moderated review per browser per clone.
--
-- SUPERSEDES 09-clone-reviews.sql, which was never applied to the live
-- database. Do not run 09 - it extends the old `clone_ratings` table with five
-- jargon axes (voicing, gain_character, dynamics, noise_floor, build_quality)
-- and an unmoderated free-text field, which is the shape this replaces.
--
-- WHAT CHANGED AND WHY
--
-- 1. One form instead of two tiers. The old flow was a one-tap star, then an
--    "Add detail" panel holding five separate 1-5 axes. Splitting them meant
--    almost nobody reached the second tier, and the axes that waited there were
--    written for pedal builders: "gain character", "noise floor", "voicing".
--    A player who owns one overdrive cannot answer those with any confidence.
--
-- 2. Three plain questions, not five technical ones. Each is something an
--    owner can answer from having used the thing - see the comments on the
--    columns. Every one is scored so HIGH IS GOOD, including value, so the
--    averages never need a per-axis direction lookup.
--
-- 3. Moderated. Nothing appears on the site until it is approved in
--    /admin/reviews. The old design published prose immediately and offered a
--    hide switch afterwards, which is the wrong way round for a site that takes
--    anonymous submissions with no account behind them.
--
-- 4. Insert-only for the public. `voter_id` is a random uuid in localStorage,
--    not authentication, so no RLS policy can prove a row belongs to whoever is
--    editing it. The old migration granted anon UPDATE with `using (true)`,
--    which let any visitor rewrite any review. One insert per browser per clone
--    closes that off; re-submitting hits the unique constraint.
--
-- Safe to run twice.
-- ---------------------------------------------------------------------------

create table if not exists public.clone_reviews (
  id uuid primary key default gen_random_uuid(),

  -- FK-by-convention to alternatives.id, matching how clone_ratings did it.
  alternative_id text not null,
  -- Random uuid from the browser's localStorage. Enough to stop casual vote
  -- stacking; deliberately not presented as authentication anywhere.
  voter_id uuid not null,

  -- The headline star. Required: it is the whole review for someone who does
  -- not want to answer anything else.
  rating smallint not null check (rating between 1 and 5),

  -- "Does it sound like the original?" 1 nothing like it, 5 couldn't tell them
  -- apart. The only answer that feeds the tone match percentage, because it is
  -- the only one asking the same question the editorial number answers.
  sounds_like smallint check (sounds_like between 1 and 5),
  -- "How well made does it feel?" 1 feels cheap, 5 built to last. The most
  -- common real complaint about the budget option, and nothing to do with tone.
  build_quality smallint check (build_quality between 1 and 5),
  -- "Worth the money?" 1 not worth it, 5 a bargain. Cheap and disappointing
  -- and cheap and brilliant are the two outcomes this site exists to separate.
  value smallint check (value between 1 and 5),

  -- Free text, optional, moderated. Capped well under a screenful.
  comment text check (comment is null or length(comment) <= 600),

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  -- Private note from moderation, for your own memory.
  review_note text,

  -- One review per browser per clone. Also what makes a re-submit fail loudly
  -- instead of silently creating a second vote.
  unique (alternative_id, voter_id)
);

create index if not exists clone_reviews_approved_idx
  on public.clone_reviews (alternative_id, created_at desc)
  where status = 'approved';

create index if not exists clone_reviews_moderation_idx
  on public.clone_reviews (status, created_at desc);

-- Aggregate: approved rows only -------------------------------------------
-- Per-question counts rather than one shared `votes`, because a review may
-- answer the stars and skip the rest: "4.2 from 3 people" and "4.2 from 30"
-- are different claims and the UI needs to tell them apart.

drop view if exists public.clone_review_summary;

create view public.clone_review_summary
with (security_invoker = true) as
select
  alternative_id,
  round(avg(rating)::numeric, 2)        as average,
  count(rating)                         as votes,
  round(avg(sounds_like)::numeric, 2)   as sounds_like_avg,
  count(sounds_like)                    as sounds_like_votes,
  round(avg(build_quality)::numeric, 2) as build_quality_avg,
  count(build_quality)                  as build_quality_votes,
  round(avg(value)::numeric, 2)         as value_avg,
  count(value)                          as value_votes
from public.clone_reviews
where status = 'approved'
group by alternative_id;

-- Row level security -------------------------------------------------------
-- anon may INSERT a pending review and SELECT approved ones. No update, no
-- delete, and pending prose is never readable by the public - which is the
-- point of moderating it. The admin screens use the service role key, which
-- bypasses RLS entirely.

alter table public.clone_reviews enable row level security;

drop policy if exists "read approved reviews" on public.clone_reviews;
create policy "read approved reviews"
  on public.clone_reviews for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "submit pending review" on public.clone_reviews;
create policy "submit pending review"
  on public.clone_reviews for insert
  to anon, authenticated
  with check (status = 'pending' and reviewed_at is null and review_note is null);

-- Belt and braces alongside the policy above: without the column grant, anon
-- could name `status` in an insert and the WITH CHECK would be the only thing
-- standing between a visitor and self-approval.
revoke insert on public.clone_reviews from anon;
grant insert (
  alternative_id, voter_id, rating, sounds_like, build_quality, value, comment
) on public.clone_reviews to anon;

grant select on public.clone_review_summary to anon, authenticated;

-- Carry over anything cast under the old one-star-only table, as approved:
-- those rows are bare scores with no prose, so there is nothing to moderate.
insert into public.clone_reviews (alternative_id, voter_id, rating, status, created_at, reviewed_at)
select alternative_id, voter_id, rating, 'approved', created_at, now()
from public.clone_ratings
where rating is not null
on conflict (alternative_id, voter_id) do nothing;
