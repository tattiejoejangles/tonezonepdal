-- ---------------------------------------------------------------------------
-- Spec label repairs.
--
-- src/lib/specs.ts gives every spec a canonical name and resolves the spellings
-- already in the data through an alias list, so most inconsistency is handled
-- without touching a row. These four cannot be, because they are wrong rather
-- than merely spelled differently:
--
-- 1. "Power Output" holds two incompatible facts. On the Fender '68 Custom
--    Deluxe Reverb it means amplifier wattage ("22 Watts at 8 Ohms"), which is
--    what the name means. On the Strymon Sunset and the Origin Effects Halcyon
--    Gold it holds a power SUPPLY ("9V DC, Center Negative"). Left alone, the
--    numeric parser reads those two as a 9 watt amplifier.
--
-- 2. "nput Impedance" is a typo for "Input Impedance". specs.ts carries it as
--    an alias so the row displays correctly either way, but the stored data
--    should still be right.
--
-- 3. "Bypass: True Bypass" is a label with the value folded into it and an
--    empty value beside it, so the row renders as a heading with nothing after
--    it and is skipped entirely by the resolver.
--
-- 4. "Current Draw" / "Current draw" are the same field stored two ways. The
--    alias list already unifies them; this normalises the stored spelling so
--    the admin form shows one consistent name.
--
-- Rewrites the jsonb array element-by-element and leaves every other row
-- untouched. Safe to run twice - each statement only matches what it repairs.
-- ---------------------------------------------------------------------------

-- 1a. Power supply mislabelled as power output, on the two pedals affected.
update public.originals
   set specs = (
     select jsonb_agg(
       case when spec->>'label' = 'Power Output'
            then jsonb_build_object('label', 'Power', 'value', spec->>'value')
            else spec end
       order by ord
     )
     from jsonb_array_elements(specs) with ordinality as t(spec, ord)
   )
 where slug in ('strymon-sunset-dual-overdrive', 'origin-effects-halcyon-gold-overdrive')
   and specs @> '[{"label": "Power Output"}]';

-- 1b. The amp keeps the label, which is correct for it - renamed only to the
--     canonical casing the vocabulary uses.
update public.originals
   set specs = (
     select jsonb_agg(
       case when spec->>'label' = 'Power Output'
            then jsonb_build_object('label', 'Power output', 'value', spec->>'value')
            else spec end
       order by ord
     )
     from jsonb_array_elements(specs) with ordinality as t(spec, ord)
   )
 where slug = 'fender-68-custom-deluxe-reverb'
   and specs @> '[{"label": "Power Output"}]';

-- 2. The typo.
update public.alternatives
   set specs = (
     select jsonb_agg(
       case when spec->>'label' = 'nput Impedance'
            then jsonb_build_object('label', 'Input impedance', 'value', spec->>'value')
            else spec end
       order by ord
     )
     from jsonb_array_elements(specs) with ordinality as t(spec, ord)
   )
 where specs @> '[{"label": "nput Impedance"}]';

-- 3. Label with the value baked into it and nothing in the value.
update public.alternatives
   set specs = (
     select jsonb_agg(
       case when spec->>'label' = 'Bypass: True Bypass'
            then jsonb_build_object('label', 'Bypass', 'value', 'True bypass')
            else spec end
       order by ord
     )
     from jsonb_array_elements(specs) with ordinality as t(spec, ord)
   )
 where specs @> '[{"label": "Bypass: True Bypass"}]';

-- 4. One spelling of current draw, in both tables.
update public.originals
   set specs = (
     select jsonb_agg(
       case when spec->>'label' = 'Current Draw'
            then jsonb_build_object('label', 'Current draw', 'value', spec->>'value')
            else spec end
       order by ord
     )
     from jsonb_array_elements(specs) with ordinality as t(spec, ord)
   )
 where specs @> '[{"label": "Current Draw"}]';

update public.alternatives
   set specs = (
     select jsonb_agg(
       case when spec->>'label' = 'Current Draw'
            then jsonb_build_object('label', 'Current draw', 'value', spec->>'value')
            else spec end
       order by ord
     )
     from jsonb_array_elements(specs) with ordinality as t(spec, ord)
   )
 where specs @> '[{"label": "Current Draw"}]';
