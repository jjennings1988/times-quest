# Times Quest — Camp Art Production Bible

Everything needed to generate the camp: technical specs, a style bible to paste
into every prompt, the full item catalogue with upgrade chains and prices, and
copy-pasteable generation prompts.

Style: **painterly stylised game art** — see §3. Motion: **fire, water and fabric only.**

---

## 1. The world it lives in

The camp scene today is a gradient from deep purple sky into green ground. That's
worth keeping as the art direction rather than fighting:

> **Golden hour turning to dusk, high on a mountain.** Cool violet sky, cool blue
> shadows on the grass — and every warm light in the scene comes from the camp
> itself. The fire, the lanterns, the windows of the tent.

That gives the art a job: the cool background recedes, the warm camp pops forward,
and every upgrade he buys literally adds light to his world. It also means a
half-built camp still looks intentional rather than empty.

The palette below is lifted straight from the app's `:root`, so generated art will
sit in the same colour world as the buttons and cards around it.

| Role | Hex |
|---|---|
| Deep sky | `#1A1538` |
| Sky | `#241E4E` |
| Sky lit | `#553E9E` |
| Accent violet | `#9B7BFF` |
| Grass lit | `#2E8B57` |
| Grass shadow | `#1E5F3C` |
| Firelight / gold | `#FFC53D` |
| Gold deep | `#D99C0B` |
| Warm cream | `#FFF8EC` |
| Coral | `#FF6B6B` |
| Sky blue | `#5BA8FF` |

---

## 2. Technical specs

### Format

**PNG with true alpha transparency.** Not SVG — image models don't produce usable
vector. WebP is ~30% smaller and iPad Safari handles it fine, so converting at the
end is worth doing, but generate and cut as PNG.

### Sizing — one rule

The camp grid is **10 columns × 6 rows** in a scene roughly 590×320 CSS px, so one
cell is about **59 × 53 px**. Assets are cut to **192 px per grid cell** — a little
over 3× for retina, with headroom if the grid ever gets bigger.

| Footprint | Final PNG | Used for |
|---|---|---|
| 1×1 | 192 × 192 | stumps, lanterns, flowers, buckets, path tiles |
| 2×1 | 384 × 192 | benches, gear racks, bridges, wide beds |
| 2×2 | 384 × 384 | tents, hearths, wells, trees, watchtower |
| 3×2 | 576 × 384 | the Lodge, the Observatory, the Great Bonfire |

> **Code note for later:** the current placement code is one item per cell.
> Multi-cell footprints need a `w`/`h` on the catalogue entry, an occupancy check
> across the whole footprint, and cells rendered as a drop target for the item's
> top-left corner. Worth building before generating anything bigger than 2×2.

### Animated items — one strip, not three files

Animated pieces are a **single horizontal sprite strip**: 3 frames side by side in
one PNG. A 1×1 animated item is therefore 576 × 192.

This is better than three separate files for three reasons: the frames are
guaranteed consistent because they were generated together, it's one file to cache,
and it animates in pure CSS with no JavaScript at all:

```css
.citem.anim{
  background-repeat:no-repeat;
  background-size:300% 100%;          /* 3 frames */
  animation:sprite3 .9s steps(3) infinite;
}
@keyframes sprite3{ from{background-position:0 0} to{background-position:-300% 0} }
```

### Offline and fallbacks

The service worker already caches same-origin requests on first fetch, so art
files self-cache the first time the camp is opened even if they aren't in the
`SHELL` array. Two things follow:

- Add **only the background and the tier-1 pieces** to `SHELL` in `sw.js`. Everything
  else self-caches on first view. Keeps the install fast.
- **Keep the emoji as a fallback layer underneath the image.** If a PNG is missing
  or hasn't cached yet, he sees 🔥 instead of a broken image icon. Costs nothing
  and makes the whole art pipeline safe to ship incrementally.

### Where files go

