# Times Quest — Camp Build Plan

Four steps over roughly a month. Each one ships on its own and works alone.
Each one makes the next more valuable.

> **The design in one sentence:** the camp is the world, realm conquests furnish
> it, caught monsters live in it and change it while he's away, and the boss wave
> is the thing coming for it.

Tuned for a kid who prefers building and arranging over combat. That biases the
plan toward steps 1–3 and keeps step 4 deliberately lean.

---

## Hard constraints (unchanged)

- No build step, no npm, no backend. One HTML file, works offline.
- `localStorage` key `timesquest-save` and every existing field inside it stay
  exactly as they are. **Add fields, never rename or remove.**
- Bump `const CACHE` in `public/sw.js` on every deploy. `v2` → `v3` → `v4` → `v5` → `v6`.
- iPad Safari, portrait, touch-only. No drag, no hover, no pointer capture.

---

## State shape — specify this before writing any feature code

### Rule: derive everything you can, store only what you can't

Anything computable from existing state should be computed, not stored. Fewer
stored fields means fewer migration bugs over a month of edits.

**Derive, don't store:**

| Thing | Derived from |
|---|---|
| Which realm build pieces he owns | `state.realms[f].conquered` |
| Which monsters live at camp | `state.facts[k].rating >= 4` |
| Which facts are restless | `state.facts[k].last` + `rating` |
| Camp population count | count of the above |

**Store (all new fields, nothing renamed):**

```js
// added to defaultState() at L491
v: 1,                  // schema version — lets future migrations branch cleanly
placed: [],            // [{t:'pine', x:3, y:2, k:false}, ...]  t = piece type, k = knocked over
bought: {},            // {pine: 2}  duplicate realm pieces bought with gems
campSeen: null,        // toDateString() of last camp visit — drives "what changed" on open
```

```js
// added to the fact record at L540 and the comment at L495
{c:0, w:0, streak:0, rating:0, slow:0, last:null, bt:null}
//                                                 ^ best time in ms
```

`last` already exists and is already written on every answer at L844. It has
never been read. Step 3 is where that changes.

### Migration — goes in `loadState`, follows the existing pattern at L526–528

```js
if(!state.v) state.v = 1;
if(!state.bought) state.bought = {};
if(state.campSeen === undefined) state.campSeen = null;

// One-time: seed placed[] from his existing camp so the update improves his
// camp instead of wiping it. SHOP x/y percentages convert to grid coords.
if(!state.placed){
  state.placed = SHOP
    .filter(i => i.type === 'camp' && state.owned.includes(i.id))
    .map(i => ({
      t: i.id,
      x: Math.round(i.x / 100 * (CAMP_COLS - 1)),
      y: Math.round(i.y / 100 * (CAMP_ROWS - 1)),
      k: false
    }));
}
```

With `CAMP_COLS = 10, CAMP_ROWS = 6` the eight existing camp items land at
`flag(8,1) log(2,4) lantern(6,3) kite(1,1) tent(7,4) canoe(4,5) telescope(9,3)
bigtent(1,3)` — no collisions. His camp looks the same on first load and is
suddenly movable.

**`state.owned` stays exactly as it is.** It keeps doing what it does for hats,
buddies and the eight legacy camp items. `bought` is only for duplicates of the
new realm pieces. Two systems is fine; renaming a field he has progress in is not.

---

## Step 1 — Placement *(weekend)*

**Goal:** the camp becomes his instead of assembling itself.

Today `renderCamp` (L1225) reads coordinates out of the `SHOP` constant
(L1191–1198), so every camp is identical. Move the coordinates into `state.placed`
and the whole thing becomes an arrangement he authored.

### Grid

```js
const CAMP_COLS = 10, CAMP_ROWS = 6;
```

Grow `.camp-scene` (L264) from `height:175px` to `height:320px`. Paired with the
iPad width fix (`#app` max-width 480px → 620px at L45) the interior lands near
590×320, giving ~59×53px cells. Comfortable 8-year-old tap targets, and emoji at
34px sit inside them cleanly.

Render the grid as absolutely-positioned cells inside `.camp-scene`, each with
`data-x` / `data-y`. Keep the existing sky/ground gradient as the backdrop.

### Interaction — tap-tap, never drag

Drag on iPad Safari fights page scroll and needs pointer capture. Two taps is
more robust and an 8-year-old understands it instantly.

1. Tap a piece in the tray → it becomes **held** (gold outline, small bounce).
2. Tap an empty grid cell → places it there, clears held.
3. Tap a piece already on the grid → picks it up (becomes held, leaves the grid).
4. Tap the held piece in the tray again, or a 🎒 "put away" chip → cancels.
5. Tapping an occupied cell while holding → swap the two.

