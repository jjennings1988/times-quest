# Times Quest — Character & Interface Art

Companion to `CAMP-ART.md`. Same world, same style bible. This covers everything
outside the camp: the realm characters, the bosses, the 40 fact-monsters, the
climber, and the interface icons.

## Production status

| Set | Status |
|---|---|
| 13 realm characters | Complete — transparent 512×512 PNGs |
| 13 bosses | Complete — transparent 512×512 PNGs |
| Climber | Complete — transparent 3-frame 768×256 strip |
| 6 hats | Complete — transparent 256×256 PNGs, layered on the climber |
| 3 shop buddies | Complete — transparent 256×256 PNGs |
| 40 fact monsters | Deferred for the dedicated collectible-monster pass |
| Tier B interface icons | Still emoji; planned as inline SVG rather than PNG |

**Inventory: 137 distinct emoji, 223 uses.** They do not all want the same
treatment, and that's the main finding here.

---

## 1. The split — two tiers, two pipelines

Painted watercolour at 60px is beautiful. Painted watercolour at **13px is mud**.
The nav bar renders icons at 21px, the gem chip at 15px, hearts at 16px and the
realm stars at 13px. Generating those as PNGs would waste a lot of generation
effort on assets that end up looking worse than the emoji they replaced.

So the glyphs split cleanly:

| | **Tier A — painted PNG** | **Tier B — flat SVG** |
|---|---|---|
| What | Characters and objects that live in the world | Interface chrome |
| Size on screen | 26–110 px | 11–38 px |
| Count | ~78 assets | ~45 icons |
| Made by | ChatGPT / Gemini, from the prompts below | Hand-authored — **I can write these directly** |
| Why | Personality, warmth, collectability | Crisp at any size, tintable, no files to cache |

**Tier B should be inline SVG, not images.** Three concrete reasons from the
existing code: the nav already recolours the active icon gold
(`#nav button.on .em{color:var(--gold)}`), which SVG gets for free via
`currentColor` and a PNG simply cannot do; hearts render as a repeated string
that shrinks as they're lost; and stars render at three different sizes on three
different screens. Inline SVG handles all of that with zero files, zero cache
entries and no offline risk.

I can author the whole Tier B set myself — it's path data, not an image-generation
job. Say the word.

The rest of this document is Tier A.

---

## 2. Character style bible

Paste the **STYLE BIBLE** from `CAMP-ART.md` first, then both blocks below.

> **What went wrong in the first test.** The original brief said "friendly
> creatures for an 8-year-old… a little goofy… large expressive eyes… soft
> rounded bodies." Every one of those phrases points at preschool. Big eyes plus
> round bodies plus a wide grin is the baby-schema recipe, and the model followed
> it perfectly. The fix isn't tone-of-voice — it's changing the actual targets:
> eye size, proportion, stance and surface detail.

```
CHARACTER ADDENDUM

These are heroes and creatures with attitude — the kind an older kid would
put on a poster. Confident, capable, slightly dangerous. They belong in a
good adventure game, never in a nursery.

Proportions: roughly 1:5 head-to-body. Real shoulders, real stance, visible
weight and muscle. No oversized heads. No chibi. No baby proportions.

Eyes: sharp, narrow, focused, with a defined brow. Small to medium — never
huge and round. The eyes carry intent, not innocence.

Expression: determined, sly, or coolly amused. A smirk beats a grin. Mouth
usually closed. Never a wide beaming open-mouthed smile.

Pose: dynamic and confident — weight shifted onto one leg, arms folded,
mid-motion, or turning to look back over a shoulder. Never standing square
to the viewer with arms hanging at its sides.

Gear and wear: every character carries or wears something with texture and
history — straps, buckles, wrapped cloth, a worn pack, plated armour,
scuffed metal, small scars or chips in the surface. Detail reads as serious.

Energy: a hint of elemental power — arcing light, drifting embers, frost,
static, mist — integrated into the body, not sprinkled around it.
```

### The number signature — new, and the whole point

Each character now **encodes its times-table number as something countable.** It
turns the art into a mnemonic: the four-square shell on the turtle *is* why ×4 is
the square family.

```
NUMBER SIGNATURE — mandatory, and the most important instruction here.

The character carries its number as a visible, countable feature. Render the
specified count EXACTLY — no more and no fewer — and keep the elements
clearly separated and easy to count at a glance. Do not stylise them into an
ambiguous cluster.

Where a literal numeral is specified, render it large, clean and correct.
Apart from those, no letters, no words and no other digits anywhere.
```

