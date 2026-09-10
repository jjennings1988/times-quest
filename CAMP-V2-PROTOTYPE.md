# Camp 2: Willowbrook Camp

Audience: grades 2–5. Target devices: iPhone, iPad, and school computers/tablets.
This is a local comparison prototype; Camp 1 and the illustrated adventure map remain available.

## Run and compare

```powershell
pnpm start
```

Open `http://127.0.0.1:4177`, choose a climber, and open **Camp → Try Camp 2**.
Use **Camp 1 / Camp 2** at the top to compare with the same profile. Run automated
checks with `pnpm test` (Camp 2 domain/learning regressions, then existing QA).

Camp 2 saves into `campV2` inside each existing profile. Its schema is independently
versioned (`v: 3`, world `willowbrook-1`). It has its own layout, backpack, project history, wood, stone, fish, and gems.
Existing family exports include it automatically. Unsupported or invalid Camp 2
data is retained and a recovery message offers Camp 1; it is not silently reset.

The prototype starts with 120 gems, 10 wood, and a small building kit. Once Camp 2
has been opened, finishing learning rounds adds the earned answer/star/quest/chest
gems to its balance as well as the usual Camp 1 balance. Camp 2 spending never
deducts Camp 1 gems. This temporary comparison economy is explained in the Journal;
choose one production economy after the playtest rather than retaining two wallets.

## Included

- An original **3D woodland** with a 12 × 10 starting plot and nine
  additional parcels (771 potential cells before trees, objects, and the Story
  Stones garden; Homestead Meadow is available immediately).
  The camera pans, zooms, and turns in 45° steps.
- All 26 camp object definitions have procedural 3D models, including connected
  picket/palisade/stone defenses, gates, a lodge, cottage, keep, wells, and moat.
  Catalogue thumbnails are rendered from these models, not imported artwork.
- A modeled explorer and dog with walking limbs, seated interaction, and wagging
  tail; a bird flies around and visits the feeder. Gates open as the explorer nears.
  The explorer uses a profile-derived colour palette, not the old portrait sprite.
- A stream with banks, a traversable wooden bridge, woodland, rocks, flowers,
  and three destinations: Willow Bridge, Story Stones, Butterfly Meadow.
  Discovery records persist; revisiting does not create a repeatable gem reward.
- Tap ground to walk; drag to pan; pinch/wheel or buttons to zoom; camera arrow
  buttons to orbit; Home to recenter. The camera recenters when a walk leaves view.
- Select, preview, confirm, move, cancel, rotate supported pieces, store, and
  one-action undo. Commands validate before charging or changing ownership.
- Separate ground-cover and solid-object layers; furniture can stand on a deck.
  Construction extends into parcels opened through mastery and review.
- A village supply store trades gems, wood, stone and fish; a purchased rod opens
  fishing reviews. Tree and parcel reviews open space and reward wood. Larger
  buildings have short, skippable explorer assembly animations.
- Walking routes avoid camp objects, forest trunks, and water. Water is crossed
  on the bridge. Decorative rocks and grass do not obstruct routes.
- Three fallen-wood piles, replenished through learning; shelter upgrades and
  three one-time construction goals. Fences support creative play; no attacks yet.
- Independent low-power, gentle-motion, and morning/moonlit settings. OS and parent
  reduced motion also apply. Low power disables shadows and caps resolution/fps.
- Backpack object list, location labels, keyboard/button nudges, textual invalid
  feedback, and Journal buttons for gathering and visiting destinations.
- Camp 1 and the illustrated adventure map remain intact.
- A continuous build brush for connected pieces; repeated taps place, Done exits,
  and Undo refunds the last piece. Keyboard/button placement remains available.
- Ten village buildings, curved roofs and dormers, softened masonry and foliage,
  ivy, ground contact shading, a river colour gradient and reeds, market stalls,
  a working waterwheel, fountain gardens, and flowered gateway arches.
- Thirteen original guardian models in Guardian Grove. Residents are derived
  from the active profile's conquered realms, never gems or tester inventory.
  Visits offer a practice link for that family; unearned residents remain absent.

## Learning and integrity improvements in this build

- Correct first attempts increase recall ratings regardless of elapsed time.
  Immediate retries and appended correction reps cannot accelerate collection.
- Caught/shiny collection flags and claimed realm stars persist through misses.
  Practice selection still uses current recall, rather than collection ownership.
- Review intervals advance on qualifying later-day retrievals. Same-day successes
  cannot turn a lapse into long-term retention evidence. Parent retention labels
  now describe an observed elapsed recall gap, not a future scheduled interval.
- Returning after a gap no longer spends 20 gems. Short-round daily goals adapt
  their answer threshold to the selected round length.
- Due review is recommended before new adventure work when applicable.
- Camp 1 undo includes inventory, gems, discoveries, and tutorial state, is bound
  to a profile, and is cleared on profile changes. Camp 2 commands have revisions.
- Saves flush at page hide/profile transitions; in-memory fallback is keyed per
  record and reports that device persistence failed.
- Camp 1 sheet drag ignores clicks on header buttons, fixing close-button capture.

## Architecture boundaries

`public/camp-v2.js` exposes pure `fresh`, `validSave`, `placementReason`, `route`,
`command`, and `awardLearning` functions independently of `mount`. The renderer
receives an explicit profile-bound adapter; it does not reference V1 globals.
This is a boundary for eventual extraction into separate domain/render modules,
not a new framework for the rest of the application. Rendering lives in the separate
`public/camp-v2-scene.js` ES module.

