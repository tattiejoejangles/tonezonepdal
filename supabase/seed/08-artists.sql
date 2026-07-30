-- ---------------------------------------------------------------------------
-- Artists, with photos.
--
-- The "Played by" sections were a row of grey word-chips, which is a lot of
-- blank space for the most evocative fact on the page. This table holds one
-- row per artist with a photo URL you fill in; the site matches the names
-- already stored on each pedal against it and shows the picture.
--
-- HOW THE MATCHING WORKS
--
-- Pedals keep storing artists as plain text in `originals.artists` - nothing
-- about how you add a pedal changes. Matching is on `match_key`, which is the
-- name lowercased with accents stripped and everything non-alphanumeric turned
-- into a hyphen. So "Noel Gallagher", "noel gallagher" and "NOEL  GALLAGHER"
-- all find the same row.
--
-- A genuine misspelling will NOT match - deliberately, because fuzzy matching
-- that is loose enough to catch "Gallager" is also loose enough to put the
-- wrong face on a pedal. Add the misspelling to `aliases` instead and it
-- resolves to the same artist:
--
--   update public.artists
--      set aliases = array_append(aliases, 'noel-gallager')
--    where match_key = 'noel-gallagher';
--
-- TO ADD A PHOTO
--
--   update public.artists set image_url = 'https://…', image_credit = 'Wikimedia - CC BY-SA 4.0'
--    where match_key = 'noel-gallagher';
--
-- Mind the licensing on artist photography - press shots are usually
-- copyrighted. Wikimedia Commons is the safe source, and `image_credit` is
-- rendered on the page when it starts with "wikimedia".
--
-- Seeded from every artist already named anywhere in the catalogue, deduped
-- case-insensitively: 99 rows. Two entries in the existing data are
-- descriptive phrases rather than artists and are deliberately NOT here:
-- "Bands in the HM-2 death metal revival" and "Widely used across doom and
-- stoner rock". They will render as plain chips with no photo, which is right,
-- but they'd read better edited out of those pedals' artist lists.
-- ---------------------------------------------------------------------------

create table if not exists public.artists (
  -- Normalised name. The join key, and stable if the display name is retitled.
  match_key text primary key,
  name text not null,
  -- Alternate spellings that should resolve here. Store them normalised.
  aliases text[] not null default '{}',
  image_url text,
  image_credit text,
  -- Optional one-liner, e.g. "Radiohead". Shown under the name where there's room.
  known_for text,
  created_at timestamptz not null default now()
);

create index if not exists artists_aliases_idx on public.artists using gin (aliases);

-- Readable by the public site; only the service role writes.
alter table public.artists enable row level security;

drop policy if exists "artists are public" on public.artists;
create policy "artists are public"
  on public.artists for select
  to anon, authenticated
  using (true);