| Realm | Character | What you count |
|---|---|---|
| ×0 | Poof | a clean circular hole straight through its chest — the zero itself |
| ×1 | Echo | one bold vertical blaze down the forehead, one mirror-double |
| ×2 | Twix | two tails, two-tone split coat |
| ×3 | Trio | three gold arm-bands, three claw-scars |
| ×4 | Boulder | shell of exactly four square plates in a 2×2 grid |
| ×5 | Slap | one raised hand, five long clearly separated fingers |
| ×6 | Buzz | six legs, six abdominal stripes |
| ×7 | Tempest | seven lightning streaks along the flank |
| ×8 | Glacier | an eight-pointed ice star, eight facets |
| ×9 | Sensei | a cord strung with exactly nine gold beads |
| ×10 | Deca | numeral **10** stamped on the chest plate, ten indicator lights |
| ×11 | Copy | two long straight tail feathers side by side, like 11 |
| ×12 | Tock | a dial with twelve tick marks and the numeral **12** at the top |

> **Check the digits.** Image models are unreliable with numerals — that's why
> only two characters use them. Count the lights, beads, fingers and tick marks
> on every generation. Miscounts are the most common defect after style drift.

---

## 3. Sizes and files

| Set | Final PNG | Displayed at |
|---|---|---|
| Realm characters | 512 × 512 | 66px in map bubble, ~110px in realm hero |
| Boss portraits | 512 × 512 | 36px in the boss bar, ~90px on results |
| Fact monsters | 256 × 256 | 26px today — **worth enlarging to ~56px** |
| Hats | 256 × 256 | 28px in shop, overlaid on the climber |
| Buddies | 256 × 256 | 28px in shop, beside the climber |
| Climber | 3-frame strip, 768 × 256 | ~40px on map, 60px at camp |

```
public/art/
├── realm/pet-0.png … pet-12.png      (keyed by family number)
├── boss/boss-0.png … boss-12.png
├── mon/mon-00.png … mon-39.png       (index MUST match MON_POOL order)
├── hat/cap.png, tophat.png, …
└── climber.png                        (3-frame idle strip)
```

> ### ⚠️ The one thing that will break his collection
>
> `monsterFor(a,b)` resolves to `MON_POOL[(lo*13+hi) % 40]`. The **array index is
> the identity** of every monster he has ever caught. If the art files are numbered
> in a different order than the current emoji array, every creature in his
> collection silently becomes a different animal.
>
> Generate and name strictly in the existing order. It's listed in §6.

**Realm characters are cut out to transparency, not drawn as circular badges.** The map
bubble already draws a coloured circle per realm from `REALMS[].color`, and the
realm hero uses that same colour as a gradient panel. Keeping the character
transparent means one asset serves both places and the existing colour-coding
survives.

---

## 4. The 13 realm characters

**Four sheets, four characters each** (the last has one). Portrait panels at 3:1.

### Sheet header — use verbatim on all four

```
A single wide image divided into exactly 4 equal panels side by side, each
containing one character, centred, full body, feet near the bottom of its
panel. Identical painting style, palette, camera angle and lighting across
all four panels. No dividing lines, no labels, no captions.

Aspect ratio 3:1.
```

| Sheet | Characters |
|---|---|
| 1 | Poof, Echo, Deca, Twix |
| 2 | Slap, Copy, Trio, Boulder |
| 3 | Sensei, Buzz, Tock, Glacier |
| 4 | Tempest alone — square, 1:1 |

### The briefs