One `onclick` on the scene container, delegated on `e.target.closest('.camp-cell')`.
Mirrors how the keypad already works at L1274.

### Acceptance

- His existing camp loads unchanged, then every piece moves.
- Arrangement survives a full app close and reopen.
- No scroll jank while placing on a real iPad in portrait.

**Ship it, then leave it alone for a week and watch whether he opens the Camp tab
unprompted.** That's the signal that the rest of this plan is worth building.

---

## Step 2 — Realm build tools *(afternoon)*

**Goal:** every boss victory leaves a permanent, visible, thematic mark.

Right now beating a boss (L920–927) pays a headline, +50 gems, and the name of
the next realm. Gems are fungible and end up as a glyph in a string. A build piece
is specific and it stays in his world.

### The thirteen pieces, one per realm, in `REALM_ORDER`

| Realm | Family | Piece |
|---|---|---|
| Zero Marsh | ×0 | 🌾 Marsh Reeds |
| One Woods | ×1 | 🌲 Woods Pine |
| Ten City | ×10 | 🏢 City Tower |
| Double River | ×2 | 🌉 River Bridge |
| High-Five Harbor | ×5 | ⚓ Harbor Anchor |
| Twin Towers | ×11 | 🗼 Twin Spire |
| Triple Jungle | ×3 | 🌴 Jungle Palm |
| Squarestone Valley | ×4 | 🗿 Stone Head |
| Nine Ninja Temple | ×9 | ⛩️ Temple Gate |
| Six Circuit | ×6 | ⚙️ Great Gear |
| Dozen Desert | ×12 | 🕰️ Clock Tower |
| Eight Ice Caves | ×8 | 🧊 Ice Block |
| Seven Storm Peak | ×7 | 🏔️ Storm Peak |
| *The 12s Summit* | — | 🏆 Summit Trophy *(from `state.summitDone`)* |

All standard emoji that render on iOS. Store as a constant keyed by family so
ownership is `state.realms[f].conquered` — nothing new in the save.

### Unlock by climbing, multiply by practicing

One free copy per conquest. After that the piece appears in the Base Camp shop
as a **duplicate** at a low price (~20 gems), tracked in `state.bought`.

This matters more than it sounds for a kid who likes arranging: one palm tree is
a trophy, six palm trees are a jungle. It also gives the gem economy a sink that
doesn't compete with the existing shop.

Keep the two currencies distinct:
- **Realm pieces** — earned by climbing, thematically unique, duplicates cost gems.
- **Legacy shop gear** (hats, buddies, tent, telescope) — cosmetic, gems only,
  prices at L1181–1199 stay untouched. The 15–200 curve against ~30–40 gems a
  round is well tuned. Don't inflate it.

### Boss payout

In the `mode:'boss' && passed` branch (L920–927), when `first` is true, add the
piece reveal to the results screen: the emoji pops in at 72px with confetti and
"🌴 Jungle Palm unlocked — place it at camp!", with a button routing straight to
`screen-camp` with the new piece pre-held.

### Acceptance

- Conquering a realm produces a piece he can place within two taps of the results screen.
- Duplicates purchasable and placeable.
- Save file from step 1 loads without touching migration code.

---

## Step 3 — Monsters live at camp *(afternoon)*

**Goal:** something changed while he was away, and it's driven by real spaced
repetition rather than a wall-clock idle timer.

This is the step that makes the README's "spaced repetition" claim true. `f.last`
has been written on every answer since day one (L844) and read nowhere.

### Population

Monsters at rating ≥ 4 live at the camp. Up to 91 of them, so don't render them
all — show the **6 most recently caught** wandering along the ground (a slow CSS
`translateX` loop, staggered delays, same technique as `.stars` at L1282) plus a
counter: *"24 monsters live here."*

Tapping one opens the monster detail card — the fact, times caught (`f.c`),
times escaped (`f.w`), best time (`bt`), and the realm strategy rendered through
`REALMS[fam].hint(a,b)`. That's the good instructional writing at L445–481 finally
appearing somewhere he can browse for fun instead of only as a consequence of failure.

### Restless facts

```js
function daysSince(dateStr){
  if(!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr)) / 864e5);
}
function restlessFacts(){
  return Object.entries(state.facts).filter(([k,f]) =>
    (f.rating === 5 && daysSince(f.last) >= 14) ||
    (f.rating === 4 && daysSince(f.last) >= 21)
  ).map(([k]) => k);
}
```

