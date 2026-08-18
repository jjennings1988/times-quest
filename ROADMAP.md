# Times Quest — Product Roadmap

> **Active roadmap updated August 18, 2026.** Times Quest has now grown well
> beyond the original six-release plan. The current product assessment and next
> five releases below are the active sequence. The original plan remains later in
> this document as useful design history.

## Where the app is now

Times Quest is a substantial local-first multiplication PWA, not an early
prototype. Its strongest quality is that learning, progression, collecting, and
camp building all use one shared fact-mastery system instead of separate reward
games.

| Product area | Current state |
|---|---|
| Learning | 13 fact families; Learn, Practice, Mastery Trial, Weak Facts, Mixed Mayhem, Division, custom quizzes; adaptive weighting; worked strategy hints; immediate retry; missed-fact end review |
| Adventure | Large illustrated scrolling map; 13 realms; guardian lore/cards; three-star mastery path; Mount Twelve finale |
| Boss play | 13 guardian configurations and portrait battlefields; phased cinematic battle UI; replayable Camp Siege bonus round |
| Camp | Immersive panoramic 24 × 8 perspective world; four environments; camera persistence; multi-cell footprints; upgrades; motion; undo; bottom-sheet tools; calibrated object scaling |
| Identity | Separate local child profiles; 19 inclusive climbers; selected climber appears throughout the game; isolated Summit Tester QA profile |
| Collection | 78 named painted non-square Fact Monsters plus 13 square-fact realm guardians; all 91 canonical facts are visually unique; caught favorites can be invited into six anchored Base Camp resident slots |
| Parent tools | Per-fact mastery heatmap, slow/weak fact summaries, controls, separate-profile saves, manual backup/restore with a visible last-export reminder |
| Platform | Installable offline PWA on Netlify; service-worker cache migrations; responsive iPhone/iPad layouts; new creature art included in the offline manifest |
| Engineering | Static single-page application plus a declared, locked `jsdom` regression dependency; one-command local QA and GitHub Actions on branches/pull requests |

## Product judgment

The app does **not** need more realms, currencies, menus, or unrelated mini-games
right now. Its path to a superior product is to make the existing loop more
cohesive, more educationally trustworthy, more delightful, and much harder to
break.

The differentiating loop should be:

```text
retrieve a fact → receive useful coaching → master its creature
→ see that creature inhabit the camp → return later for spaced review
```

The app already owns the first half of that loop. The next releases finish the
second half and prepare it for use beyond one device and one family.

---

## Active next roadmap

### Release 9 — Beta hardening and evidence

**Goal:** make the current feature set dependable enough that playtest findings
describe the product, not incidental bugs.

**Implemented in the current beta branch:** reproducible `pnpm test`, locked
development dependency, GitHub CI, visible build/schema label, last-backup
timestamp, expanded progression/art/offline regression coverage, and the
`BETA-QA.md` real-device plus five-session evidence checklist. Still required
before the release exit gate: module extraction, measured load optimization,
and completion of the physical-device/offline/update evidence matrix.

- Make the regression suite runnable from a clean checkout with documented
  development-only dependencies and one command. Add GitHub CI for every branch
  and pull request; keep production dependency-free.
- Break the monolithic file into clearly owned static modules (state/migrations,
  learning engine, adventure, camp, profiles/parent tools, and presentation)
  without adding a production build step.
- Add migration fixtures for old profiles and camps, plus end-to-end coverage for
  a first-time child, a returning child, a full Mastery Trial, every boss launch,
  Camp Siege, backup/restore, offline reload, and app update.
- Run a real-device matrix at 390 × 844, 430 × 932, 768 × 1024, and 1024 × 768;
  include installed iPhone/iPad PWA, browser mode, rotation recovery, airplane
  mode, and a service-worker update from the previous cache.
- Measure and reduce first-load cost. Keep a small app shell immediately offline,
  then cache realm/camp art predictably instead of making first installation
  depend on downloading every runtime asset at once.
