# Times Quest — Upgrade Roadmap

Six releases over about a month. Ordered so every release ships on its own, and
each one either fixes something the app currently gets wrong or unlocks the next.

`BUILD-PLAN.md` holds the deep implementation spec for releases 3–6.
This file is the sequence, the reasoning, and the decision gates.

---

## The whole thing at a glance

| # | Cache | Release | Effort | Ships |
|---|---|---|---|---|
| 1 | `v3` | Honest feedback | ~2h | week 1 |
| 2 | `v4` | Fit the iPad | ~2h | week 1 |
| 3 | `v5` | Camp placement | weekend | week 2 |
| 4 | `v6` | Realm build tools | afternoon | week 3 |
| 5 | `v7` | Monsters live at camp | afternoon+ | week 3 |
| 6 | `v8` | Lane defense boss | weekend | week 4 |

**Destination:** the camp is the world, realm conquests furnish it, caught
monsters live in it and change it while he's away, and the boss wave is the thing
coming for it. Releases 1–2 are independent fixes that happen to also clear the
runway.

---

## How the original seven proposals merged

Three of them stopped being separate features once the camp existed. Worth
recording so they don't get rebuilt twice.

| Original proposal | Fate |
|---|---|
| 1. Timer bar honesty | → **Release 1**, unchanged |
| 2. "Try again" actually retries | → **Release 1**, unchanged |
| 3. Continue-climbing button | → **Release 2**, unchanged |
| 4. iPad sizing | → **Release 2** — and it became a *prerequisite*, see below |
| 5. Boss battles that do something | → **absorbed into Release 6.** The lane defense is this proposal with somewhere to stand. |
| 6. Tappable monster cards | → **absorbed into Release 5.** A monster card is much better when the monster lives somewhere. |
| 7. Facts decay / restless | → **absorbed into Release 5.** Restlessness is what makes monsters leave the camp. |

**Cut entirely:** real tower defense with placement and pathing (changes the input
model, makes math the tax you pay), idle accrual faster than daily (teaches
compulsive checking), drag-to-place (fights scroll on iPad Safari).

---

## Release 1 — Honest feedback `v3`

**Why first:** the app currently lies to him in two places, both cheap to fix,
both in the part of the game he already uses every session. Also gives you a
read on how he responds to change before you spend a weekend on anything.

### 1a. The timer bar means what it rewards

`dur = 8000` at L819, but the reward boundary is `FAST_MS = 4000` at L487 — the
point where the bar turns *gold*. The bar says "you have eight seconds" while the
mechanic that drives the whole rating ladder is four.

- Set `dur = FAST_MS`. Let the bar empty to zero and stay there.
- Add a faint gold tick at the end of the track (`.timer-fill` CSS, L194).
- Flash `⚡` on the answer box when `fast` is true (L851).
- Failure state stays exactly where it is: nowhere. Missing the window costs him
  a rating point, never a round.

### 1b. "Got it — try again!" actually tries again

`dismissHint()` at L895 does `quiz.idx++`. He reads "9 × 6 = 54", taps a button
that says try again, and gets shown 3 × 7.

- Re-present the same question: clear `quiz.answer`, `quiz.locked = false`,
  restore the keypad, reset `qStart`, suppress the timer for the retry.
- Cap at one retry. Second miss reveals the answer plainly and advances.
- Drop the requeue at L876–881, or stop counting requeued corrects toward
  `needCorrect`.

### 1c. Close the requeue exploit

`needCorrect` is fixed from `queue.length` at launch, but requeues grow
`quiz.total`. Two wrong answers in a 10-question boss can still yield 10 correct
and pass. Evaluate `passed` at L912 against the original queue length.

**Touches:** L194, L487, L819–827, L851–856, L876–899, L912
**How you'd know it worked:** rating 4/5 counts climb and `f.slow` counts drop in
the parent tab over two weeks. He starts visibly racing the bar.
**Risk:** speed pressure. The `state.settings.timer` toggle already exists and
already works — it's the escape hatch if he tenses up.

---

## Release 2 — Fit the iPad `v4`

**Why second:** one of these is a genuine prerequisite. The camp grid math in
Release 3 is sized against the app width, so changing the width afterward means
redoing it.

