# Specifications

How the spec sheet works, and how to fill it in.

## The fields

Eight for a pedal, nine for an amp, always in this order:

| Pedal | Amp |
| --- | --- |
| Power | Power |
| Current draw | Power output |
| Bypass | Valves |
| Connections | Speaker |
| Dimensions | Channels |
| Weight | Connections |
| Enclosure | Dimensions |
| Features | Weight |
| | Enclosure |
| | Features |

That is the whole vocabulary, and the admin form offers exactly those and
nothing else. It used to be a free textarea of `Label | value` lines, which is
how the catalogue reached around **sixty** distinct labels for what is really a
dozen facts: `Current Draw` beside `Current draw`, dimensions split into
Width/Depth/Height on some rows and one `Dimensions` on others, values typed
into the label (`Current Draw: 7mA` with nothing beside it), and a long tail of
one-offs like `DSP Processing` and `Chassis Layout`. Two pedals could not be
read side by side because they were not describing themselves in the same words.

**Dimensions is one field** — `73 × 129 × 59 mm`, entered as one line. The
numbers are pulled apart internally so the comparison can work out board space
and say which is smaller, but that is a derivation, not three things to fill in.

**Features is the catch-all**, and the reason nothing had to be deleted to get
down to this list. For a delay or a modeller, "9 modes, 200 presets" is the most
useful line on the sheet and there is nowhere else for it.

## The shape

Specs are stored per item as label/value pairs in the `specs` jsonb column.
There is no column per field, deliberately: what is worth stating varies by
item, and a table with a column for every possible field would give every row
forty nulls.

`src/lib/specs.ts` is what makes those pairs comparable:

- **One canonical name per field**, with an alias list so old spellings keep
  resolving. Nothing had to be re-typed.
- **Units and a direction.** `Weight` is grams and lower is better; `Power
  output` is watts and higher is better. That is what lets the comparison say
  "25g better" and "3× better" instead of printing two strings.
- **Board space**, derived from width × depth. No retailer publishes it and it
  is the number that answers "will this fit".

The comparison holds no data of its own. Filling in an item's specs improves its
own page and every comparison it appears in, at once.

## Re-normalising

If old-shaped rows appear again (a bulk import, say):

```bash
node --env-file=.env.local scripts/normalise-specs.mjs --dry
```

It resolves every row through the same module the site renders through and
prints what it would rewrite, plus every value it would drop, so anything worth
keeping can be added to `features`' alias list first. Drop `--dry` to write.

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

Sign into `/admin`, open the item's page on the site, and use the **Edit**
button. The form gives you one box per field — fill in what you can confirm and
leave the rest blank. Values keep their units: `73 × 129 × 59 mm`, `360g`,
`10mA`.

Sweetwater's product pages are the best single source for dimensions and weight
if you are reading them in a browser; they simply cannot be fetched by a script.

## Coverage today

Fully specced from the manufacturer: the BOSS DS-1, BD-2, CH-1, MT-2, GE-7 and
RV-6, plus the Strymon Sunset (no published weight). Enclosure dimensions on the
eight combined/vintage BOSS entries. Everything else carries whatever it already
had — usually Power, Connections and Bypass.

The comparison prints its own coverage at the foot of every page ("We have 7 of
8 fields for the …"), so the gap is visible rather than hidden.
