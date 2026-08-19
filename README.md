# Times Quest — The Climb to Mount Twelve

A multiplication fact-family game built as an installable Progressive Web App.
Adaptive spaced review, realm-based progression, boss battles, a gem economy,
visual worked examples, and a parent dashboard with per-fact retention insight.

No build step, runtime dependencies, or API keys. The game is a static PWA;
`jsdom` is used only by the development regression suite.

## Structure

```
public/
├── index.html              The entire game
├── manifest.webmanifest    App name, icons, colors for install
├── sw.js                   Service worker — offline caching
└── icons/                  Android, iOS, and maskable icons
netlify.toml                Publish config + service worker cache headers
package.json                Local and CI test command
test/headless.js            State, progression, art, offline and flow checks
BETA-QA.md                  Real-device and child-observation release gate
```

All paths inside the app are relative, so it works at any URL depth.

## Local development

Do **not** open `public/index.html` directly with `file://` — service workers
and install prompts require a real HTTP origin. Serve it instead:

```
npx serve public
```

The game itself plays fine from `file://`; only the PWA features are affected.

Run the regression suite before a pull request or deployment:

```powershell
pnpm install
pnpm test
```

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