```
POOF (×0) — a tall, tattered spectre of pale mist and cream #FFF8EC, its
lower half fraying away into nothing. Straight through its chest is a clean
circular hole you can see clear through — a perfect void where a heart would
be. Narrow, sharp, cold-glowing eyes under a hooded brow. Ragged trailing
edges. Silent and unsettlingly calm.

ECHO (×1) — a lean, alert hare built like a runner: long powerful hind legs,
tight muscle, ears swept back. One bold vertical blaze marking runs down the
centre of its forehead. Wrapped cloth bracers on the forelegs. A perfect
mirror-double stands directly behind it, slightly translucent, matching its
stance exactly. Sharp watchful eyes.

DECA (×10) — a rugged salvage-built robot in scuffed sky blue #5BA8FF and
cream, panel seams and exposed cabling, one glowing gold optic under a heavy
brow plate. The numeral 10 is stamped large and clean on its chest plate. A
row of exactly ten small indicator lights runs along one forearm. Two hands,
five fingers each. Stands with weight on one leg, arms loose and ready.

TWIX (×2) — a lean fox caught mid-stride, body low and fast, with exactly
two tails streaming out behind it. Sharply split two-tone coat, burnt orange
over cream, divided down the middle. A worn leather harness across the
chest. Narrow amber eyes and a sly sideways look.

SLAP (×5) — a wiry, athletic tree frog with long powerful limbs, crouched on
a weathered harbour post. One webbed hand is raised open toward the viewer
showing exactly five long, clearly separated fingers. Wrapped cloth on both
forearms. Confident closed-mouth smirk, half-lidded eyes.

COPY (×11) — a sharp-eyed macaw in coral #FF6B6B and gold, crest raised,
shoulders squared, with exactly two long straight tail feathers hanging side
by side like a pair of vertical strokes. A small worn leather band on one
leg. A translucent mirror-double just behind and offset. Hard bright stare.

TRIO (×3) — a lean, wiry monkey caught mid-swing on a vine, all coiled
motion. Exactly three gold bands stacked on one forearm and exactly three
pale claw-scars raked across its chest. A faded bandana at the neck. Closed-
mouth grin, eyes alight with mischief.

BOULDER (×4) — a massive armoured tortoise, heavy and immovable. Its shell
is built from exactly four large square stone plates arranged in a perfect
2×2 grid, with glowing gold seams running between them. Chipped edges, moss
in the cracks, deep scars. Heavy-lidded, thoroughly unimpressed stare.

SENSEI (×9) — a lean, sharp-eyed great horned owl in deep red-brown and
cream, one wing extended in a precise, controlled martial gesture. A cord
around its neck strung with exactly nine gold beads. A worn cloth headband,
tattered wingtips, talons gripping a temple beam. Fierce focused eyes.

BUZZ (×6) — a sleek, armoured hornet-like bee in gold #FFC53D and black,
hovering in an aggressive forward stance. Exactly six segmented legs, clearly
separated. Exactly six bold stripes banding its abdomen. Angular translucent
wings blurred with speed, gold plating over the thorax. Hard narrow eyes.

TOCK (×12) — a sinewy terracotta and gold dragon, coiled and alert, plated
scales and swept-back horns. Set into its chest is a bronze dial bearing
exactly twelve tick marks around the rim with the numeral 12 clean at the
top. Smoke curling from its nostrils. Slit pupils, level unblinking gaze.

GLACIER (×8) — a broad-shouldered emperor penguin in deep blue-black and
cream, standing square and immovable on a cracked ice shelf. Frozen on its
chest is an eight-pointed ice star with exactly eight sharp facets catching
the light. Frost creeping up both flippers, an icicle at the beak tip.
Stern, unbothered, faintly contemptuous.

TEMPEST (×7) — a lean, powerful wolf in violet #9B7BFF and storm grey, head
lowered, eyes up at the viewer. Exactly seven gold lightning streaks arc
along its flank and down its tail. Static lifting the fur along its spine.
Scarred muzzle, torn ear. Coiled and about to move.
```

---

## 5. The 13 bosses

Bosses are the same characters' realms turned up: bigger, heavier, genuinely
imposing. **Intimidating is correct here** — this is the payoff at the end of a
realm and it should feel like one.

```
BOSS ADDENDUM

Formidable and imposing. Far larger and heavier than a companion character,
with real presence, scale and weight. Dramatic rim lighting, swirling
elemental energy, a low camera angle looking slightly up at it. This is a
genuine obstacle at the end of a long climb.

Intimidating, yes. Frightening, no. No gore, no body horror, no realistic
cruelty, nothing that would unsettle a child alone at night. Think the
legendary creature guarding the last area of a great adventure game.

Each boss carries the SAME number signature as its realm character — the
same countable feature, scaled up and made more dramatic.
```

Same four-panel sheet header at 3:1. Four sheets.

| Sheet | Bosses |
|---|---|
| 1 | Vanishing Fog, Mirror Spirit, Mega Machine, River Serpent |
| 2 | Harbor Kraken, Tower Twins, Jungle King, Stone Golem |
| 3 | Ninja Master, Circuit Breaker, Clock Dragon, Ice Titan |
| 4 | Storm Lord + the fallback imp — two panels, 3:2 |