- Add a visible version/build label and a parent-facing backup reminder before
  migrations or large releases.
- Observe at least five real sessions. Record first-try accuracy, response time,
  repeat-review count, where navigation stalls, accidental taps, voluntary camp
  visits, and what the child chooses without prompting. Keep this local/manual;
  do not add child analytics yet.

**Exit gate:** no data loss, no blocking console errors, no clipped core controls,
all automated checks green, offline launch and update verified, and five sessions
produce actionable learning/usability notes.

### Release 10 — Fact Monsters become the signature collection

**Goal:** finish the largest remaining visual inconsistency and connect mastery
to the camp world.

**Implemented in the current beta branch:** all 78 locked non-square identities now have
named 256×256 transparent production PNGs and archived high-resolution masters;
the Field Guide, detail cards, filters, and undiscovered silhouettes use the new
art. Together with the 13 realm guardians, every canonical multiplication fact
has a unique collectible while reversed facts share the correct identity. Up to
six caught favorites can be invited to anchored, gently animated camp slots.
Still required before the release exit gate: child observation, a gentle due-
review state, and the last utility/reward glyph cleanup.

- Maintain the 78 final transparent Fact Monster assets in canonical triangular
  order. Never reorder `MON_POOL` or `MON_NAMES`; their indices are persistent
  creature identity, and modulo-based lookup is forbidden.
- Enlarge field-guide creatures to card-readable size and finish caught, shiny,
  sleepy, wild, and undiscovered presentation using the existing one-asset-plus-
  CSS-state model.
- Let the child choose a small group of favorite caught monsters to inhabit camp.
  Give them anchored idle motion and tappable Quest Cards; do not let them wander
  far enough to look detached from the ground plane.
- Turn due/weak facts into a gentle “wants training” state. Never remove a caught
  monster or lower mastery as punishment.
- Finish the remaining utility/reward glyphs with the existing inline-SVG system
  so emoji remain personality/fallback content rather than the interface style.

**Exit gate:** every collectible has approved art, a mastered creature visibly
connects field guide to camp, and the child voluntarily opens at least one
monster card or training prompt during observation.

### Release 11 — Retention engine v2

**Goal:** prove facts remain retrievable across days, not merely within one
session.

- Add a due-review scheduler using last-seen date, first-try accuracy, retrieval
  speed, and recent misses. Space reviews across days and interleave old facts
  with the active realm.
- Keep the new end-of-round miss queue for same-session correction; use the due
  queue for long-term retention. These solve different problems.
- Add visual worked examples for the strategies that benefit from them: arrays,
  equal groups, number lines, doubling, and ten-minus-one. Preserve the concise
  computed text explanation alongside them.
- Require evidence on more than one day before the highest mastery state. Never
  erase an earned collectible; show “ready to polish” or “needs a quick review”
  rather than taking status away.
- Upgrade the Parent view with retention trends: newly secure facts, due facts,
  first-try accuracy, median response time, and strategy/review history. Avoid a
  single reductive child score.

**Exit gate:** a fact mastered on day one is intentionally sampled again on later
days, parent summaries explain why it was selected, and the child can recover a
miss using the supplied strategy rather than guessing repeatedly.

### Release 12 — Sensory polish, accessibility, and PWA finish

**Goal:** make the app feel authored and calm at every touchpoint.

- Add restrained realm and camp ambience, battle cues, and music only where it
  helps pacing. Keep reward sounds, interface clicks, music, and ambience as
  separate parent controls; all gameplay remains understandable muted.
- Complete animation anchoring and atmosphere passes, including reduced-motion
  behavior, contrast checks, focus visibility, keyboard navigation, screen-reader
  names, and no focus hidden behind bottom sheets.
- Audit to WCAG 2.2 AA. Keep the app's child-friendly 44 × 44 CSS-pixel target
  standard even where the formal minimum permits smaller controls.