### 2a. Stop rendering a phone app on a tablet

`#app { max-width: 480px }` at L45 puts a phone-width strip in the middle of a
768pt portrait iPad with dark gradient down both sides.

- `max-width: 480px` → `620px`
- `.q-text` 56px → `clamp(56px, 13vw, 84px)` (L183)
- `.answer-box` 40px and `.key` 26px / 13px padding scaled to match (L186, L204)
- Keypad stays 3 columns. Cap `.keypad` around 480px if wide keys mis-tap when
  he's holding it two-handed — test that before committing.

### 2b. One button that starts the right thing

Today: open app → map → find realm → tap → choose between four modes he has no
basis for choosing between. Three taps and a four-way decision before a question
appears.

Add a primary button at the top of the map, above the daily quest banner, that
dispatches on state:

| Condition | Launches |
|---|---|
| no facts seen in this family | `startLearn` |
| `caught < 10` | `startPractice` |
| caught ≥ 10, `!trial` | `startTrial` |
| `trial && !conquered` | `startBoss` |
| all conquered, weak facts exist | `startWeakWorkout` |
| all conquered, none weak | `startMixedMayhem` |

The four-mode grid at L734–739 stays exactly as it is. This is a shortcut, not a
replacement.

**Touches:** L45, L183, L186, L200–210, L320–334, `renderMap` L666–710
**How you'd know it worked:** he stops going through the map to start a round.
**Risk:** he stops exploring the other modes. Small loss — they're mechanically
near-identical today. Don't remove the grid.

---

## ⟨ Gate ⟩ Before Release 3

Releases 1–2 are ~4 hours total and improve the app he already plays. Release 3
is the first weekend. Worth pausing here to confirm the premise: **does he open
the app unprompted at all right now, and does he ever open the Camp tab?**

If Camp is already the tab he pokes at, releases 3–5 are the whole game. If he's
never opened it, that's not a reason to skip — it's currently a shop with a
diorama — but it does mean Release 3's signal matters more.

---

## Release 3 — Camp placement `v5`

**Goal:** the camp becomes his instead of assembling itself.

Coordinates currently live in the `SHOP` constant (L1191–1198), so every camp is
identical. Move them into `state.placed` and it becomes an arrangement he authored.

- Grid at `CAMP_COLS = 10, CAMP_ROWS = 6`. `.camp-scene` grows 175px → 320px (L264).
- **Tap-tap placement, never drag.** Tap tray piece → held. Tap empty cell →
  place. Tap placed piece → pick up. Delegated click on `.camp-cell`, same shape
  as the keypad handler at L1274.
- Migration seeds `placed[]` from his existing camp so it loads looking identical
  and is suddenly movable. Full spec in `BUILD-PLAN.md`.

**How you'd know it worked:** he opens the Camp tab without being sent there, and
the arrangement changes between sessions.
**Risk:** he arranges it once and never returns. That's what Releases 4 and 5 are for.

---

## Release 4 — Realm build tools `v6`

**Goal:** every boss victory leaves a permanent, visible, thematic mark.

Beating a boss currently pays a headline, +50 gems, and the next realm's name
(L920–927). Gems are fungible and end up as a glyph in a string.

- Thirteen pieces, one per realm, plus a Summit trophy. Table in `BUILD-PLAN.md`.
- **One free copy per conquest, duplicates buyable at ~20 gems** (`state.bought`).
  One palm tree is a trophy; six palm trees are a jungle.
- Results screen reveals the piece at 72px with confetti and a button routing
  straight to Camp with it pre-held.
- Legacy shop prices (L1181–1199) untouched. The 15–200 curve against ~30–40 gems
  per round is well tuned — don't inflate it.

**How you'd know it worked:** he goes to Camp immediately after beating a boss,
without the button.
**Risk:** shop dilution. Keep the currencies distinct — realm pieces are earned
and thematic, gem gear is cosmetic variety.

---

## Release 5 — Monsters live at camp `v7`

**Goal:** something changed while he was away — driven by real spaced repetition,
not a wall-clock idle timer.

