# Times Quest — The Climb to Mount Twelve

A multiplication fact-family game built as an installable Progressive Web App.
Adaptive spaced review, realm-based progression, boss battles, a gem economy,
visual worked examples, and a parent dashboard with per-fact retention insight.

No build step or API keys. The game is a static PWA. Camp 2 lazy-loads a pinned,
locally vendored Three.js runtime; `jsdom` is used by the regression suite.

## Structure

```
public/
├── index.html              Learning, progression, profiles, legacy data
├── learning-journey.js    Authored ideas, independent evidence, journey migration
├── realm-trail.js         Explicit third-star fact checks and legacy credit
├── squarestone-scene.js   Painted ×4 realm, lesson and restoration state selection
├── squarestone-scene.css  Responsive scene composition and reduced-motion effects
├── realm-scenes.js       Painted landmarks and earned restoration across all realms
├── realm-scenes.css      Guardian placement and compact encounter framing
├── scene-transitions.js  Decoded landmark crossfades with stable scenery
├── scene-transitions.css Calm and reduced-motion transition rules
├── realm-scene-registration.js Measured ground anchors for all 65 stages
├── journey-ui.js          Lessons, starting routes, encounters, resumable rewards
├── opening.js             Illustrated title and Zero Marsh expedition
├── opening.css            Title and interactive guardian scenes
├── camp-guide.js          Parcel map and shelter upgrade previews
├── journey.css            Learning, identity, results and parent surfaces
├── math-visuals.js        Operation-aware, accessible mathematical models
├── camp-v2.js              Camp commands, saves, controls, exploration
├── camp-v2-scene.js        Procedural 3D woodland and models
├── vendor/three/           Pinned offline renderer and MIT license
├── manifest.webmanifest    App name, icons, colors for install
├── sw.js                   Service worker — offline caching
└── icons/                  Android, iOS, and maskable icons
netlify.toml                Publish config + service worker cache headers
package.json                Local and CI test command
test/headless.js            State, progression, art, offline and flow checks
BETA-QA.md                  Real-device and child-observation release gate
```

All paths inside the app are relative, so it works at any URL depth.

Realm stars follow **Challenge → Guardian → Fact Trail**. Star two opens the
next realm; star three comes from a visible checklist of thirteen facts in short,
untimed rounds. See [REALM-STARS.md](REALM-STARS.md) for the rules and save compatibility.

All thirteen realms now have painted restoration scenes, extending the
Squarestone Valley pilot. See [REALM-SCENES.md](REALM-SCENES.md) for the full art
catalogue, prompts, performance budgets and verification; the original pilot is
documented in [SQUARESTONE-SCENE.md](SQUARESTONE-SCENE.md).

## Local development

Do **not** open `public/index.html` directly with `file://` — service workers
and install prompts require a real HTTP origin. Serve it instead:

```
npx serve public
```

Camp 2 uses JavaScript modules and requires HTTP, including for local play.

Run the regression suite before a pull request or deployment:

```powershell
pnpm install
pnpm test
```

The local dependency-free server is also available with `pnpm start` at
`http://127.0.0.1:4177`.

## Camp comparison prototype

Open **Camp** to enter **Willowbrook**, the game's single playable camp.
Turn the camera, drag to pan, and pinch or use buttons to zoom. Camp help offers
restart, low-power restart and reload without clearing progress. Parents retains
a read-only earlier-camp collection; compatible inventory transfers once and the
wallet uses the larger balance instead of adding both. See
[the recovery and migration review](CAMP-RECOVERY-REVIEW.md).

The next camp expansion adds a supply-store village, four unlockable building
parcels, connected paths and defenses, tree-clearing and fishing reviews, and
explorer construction animations. Progress from picket fencing through timber
and stone to moat channels across thirteen completed Realm Challenges. Summit Tester
receives gems, wood, stone, fish, a rod, all parcels, and a refill button in the
Journal. See [the upgrade strategy and milestone table](CAMP-UPGRADE-STRATEGY.md).

The 0.15 world pass adds a continuous build brush: choose a fence, wall, path or
moat, then tap successive squares until **Done**. Existing connected pieces also
offer **Build more**. Nine parcels provide 771 potential building cells, including
a free Homestead Meadow; the Story Stones remain a shared garden. The larger
village has ten buildings, a market, watermill, fountain gardens and **Guardian
Grove**, with original 3D residents unlocked by actual realm-battle victories.
Use the Journal to visit destinations or jump to an opened building parcel.

Three.js 0.180.0 is pinned in the lockfile and copied into `public/vendor/three`.
After an intentional dependency change, run `pnpm vendor:three`. There is no CDN
dependency. Visit Camp 2 online before testing it offline. WebGL 2 is required
for the 3D scene; Backpack controls and Camp help remain available without it.

Accurate answers now progress at any speed. Earned creatures and realm stars stay
earned, and returning after a break never deducts gems.

## First expedition — 0.18 beta