insert into public.artists (match_key, name) values
  ('adam-jones','Adam Jones'),
  ('albert-hammond-jr','Albert Hammond Jr'),
  ('alex-lifeson','Alex Lifeson'),
  ('alex-turner','Alex Turner'),
  ('andy-summers','Andy Summers'),
  ('andy-timmons','Andy Timmons'),
  ('bill-frisell','Bill Frisell'),
  ('bill-kelliher','Bill Kelliher'),
  ('billy-corgan','Billy Corgan'),
  ('billy-gibbons','Billy Gibbons'),
  ('brian-jones','Brian Jones'),
  ('brian-may','Brian May'),
  ('bruce-kulick','Bruce Kulick'),
  ('carlos-o-connell','Carlos O''Connell'),
  ('christian-savill','Christian Savill'),
  ('conor-curley','Conor Curley'),
  ('dan-auerbach','Dan Auerbach'),
  ('daniel-lanois','Daniel Lanois'),
  ('daniele-villarreal','Daniele Villarreal'),
  ('dave-keuning','Dave Keuning'),
  ('dave-simpson','Dave Simpson'),
  ('david-gilmour','David Gilmour'),
  ('dinosaur-jr','Dinosaur Jr'),
  ('dismember','Dismember'),
  ('ed-o-brien','Ed O''Brien'),
  ('eddie-van-halen','Eddie Van Halen'),
  ('electric-wizard','Electric Wizard'),
  ('emily-roberts','Emily Roberts'),
  ('entombed','Entombed'),
  ('eric-johnson','Eric Johnson'),
  ('gary-holt','Gary Holt'),
  ('gary-moore','Gary Moore'),
  ('geddy-lee','Geddy Lee'),
  ('graham-coxon','Graham Coxon'),
  ('guy-pratt','Guy Pratt'),
  ('j-mascis','J Mascis'),
  ('jack-white','Jack White'),
  ('jamie-stillman','Jamie Stillman'),
  ('jeff-baxter','Jeff Baxter'),
  ('jeff-beck','Jeff Beck'),
  ('jenny-clifford','Jenny Clifford'),
  ('jim-root','Jim Root'),
  ('jimi-hendrix','Jimi Hendrix'),
  ('joe-bonamassa','Joe Bonamassa'),
  ('joe-perry','Joe Perry'),
  ('joe-satriani','Joe Satriani'),
  ('joey-landreth','Joey Landreth'),
  ('joey-walker','Joey Walker'),
  ('john-frusciante','John Frusciante'),
  ('john-lennon','John Lennon'),
  ('john-mayer','John Mayer'),
  ('john-petrucci','John Petrucci'),
  ('johnny-marr','Johnny Marr'),
  ('jonny-buckland','Jonny Buckland'),
  ('jonny-greenwood','Jonny Greenwood'),
  ('joseph-ross','Joseph Ross'),
  ('josh-homme','Josh Homme'),
  ('keith-urban','Keith Urban'),
  ('kevin-shields','Kevin Shields'),
  ('kirk-hammett','Kirk Hammett'),
  ('kurt-ballou','Kurt Ballou'),
  ('kurt-cobain','Kurt Cobain'),
  ('lari-basilio','Lari Basilio'),
  ('les-claypool','Les Claypool'),
  ('mark-speer','Mark Speer'),
  ('mark-tremonti','Mark Tremonti'),
  ('matt-bellamy','Matt Bellamy'),
  ('matt-pike','Matt Pike'),
  ('mike-campbell','Mike Campbell'),
  ('mila-karlsson','Mila Karlsson'),
  ('monica-valli','Monica Valli'),
  ('neil-halstead','Neil Halstead'),
  ('nels-cline','Nels Cline'),
  ('nicke-andersson','Nicke Andersson'),
  ('noel-gallagher','Noel Gallagher'),
  ('nuno-bettencourt','Nuno Bettencourt'),
  ('pete-thorn','Pete Thorn'),
  ('peter-buck','Peter Buck'),
  ('peter-frampton','Peter Frampton'),
  ('phoebe-bridgers','Phoebe Bridgers'),
  ('prince','Prince'),
  ('rabea-massaad','Rabea Massaad'),
  ('radiohead','Radiohead'),
  ('robben-ford','Robben Ford'),
  ('robert-smith','Robert Smith'),
  ('robin-trower','Robin Trower'),
  ('rory-gallagher','Rory Gallagher'),
  ('sam-fender','Sam Fender'),
  ('scott-ian','Scott Ian'),
  ('slash','Slash'),
  ('steve-vai','Steve Vai'),
  ('stevie-ray-vaughan','Stevie Ray Vaughan'),
  ('the-edge','The Edge'),
  ('tom-morello','Tom Morello'),
  ('tom-petty','Tom Petty'),
  ('tracii-guns','Tracii Guns'),
  ('trey-azagthoth','Trey Azagthoth'),
  ('troy-van-leeuwen','Troy Van Leeuwen'),
  ('zakk-wylde','Zakk Wylde')
on conflict (match_key) do nothing;
