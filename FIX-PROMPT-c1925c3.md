# Implementation prompt — review fixes for `codex/camp-progression-v1` @ `c1925c3`

Hand this to the coding agent verbatim. It is self-contained: every defect has a
file reference, a reproduction, an acceptance criterion, and a required test.

---

## Context

Times Quest is a mobile-first multiplication PWA for children. **iPhone is the
primary target, tablet secondary.** It is a single HTML file with no build step,
no npm runtime dependencies, and no backend. It works offline.

A review of `c1925c3` found one critical data-loss defect, three high-severity
issues, and six medium ones. Baseline is **284/284 headless tests passing** — do
not regress that number.

## Hard constraints — do not violate

1. **Real children have real saved progress.** Never rename or remove a field in
   the save object. Migrations are additive only and must be idempotent.
2. **No build step, no npm runtime dependencies, no backend.** The game stays a
   single `public/index.html` plus `sw.js`, `manifest.webmanifest` and `art/`.
3. **Bump `CACHE` in `public/sw.js` for any change under `public/`.** Currently
   `times-quest-v29` → `v30`.
4. **No framework rewrite.** Every fix below is local. If you believe a defect
   requires architectural change, stop and explain rather than proceeding.
5. **`test/headless.js` must stay green.** Add tests; don't weaken existing ones.
   Run with `npm i jsdom && node test/headless.js`.
6. Work through the tasks **in the order given**. Commit after each one so any
   single change can be reverted independently.

---

# CRITICAL

## C1 — A corrupt profile book orphans every child's save

**Files:** `public/index.html:1160–1177` (`loadState`), `1283–1292` (`saveState`)

### The defect

`loadState()` falls back to the legacy single-save key when `activeProfileId` is
null, and then executes:

```js
profileBook.profiles=[p]; activeProfileId=p.id;   // line 1171
```

This **replaces the entire profile list** with one synthesised profile. Because
`saveState()` writes `LEGACY_SAVE_KEY` on every single save (line 1289), that
fallback is permanently armed — it is not limited to genuinely old installs.

### Reproduction (verified)

1. Create profiles "Alice" and "Bruno". Play as each so both have distinct state.
2. `localStorage.setItem('timesquest-profiles','{oops not json')`
3. Reload.

Observed:

```
profiles now in book : ["Climber/legacy"]
loaded gems          : 2222          (Bruno's — whoever saved last)
orphaned save blobs  : timesquest-save-pmsrk7dhjm4i, timesquest-save-pmsrk7dz36ps
reachable from book  : timesquest-save-legacy
```

Both children now share Bruno's progress under the name "Climber". Alice's save
exists on disk with no path back to it.

### Required fix

1. **Never reassign `profileBook.profiles`.** Only append, and only when the list
   is genuinely empty.
2. **Add a recovery scan.** Before falling back to the legacy key, enumerate
   `localStorage` for keys matching `^timesquest-save-(.+)$`. For each orphan not
   present in the book, rebuild a profile entry (id from the key suffix, name
   `Climber 1..n`, avatar 0, progress derived from the parsed save). Only if that
   scan finds nothing should the legacy-key path run.
3. **Stop writing `LEGACY_SAVE_KEY` on every save** (delete line 1289). Write it
   once during the initial legacy import, or drop it entirely. Profiles own the
   data now; the mirror only creates ambiguity about which child "the" save is.
4. Give the synthesised legacy profile a **unique** id, not the fixed string
   `'legacy'`, so a second run cannot overwrite `timesquest-save-legacy`.

### Acceptance

- Corrupting only `timesquest-profiles` with two intact profile blobs recovers
  **both** profiles with their original gem balances and realm progress.
- No `timesquest-save-*` key is ever unreachable from the book after boot.
- A genuine pre-profile install (only `timesquest-save`, no book) still imports
  correctly into one profile.

### Required tests