On opening the camp, if `state.campSeen !== todayStr()` and anything is restless:
those monsters are shown at the edge of the scene walking off, with a toast and a
**"Go get them back"** button routing into `startWeakWorkout()` — which already
exists at L1046 and already picks exactly the right facts. Then set `campSeen`.

Also fold restlessness into selection weight: in `weightedFamilyFacts` (L748),
a restless fact gets weight 4 instead of its rating-based 1.

### Two guardrails

1. **Never lower the stored `rating`.** Only raise selection weight. Un-mastering
   feels like theft to a kid and the monster grid must keep showing him caught.
2. **Daily granularity, never hourly.** Hourly accrual teaches compulsive checking.
   That's acceptable in an adult focus app and not acceptable here. Cap the
   restless list at ~6 so it reads as an event, not a chore list.

### Also in this step

Write `bt` in `checkAnswer` (L849) — `if(!f.bt || elapsed < f.bt) f.bt = elapsed`.
Best-time is the thing kids actually chase, and it costs one line.

---

## Step 4 — Lane defense boss *(weekend, kept lean)*

**Goal:** the boss fight defends the camp he built instead of an abstraction.

Deliberately scoped down given his taste runs to building. This is *not* a tower
defense. No placement, no pathing, no real-time. **Same keypad, same
`checkAnswer`, same `qStart` timing.**

### Staging

Reuse the camp scene as the backdrop, camp at the right edge. A row of 5 monsters
enters from the left. Every question is a step in the standoff:

- **Correct** → the front monster is knocked back one cell. Existing `sfx.ok`, existing pop.
- **Wrong** → the whole row advances one cell toward the camp.
- **Row reaches the camp** → one placed piece gets knocked over.
- **All 5 cleared** → boss defeated.

Hearts (L870) can stay as-is or be replaced by the distance itself — distance is
more legible than hearts, and it's the same information.

### Boss turns

Every third correct, the boss lunges and demands a fact drawn from
`getWeakFacts()` (L1041) intersected with this family. Distinct visual — coral
answer-box border, "⚔️" prefix, longer timer. Hit = double knockback. Miss = the
row advances two.

### Knocked-over pieces — recoverable, never deleted

Set `k:true` on the placed instance. Render it rotated ~70° and desaturated.
Completing any Weak Fact Workout repairs one; completing a boss repairs all.

A wave that permanently destroys something he spent a week arranging would be
devastating and would make him stop opening the app — the exact opposite of the
goal. Knocked over is real stakes. Deleted is not on the table.

### Fix while you're in there

`needCorrect` is set from `queue.length` at launch (L995) but requeues grow
`quiz.total` (L880), so missing questions can help you pass — 2 wrong in a
10-question boss can still yield 10 correct. Evaluate `passed` (L912) against the
original queue length.

---

## The one rule that protects all of this

**The camp is only reachable through the keypad.**

No mini-game, no side activity, no way to earn a piece or a gem without answering
a fact. The moment there's a second path to camp material, the math becomes the
tax you pay to reach the fun part — which is exactly the failure mode that killed
the tower-defense direction. Every reward in this plan traces back to a correct
answer.

---

## Don't break these

Carried forward from the code review. Everything above should preserve them.

- **`REALM_ORDER`** `[0,1,10,2,5,11,3,4,9,6,12,8,7]` — a good pedagogical sequence.
  Identity and pattern families first, 7s last. Don't "fix" it to 2,3,4,5.
- **The `REALMS[].hint` functions** (L445–481) — real instruction computed with the
  actual operands. Reuse them everywhere; don't write new copy.
- **The slow-correct cap at rating 3** (L852) — the distinction between knowing a
  fact and computing it is the sharpest idea in the file. Nothing in step 4 may
  pollute `qStart`.
- **Commutative fact keys** — `fkey` (L537) plus the random flip in `makeQ` (L768).
- **No fail state outside boss/trial.** Practice, Learn, Weak Workout and Division
  never punish. Keep it.
- **The parent heatmap** (L1132–1141) — honest and dense. Doesn't need gamifying.
- **`storageGet`/`storageSet` and the 400ms debounced save** (L502–534).

---

## Ship checklist, every time

- [ ] Bump `const CACHE` in `public/sw.js`
- [ ] Load an existing save — his progress, gems, camp, and monsters all intact
- [ ] Load with `localStorage` cleared — `defaultState()` path still works
- [ ] Test on the actual iPad, portrait, installed to home screen, airplane mode
- [ ] Confirm no new file needs adding to `CORE` or `OPTIONAL` in `sw.js`