```
THE VANISHING FOG (×0)   a vast rolling wall of pale mist with two cold
                         burning eyes deep inside; a single enormous
                         circular void punched clean through its centre
THE MIRROR SPIRIT (×1)   a towering cracked mirror in a heavy tarnished gold
                         frame, floating, surface rippling like mercury, a
                         single sharp figure half-formed in the reflection
THE MEGA MACHINE (×10)   a hulking industrial war-frame of battered cream and
                         blue plate, one heavy crane arm, the numeral 10 huge
                         and stencilled on its shoulder, ten lights down its side
THE RIVER SERPENT (×2)   an immense water serpent rearing in two great
                         coils of translucent blue-green water, spray flying,
                         hard bright eyes
THE HARBOR KRAKEN (×5)   a colossal violet cephalopod surging from black
                         harbour water, exactly five massive curling arms
                         raised, gold suckers, one vast intelligent eye
THE TOWER TWINS (×11)    two identical towering stone spires side by side
                         like a pair of vertical strokes, each with a single
                         burning gold window, chained together with iron
THE JUNGLE KING (×3)     an enormous silverback with scarred knuckles and
                         a crown of three golden leaves, three claw-scars
                         across the chest, arms braced, utterly unbothered
THE STONE GOLEM (×4)     a giant of exactly four stacked square sandstone
                         blocks in a 2×2 body, gold light blazing from the
                         seams, moss and battle damage, a heavy blank face
THE NINJA MASTER (×9)    a tall figure in deep red and charcoal wrappings,
                         only hard eyes visible, blade sheathed, exactly nine
                         gold leaves suspended in a ring around it
THE CIRCUIT BREAKER (×6) a huge brass clockwork orb of six interlocking
                         gears grinding, furnace-gold light pouring from the
                         seams, two cold lens eyes
THE CLOCK DRAGON (×12)   a vast terracotta and gold dragon coiled around an
                         enormous bronze dial with exactly twelve tick marks
                         and the numeral 12 at the top, wings spread wide
THE ICE TITAN (×8)       a colossal figure of faceted translucent blue ice,
                         an eight-pointed star of light burning in its chest,
                         frost blasting off its shoulders
THE STORM LORD (×7)      a towering violet thunderhead with a hard noble face
                         formed in it, exactly seven forks of gold lightning
                         striking down, wind tearing around it
THE IMP (fallback)       a wiry purple imp with short horns, arms folded,
                         smirking — small but clearly trouble
```

---

## 6. The 40 fact-monsters

**This is the highest-value art in the game.** It's the collection — 91 facts
mapping into 40 creatures, the thing he'll page through and want to complete.

Framing: these are *fact monsters*, not zoo animals. Each keeps its animal
identity but gains real presence — the set should read like a card-game bestiary
he'd want to collect, not a preschool sticker book.

**Generate as 10 sheets of 4. Name files strictly by index.** The order below is
`MON_POOL` — do not sort, rename or reorder it.

```
Sheet header for all ten:

A single wide image divided into exactly 4 equal panels in a row, each
containing one small creature, centred, full body. Identical painting
style, palette, camera angle and lighting across all four. Each creature is a "fact monster" — a real
animal reimagined with attitude and one mark of power: a glowing rune worked
into its hide, arcing energy, plated scales, or a burning pattern in its
markings. Sharp-eyed and confident, built like a creature you would want on
your team. Think Pokémon mid-evolution or a trading-card illustration, not a
baby animal. No text, no numerals, no labels, no dividing lines.

Aspect ratio 3:1.
```

| Sheet | Indices | Creatures |
|---|---|---|
| 1 | 00–03 | caterpillar, hedgehog, octopus, crab |
| 2 | 04–07 | snail, lizard, squirrel, butterfly |
| 3 | 08–11 | ladybird, snake, eagle, raccoon |
| 4 | 12–15 | boar, badger, otter, crocodile |
| 5 | 16–19 | scorpion, shark, baby dragon, long-necked dinosaur |
| 6 | 20–23 | small T-rex, great dragon, unicorn, tiger |
| 7 | 24–27 | lion, bear, panda, koala |
| 8 | 28–31 | giraffe, zebra, elephant, hippo |
| 9 | 32–35 | rhino, camel, kangaroo, turkey |
| 10 | 36–39 | peacock, parrot, swan, flamingo |

Sheets 5 and 6 carry the fiercest creatures — let them be fierce. Add:
`The scorpion, shark, dinosaurs and dragon should look powerful and dangerous
but not gruesome — closed mouths, no gore, no blood, nothing a child would find
frightening at night.`

**No extra art is needed for the collection states.** Wild, sleepy, caught and
shiny are already CSS filters on the cell, and undiscovered can stay a silhouette
via `filter: brightness(0) opacity(.35)`. One image per creature covers all five
states.

