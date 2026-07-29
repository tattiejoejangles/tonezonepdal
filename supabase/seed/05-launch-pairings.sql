-- ---------------------------------------------------------------------------
-- Launch expansion, part 2: pairings first.
--
-- Run AFTER 04-expansion.sql. Safe to run twice: bare `on conflict do nothing` absorbs id AND slug clashes.
--
-- This file is deliberately thin on prose. The priority here was breadth of
-- ORIGINAL -> ALTERNATIVE links rather than finished copy: every row has the
-- fields the site needs to render a card and a page (name, brand, price,
-- blurb, category, match quality), and `description`, `tags`, `artists`,
-- `pros`, `cons`, `specs` and `verdict` are left empty for you to fill in from
-- the admin. The UI already handles those being absent - specs say "Not
-- confirmed yet", artists say "None recorded yet", and nothing invents data.
--
-- Checked against everything already in the database, including 04. No id or
-- slug in here collides, and every original has at least one alternative
-- (an original with none is filtered out of the directory entirely).
--
-- Photos are NULL. Run `npm run images` afterwards.
-- Prices are approximate UK street prices and want a sanity check before launch.
-- ---------------------------------------------------------------------------

-- Originals -----------------------------------------------------------------

insert into public.originals
  (id, slug, name, brand, category, price_gbp, blurb, description,
   image_credit, tags, artists, aliases, popularity, search_query)
values

('org-small-stone','electro-harmonix-small-stone','Electro-Harmonix Small Stone','Electro-Harmonix','modulation',85,'The four-stage phaser with a colour switch and a mind of its own.',NULL,NULL,ARRAY['small stone','phaser','ehx','electro harmonix','phase','colour switch']::text[],'{}','{}',78,'Electro-Harmonix Small Stone phaser'),

('org-electric-mistress','electro-harmonix-electric-mistress','Electro-Harmonix Electric Mistress','Electro-Harmonix','modulation',145,'Flanger with a filter-matrix mode that freezes the sweep where you leave it.',NULL,NULL,ARRAY['electric mistress','flanger','ehx','electro harmonix','filter matrix','gilmour']::text[],'{}','{}',74,'Electro-Harmonix Electric Mistress flanger'),

('org-cry-baby','dunlop-cry-baby-gcb95','Dunlop Cry Baby GCB95','Dunlop','eq',99,'The wah. The most recognisable pedal shape ever made.',NULL,NULL,ARRAY['cry baby','crybaby','wah','wah wah','dunlop','gcb95','filter']::text[],'{}','{}',90,'Dunlop Cry Baby GCB95 wah'),

('org-ds-2','boss-ds-2-turbo-distortion','Boss DS-2 Turbo Distortion','Boss','distortion',109,'The DS-1 with a second, angrier mode bolted on.',NULL,NULL,ARRAY['ds2','ds-2','turbo distortion','boss','distortion','cobain','nirvana']::text[],'{}','{}',80,'Boss DS-2 Turbo Distortion'),

('org-micro-amp','mxr-micro-amp','MXR Micro Amp','MXR','overdrive',89,'One knob, no tone shaping - just more of what you already have.',NULL,NULL,ARRAY['micro amp','boost','clean boost','mxr','gain','transparent']::text[],'{}','{}',76,'MXR Micro Amp boost'),

('org-5150','evh-5150iii-50w','EVH 5150III 50W','EVH','amp',1599,'The modern high-gain benchmark, and the amp half of metal is chasing.',NULL,NULL,ARRAY['5150','5150iii','evh','van halen','high gain','metal','valve head','tube amp']::text[],'{}','{}',86,'EVH 5150III 50W head')

on conflict do nothing;

-- Alternatives --------------------------------------------------------------
-- Both new originals above and the ones added in 04, which had thin coverage.

insert into public.alternatives
  (id, slug, original_id, name, brand, price_gbp, blurb,
   image_credit, pros, cons, aliases, popularity, match_quality, search_query, verdict)
values

-- EHX Small Stone -----------------------------------------------------------
-- (Behringer VP1 is not here: 04 already files it under the Boss PH-3, and a
-- slug can only be used once.)
('alt-blood-moon','tc-electronic-blood-moon-phaser','org-small-stone','TC Electronic Blood Moon Phaser','TC Electronic',49,'Four-stage analogue phaser with speed, depth and feedback.',NULL,'{}','{}','{}',78,80,NULL,NULL),
('alt-jf11-phase','joyo-jf-38-aquarius','org-small-stone','Joyo JF-38 Aquarius','Joyo',45,'Multi-mode modulation including phaser, chorus and flanger settings.',NULL,'{}','{}','{}',70,66,NULL,NULL),

-- EHX Electric Mistress -----------------------------------------------------
('alt-eleclady','mooer-eleclady','org-electric-mistress','Mooer Eleclady','Mooer',55,'Analogue flanger in a micro box, aimed squarely at the Mistress.',NULL,'{}','{}','{}',82,84,NULL,NULL),
('alt-jf05','joyo-jf-05-classic-flanger','org-electric-mistress','Joyo JF-05 Classic Flanger','Joyo',35,'Metal-boxed analogue flanger with the full sweep range.',NULL,'{}','{}','{}',74,78,NULL,NULL),