```
public/art/
├── bg-camp.png              the backdrop
├── fire-1.png … fire-4.png  (fire-2/3/4 are 3-frame strips)
├── tent-1.png … tent-5.png
└── …
```

Filenames carry no metadata — frame counts and footprints live in the JS
catalogue, so renaming never breaks anything.

---

## 3. The style bible

**Paste this block at the top of every single generation.** Consistency across
separate AI calls is the entire ballgame; a fixed preamble is most of the fix.

```
STYLE BIBLE — read fully before generating.

Style: painterly stylised game art — the look of high-end adventure game
key art. Confident visible brushwork, real texture, strong value contrast,
rim light separating the subject from the dark. Objects have edge and
history: worn leather, chipped stone, frayed rope, scuffed metal, weathered
canvas. Reference points: Supergiant Games (Hades, Bastion), Ori and the
Blind Forest, Sea of Thieves, Pokémon TCG illustration.

The MOOD is warm and inviting. The CRAFT is serious. Not cute, not chibi,
not toy-like, not pastel, not a nursery. No bubble shapes, no smooth
featureless surfaces, no oversized cartoon proportions. This is for a sharp
ten-year-old who thinks "cute" is an insult.

Subject sits alone on a FULLY TRANSPARENT background. No ground plane, no
scenery, no shadow cast onto a surface — only a soft contact shadow directly
beneath the object, painted as part of the object.

Camera: three-quarter view from roughly 30 degrees above horizontal, as if
looking down at a tabletop diorama. Consistent across every asset. Never
straight-on, never top-down.

Lighting: cool violet ambient light from above, warm golden firelight from
the lower left. Shadows are cool blue-green, never grey or black.

Palette — use these and close neighbours only:
  violet sky #241E4E / #553E9E / #9B7BFF
  grass #2E8B57 / #1E5F3C
  firelight #FFC53D / #D99C0B
  cream #FFF8EC
  coral accent #FF6B6B
  sky blue accent #5BA8FF

Finish: a soft dark outline about 2% of the image width so the object reads
clearly at small size. No text, no letters, no numbers, no logos, no UI, no
borders, no frame, no drop shadow behind the object.

Output: PNG with real alpha transparency, square unless told otherwise.
```

### Transparency — read this, it is not optional

**The ChatGPT app cannot output transparent PNGs.** Alpha is API-only. Every sheet
you generate in the app comes back with a background, so plan to key it out.
Replace the last two lines of the style bible with:

```
Background: a single flat uniform magenta #FF00FF fill, edge to edge, with no
gradient, texture, vignette or shadow on it. The subject must not contain any
magenta.
```

Magenta keys out cleanly and never appears in the art itself — measured against
the finished characters, at most **0.7%** of any of them falls within keying
distance of magenta, versus **56%** against a neutral grey backdrop. Magenta is
the correct key for this palette; grey, white and green all collide with the art.

The backdrop's real cost is bounce light, and that's fixed with an instruction
rather than a colour change — see the "inert cutting swatch" clause in
`chatgpt/project-instructions.txt`. See `ART-WORKFLOW.md` for the cutting step.

### Two ways to keep a chain consistent

**Method A — reference chaining (best quality).** Generate tier 1 alone at full
resolution. For tier 2, attach the tier-1 image and say *"Same object, same style,
same palette, same viewing angle, same scale. Now upgraded to: …"*. Repeat up the
chain. Both ChatGPT and Gemini accept image input, and this keeps every tier
recognisably the same object getting better.

**Method B — one wide sheet (fastest).** Ask for a single image containing 3–4
tiers in a row, then cut it apart. Consistency is near-perfect because it's one
generation. **3:1 is the widest ratio available**, so four panels is the hard
ceiling — see `ART-WORKFLOW.md`.

Use A for the shelter and fire chains — they're the hero items. Use B for
everything else.

---

## 4. The catalogue

