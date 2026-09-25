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
├── learning-items.js      Unseen, shuffled independent check items
├── rounds.js              Pass rule, one next step, round summary
├── device-check.js        Read-only device report for beta testing
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
├── chart-world.js         Hand-drawn map: rivers, lake, relief and landscapes around the realms
├── chart-paint.js         Hand-drawn map: watercolour, ink, trees, peaks and cottages (canvas)
├── chart-realms.js        Hand-drawn map: the twelve other realm landmarks, stage by stage
├── chart-landmarks.js     Hand-drawn map: ink by realm stage, the twin crossing, night lights
├── chart-worker.js        Paints the hand-drawn map off the main thread
├── chart-lore.js          Hand-drawn map: parchment, Fact Trail milestones, gold leaf, the signed cartouche
├── map-zoom.js            Pinch-to-zoom for the hand-drawn map
├── map-chart.js / .css    Mounts, caches and inks the hand-drawn map (Parents switch)
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

## The map as an object — 0.38 beta (testing)

- **Seasons:** the chart is painted in the season of the real calendar: blossom
  and meadow flowers in spring, green in summer, gold and russet woods in autumn,
  snow on the ground, trees and pines in winter, with the fen pools frozen. Each
  season is cached separately, so the chart repaints once when the season turns.
- **A made thing:** a neatline border with a graduated band and league numbers,
  gilded corner marks, a scale bar in leagues, fold creases, worn corners, a tea
  ring, and pencilled notes from an earlier traveller in four places.
- **Willowbrook on the map:** the child's camp (tents, campfire, pennant, willows)
  stands west of Ashford; tapping it opens the camp.
- **Map key:** a Key button beside the zoom buttons explains the symbols (bridge,
  ford, ferry, milestone, inn, village, mill, mine, spring, parchment, gold leaf,
  camp).

## Water and wild — 0.37 beta (testing)

- **Water that behaves like water:** Sevenfold Falls tumbles down seven drops where
  the Long River leaves the high country (a smaller fall at the glacier snout);
  springs mark where Mill Beck, Fern Brook and the Dry Wash rise; Heron Isle and
  Otter Rock stand in Sounding Lake, which carries depth soundings like a pilot's
  chart; the upper river breaks over rapids at The Churn; and the Lower Weir spans
  the river below Double River.
- **Life:** sheep and cattle graze the Midlands pastures, deer stand at the wood's
  edge, travellers and a pony cart walk the roads, a rowing boat crosses to Heron
  Isle, fish leap in the lake, and geese pass over. Moving things rest in Calm mode
  and at night.

## A lived-in land — 0.36 beta (testing)

The hand-drawn map now has ordinary life between the realms:
- **Places:** the market town of Ashford (church, square and well), the villages
  of Millbrook, Stonecross and Fernhollow, Greenhollow's stilt huts in the
  jungle, four farms with barns, haystacks and hedged fields, three inns with
  signboards (The Twelve Bells, The Crooked Gear, The Fen Lantern), two
  watermills with wheels, Glimmer Mine, the Old Quarry, an orchard, sheep folds,
  a woodcutters' camp and the ring of Twelve Oaks.
- **Roads with meaning:** lanes join every place to the road (with plank
  footbridges over Fern Brook), signposts point the way at four crossroads, and
  roads leave the map toward the Coast Kingdoms, the Salt Road, the High Passes
  and the Sunrise Road.
- **Names everywhere, lettered like a real chart:** towns in bold small capitals,
  villages in small capitals, hamlets and bridges in italics, water in blue
  italics, regions spread wide (The Midlands, The High Country, The Lowlands),
  with number-themed treats to find.
- Every settlement's chimney smokes, and its windows light at night.

## Mountains that rise out of the ground — 0.35.2 beta (testing)

