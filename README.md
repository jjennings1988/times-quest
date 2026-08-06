# Times Quest — The Climb to Mount Twelve

A multiplication fact-family game built as an installable Progressive Web App.
Spaced repetition, realm-based progression, boss battles, a gem economy, and a
parent dashboard with a per-fact heatmap.

No build step, no dependencies, no API keys. The entire game is one HTML file.

## Structure

```
public/
├── index.html              The entire game
├── manifest.webmanifest    App name, icons, colors for install
├── sw.js                   Service worker — offline caching
└── icons/                  Android, iOS, and maskable icons
netlify.toml                Publish config + service worker cache headers
```

All paths inside the app are relative, so it works at any URL depth.

## Local development

Do **not** open `public/index.html` directly with `file://` — service workers
and install prompts require a real HTTP origin. Serve it instead:

```
npx serve public
```

The game itself plays fine from `file://`; only the PWA features are affected.

## Deployment

Connected to Netlify via GitHub. Pushes to `main` deploy automatically.

- Publish directory: `public`
- Build command: none
- Environment variables: none

## Updating the game — read before you push

The service worker caches the app shell aggressively so it works offline. That
means **an installed device will keep playing the old version after you deploy
a new one** unless you tell it otherwise.

Whenever you change anything in `public/`, bump the cache name in `sw.js`:

```js
const CACHE = 'times-quest-v2';   // → 'times-quest-v3'
```

That single line is what triggers installed devices to fetch the new files.
Forgetting it is the most common reason a deploy appears to do nothing.

If you add a new file to the app shell, also add it to the `SHELL` array in
`sw.js` so it's available offline.

## Where progress is saved

Progress lives in the device's `localStorage`. It survives closing the app and
going offline, but it is per-device and per-browser — a different tablet starts
fresh. Clearing site data erases progress. The Parents tab has a manual reset.

Because progress is keyed by name in `localStorage`, renaming those keys in a
future version will orphan existing saved progress.

## Installing on a device

**Android / Chrome:** open the URL — an install banner appears at the top of
the map, or use the Chrome menu → *Add to Home screen*.

**iPad / iPhone (Safari):** open the URL, tap **Share**, then **Add to Home
Screen**. iOS does not show automatic install prompts, so the in-app banner
won't appear there — the Share method is the official path.

After installing, the app works fully offline.
