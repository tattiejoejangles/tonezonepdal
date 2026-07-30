# Specifications

How the spec sheet works, and how to fill it in.

## The shape

Specs are stored per pedal as a list of label/value pairs in the `specs` jsonb
column — the same shape the admin form edits. There is no column per field,
deliberately: what is worth stating varies by pedal, and a table with a column
for every possible field would give every row forty nulls.

`src/lib/specs.ts` adds the layer that makes those free pairs comparable:

- **One canonical name per field.** The catalogue had arrived at `Current Draw`
  and `Current draw` as separate facts, a label reading `Bypass: True Bypass`
  with an empty value, and one row spelled `nput Impedance`. Each field carries
  an alias list, so old spellings keep resolving without a data migration.
- **Units and a direction.** `Weight` is grams and lower is better; `Max delay`
  is milliseconds and higher is better. That is what lets the comparison say
  "25g better" and "3× better" instead of printing two strings.
- **Derived fields.** Board space (cm²) is computed from width × depth. No
  retailer publishes it and it is the number that answers "will this fit".
- **Combined rows are split.** A single `Dimensions: 73 x 129 x 59 mm` row is
  expanded into Width, Depth and Height, so a pedal quoting one row lines up
  against one quoting three.

Anything with no canonical home is kept and shown under "Also listed" rather
than dropped — an unrecognised label is a fact we haven't catalogued yet.

The comparison holds no data of its own. Filling in a pedal's specs improves its
own page and every comparison it appears in, at once.

## The sourcing rule

**A figure is either read from the manufacturer's own published page, or it is
left blank.** Never inferred from a similar model, never estimated, never
recalled.

A blank renders as "Not listed", which is true and useful. A plausible wrong
weight is a lie that happens to render nicely — and on a site whose whole premise
is honest comparison, that is the worst thing it could do.

The one inference allowed so far is the BOSS compact enclosure: 73 × 129 × 59 mm
is identical on every BOSS compact specification page, so it is applied to the
combined entries (`DD-2 / DD-3`) whose individual pages are gone. Their weights
and current draws differ between variants, so those are left blank.

## Filling it in

### Automatically, for BOSS

```bash
npm run specs -- --dry
```

Drop `--dry` to write. `--only slug-a,slug-b` limits it.

BOSS publish full specifications per model in readable HTML. Of everything else
tried, Sweetwater and EHX return 403 to any automated request, Thomann doesn't
list dimensions or weight on most pedal pages, and Behringer's product URLs are
opaque model codes. So the script covers BOSS and the rest is done by hand.

### By hand, for everything else

Sign into `/admin`, open the pedal's page on the site, and use the **Edit**
button. Add rows using the canonical labels in `SPEC_FIELDS`
(`src/lib/specs.ts`) — Width, Depth, Height, Weight, Current draw, Bypass,
Enclosure, and so on. Values keep their units: `73mm`, `360g`, `10mA`, `1MΩ`.

Sweetwater's product pages are the best single source for dimensions and weight
if you are reading them in a browser; they simply cannot be fetched by a script.

## Coverage today

Fully specced from the manufacturer: the BOSS DS-1, BD-2, CH-1, MT-2, GE-7 and
RV-6, plus the Strymon Sunset (no published weight). Enclosure dimensions on the
eight combined/vintage BOSS entries. Everything else carries whatever it already
had — usually Power and Connections.

The comparison prints its own coverage at the foot of every page ("We have 11 of
37 fields for the …"), so the gap is visible rather than hidden.
