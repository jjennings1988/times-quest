# Painted guardian realms

Version 0.20.3-beta.1, service-worker cache v86. Extends the approved Squarestone
Valley treatment through the other twelve realms. The map, guardian portraits,
camp, multiplication rules and earned stars are preserved. No save migration.

## Places children restore

| Family | Realm | Landmark | Three-star decoration |
| --- | --- | --- | --- |
| 0 | Zero Marsh | Lantern causeway emerging from the fog | Gold-and-teal ribbons |
| 1 | One Woods | Woodland nursery and flowering trellis | Floral garlands and pennants |
| 2 | Double River | Timber crossing on stone piers | Bridge banners |
| 3 | Triple Jungle | Canopy walkway and lookout | Flowers and jungle pennants |
| 4 | Squarestone Valley | Valley watchtower | Original pilot celebration banners |
| 5 | High-Five Harbor | Repaired dock and boat shelter | Nautical banners and flower baskets |
| 6 | Six Circuit | Sun engine and valley beacons | Sun banners and planters |
| 7 | Seven Storm Peak | Mountain refuge and guiding lamps | Purple-and-gold banners |
| 8 | Eight Ice Caves | Crystal arch and passage | Ribbons and crystal stars |
| 9 | Nine Ninja Temple | Lantern gateway and courtyard | Gold tassels and festival bunting |
| 10 | Ten City | Blue-domed power station | City banners and star finials |
| 11 | Twin Towers | Matching sky towers and connecting bridge | Matching banners and bunting |
| 12 | Dozen Desert | Irrigation channels and oasis fountain | Turquoise canopies and ribbons |

Each place has five illustrated states: waiting/neglected, initial repairs,
near-complete, restored, celebrated. Star 1 shows preparations and directs the
child to the guardian encounter. Star 2 shows the finished place and points to
the Fact Trail. Star 3 adds distinct painted decorations. The encounter advances
through three restoration milestones. Learning previews are explicitly labelled;
they neither grant restoration nor erase a previously earned finished scene.
Poof keeps the existing basket lesson and three-discovery encounter rules.

## Art production and alignment

The original v1 full-frame illustrations remain on disk. Runtime now uses their
empty landscapes as fixed backgrounds, with new transparent v2 landmarks. All
new illustration used **built-in image_gen**, with the corresponding approved
v1 atlas as reference. No external API key or CLI generation was used.

- Runtime landmarks: `public/art/realm/scenes/x{family}/{stage}-v2.webp`.
- Fixed backgrounds: `public/art/realm/scenes/x{family}/landscape-v1.webp`.
- Original generated masters: `art-source/realm-scenes-v2/x{family}-atlas.png`.
- Exact final prompts: `art-source/realm-scenes-v2/prompts.json`.
- Original generation paths: `art-source/realm-scenes-v2/sources.json`.
- Alpha coverage, dimensions, bytes and measured ground anchors: `art-source/realm-scenes-v2/manifest.json`.
- Reproducible packaging and registration: `tools/prepare-aligned-scenes.js`.
- Runtime registration: `public/realm-scene-registration.js`.

The atlases contain five transparent landmark states and an unused sixth cell.
Sharp extracts rectangular cells and encodes WebP. Alignment uses CSS coordinates,
not repainted pixels. The packaging tool measures the structural ground band and
registers its left/right anchors and baseline to each realm's restored stage.
Set SHARP_MODULE if Sharp is outside the normal module search path. Existing
repository masters take precedence over original generation-output paths.
Squarestone retains its approved v1 art and receives the same registration pass.

This fixes background drift, guardian movement and inconsistent ground anchoring.
It is a crossfade between paintings, not a geometric morph: individual stones,
boards and decorations can still vary between stages. Future art revisions should
retain the same foundation geometry and be reviewed at transition midpoint as
well as at the finished stage. Do not call all internal details pixel-identical.

## Architecture and loading

The existing stars, trials and conquest flags select visual progress; there is
no separate art save and no save migration. Realm pages, guided lessons and
encounters share the scene contract. The renderer keeps the existing figure,
landscape and guardian DOM nodes when the family and context match.

`scene-transitions.js` waits for a successful image decode, then crossfades only
the registered landmark over 420 ms. It retains old artwork during loading,
ignores stale loads, limits transitions to two landmark images, and preserves the
previous image with a visible status message on failure. Rendering the same
stage again can retry a failed load. A realm/context change mounts a fresh scene.
Calm and system reduced-motion settings skip the fade.

Only the entered realm's five landmarks and fixed landscape warm in the page.
The service-worker CORE includes the small scripts and CSS, not the artwork.
Targeted WARM_REALM and optional offline downloads include all current stages.
Old full-frame v1 stages are no longer warmed. Cache v86 provides the update via
the existing explicit in-app update flow; it does not force a reload mid-lesson.

The 60 new alpha landmarks total **5,044,358 bytes**. Including the twelve fixed
landscapes, runtime art for those realms totals **6,136,294 bytes**, with each realm
between 0.42 and 0.68 MB (under its 750 KB regression budget). Squarestone's existing
six assets remain 1,129,856 bytes. Typical decoded realm artwork is approximately
6.3 MB before guardian art and browser overhead. No new runtime dependency,
WebGL context or animation loop was added.

## Layout and accessibility

Realm and lesson scenes retain their 3:2 composition. Compact encounters frame
landmarks and guardians separately over the same fixed landscape. HTML captions
and next actions describe earned progress; decorative art remains hidden from
screen readers. Existing keyboard-accessible mathematics controls are unchanged.
Calm/reduced-motion disable transitions and effects; hidden screens pause motion.
A missing landmark does not remove the fixed scenery, captions or learning UI.

## Verification and release QA

- Full suite: **1,587 passing checks**, including 389 painted-realm checks and
  258 alignment/transition checks.
- All thirteen families: measured anchor mapping, stable scenery nodes across
  all five stages, correct decoded stage, existing progress selection.
- Delayed/out-of-order decodes, interrupted fades, failed load, retry, realm
  changes, Calm and system reduced-motion behavior.
- Actual lesson, guardian-victory, final Fact Trail, save reload and replay flows.
- Real service-worker targeted caching and shell-install contract.
- Browser gallery with production renderers/CSS at desktop, 390 × 844 and
  1024 × 768: realm and compact encounter compositions, all five stage sets
  loaded, and unchanged landscape/guardian source and bounding rectangles for
  all thirteen realms. Test origin was isolated from existing child profiles.
- Physical iPhone/iPad, school-device rendering and real airplane-mode testing
  remain release QA. This change is local; no commit or deployment was performed.