Every peak, hill and mesa is now drawn on its own sheet whose foot fades into
the chart before it is laid down, with a soft shadow and fall-lines running out
onto the plain, so they rise from the relief instead of standing on a ruled
line. Peaks, hills and mesas keep their whole outline, not just their foot, off
every realm landmark (Storm Peak's refuge was being crossed by a neighbour).
"The Long River" and "Sunscorch Waste" are lettered on clear ground.

## Zooming out recentres the map — 0.35.1 beta (testing)

Zooming out now glides the map back to the middle: how far it sits off-centre
shrinks in step with the zoom, so it is exactly centred by the time it is back to
normal size (before, sliding right and zooming out left it stuck off-centre). A
pinch that ends just above normal size settles at exactly 1×.

## Learning in the chart's own hand, and pinch-to-zoom — 0.35 beta (testing)

On the hand-drawn map, the old on-map details are redrawn in the chart's style
(the painted map keeps its originals):
- **Unexplored realms are blank parchment**, marked "Uncharted" with a
  surveyor's faint marks. The map now goes blank → pencil → ink and colour.
- **Fact Trails are milestones:** thirteen along the road out of each open realm,
  a pencil outline until the fact is checked, then an inked stone with a gold cap.
- **Three stars gild the realm:** its name label turns to shimmering gold leaf and
  a gold-leaf compass star is inked beside its landmark.
- **The summit:** gold-leaf rays around Mount Twelve once every realm is restored;
  a flag and fireworks when it is conquered.
- **A signed cartouche:** "A Chart of the Twelve Realms — surveyed by …" waits in
  pencil and is inked, signed with the child's name and sealed when the summit
  is conquered.
- **Pinch-to-zoom** (up to 2.6×) on phones and tablets, ctrl/⌘ + scroll or trackpad
  pinch on laptops, and − / + buttons. The map grows while realm buttons keep
  their size; the chart redraws itself sharper after a large zoom.

## Landmarks set into the land, and a surveyor's topography — 0.34.3 beta (testing)

Ten City and the Nine Ninja Temple now rise on low hills in the map itself, so
the painted relief, hill shading and contours wrap around them, and a road runs
from each gate down to its realm. Ten City's walls fall to a grassy bank and a
moat that wraps the corner towers, crossed by a drawbridge; the temple stands on
a stone terrace with earth slopes and a grand stair between stone lanterns. Both
sit on hillsides hatched like the chart's own slopes. Across the whole map a
contour runs every 25 units of height, every fourth an index contour lettered
with its height, and the lowlands gently undulate so meadows carry contours too.

## One style for every landmark — 0.34.2 beta (testing)

A style review against the painted chart's own rules: one three-quarter
viewpoint lit from the upper left, watercolour ground (soft feathered patches,
never hard outlined shapes), muted chart pigments, and trees drawn the chart's
way (scalloped, inked lobes). One Woods' nursery was rebuilt from a flat plan
into a walled garden in perspective with standing walls and coping, an open
gate, raised timber beds planted by row, a glasshouse, a shed and apple trees.
Ten City and Stone Valley now stand on soft ground, Triple Jungle's canopies
match the painted jungle, Storm Peak's refuge sits on a ragged snow-capped
knoll, and the ice cave rests on a snow drift.

## Landmarks in detail — 0.34.1 beta (testing)

Every realm landmark was rebuilt at the level of the Double River ship and
cottages: coursed masonry, scalloped shingles, planked decks and rigging,
shuttered windows, people and animals, and more work in progress at the
foundation stage. Highlights: Ten City's clock tower stands at ten o'clock;
the harbor has a jib crane, drying nets and a keeper's cottage; the Stone
Valley henge is a true four-by-four square in perspective with gateways and an
altar; the temple has a koi pond, stone lanterns and falling blossom; the sun
engine has a riveted boiler, gauges and a segmented mirror; the refuge has a
snow-laden roof, woodpile, bell and a burning beacon. The causeway now crosses
the fen pool with a heron and a moored punt.

## Realm landmarks on the hand-drawn map — 0.31–0.34 beta (testing)

Every realm now has its own landmark on the hand-drawn map, drawn in five
stages (ruins, foundation, walls, restored, celebrated). Restored places come
alive, and at night their windows and lanterns glow above the darkened map.
- **0.31:** Zero Marsh's lantern causeway (the fen mist thins as it is
  restored; fireflies; floating lanterns), One Woods' walled nursery with its
  glasshouse and flower beds, Ten City's walls and power station with its
  glowing "10" orb, street lamps and chimney smoke.