> **Worth changing when this lands:** monster cells render art at 26px. Painted
> creatures need roughly 56px to read. The grid is 4 columns in a 620px app, so
> there's plenty of room — this is a CSS change, not a layout problem.

---

## 7. The climber and his gear

### Climber — a 3-frame idle strip

The one place the Focus Friend feeling belongs outside the camp. He appears on the
map at the current realm and standing in the camp scene.

```
A single wide image of exactly 3 equal square panels side by side showing the
SAME character in a gentle looping idle animation. Position, scale, style and
camera identical in all three panels — only the breathing and small motion
change. Transparent background, no dividing lines.

The character: a young mountaineer seen three-quarter view, lean and
capable, roughly 1:5 proportions. A weathered cream jacket with rolled
sleeves, a gold scarf, climbing harness with visible buckles and a coiled
rope at the hip, scuffed boots, a worn pack. Goggles pushed up. Weight on
one leg, one thumb hooked in the harness. Sharp focused eyes, a confident
closed-mouth half-smile — not a grin.

The head is bare, since hats are layered on separately, so keep the top of
the head clear and unobstructed.

Frame 1: standing loose, scarf and rope still.
Frame 2: chest risen with a breath, scarf and rope lifted in the wind.
Frame 3: settled, scarf drifting the other way.

Aspect ratio 3:1.
```

### Hats — one sheet of 6

```
[standard header, 3 panels, aspect ratio 3:1 — run twice for all six]

All six hats drawn at the SAME scale, from the SAME three-quarter angle,
as if each is sitting on an invisible head of identical size, so they can be
layered onto a character. Nothing else in the panel.

1  a soft cream and gold baseball cap, brim to the left
2  a black silk top hat with a coral band
3  a sturdy climbing helmet in gold with a small lamp on the front
4  a wide tan cowboy hat with a braided cord
5  a violet graduation cap with a gold tassel
6  an ornate gold summit crown set with small violet gems
```

**Layering note:** the avatar is a string today (`hat + climber + buddy`). With art
it becomes three stacked absolutely-positioned layers. Generating every hat at one
consistent scale and angle is what makes that work — it's the single most
important instruction in this prompt.

### Shop buddies — one sheet of 3

```
[standard header, 3 panels, aspect ratio 3:1]

1  a lean ginger camp cat sitting alert, tail curled, one ear notched from
   an old scrap, sharp green eyes watching something off-frame
2  a wiry trail dog in a worn canvas saddle-pack, standing squarely, scarred
   muzzle, ears up, eyes locked forward — a working animal, not a puppy
3  a young unicorn with a short spiralled gold horn, a pale violet mane
   caught in the wind, and faint light tracing its legs; poised and watchful
```

---

## 8. Batch order

Twenty-two generations covers 78 assets. See `ART-WORKFLOW.md` for why sheets
cap at four panels.

| Batch | Generations | Assets | Why this order |
|---|---|---|---|
| **1 — Realms** | 4 sheets | 13 | The map is the first screen he sees. Biggest visible change per unit of effort. |
| **2 — Climber & hats** | 2 (strip + sheet) | 7 | Makes the map and camp feel inhabited. Small and quick. |
| **3 — Monsters** | 10 sheets | 40 | The collection. Do it once the style is locked. |
| **4 — Bosses** | 4 sheets | 14 | Only seen at the end of a realm — least screen time per asset. |
| **5 — Buddies** | 1 sheet | 3 | Cheap tidy-up. |

Run **Batch 1 first and put it on the iPad before generating anything else.** If
painted realm characters land, the rest is worth doing. If the emoji actually read
better at 66px, you'll have found out for the price of four generations.

---

## 9. Code changes this needs

Small, and shared with the camp art work:

1. **An art layer with emoji fallback.** Every glyph becomes a `<span>` with the
   emoji as text and the PNG as a background image on top. A missing or uncached
   file degrades to exactly what's on screen today. This is what makes the whole
   pipeline safe to ship one batch at a time.
2. **Avatar compositing.** `avatarStr()` returns a string; it becomes three
   stacked layers.
3. **Monster cell sizing.** 26px → ~56px.
4. **The Tier B SVG set.** ~45 icons, hand-authored, inline. Also lets the nav
   keep its gold active state and the hearts keep tinting.

Items 1 and 4 are the ones I'd build first — 1 unblocks every batch above, and 4
is independent of any image generation at all.
