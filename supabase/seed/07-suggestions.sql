-- ---------------------------------------------------------------------------
-- User suggestions.
--
-- Anyone can propose a change; nothing reaches the catalogue until it is
-- approved in /admin. This table is the queue in between.
--
-- Deliberately NOT a set of columns mirroring `originals`. A suggestion is a
-- message about the catalogue, not a draft row in it: "add Sarah Lipstate to
-- the Big Muff" and "this price is £20 out" and "please add the Boss OD-3"
-- have almost nothing structurally in common, and modelling them as a
-- half-populated pedal row would make every field nullable and meaningless.
-- Instead the shape is: what kind of change, what it is about, and the
-- proposed content as free text plus an optional JSON payload for structured
-- fields the form can collect.
-- ---------------------------------------------------------------------------

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- What sort of change. Drives the admin filter.
  kind text not null check (kind in ('addition', 'amendment', 'removal')),

  -- What it is about. Both null for "add something new that isn't here yet".
  target_kind text check (target_kind in ('original', 'alternative')),
  target_slug text,

  -- Which part of the record, e.g. "price", "artists", "specs", "new-clone".
  field text not null,

  -- The proposal in the submitter's words. Always required - even a
  -- structured edit wants a reason.
  body text not null check (length(btrim(body)) between 1 and 4000),

  -- Optional structured payload for forms that can collect one, e.g.
  -- {"price_gbp": 45} or {"artists": ["Nels Cline"]}.
  payload jsonb,

  -- Optional, so someone can be told their suggestion landed. Never shown.
  contact text check (contact is null or length(contact) <= 200),

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  -- Free-text note from review, for your own memory.
  review_note text
);

create index if not exists suggestions_status_created_idx
  on public.suggestions (status, created_at desc);

create index if not exists suggestions_target_idx
  on public.suggestions (target_kind, target_slug);

-- Row level security -------------------------------------------------------
-- The public anon key may INSERT and nothing else: no reading other people's
-- submissions, no editing, no deleting. The admin routes use the service role
-- key, which bypasses RLS entirely, so review is unaffected.

alter table public.suggestions enable row level security;

drop policy if exists "anon can submit suggestions" on public.suggestions;
create policy "anon can submit suggestions"
  on public.suggestions for insert
  to anon, authenticated
  with check (true);

-- No select/update/delete policy is created on purpose. Without one, RLS
-- denies those to anon by default.