Prices are tuned against the progression economy: a perfect fast 12-question
round pays about 16 gems, while each realm's first, second, and third map stars
award a larger one-time mastery bonus. Late camp tiers also require cumulative
map-star milestones; the 500-gem Base Camp Lodge requires all 39 realm stars.

Realm trophies (the 13 conquest pieces plus the Summit Trophy) stay **unbuyable** —
they're earned. These chains are the gem sink.

### Shelter — the flagship chain

| Tier | Item | Price | Footprint | Notes |
|---|---|---|---|---|
| 1 | Bedroll | 20 | 2×1 | a rolled mat and a folded blanket on the grass |
| 2 | Pup Tent | 60 | 2×2 | small canvas A-frame, one pole, slightly saggy |
| 3 | Canvas Tent | 140 | 2×2 | proper ridge tent, guy-lines, rolled-back door |
| 4 | Cabin Tent | 280 | 2×2 | tall walls, a window with warm light inside |
| 5 | Base Camp Lodge | 500 | 3×2 | timber-framed, stone chimney, lantern by the door |

### Fire — the heart of the camp

| Tier | Item | Price | Footprint | Motion |
|---|---|---|---|---|
| 1 | Fire Ring | 15 | 1×1 | still — a circle of stones, unlit |
| 2 | Campfire | 40 | 1×1 | **3-frame** |
| 3 | Stone Hearth | 110 | 2×2 | **3-frame** |
| 4 | Great Bonfire | 260 | 3×2 | **3-frame** |

### Light

| Tier | Item | Price | Footprint | Motion |
|---|---|---|---|---|
| 1 | Candle Lantern | 30 | 1×1 | CSS sway |
| 2 | Storm Lantern on a hook | 85 | 1×1 | CSS sway |
| 3 | String Lights | 180 | 2×1 | **3-frame** twinkle |

### Seating

| Tier | Item | Price | Footprint |
|---|---|---|---|
| 1 | Log Stump | 15 | 1×1 |
| 2 | Log Bench | 50 | 2×1 |
| 3 | Picnic Table | 120 | 2×2 |

### Camp kitchen

| Tier | Item | Price | Footprint |
|---|---|---|---|
| 1 | Cook Pot on a tripod | 40 | 1×1 |
| 2 | Camp Stove | 100 | 2×1 |
| 3 | Chuckwagon Kitchen | 210 | 2×2 |

### Water

| Tier | Item | Price | Footprint | Motion |
|---|---|---|---|---|
| 1 | Water Bucket | 20 | 1×1 | still |
| 2 | Stone Well | 90 | 2×2 | still |
| 3 | Waterfall Pool | 200 | 2×2 | **3-frame** |

### Garden

| Tier | Item | Price | Footprint | Motion |
|---|---|---|---|---|
| 1 | Wildflower Patch | 15 | 1×1 | CSS sway |
| 2 | Berry Bush | 40 | 1×1 | CSS sway |
| 3 | Sapling | 75 | 2×2 | CSS sway |
| 4 | Great Pine | 150 | 2×2 | CSS sway |

### Storage

| Tier | Item | Price | Footprint |
|---|---|---|---|
| 1 | Pack & Bedroll pile | 20 | 1×1 |
| 2 | Gear Rack | 60 | 2×1 |
| 3 | Supply Shed | 160 | 2×2 |

### Lookout

| Tier | Item | Price | Footprint |
|---|---|---|---|
| 1 | Trail Sign | 25 | 1×1 |
| 2 | Watchtower | 130 | 2×2 |
| 3 | Observatory | 300 | 3×2 |

### Banners — fabric, so all animated

| Tier | Item | Price | Footprint | Motion |
|---|---|---|---|---|
| 1 | Pennant | 15 | 1×1 | **3-frame** |
| 2 | Camp Flag | 45 | 1×1 | **3-frame** |
| 3 | Summit Banner | 110 | 2×1 | **3-frame** |

### Standalone pieces