```
section('Profile recovery')
- two profiles + corrupted book        → both recovered, gems intact, names distinct
- two profiles + book missing entirely → both recovered
- legacy-only install (no book)        → one profile, progress preserved
- no orphan blob is left unreachable after boot
```

---

# HIGH

## H1 — `cache.addAll()` over 23.5 MB is atomic; one failure means no offline app

**File:** `public/sw.js:2` (CACHE), `115` (SHELL array), `123` (`addAll`)

### The defect

116 SHELL entries totalling **23.5 MB**. `addAll()` rejects wholesale if any
single fetch fails, so the service worker never activates and the child silently
loses offline play. On cellular this is a realistic failure, and it fails quietly.

The precache is also mostly premature. Measured:

| Group | Files | Size | When it's actually needed |
|---|---|---|---|
| Camp backgrounds | 4 | 4.6 MB | one renders at a time |
| `bg-adventure-map.png` | 1 | 3.3 MB | immediately |
| Profile avatars | 19 | 3.0 MB | one is chosen, once |
| Boss portraits | 13 | 4.0 MB | first only after conquering ×0 |

### Required fix

Split SHELL into two tiers:

```js
const CORE = [ './', './index.html', './manifest.webmanifest',
               icons…, './art/climber.png', './art/map/bg-adventure-map.png',
               './art/camp/bg-camp-dusk.png' ];          // default background only
const OPTIONAL = [ …everything else… ];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      await c.addAll(CORE);                               // atomic, small, must succeed
      await Promise.allSettled(OPTIONAL.map(u => c.add(u))); // best-effort
    })
  );
  self.skipWaiting();
});
```

`Promise.allSettled` means a single 404 or dropped connection no longer prevents
activation. The existing runtime handler (`sw.js:146`, `if (res.ok)`) already
fills gaps correctly on later visits.

Also consider generating `bg-adventure-map.png` at a smaller size or as WebP —
3.3 MB in one file is the single largest asset and it loads on the first screen.

### Acceptance

- With one OPTIONAL URL returning 404, the SW still installs, activates, and the
  app opens offline.
- CORE stays under ~6 MB.

### Required tests

Headless can't run a service worker, so add a **static assertion** in
`test/headless.js`: parse `sw.js`, confirm every CORE path exists on disk, and
assert `CORE` total bytes are under a budget constant. Then a manual check:
DevTools → Application → Service Workers, throttle to Slow 3G, hard reload,
confirm activation.

---

## H2 — Migration silently drops placed pieces

**File:** `public/index.html:1261`, `1272`; `findCampSpot` at `2353–2358`

### The defect

```js
const spot=findCampSpot(p.t,preferredX,preferredY);
if(spot) state.placed.push({...p,...spot});     // no else — the piece vanishes
```

`findCampSpot` returns `null` when nothing fits (line 2357). A crowded legacy
camp loses items with no warning. `bought` survives so the piece can be
re-placed, but the child's arrangement is gone and nothing tells them.

### Required fix

Collect the drops and surface them. Push unplaced pieces into a
`state.campReturned` array (new field, backfilled to `[]` in `migrateState`), and
render a dismissible notice on the next camp visit:

> "3 pieces were returned to your backpack when the camp got bigger — tap Build to place them again."

Clear `campReturned` once the notice is dismissed.

### Acceptance

- Migrating a dense v3 save preserves `placed.length`, **or** reports the exact
  shortfall — never silently loses.
- Reported pieces are still owned in `bought` and placeable.

### Required test

```
- migrate a v3 save with 40+ pieces incl. several 3×3 lodges
  → placed.length preserved OR state.campReturned.length accounts for the difference
  → every returned piece still has bought[id] >= 1
```

---

## H3 — Every save writes all children's complete state

**File:** `public/index.html:1287–1290`

### The defect

Each debounced save writes three things: the profile key, the legacy key, **and**
the whole profile book — and the book embeds `p.snapshot`, a complete state
object per profile (line 1287). Measured at **8.8 KB per save with one child**,
scaling linearly with the number of children. `localStorage` is synchronous and
this fires after every answered question.

