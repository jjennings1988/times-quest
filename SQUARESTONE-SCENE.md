# Squarestone Valley: painted scene pilot

Version 0.20.1-beta.1. Squarestone is the first realm using a layered painted
landscape and landmark. Other realms and the illustrated adventure map retain
their existing artwork.

## Experience

- **Before the first star:** a solid ruined watchtower with fallen masonry.
- **First star:** repaired lower walls, organized stones, ladders and scaffolding.
- **Guardian encounter:** ruins → foundation → repaired walls → lit beacon.
- **Second star:** finished tower, warm windows, gold seams and four-square banner.
- **Third star:** additional teal-and-gold festival banners and subtle light motes.

The guided lesson previews preparation as the child doubles groups. It cannot
grant restoration by itself, and revisiting a lesson preserves an already earned
finished/celebrated scene. A rematch illustrates the restoration again without
removing the saved completion. The scene's button points to the appropriate
learning activity or onward adventure.

## Production assets and provenance

Generated with the **built-in image_gen tool**, using the existing Squarestone
battlefield and Boulder artwork as style references. Original generated masters
were copied into this repository; the source outputs were left intact.

- Runtime artwork: `public/art/realm/squarestone/*-v1.webp`.
- Editable/source PNG masters: `art-source/squarestone-v1/`.
- Exact landscape, restored tower and construction prompts:
  `art-source/squarestone-v1/prompts.json`.
- Exact celebration edit prompt:
  `art-source/squarestone-v1/celebrated-prompt.txt`.

The six runtime images total **1,129,856 bytes** (about 1.13 MB), comprising a
1280 × 853 landscape and five 768 × 768 transparent tower stages. Sharp performs
only resizing and WebP encoding; all new illustration and variant edits came
from image_gen. Alpha is preserved. Boulder reuses `art/realm/pet-4.png`.
The existing map and original portrait battlefield remain untouched.

## Implementation

`public/squarestone-scene.js` contains pure progress-to-art selection plus markup
and the small application adapter. `public/squarestone-scene.css` composes the
landscape, tower, Boulder, lighting and captions. Realm, lesson and encounter
use the same asset family, with compact framing for the encounter.

Persistent visuals derive from the current trial/conquest flags and earned star
ledger; no additional save fields or migrations are needed. Encounter progress
selects four explicit states. The scene stays mounted between milestones to avoid
restarting image decoding/animation on every answer. New sprites warm on entering
Squarestone. The service worker includes all six in optional art warming and in
its targeted ×4 realm download; the script and stylesheet join the app shell.

The illustration has no WebGL context or render loop. Motion uses small CSS
opacity/transform effects; hidden screens pause them. Both the Calm setting and
system reduced-motion disable them. Every state has a textual caption and goal;
maths controls remain HTML and keep their existing keyboard/screen-reader support.
If a new image is unavailable, the retained battlefield and textual instructions
remain; image failure never disables the learning controls.

## Verification

`test/squarestone-scene.js` covers visual state selection, lesson/replay behavior,
the real guardian-to-third-star flow, save reloads, no mutation while viewing,
unchanged rendering for other realms, asset existence and the 1.2 MB art budget.
Guardian chapter regression checks now assert the painted restoration for ×4.

Browser inspection used an isolated local fixture rather than changing an
existing child's profile. Verified 390 × 844 phone and 1024 × 768 tablet layouts,
restoration states, the lesson, the entire phone keypad, and Calm behavior.
The complete automated suite passed all 940 checks, including 30 scene checks.
Physical iPhone/iPad and school-device checks are still part of release QA.