| Item | Price | Footprint | Motion |
|---|---|---|---|
| Stone Path tile | 5 | 1×1 | still, buy many |
| Wooden Deck tile | 10 | 1×1 | still, buy many |
| Bird Feeder | 35 | 1×1 | still |
| Beehive | 55 | 1×1 | still |
| Kite | 30 | 2×1 | **3-frame** |
| Rope Swing | 80 | 2×2 | CSS sway |
| Zipline anchor | 190 | 2×1 | still |

**Totals:** 43 buyable pieces, 9 of them animated. Plus the backdrop and,
eventually, repainting the 14 realm trophies.

---

## 5. The prompts

Every one of these goes **after** the style bible block.

### 5.1 The backdrop

```
A wide empty mountain base-camp clearing at golden hour turning to dusk,
painted as a storybook illustration.

Foreground: a broad flat grassy clearing filling the lower two thirds,
completely bare and empty — no tents, no fire, no objects, no people. Just
grass with a few scattered small stones and patches of alpine wildflowers at
the very edges. The centre must be clear and uncluttered.

Behind it: a gentle rise, then layered mountain ridges receding into violet
haze, snow catching the last warm light on the highest peaks.

Sky: deep violet #241E4E at the top warming to #553E9E near the horizon, a
scatter of early stars up high, a soft golden glow low on the left where the
sun has just gone.

The composition must feel calm, inviting and unfinished — like a place
waiting to be built on.

Aspect ratio 16:9. No transparency needed for this one; fill the frame.
```

Cut to **1180 × 640** (2× the scene box). If you want the extra touch, generate a
second version with the prompt's *"golden glow low on the left"* replaced by
*"cool blue moonlight and a bright moon"* — swapping backdrops by device clock is
about six lines of code and makes the camp feel genuinely alive.

### 5.2 Shelter chain — use Method A, reference chaining

**Tier 1**
```
A simple camping bedroll laid out on the ground: a rolled sleeping mat in warm
cream canvas #FFF8EC, a folded wool blanket in coral #FF6B6B, and a small
stuffed pillow. Humble, soft, well-loved. Wide horizontal object.
```

**Tiers 2–5** — attach the previous tier's image each time:
```
Same object, same painting style, same palette, same viewing angle, same
light direction. This is the next upgrade of the same shelter. Now:

[T2] A small canvas pup tent in warm cream #FFF8EC, a single ridge pole,
     slightly saggy and charmingly imperfect, the bedroll just visible inside
     the open flap.

[T3] A proper ridge tent — taut cream canvas, wooden poles, guy-lines pegged
     out, the door flap rolled back and tied, a coral blanket inside.

[T4] A tall cabin tent with straight walls and a peaked roof, a small square
     window glowing warm gold #FFC53D from a lantern inside, a woven mat at
     the entrance.

[T5] A timber-framed base camp lodge with a shingled roof, a rounded stone
     chimney with a wisp of smoke, two warmly glowing windows, a lantern
     hanging beside a solid wooden door, and a small covered porch. Cozy and
     substantial but still small enough to be a mountain lodge, not a house.
     Wide object, 3:2 proportions.
```

### 5.3 Fire chain — animated, Method A then frames

Generate each tier as a **3-frame strip**:

```
A single wide image divided into exactly 3 equal square panels side by side,
showing the SAME object in 3 stages of a looping flame animation. The object,
camera angle, scale and position must be pixel-identical across all three
panels — ONLY the flames and embers change shape. No dividing lines or gaps
between panels.

The object: [see below]

Frame 1: flames leaning gently left, tallest tongue on the left.
Frame 2: flames upright and slightly taller, a few embers rising.
Frame 3: flames leaning gently right, one ember drifting up on the right.

Aspect ratio 3:1.
```

- **T1 Fire Ring** *(not animated — generate alone, square)*: `A neat ring of smooth
  grey river stones on grass, unlit, with a small pile of kindling twigs stacked
  in the centre ready to light.`