- Finish install/update UX: richer manifest metadata and screenshots, an “update
  ready” prompt, predictable offline fallbacks, and a parent-visible way to
  refresh without risking progress.
- Run Lighthouse/Core Web Vitals and profile actual Safari panning, battle
  animation, memory use, and cold launch—not only desktop emulation.

**Exit gate:** the whole app is usable muted, with reduced motion, by keyboard,
at 200% zoom, and offline; no primary interaction depends on emoji meaning,
animation, color alone, or precise dragging.

### Release 13 — Family-ready accounts and optional sync

**Decision gate:** build this only after the local beta is being used on multiple
devices or by multiple families. A backend is valuable for recovery and sync,
not as a prerequisite for the game.

- Make the account parent-owned. Child profiles should need only a nickname and
  chosen avatar; do not ask children for email, age, photo, voice, location, or
  other unnecessary personal information.
- Add opt-in encrypted cloud backup/sync while preserving offline play. Define
  conflict behavior before implementation; a newer device must never silently
  erase a more advanced camp or mastery record.
- Provide parent access, export, deletion, consent, and privacy controls before
  collecting any online child data. No behavioral ads, social feed, public child
  profiles, or child-targeted push notifications.
- If anonymous product telemetry is needed, design the event/data-retention plan
  first and gate it through the parent experience. Prefer aggregate operational
  metrics over per-child behavior histories.
- Pilot account recovery and two-device sync with a few consenting families
  before any broad launch.

**Exit gate:** documented privacy/data map, reviewed parental-consent flow where
required, tested export/deletion/recovery, deterministic sync conflicts, and no
loss of local/offline access when the network or backend is unavailable.

---

## Immediate next build slice

1. Run the new automated suite and repair every regression from the progression
   and collection integration.
2. Complete the `BETA-QA.md` iPhone/iPad/offline/update matrix and fix only issues
   found in that evidence pass.
3. Observe five child sessions, especially whether the new 1★ / 2★ / 3★ ladder
   and the next action are understood without adult coaching.
4. Measure cold-load and installed-update behavior, then reduce service-worker
   install cost without weakening predictable offline play.
5. Extract the monolithic app into owned static modules before beginning the
   due-review/retention scheduler.

## Deliberately not next

- More realms or another currency.
- A second combat system or unrelated mini-game.
- Competitive leaderboards, chat, social profiles, or ads.
- Cloud accounts before the local beta proves a real multi-device need.
- More collectible art before the completed 40-creature set is tested with a child.

## Decision anchors

- Retrieval practice and spacing remain the learning foundation; the U.S.
  Department of Education practice guide recommends spacing learning over time
  and active-retrieval quizzing.
- The PWA should start fast, remain fast, and provide a complete offline
  experience, following the current web.dev PWA checklist.
- Accessibility targets WCAG 2.2 AA, including target sizing, alternatives to
  dragging, and focus that is not obscured.
- Remaining local-only avoids online child-data collection. Any future backend
  must be designed around the current COPPA rule, data minimization, parent
  notice/consent, access, and deletion—not retrofitted afterward.

---

## Original six-release plan — retained for history

`BUILD-PLAN.md` holds the original deep implementation spec for releases 3–6.
It remains useful for why earlier decisions were made, but it is no longer the
active delivery queue.

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
- In Learn, Practice, and Mastery Trial, also put each missed fact at the end of
  the round until it is answered correctly there.

### 1c. Keep review honest

End-of-round reviews do not repair the Mastery Trial's original first-attempt
score, and review reps use the reduced Learn/retry gem rate. This keeps the
Duolingo-style reinforcement loop without making misses a shortcut through the
trial or a gem-farming strategy. Boss, Summit, and Camp Siege queues stay fixed.

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

> **Implemented direction:** the cinematic guardian engine now has thirteen
> realm-specific portrait battlefields. Camp Siege is a replayable, non-destructive
> mixed-fact bonus round reached from Base Camp; conquered guardians rotate as
> raiders, and no placed camp item is deleted or knocked out of the player's layout.

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