This is where proposals 6 and 7 land, and where `f.last` finally gets read. It's
been written on every answer since day one (L844) and read nowhere.

- Monsters at rating ≥ 4 live at camp. Render the 6 most recently caught wandering
  on the ground; show a counter for the rest.
- **Tap a monster** → detail card: the fact, times caught, times escaped, best
  time (`bt`, one new line in `checkAnswer`), and the realm strategy rendered
  through `REALMS[fam].hint(a,b)`. That good instructional writing at L445–481
  finally appears somewhere he can browse for fun rather than only as a
  consequence of failure.
- **Restless facts** — rating 5 untouched 14+ days, or rating 4 untouched 21+ —
  walk off the edge of the scene on open, with a "Go get them back" button routing
  into `startWeakWorkout()` (already exists, L1046, already picks the right facts).
  Restless facts also get weight 4 in `weightedFamilyFacts` (L748).

**Two guardrails, non-negotiable:**
1. **Never lower the stored `rating`.** Only raise selection weight. Un-mastering
   feels like theft and the monster grid must keep showing him caught.
2. **Daily granularity, never hourly.** Hourly teaches compulsive checking — fine
   in an adult focus app, not here. Cap the restless list at ~6 so it reads as an
   event, not a chore list.

**How you'd know it worked:** he opens the app on a day nobody asked him to,
because monsters left.

---

## Release 6 — Lane defense boss `v8`

**Goal:** the boss fight defends the camp he built instead of an abstraction.

Deliberately lean. **Not** a tower defense — no placement, no pathing, no
real-time. Same keypad, same `checkAnswer`, same `qStart` measurement.

- Camp scene as backdrop, camp at the right edge. Five monsters enter from the left.
- Correct → front monster knocked back. Wrong → the row advances.
- Row reaches the camp → one placed piece is **knocked over** (`k:true`, rendered
  rotated and desaturated). Repaired by a Weak Fact Workout, or all at once by
  beating a boss.
- Every third correct, the boss lunges with a fact from `getWeakFacts()` (L1041)
  intersected with this family. Hit = double knockback, miss = advance two.

**Nothing is ever deleted.** A wave that permanently destroys a week of arranging
would stop him opening the app — the exact opposite of the point.

**How you'd know it worked:** he rematches bosses voluntarily. The rematch path
already exists at L738 and I'd bet it has never been used.
**Risk:** step 4 must not pollute `qStart`. If the staging makes him look at the
board instead of the question, the rating ladder loses its best signal.

---

## The rule that protects all of it

**The camp is only reachable through the keypad.**

No mini-game, no side activity, no way to earn a piece or a gem without answering
a fact. The moment a second path exists, math becomes the tax you pay to reach
the fun part — which is exactly the failure mode that killed the tower-defense
direction. Every reward here traces back to a correct answer.

---

## Don't break these

- **`REALM_ORDER`** `[0,1,10,2,5,11,3,4,9,6,12,8,7]` — good pedagogical sequence.
  Identity and pattern families first, 7s last. Don't "fix" it to 2,3,4,5.
- **`REALMS[].hint`** (L445–481) — real instruction computed with the actual
  operands. Reuse it everywhere; don't write new copy.
- **Slow-correct capped at rating 3** (L852) — the distinction between knowing a
  fact and computing it is the sharpest idea in the file.
- **Commutative fact keys** — `fkey` (L537) plus the random flip in `makeQ` (L768).
- **No fail state outside boss/trial.** Practice, Learn, Weak Workout and Division
  never punish.
- **The parent heatmap** (L1132–1141) — honest and dense. Doesn't need gamifying.
- **`storageGet`/`storageSet` and the 400ms debounced save** (L502–534).
- **`timesquest-save` and every field already inside it.** Add fields. Never
  rename, never remove.

---

## Ship checklist — every release, no exceptions

- [ ] Bump `const CACHE` in `public/sw.js`
- [ ] Load an existing save — progress, gems, camp, monsters all intact
- [ ] Load with `localStorage` cleared — `defaultState()` path still works
- [ ] Test on the actual iPad, portrait, installed to home screen, airplane mode
- [ ] Any new file added to `CORE` or `OPTIONAL` in `sw.js`