- **T2 Campfire**: `A small campfire — the ring of grey stones with three split logs
  burning, modest warm golden flames #FFC53D, glowing orange embers at the base.`
- **T3 Stone Hearth**: `A built stone hearth — a low horseshoe of stacked flat
  stones sheltering a healthy fire, an iron grate across the top, a kettle hanging
  from a hook on an iron arm. 2:2 square object.`
- **T4 Great Bonfire**: `A large ceremonial bonfire — a tall teepee of thick logs
  blazing brightly, a wide circle of seating stones around it, tall golden flames
  throwing warm light outward. Wide object, 3:2 proportions.`

### 5.4 Everything else — Method B, one sheet per chain

Template:

```
A single wide image divided into exactly [N] equal panels side by side
(N is 3 or 4, never more), showing [N] upgrade tiers of the same camp
object. Same painting style, same palette, same camera angle and same light
direction in every panel. Each object centred in its own panel. No dividing
lines, no numbers, no labels.

Panel 1: [tier 1]
Panel 2: [tier 2]
...

Aspect ratio 3:1.
```

**Light** *(3 panels)*
1. `a small brass candle lantern with cream glass panes, warm gold light inside, a carry ring on top`
2. `a larger storm lantern with a domed cap and wire guard, hanging from a wooden shepherd's hook staked in the grass`
3. `a garland of small round warm-gold bulbs strung between two slim wooden posts, gently swagging in the middle` *(this one becomes a 3-frame twinkle strip — regenerate alone using the fire strip template, varying only which bulbs are brightest)*

**Seating** *(3 panels)*
1. `a single round log stump used as a stool, bark on the sides, pale cut top`
2. `a bench made from a split log on two stump legs, worn smooth on top`
3. `a wooden picnic table with attached benches and a folded cream cloth on one corner`

**Camp kitchen** *(3 panels)*
1. `a black cast-iron cook pot hanging from a small wooden tripod over cold ashes`
2. `a two-burner camp stove on a folding wooden table, a cream enamel kettle on one burner`
3. `a small covered chuck-wagon camp kitchen — a wooden cabinet with a fold-down worktop, hanging pans, jars and a rolled awning`

**Water** *(3 panels — panel 3 regenerate as a 3-frame strip)*
1. `a wooden bucket bound with iron bands, full of clear water, a rope handle`
2. `a round stone well with a small shingled roof, a wooden crank and a bucket on a rope`
3. `a small rocky pool fed by a thin waterfall spilling over mossy stones, ferns at the edge` — frames vary **only** the falling water and ripples

**Garden** *(4 panels — portrait panels at 3:1)*
1. `a low patch of alpine wildflowers in coral, gold and cream on tufted grass`
2. `a rounded berry bush with dark green leaves and clusters of small red berries`
3. `a young sapling with a slim trunk and a soft rounded canopy, staked with a thin support`
4. `a tall mature pine with layered branches and a sturdy trunk, a few cones`

**Storage** *(3 panels)*
1. `a canvas backpack propped against a rolled bedroll, a tin mug clipped to the strap`
2. `a wooden A-frame gear rack hung with a coiled rope, a lantern and a coat`
3. `a small timber supply shed with a shingled roof and double doors slightly ajar, crates stacked beside it`

**Lookout** *(3 panels)*
1. `a wooden trail signpost with two blank arrow boards pointing opposite ways, no text or letters of any kind`
2. `a slim wooden watchtower with a ladder and a small railed platform under a peaked roof`
3. `a round stone observatory with a domed copper roof, the dome slit open, a brass telescope angled at the sky. Wide, 3:2`

**Banners** *(all three become 3-frame strips — use the fire strip template, varying only the cloth ripple)*
1. `a small triangular pennant in coral #FF6B6B on a thin wooden pole staked in the grass`
2. `a rectangular camp flag in cream and gold with a simple mountain shape on it — a shape only, no letters or writing — on a taller pole`
3. `a long horizontal banner in deep violet and gold strung between two poles, edged with small tassels, no text`

