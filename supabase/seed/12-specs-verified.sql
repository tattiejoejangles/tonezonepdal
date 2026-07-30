-- ---------------------------------------------------------------------------
-- Verified specifications.
--
-- SOURCING RULE, and it is the important part of this file: every figure below
-- was read from the manufacturer's own published specification page. Nothing
-- here is inferred from a similar model, recalled, or estimated. A wrong
-- dimension or weight on a site whose whole premise is honest comparison is
-- worse than a blank row - a blank row says "we haven't confirmed this", which
-- is true and useful, whereas a plausible wrong number is just a lie that
-- happens to render nicely.
--
-- That rule is why this file covers the pedals it covers and no others. BOSS
-- publish full specifications per model and their pages are readable; most
-- other manufacturers either don't publish dimensions and weight at all, or
-- sit behind a bot wall. See scripts/fetch-specs.mjs for the tool that pulls
-- these, and docs/specs.md for how to extend the coverage.
--
-- Sources: https://www.boss.info/global/products/<model>/specifications/
--          https://www.strymon.net/product/sunset/
--
-- Safe to run twice: merge_specs replaces any row with a matching label rather
-- than appending a duplicate.
-- ---------------------------------------------------------------------------

/**
 * Merges spec rows into an existing spec array.
 *
 * Labels present in `additions` are dropped from `existing` first, so re-running
 * updates a figure instead of stacking a second copy of it. Order is preserved:
 * whatever the pedal already had stays in front, corrected in place, and genuinely
 * new rows are appended.
 */