Object IDs identify instances; definitions hold footprints, rotation support,
layers, prices, and upgrades. Commands return a new save instead of mutating the
input. Undo restores the complete transaction, including supplies/project rewards.
The UI preserves the original placement until confirmation. Rendering, movement,
and temporary selection are not saved every animation frame.

The scene imports **Three.js 0.180.0**, pinned and locally vendored with its MIT
license. This fits the existing static PWA: no bundler, CDN, physics engine, or
application framework. WebGL 2 supplies actual depth, camera rotation, ray picking,
lighting, and shared procedural geometry. The art is original code-built geometry;
no Pilgrimage assets, code, buildings, UI, or map layout were copied.

Forest and scenery meshes are instanced. Terrain uses vertex colours; there are
no downloaded textures or models in this scene. Shadows update after scene changes;
characters use cheap ground shadows. DPR is capped at 1.5 (1 in low power), hidden
pages pause rendering, and exiting disposes GPU resources and event listeners.
A no-WebGL or module-load failure keeps the save and exposes Backpack controls
with a message and the Camp 1 switch. No fallback silently resets data.

The 3D scene and engine total approximately **0.19 MB gzip / 0.75 MB raw** before
HTTP overhead; existing broad PWA artwork warming is unchanged. The renderer is
loaded on entering Camp 2. Its module pack is cached after the first online visit.
There are no remote runtime requests for this renderer. Server compression must be
measured on the eventual host; the simple local server serves uncompressed files.

Save migration accepts the first prototype's valid schema-1 layout, inventory,
upgrades, project history, gems, wood, and view, as well as schema-2 woodland saves.
It writes schema 3 with defaults for mastery, parcels, tools, resources, cleared
trees, pending reviews, and construction. Stable object IDs and coordinates survive.
Invalid/unknown schemas or worlds are retained, not replaced with a starter save.
Schemas 2 and 3 support explorer positions outside the old building grid. Returning to
Camp 1 is supported; rolling back the application to the old Camp 2 code is not a
supported save downgrade. Export a family backup before release testing.

## Comparison tasks and acceptance

Use two sessions with 8–12 children if possible; vary which camp is shown first.
Keep supplied objects/tasks comparable. Do not use an all-access profile to judge
the normal gem economy. Record observations locally, without adding child analytics.

1. Find both camps and explain what is different.
2. Place a path, move and rotate the bench, store/re-place an item.
3. Attempt an invalid placement, then recover without adult coaching.
4. Gather wood and upgrade the shelter; cancel once before confirming.
5. Make the explorer sit with the pet; build a fence with an opening.
6. Turn the camera, cross the bridge, discover a destination, and return to camp.
7. Leave/reopen, switch profiles, and confirm each layout remains independent.
8. Finish a short learning round, return, and notice the supplies earned.
9. Ask which camp they want to return to and what they want to build next.

Targets: 80% complete building/recovery unaided; first placement under 30 seconds;
75% intentionally use an object; no material decline in learning accuracy; no save
loss. Continue Camp 2 only if creative agency or repeat visits improve over Camp 1.

Physical-device release gates are still required: Safari/browser and installed PWA,
portrait/landscape, 200% zoom, screen reader, airplane-mode reload, service-worker
update, 20-minute battery/frame pacing, and 10 scene entry/exit memory cycles.
Desktop viewport checks are not evidence of iOS frame rate or offline reliability.

Historical 0.13 verification (see CAMP-UPGRADE-STRATEGY.md for 0.14 measurements):
automated tests cover old-save migration, unsupported
worlds, outside-plot save/reload, reachable destinations, river crossing, trunks,
and continuing learning after exploration. Desktop browser viewport checks cover
phone/tablet/desktop layouts and the build/edit/discover flows. An initial starter
scene reported 84 draw calls and roughly 42k triangles before the terrain-border
extension. In-browser submission diagnostics are available on the canvas dataset;
The final upgraded-cabin scene reported 154 draw calls, about 57k triangles, and
10 uploaded geometries. CPU submission time is not GPU frame time or evidence of
iOS performance. The complete automated suite passed 398 checks. The normal
in-app service-worker update was also exercised against a prior saved profile;
its fence and inventory survived, both shelter upgrades worked, and a discovery
outside the building plot survived reload.

Budget targets for subsequent profiling: 60 fps active / 30 low mode; under 150 draw calls for the starter scene and
under 250 for a furnished slice; under 80k visible triangles; interaction
feedback within 100 ms; camp first-playable packet below 3 MB; complete slice below
5 MB; stable memory across repeated entry. Initial full-app download optimization
and transactional IndexedDB migration remain separate production-foundation work.

## Deliberately deferred

Terrain sculpting, interiors, actual defensive simulation, production character
art/animation, thirteen biome packs, reducing existing explorer choices, cloud sync,
wholesale module extraction, and new mathematics beyond multiplication. No Camp 1
or adventure-map artwork is replaced. The original 2.5D experiment has evolved into
this 3D Camp 2; the comparison remains Camp 1 versus Camp 2.

## 0.16 world refinement

Camp territory is now 1,312 potential cells (2×), plus 115 unchanged village cells. Roads follow the terrain and every town entrance; Guardian Grove has moved to a fenced woodland clearing reached by a lantern trail. All-sided architecture, forest/mountain boundaries and anchored camera orbit are included. See CAMP-UPGRADE-STRATEGY.md for dimensions, compatibility and current validation. Earlier measurements above describe earlier prototype revisions.