**Standalone singles** *(generate individually, square, transparent)*
- `a square paving stone of flat grey river rock set flush into grass, edges softened with moss`
- `a square of warm honey-coloured wooden decking planks set flush into grass`
- `a small wooden bird feeder on a slim post with a shingled roof and scattered seed`
- `a classic domed straw beehive on a small wooden stand with a few bees, painted soft and friendly`
- `a rope swing hanging from a stout branch, a flat wooden seat, rope worn smooth`
- `a zipline anchor — a heavy timber post with a steel cable running off to one side and a pulley handle hanging from it`
- **Kite** *(3-frame strip)*: `a diamond kite in coral and gold with a ribbon tail, flying on a taut string tethered to a small ground stake` — frames vary the tail curl and kite tilt

---

## 6. Motion spec

**3-frame strips (9 items):** Campfire, Stone Hearth, Great Bonfire, Waterfall
Pool, String Lights, Pennant, Camp Flag, Summit Banner, Kite.

Vary the strip speed per item so the camp doesn't pulse in unison — that
synchronised throb is what makes cheap animation look cheap:

| Item | Duration |
|---|---|
| Campfire / Hearth / Bonfire | 0.75s, 0.9s, 1.1s |
| Waterfall | 0.6s |
| String Lights | 2.4s |
| Pennant / Flag / Banner | 1.3s, 1.5s, 1.8s |
| Kite | 2.0s |

**CSS-only motion (no extra art):** tents breathe (`scaleY 1 → 1.015`, 4s),
trees and bushes sway (`skewX ±0.8deg`, 5–7s), lanterns swing (`rotate ±2deg`,
3s), swing seat rocks (`rotate ±3deg`, 3.5s). Give each a random negative
`animation-delay` on render so nothing starts in phase.

All of it must respect calm mode — the existing `body.calm *{animation:none}`
rule already covers it, which is one more reason to do motion in CSS rather than
JavaScript timers.

---

## 7. Batch order

Don't generate 50 images before seeing one on the iPad. Each batch is shippable.

**Batch 1 — a camp that works (11 images)**
Backdrop · Fire Ring · Campfire *(strip)* · Bedroll · Pup Tent · Candle Lantern ·
Log Stump · Wildflower Patch · Stone Path tile · Water Bucket · Pennant *(strip)*

That's a complete, pretty, buildable camp with one working upgrade chain. Ship it,
put it in front of him, and find out whether painted art actually lands better than
the emoji before committing to the rest.

**Batch 2 — the upgrade loop (9)** — remaining Shelter and Fire tiers, Log Bench,
Storm Lantern. Proves the buy-and-upgrade rhythm.

**Batch 3 — breadth (14)** — Garden, Water, Seating, Kitchen chains complete.

**Batch 4 — the long tail (9)** — Storage, Lookout, Banners.

**Batch 5 — trophies (14)** — repaint the realm conquest pieces, currently emoji.
Worth doing last: by then the style is locked and you'll generate them fast.

---

## 8. Before any of this ships

Three code changes are prerequisites, none of them large:

1. **Multi-cell footprints.** The grid places one item per cell. Needs `w`/`h` per
   catalogue entry, an occupancy check across the footprint, and drop targeting on
   the top-left cell.
2. **Upgrade-in-place.** Buying tier 3 should transform the tier-2 item already
   standing in the camp, not add a second one. One placed instance per chain,
   with the purchase rewriting its type — and the old tier is consumed, not kept.
3. **Image layer with emoji fallback.** Render the PNG as a background image on the
   existing `.citem` with the emoji still inside as text underneath, so a missing
   or uncached file degrades to what's there today instead of breaking.

Say the word and I'll build those three, so the art has somewhere to land the
moment the first batch comes back.