- **0.32:** High-Five Harbor's piers with five moored boats and a lighthouse
  whose beam sweeps the lake at night; Twin Towers rebuilt and joined by a sky
  bridge; Triple Jungle's canopy walkway between three giant trees.
- **0.33:** Stone Valley's four-by-four square of standing stones capped into
  trilithons with glowing runes; the Nine Ninja Temple's courtyard with ten
  hooks and nine lanterns lit; Six Circuit's sun engine, five small gears and
  one great wheel turning.
- **0.34:** Dozen Desert's oasis with ten palms and two more; Eight Ice Caves'
  crystal passage, crystals doubling around a glowing mouth (an aurora at three
  stars); Seven Storm Peak's refuge with its beacon, the storm clearing to a
  rainbow when celebrated.

Each landmark sits beside its realm, clear of the realm button, label and
climber, and within the part of the map a phone shows. `test/chart-gallery.html`
can show every landmark at any stage, by day or night.

## The hand-drawn map — 0.30 beta (testing)

- **A map drawn by the app itself:** a cartographer's chart painted in code:
  watercolour washes with relief shading, engraved water lines, contours, and
  thousands of individually drawn trees, peaks, dunes, reeds and cottages. Every
  realm keeps its exact position; the route and buttons sit on top unchanged.
- **Pencil becomes ink:** unexplored country is a warm pencil sketch. Each realm
  inks outward as it is begun, restored and completed (the same stages as its
  painted scene), with a spreading-ink moment when a realm is newly restored.
- **One road through the world:** thirteen named roads join the realms in play
  order (Fen Road, Woodland Way, Crossing Road … High Pass, Summit Stair). They
  cross water only on a drawn bridge, stepping-stone ford or the island ferry,
  pass through villages and waystations, and climb Mount Twelve by switchbacks.
  On the hand-drawn map the dotted progress route walks this road.
- **Double River finished first:** the twin crossing is rebuilt stone by stone,
  lamps light at night, the mill turns and teal-and-gold banners fly at three stars.
- **Phones first:** painted once per device in a worker, saved in the browser's
  cache (about 2 MB), then only a small ink mask changes. Off by default: turn on
  **Parents → Hand-drawn map (testing)**. `test/chart-gallery.html` previews the
  chart outside the app (serve the repo root).

## Devices, returns, variety and camp depth — 0.27 beta

- **Device testing:** Parents includes a read-only device report. The camp
  measures its own frame pacing and offers low power when it runs slowly. See
  [DEVICE-AND-PILOT-PLAN.md](DEVICE-AND-PILOT-PLAN.md) for the device pass and
  the ×4/×7 child pilot.
- **Coming back:** later days open with an optional warm-up of due facts, then a
  Fact Trail from an earlier adventure. Both can be skipped for the day. Round
  outcomes live in `rounds.js`. Parents asks a grown-up question first and shows
  independent, supported and remembered-later evidence separately.
- **Lesson variety:** each strategy group has its own planning decision before
  the prediction, plus an optional "another way" link between strategies. A
  child who already knows a related strategy can jump straight to planning.
- **Camp:** river stones join fishing as river trips, stone income starts at
  three realms, new homes get a moving-in moment, restored realms raise pennants
  at camp, and each project suggests one small idea for today.

## Every answer counts — 0.23 beta

This release makes independent evidence trustworthy and each lesson step a real
decision. `learning-items.js` chooses check items from amounts the child has not
just seen, reverses one item and never repeats a set on retry. Lessons use a
varied 6–8 prediction amount, predictions that are not printed in their own
question, and a required build-and-total with the child's own amount. Guardian
encounters have no hearts; misses bring fresh facts and five misses pause kindly.
Results show one next step. Passing a starting check earns star 1. Camp wood and
stone come from the world rather than the store, and gathering uses two due
facts. The adventure map ships as a 470 KB WebP (was a 3.4 MB PNG), and the
legacy camp background is no longer part of the install download.

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