The new illustrated title screen leads into **Zero Marsh**. Create a climber,
choose **Show me how**, and help Poof explore three empty baskets and zero baskets
of four. Three independent problems complete the opening challenge; three more
successes clear the fog, open One Woods and earn a free Cozy Pup Tent renovation.
All other families retain their six-question, five-success Realm Challenges.
Adventure has no timer, and optional starting checks remain available.

New ordinary profiles start with a modest pup-tent camp. Existing saves, balances,
opened routes, and both camp versions remain intact. Camp 2 now has **My land**
and **Upgrades** controls. Homestead Meadow is free; later parcels unlock through
Realm Challenges. Clear trees only where they obstruct a desired building.

See [the opening slice and verification guide](OPENING-EXPEDITION.md),
[the follow-up audit](FOLLOW-UP-EXPERIENCE-AUDIT.md), and
[the prior learning upgrade checklist](LEARNING-UPGRADE-CHECKLIST.md).
Tests now include test/opening.js for the complete first expedition.

## Deployment

Connected to Netlify via GitHub. Pushes to `main` deploy automatically.

- Publish directory: `public`
- Build command: none
- Environment variables: none

## Updating the game — read before you push

The service worker caches the app shell aggressively so it works offline. A new
cache version downloads in the background; the map then shows an explicit
**Update** action so the app never reloads a child in the middle of a round.

Whenever you change anything in `public/`, bump the cache name in `sw.js`:

```js
const CACHE = 'times-quest-v2';   // → 'times-quest-v3'
```

That single line is what triggers installed devices to fetch the new files.
Forgetting it is the most common reason a deployed update does not appear.

If a new file is required for the first offline screen, add it to `CORE` in
`sw.js`. Add other artwork to `OPTIONAL`; the app warms those files in small,
failure-safe batches after first paint and also caches them when visited.

## Where progress is saved

Progress lives in the device's `localStorage`. It survives closing the app and
going offline, but it is per-device and per-browser — a different tablet starts
fresh. Clearing site data erases progress. The Parents tab has a manual reset.

Each child has a stable profile ID and a separate `localStorage` save. The app
can rebuild a damaged profile index from those save slots, but clearing site
data still erases all local progress, so use the Parents-tab backup for safety.

The Parents tab now offers a **Protected family backup**. It packages every
climber into one `.tqbackup` file, encrypts it in the browser with a parent
passphrase, and opens the device share sheet (or downloads the file) so the
parent can save it to Files, iCloud Drive, Google Drive, or another location.
Times Quest does not upload the file or passphrase to its own server. Restoring
one of these files validates it first, then replaces the complete set of local
family profiles after an explicit warning. See [`CLOUD-BACKUP.md`](CLOUD-BACKUP.md)
for the privacy boundary, recovery rules, and hosted-account decision gates.

## Installing on a device

**Android / Chrome:** open the URL — an install banner appears at the top of
the map, or use the Chrome menu → *Add to Home screen*.

**iPad / iPhone (Safari):** open the URL, tap **Share**, then **Add to Home
Screen**. iOS does not show automatic install prompts, so the in-app banner
won't appear there — the Share method is the official path.

After installing, the app works fully offline.

## All-access testing profile

To inspect late-game worlds and camp upgrades without changing a real child's
progress, create a new profile with the exact name **Summit Tester**. The game
turns that profile into an isolated QA save with all 39 stars, every realm and
camp blueprint unlocked, 99,999 gems, and extra repeatable path/deck inventory.
Deleting or resetting that profile does not affect the other child profiles.

Base Camp opens as a scene-first panoramic world on phones and tablets. Swipe
left or right to explore, use the target button to return to the climber, and use
the six-action bottom dock for Build, Paths, Treasures, Climber, Scenery, and
the replayable Siege.
Decorating tools rise over the world as compact trays instead of shrinking it.

The **Scenery** tray includes four compatible environments: Mountain Dusk,
Alpine Morning, Autumn Ridge, and Moonlit Meadow. They all share the same 24 × 8
placement plane, so changing scenery never moves camp items. Existing 12 × 8
camps migrate into the center of the wider clearing automatically.

The Field Guide contains 40 stable Fact Monster designs. A caught creature can
be invited to Base Camp, with up to six favorites living in the scene at once.

### Camp 2 world refinement (0.16)

Camp building territory is doubled, town roads now connect to each entrance, and Guardian Grove sits beyond a woodland trail inside its own decorative fence. Buildings have side/rear detail and the valley has forest/mountain boundaries. Existing Camp 1 and Camp 2 saves are retained. See [CAMP-UPGRADE-STRATEGY.md](CAMP-UPGRADE-STRATEGY.md) for the review and validation.

### Guardian chapters and land visibility

All thirteen guardians now have guided discoveries. The twelve later chapters
use authored group transformations and illustrated restoration scenes. Camp 2
shows solid owned-land grids and dashed future parcels during exploration.
See [Guardian and land update](GUARDIAN-AND-LAND-UPDATE.md) for behaviour,
validation, and the earlier Camp 1 retirement proposal. The 0.19 transition is now described in [Camp recovery](CAMP-RECOVERY-REVIEW.md).
