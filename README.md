# Times Quest — The Climb to Mount Twelve

A multiplication fact-family game built as an installable Progressive Web App.
Adaptive spaced review, realm-based progression, boss battles, a gem economy,
visual worked examples, and a parent dashboard with per-fact retention insight.

No build step or API keys. The game is a static PWA. Camp 2 lazy-loads a pinned,
locally vendored Three.js runtime; `jsdom` is used by the regression suite.

## Structure

```
public/
├── index.html              Learning, progression, profiles, Camp 1
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

Open **Camp → Try Camp 2** to enter **Willowbrook Camp**, a playable 3D woodland
with modeled shelters, furniture, fences, paths, an animated explorer and dog,
a stream, a bridge, and three discoveries. Turn the camera with the arrow buttons;
drag to pan and pinch or use buttons to zoom. The Camp 1 / Camp 2 switch keeps both
versions available. The previous 2.5D prototype's layout and supplies migrate.
Camp 2 has separate layout and building supplies inside each profile; spending
there does not touch Camp 1 savings. Learning rounds reward both camps after Camp 2
is first opened. See [the prototype specification and playtest guide](CAMP-V2-PROTOTYPE.md).

Three.js 0.180.0 is pinned in the lockfile and copied into `public/vendor/three`.
After an intentional dependency change, run `pnpm vendor:three`. There is no CDN
dependency. Visit Camp 2 online before testing it offline. WebGL 2 is required
for the 3D scene; Backpack controls and Camp 1 remain available without it.

Accurate answers now progress at any speed. Earned creatures and realm stars stay
earned, and returning after a break never deducts gems.

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