-- Dunlop Cry Baby -----------------------------------------------------------
('alt-hellbabe','behringer-hb01-hellbabe','org-cry-baby','Behringer HB01 Hellbabe','Behringer',49,'Optical wah with an adjustable sweep range and no pot to wear out.',NULL,'{}','{}','{}',70,74,NULL,NULL),
('alt-wah-cry','donner-wah-cry','org-cry-baby','Donner Wah Cry','Donner',45,'Compact wah with a volume mode, at half the size and price.',NULL,'{}','{}','{}',72,72,NULL,NULL),

-- Boss DS-2 -----------------------------------------------------------------
('alt-jf03','joyo-jf-03-crunch-distortion','org-ds-2','Joyo JF-03 Crunch Distortion','Joyo',35,'Mid-gain crunch in a metal box with true bypass.',NULL,'{}','{}','{}',74,76,NULL,NULL),
('alt-blade','mooer-blade','org-ds-2','Mooer Blade','Mooer',55,'Micro high-gain distortion with a genuinely usable EQ section.',NULL,'{}','{}','{}',80,74,NULL,NULL),
('alt-grand-magus','tc-electronic-grand-magus-distortion','org-ds-2','TC Electronic Grand Magus Distortion','TC Electronic',45,'Straight-ahead distortion with a wide-ranging tone control.',NULL,'{}','{}','{}',76,72,NULL,NULL),

-- MXR Micro Amp -------------------------------------------------------------
('alt-micro-boost','mooer-micro-boost','org-micro-amp','Mooer Micro Boost','Mooer',45,'Up to 20dB of clean boost in the smallest box on the board.',NULL,'{}','{}','{}',80,82,NULL,NULL),
('alt-pure-sky','caline-pure-sky','org-micro-amp','Caline Pure Sky','Caline',39,'Near-transparent boost and light drive, and a long-running budget favourite.',NULL,'{}','{}','{}',84,74,NULL,NULL),

-- EVH 5150III ---------------------------------------------------------------
('alt-catalyst-60','line-6-catalyst-60','org-5150','Line 6 Catalyst 60','Line 6',299,'Six amp voicings including a modern high-gain, with effects and a power switch.',NULL,'{}','{}','{}',82,68,NULL,NULL),
('alt-mg30','marshall-mg30gfx','org-5150','Marshall MG30GFX','Marshall',179,'30 solid-state watts with a hot lead channel and built-in effects.',NULL,'{}','{}','{}',70,48,NULL,NULL),

-- Filling out the thin originals from 04 ------------------------------------
('alt-forcefield','tc-electronic-forcefield-compressor','org-dyna-comp','TC Electronic Forcefield Compressor','TC Electronic',45,'Simple two-knob compression from a brand that knows the circuit.',NULL,'{}','{}','{}',78,78,NULL,NULL),
('alt-june-60','tc-electronic-june-60-chorus','org-small-clone','TC Electronic June-60 Chorus','TC Electronic',59,'Fixed-mode chorus modelled on the Juno synth''s chorus section.',NULL,'{}','{}','{}',84,74,NULL,NULL),
('alt-tutti-love','donner-tutti-love','org-small-clone','Donner Tutti Love','Donner',32,'Compact analogue-voiced chorus with rate, depth and level.',NULL,'{}','{}','{}',72,76,NULL,NULL),
('alt-ut300','behringer-ut300-ultra-tremolo','org-tr-2','Behringer UT300 Ultra Tremolo','Behringer',25,'Rate, depth and wave in the cheapest tremolo on the shelf.',NULL,'{}','{}','{}',68,74,NULL,NULL),
('alt-choka','tc-electronic-choka-tremolo','org-tr-2','TC Electronic Choka Tremolo','TC Electronic',45,'Analogue tremolo with a shape control that spans smooth to hard chop.',NULL,'{}','{}','{}',78,80,NULL,NULL),
('alt-uo300','behringer-uo300-ultra-octaver','org-whammy','Behringer UO300 Ultra Octaver','Behringer',29,'Two sub-octaves and an up-octave, with independent level controls.',NULL,'{}','{}','{}',66,50,NULL,NULL),
('alt-echobrain','tc-electronic-echobrain-delay','org-memory-man','TC Electronic Echobrain Delay','TC Electronic',45,'Analogue-voiced delay with up to 300ms and a warm, dark repeat.',NULL,'{}','{}','{}',80,74,NULL,NULL),
('alt-mosky-blue-delay','mosky-blue-delay','org-memory-man','Mosky Blue Delay','Mosky',35,'Micro delay with time, repeat and level, at the bottom of the price range.',NULL,'{}','{}','{}',70,66,NULL,NULL),
('alt-mosky-spring','mosky-spring-reverb','org-bluesky','Mosky Spring Reverb','Mosky',35,'Single-knob spring reverb in a micro enclosure.',NULL,'{}','{}','{}',70,58,NULL,NULL)

on conflict do nothing;