### Required fix

Drop `snapshot` from the persisted book. Keep only display metadata:

```js
{ id, name, avatar, created, qa, conquered: <int>, lastPlayed: <ms> }
```

`profileProgress()` (line 804) is the only consumer and needs one integer.
Update it to read `p.conquered`. Refresh that integer in `saveState`, not the
whole object. `switchProfile` (line 831) and `createProfile` (line 826) already
write the authoritative per-profile key, so nothing else depends on the snapshot.

Combined with deleting the legacy-key write from C1, per-save volume drops from
~8.8 KB to roughly the state size alone.

### Acceptance

- Serialized `timesquest-profiles` stays under ~1 KB with four profiles.
- Switching profiles still restores exact progress.

### Required test

```
- create 4 profiles with progress → localStorage['timesquest-profiles'].length < 1024
- switch across all 4 → each restores its own gems, realms and placed camp
```

---

# MEDIUM

## M1 — Camp width derives from `dvh`; layout rescales when the iOS toolbar moves

**File:** `public/index.html:433` — `width:max(100vw,calc(100dvh * 1.84375))`

In non-installed mobile Safari, `dvh` changes as the URL bar collapses on scroll.
The panorama width, every cell's computed position, and the scroll offset shift
underneath the child mid-pan. Installed PWA is unaffected, which is likely why it
hasn't been noticed.

**Fix:** switch the height basis to `svh` (stable small viewport), or give
`.camp-scene` an `aspect-ratio: 1.84375` and let width follow height without a
viewport-unit multiply.

**Test:** manual — mobile Safari, not installed, pan the camp, scroll to collapse
the toolbar, confirm no jump or rescale.

## M2 — Touch targets under 44 px

- `public/index.html:551` `.camp-sheet-close{width:34px;height:30px}`
- `public/index.html:554` `.camp-category-chip` — `padding:7px 10px` at 10.5 px
  font ≈ 26 px tall
- `public/index.html:504` `.camp-hud-btn{width:42px;height:42px}` — marginal
- `public/index.html:599` `.camp-dock button{height:43px}` — **landscape phone
  only**; the default at line 533 is 52 px and is fine

These are the camp's close control and its catalogue filters, operated by an
8-year-old on a phone. Apple HIG and WCAG 2.5.8 both want ~44 px.

**Fix:** give each a `min-height:44px` / `min-width:44px`. Use padding rather
than growing the visible pill so the design doesn't change — the hit area grows,
the look doesn't.

## M3 — `user-scalable=no` blocks pinch-zoom

**File:** `public/index.html:5`

Fails WCAG 1.4.4. iOS Safari has ignored it for pinch since iOS 10, but Android
Chrome honours it, and it is the wrong signal for an app aimed at children who
may need magnification.

**Fix:** remove `user-scalable=no`. Keep `viewport-fit=cover`. Verify the quiz
keypad and camp still behave when zoomed.

## M4 — Font handler caches error responses

**File:** `public/sw.js:159–166`

The same-origin branch got an `if (res.ok)` guard at line 146; the Google Fonts
branch did not. A 5xx from `fonts.gstatic.com` is cached under the current CACHE
name and persists until the next version bump.

**Fix:** mirror the `if (res.ok)` guard.

## M5 — `respondWith` can resolve to `undefined`

**File:** `public/sw.js:151`

Offline, for a non-navigation request, the catch returns `undefined`, which makes
`respondWith` throw a `TypeError` rather than producing a clean network error.
Visible as console noise plus broken images for art not yet cached.

**Fix:** return `Response.error()`. For `e.request.destination === 'image'`,
consider returning a 1×1 transparent PNG so the existing emoji fallback engages
cleanly (see `pieceVisual`, `index.html:2365`).

## M6 — Modals lack focus trapping and restore