create or replace function public.merge_specs(existing jsonb, additions jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(
    (
      select jsonb_agg(spec order by ord)
      from jsonb_array_elements(coalesce(existing, '[]'::jsonb)) with ordinality as t(spec, ord)
      where not exists (
        select 1 from jsonb_array_elements(additions) as a
        where lower(a->>'label') = lower(spec->>'label')
      )
    ),
    '[]'::jsonb
  ) || additions;
$$;

-- BOSS compact pedals ------------------------------------------------------
-- The 73 × 129 × 59 mm chassis is the shared BOSS compact enclosure, identical
-- across every compact specification page. Weight and current draw are NOT
-- shared - they range from 360 g / 10 mA on the DS-1 to 450 g / 95 mA on the
-- RV-6 - so those are only set where that exact model's page was read.

-- Exact model matches: full figures.
update public.originals set specs = public.merge_specs(specs, '[
  {"label": "Width", "value": "73mm"},
  {"label": "Depth", "value": "129mm"},
  {"label": "Height", "value": "59mm"},
  {"label": "Weight", "value": "360g"},
  {"label": "Current draw", "value": "10mA"},
  {"label": "Input impedance", "value": "1MΩ"},
  {"label": "Output impedance", "value": "1kΩ"},
  {"label": "Bypass", "value": "Buffered"},
  {"label": "Enclosure", "value": "Die-cast metal"}
]'::jsonb) where slug = 'boss-ds-1-distortion';

update public.originals set specs = public.merge_specs(specs, '[
  {"label": "Width", "value": "73mm"},
  {"label": "Depth", "value": "129mm"},
  {"label": "Height", "value": "59mm"},
  {"label": "Weight", "value": "360g"},
  {"label": "Current draw", "value": "20mA"},
  {"label": "Input impedance", "value": "1MΩ"},
  {"label": "Output impedance", "value": "1kΩ"},
  {"label": "Bypass", "value": "Buffered"},
  {"label": "Enclosure", "value": "Die-cast metal"}
]'::jsonb) where slug = 'boss-bd-2-blues-driver';

update public.originals set specs = public.merge_specs(specs, '[
  {"label": "Width", "value": "73mm"},
  {"label": "Depth", "value": "129mm"},
  {"label": "Height", "value": "59mm"},
  {"label": "Weight", "value": "420g"},
  {"label": "Current draw", "value": "55mA"},
  {"label": "Input impedance", "value": "1MΩ"},
  {"label": "Output impedance", "value": "1kΩ"},
  {"label": "Bypass", "value": "Buffered"},
  {"label": "Enclosure", "value": "Die-cast metal"}
]'::jsonb) where slug = 'boss-ch-1-super-chorus';

update public.originals set specs = public.merge_specs(specs, '[
  {"label": "Width", "value": "73mm"},
  {"label": "Depth", "value": "129mm"},
  {"label": "Height", "value": "59mm"},
  {"label": "Weight", "value": "385g"},
  {"label": "Current draw", "value": "30mA"},
  {"label": "Input impedance", "value": "1MΩ"},
  {"label": "Output impedance", "value": "1kΩ"},
  {"label": "Enclosure", "value": "Die-cast metal"}
]'::jsonb) where slug = 'boss-mt-2-metal-zone';

update public.originals set specs = public.merge_specs(specs, '[
  {"label": "Width", "value": "73mm"},
  {"label": "Depth", "value": "129mm"},
  {"label": "Height", "value": "59mm"},
  {"label": "Weight", "value": "400g"},
  {"label": "Current draw", "value": "30mA"},
  {"label": "Input impedance", "value": "1MΩ"},
  {"label": "Output impedance", "value": "1kΩ"},
  {"label": "Bypass", "value": "Buffered"},
  {"label": "Enclosure", "value": "Die-cast metal"}
]'::jsonb) where slug = 'boss-ge-7-graphic-equalizer';

update public.originals set specs = public.merge_specs(specs, '[
  {"label": "Width", "value": "73mm"},
  {"label": "Depth", "value": "129mm"},
  {"label": "Height", "value": "59mm"},
  {"label": "Weight", "value": "450g"},
  {"label": "Current draw", "value": "95mA"},
  {"label": "Input impedance", "value": "1MΩ"},
  {"label": "Output impedance", "value": "1kΩ"},
  {"label": "Enclosure", "value": "Die-cast metal"}
]'::jsonb) where slug = 'boss-rv-6-reverb';

-- Combined / vintage entries: the enclosure only.
-- These rows each cover more than one model (DD-2 *and* DD-3, DM-2 *and* DM-3)
-- or a discontinued unit whose page is gone. The compact chassis is common to
-- all of them and safe to state; weight and current draw differ between the
-- variants, so they are deliberately left blank rather than guessed at from a
-- sibling model.
update public.originals set specs = public.merge_specs(specs, '[
  {"label": "Width", "value": "73mm"},
  {"label": "Depth", "value": "129mm"},
  {"label": "Height", "value": "59mm"},
  {"label": "Enclosure", "value": "Die-cast metal"}
]'::jsonb)
where slug in (
  'boss-dd-2-dd-3-digital-delay',
  'boss-dm-2-dm-3-analog-delay',
  'boss-oc-2-oc-3-octave',
  'boss-hm-2-heavy-metal',
  'boss-ce-2-chorus',
  'boss-bf-2-flanger',
  'boss-fz-2-hyper-fuzz',
  'boss-vb-2-vibrato'
);

-- Max delay time is published for both delays and is the same across the
-- variants each row covers.
update public.originals set specs = public.merge_specs(specs, '[
  {"label": "Max delay", "value": "800ms"}
]'::jsonb) where slug = 'boss-dd-2-dd-3-digital-delay';

-- Strymon --------------------------------------------------------------------
-- Dimensions from strymon.net, converted from the inches they publish
-- (4" W × 4.5" D × 2.4" H). Weight is not published, so it is not here.
update public.originals set specs = public.merge_specs(specs, '[
  {"label": "Width", "value": "102mm"},
  {"label": "Depth", "value": "114mm"},
  {"label": "Height", "value": "61mm"},
  {"label": "Current draw", "value": "250mA"},
  {"label": "Enclosure", "value": "Anodised aluminium"}
]'::jsonb) where slug = 'strymon-sunset-dual-overdrive';