**Files:** `public/index.html:780` (`#profile-gate`), `257` (`.card-modal`)

`#profile-gate` has `role="dialog"` and `aria-modal="true"` and focuses the name
input (line 813), but Tab is not constrained and focus is not restored on close.
`.card-modal` (guardian and monster cards) has no focus management and no
Escape-to-close.

**Fix:** on open, record `document.activeElement`; trap Tab within the dialog;
bind Escape to close; restore focus on close. Add `aria-modal`/`role="dialog"` to
`.card-modal`.

---

# LOW — batch into one cleanup commit

- **L1** `migrateState()` runs twice on the legacy path (`index.html:1169` then
  `1176`). Idempotent today only because `state.v=5` short-circuits and
  `climberIntroduced` guards the climber. Fragile. Call it once.
- **L2** Duplicate `transform` on `.camp-sheet` (`543` then `544`); the first is
  dead code.
- **L3** `safeProfileName` (`795`) strips only `<>`. Names currently land in text
  content so there is no injection, but escape on render rather than sanitising
  on input.
- **L4** Nine uses of `100vw` overflow by the scrollbar width on desktop. Not an
  issue on target devices; fix only if convenient.

---

# Do not change

These were verified working. Leave them alone.

- **Gem balance.** 2,639 gems from 39 realm stars + 650 first-conquest bonuses
  against a 4,065-gem catalogue leaves a ~776 gem gap ≈ 22 practice rounds. The
  catalogue correctly outlasts the star economy.
- **The v2→v3→v5 migration chain.** Additive, versioned, `state.v`-guarded, with
  tests asserting exact post-migration coordinates. The `+6` panoramic offset
  correctly centres a 12-column camp in 24 columns. C1 and H2 are bugs *around*
  it, not in it.
- **The quiz engine.** Fast-correct rating gain, `bt` recording, hint-then-retry,
  timer suppression on retry, hearts as the sole boss gate — all verified.
- **Safe-area handling.** `env(safe-area-inset-*)` is applied consistently across
  topbar, dock, keypad, modals and edge controls.
- **`.camp-sheet` is a sibling of `.camp-viewport`, not a child** — so
  `touch-action:pan-x` (line 429) does not trap vertical scrolling in the
  catalogue. Do not "fix" this; it is already correct.
- **The 284-assertion headless suite.** Extend it; do not weaken it.

---

# Verification protocol

Run after **every** task, not just at the end:

```bash
npm i jsdom && node test/headless.js      # must stay ≥ 284 passing, 0 failing
```

Then, before declaring done:

1. **Migration:** load a real pre-change save exported from the Parents tab.
   Confirm gems, streak, realms, facts, placed camp and equipped items all
   survive. Diff the state object before and after.
2. **Multi-profile:** two profiles, play each, switch repeatedly, confirm no
   bleed. Corrupt the book, confirm recovery.
3. **Offline:** DevTools → Application → Service Workers → Offline, hard reload,
   confirm the app opens and the camp renders.
4. **Device:** iPhone Safari at 390 × 844, both installed and not. Check the camp
   pan, the build sheet scroll, every touch target, and the safe-area insets in
   both orientations.
5. **Bump `CACHE`** in `public/sw.js` to `times-quest-v30`.

## Suggested commit sequence

| # | Commit | Contents |
|---|---|---|
| 1 | `fix: recover orphaned profiles, stop legacy-key mirroring` | C1 |
| 2 | `fix: non-atomic optional precache, trim core shell` | H1 |
| 3 | `fix: report camp pieces returned during migration` | H2 |
| 4 | `perf: drop full snapshots from the profile book` | H3 |
| 5 | `fix: mobile viewport, touch targets, zoom` | M1, M2, M3 |
| 6 | `fix: service worker error caching and responses` | M4, M5 |
| 7 | `a11y: modal focus trapping and escape` | M6 |
| 8 | `chore: review cleanup` | L1–L4 |

C1 first — it is silent, total, and affects real children's data.
