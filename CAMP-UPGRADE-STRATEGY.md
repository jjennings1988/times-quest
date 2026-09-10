# Willowbrook: from campsite to personal fortress

Audience: grades 2–5; iPhone, iPad, and school hardware. Preserve Camp 1 and the
illustrated adventure map. This is a local prototype expansion, not a deployment.

## Design direction

[Townscaper](https://store.steampowered.com/app/1291340/Townscaper/) adapts buildings
to neighbouring placements. [Tiny Glade](https://store.steampowered.com/app/2198150/Tiny_Glade/)
adds procedural details and lets paths and structures influence one another.
Borrow those broad principles: forgiving editing, connected pieces, attractive
corners, warm material variation, and small inhabited details. Our geometry, town,
characters, and controls remain original. This mobile slice does not attempt their
full freeform building engines or desktop rendering budgets.

## Progression pathway

One completed Mastery Trial earns one permanent camp milestone. Boss battles and
collection keep their existing rewards; answer speed never gates these unlocks.
The family order follows the existing map, not numeric order.

| Milestone | Family | Camp addition |
|---|---|---|
| Start | — | Primitive shelter, fire, bench, free paths and picket fencing |
| 1 | ×0 | Woodland Grove clearing |
| 2 | ×1 | Fishing rod, flowers, colour choices |
| 3 | ×10 | Canvas shelter and garden well |
| 4 | ×2 | North Meadow; finish a personal campsite |
| 5 | ×5 | Timber palisade and buildable Town Green |
| 6 | ×11 | Fort gate and timber lodge |
| 7 | ×3 | Timber watchtower |
| 8 | ×4 | South Orchard; complete a timber fort |
| 9 | ×9 | Stone walls and stone cottage |
| 10 | ×6 | Stone gateway and courtyard well |
| 11 | ×12 | Stone keep and cobbled paths |
| 12 | ×8 | Space and resources to finish the stone courtyard |
| 13 | ×7 | Moat channels and drawbridges |

Existing purchased objects stay usable even if their new blueprint appears later.
Children choose the shape, layout, colours, and mixture of tiers. Upgrades are
optional; a child can keep a favourite small campsite after mastering every family.

## Learning, building, and returning

Complete a short learning adventure → earn gems and supplies → choose a project →
gather or trade → build → explore the next destination. Each return should make one
visible improvement possible. No decay, absence penalty, real-money purchase, or
construction waiting timer. Construction is a short, skippable character animation.

Tree clearing uses three untimed review questions. Clearing a designated parcel
opens its buildable area; individual remaining trees can be cleared with more review.
Wood is a useful reward, while optional trees can remain as part of the design.
Fishing requires a rod purchased with earned gems. Three reviewed facts earn a fish;
mistakes receive visual teaching and do not erase completed steps. Fish trade for
gems or stone at the town store. Three catches per learning adventure keep fishing
from replacing the wider learning loop; there is no real-world countdown.

Use four understandable supplies: gems, wood, stone, fish. Fish are barter items,
not an additional token currency. Building and upgrading spend supplies; moving,
storing, recolouring, and undo remain free. Prices are playtest values and need
five-session child observations before final balancing.

## Implementation sequence and acceptance

1. **Foundation:** versioned save migration, permanent unlock ledger, resource
   transactions, expanded parcel validation, and full Summit Tester provisioning.
   Pass: no lost layouts or supplies; no normal-profile testing privileges.
2. **Building:** connected paths/walls, taller corners, picket → palisade → stone,
   shelters → lodge → cottage → keep, wells, moat, and drawbridge. Pass: connections
   update after place/move/store/upgrade; a usable entrance cannot be sealed off.
3. **World:** original town architecture, visitable supply store, fishing dock,
   parcel clearing, and short assembly animations. Pass: all destinations are
   reachable; rewards survive reload and cannot be claimed twice from one result.
4. **Teaching:** grouped multiplication arrays, a five-group split for larger
   products, cumulative group counting, and explicit answers after mistakes.
   Preserve factor order and support zero and one. Corrections never count as
   fresh mastery evidence. Pass: 0–12 products are accurate and readable on phones.
5. **Polish and testing:** touch layouts, reduced motion, rendering budgets, offline
   caching, state tests, and normal versus tester playtests. Physical iOS battery,
   screen-reader, installed-PWA, and child sessions remain release gates.

Primary risks are a crowded catalogue, an economy that rewards repetitive camping
more than learning, excessive draw calls from walls, and save loss across activity
transitions. Group the catalogue by purpose, instance repeating geometry, use
explicit atomic commands, and keep review evidence separate from activity rewards.

## World and building update — 0.15

**Build continuously.** Selecting a fence, wall, gate, path or moat activates a
brush. Each ground tap places one validated piece and charges exactly once; the
brush stays selected. Dragging still pans. Done exits, Undo refunds the last piece,
and an existing connected object offers Build more. Keyboard nudges and explicit
placement are retained. Phones zoom closer when entering the builder.

**More room and destinations.** The walkable bounds grow from 49 × 32 to 77 × 53
cells. Nine parcels provide 771 potential building cells, versus 283 in 0.14.
Homestead Meadow is available immediately and its trees are cleared; the Story
Stones remain a shared garden. Highfield, Westwood, Apple Orchard and East Village
extend the earned land progression. Open parcels can be visited from the Journal.

**A more inhabited town.** Ten buildings, market stalls, a watermill, a clock
tower, garden fountain, flowering arches and connected public walks create
distinct destinations. Public roads avoid saved building parcels. New art uses
original geometry: curved roof profiles, dormers, ivy, rounded masonry, smooth
foliage, soft ground shading, and a depth-coloured river with reeds. The reference
games inform ease of building and attention to small details; their assets and
layouts are not reproduced.

**Guardian Grove.** Thirteen distinct original 3D guardian models correspond to
the existing realm characters. Actual realm-battle victories determine which
residents appear. Empty numbered habitats explain what remains to earn. Children
can visit a defeated guardian and practise that family. This view reads existing
profile progression, so it creates no separate capture currency or conflicting
guardian-save ledger. All thirteen appear for Summit Tester.

**Engineering and verification.** The new world-detail renderer is lazy-loaded
and included in the offline scene cache. Scenery is divided into spatial batches;
placed static objects share rendering batches while retaining individual picking
targets. Route searches build an occupancy set instead of repeatedly scanning
every tree. Existing parcel IDs, object IDs, coordinates and cleared-tree IDs
remain compatible. The scene stays on schema 3; older app versions do not support
the newly introduced parcel IDs, so save downgrades remain unsupported.

422 automated checks pass, including repeat placement/refund, locked guardians,
all destination routes, non-overlapping parcels, and legacy cleared-tree saves.
Live browser checks exercised a four-tap fence run with a corner, guardian visits
and the practice link, and phone/tablet/desktop layouts. The new scene and all
thirteen guardian controls reloaded with the isolated preview server stopped.
Updating the existing preview preserved all 33 placed objects and their coordinates.
The lazy scene/engine pack is approximately 772 KB raw / 200 KB gzip.
A garden view reported
256 draw calls, 131,590 triangles, two uploaded textures, and about 1.2 ms average
CPU render submission on the development desktop. These exceed the earlier
triangle target; physical iOS and school-device frame pacing, dense-camp stress,
and battery tests remain release gates. Do not interpret CPU submission time as
a measured mobile frame rate.

## Previous expansion verification — 0.14

- 26 procedural camp models; four new parcels increase potential building space
  from 120 to 283 cells. Trees remain optional obstacles within unlocked parcels.
- Connected paths, fences, gates, walls and moat pieces, taller corners, five roof
  palettes, village buildings, a store, residents, and a fishing dock.
- Atomic supply trades, rod ownership, three-fact reviews, saved tree removal,
  parcel opening, resumable construction, and a complete tester kit/refill.
- Camp schema 3 migrates prior layouts and wallets; Camp 1 remains separate.
- 417 automated checks pass: learning regressions, migration, resources, access,
  topology, rewards, all 169 multiplication products, and counted-group controls.
- Browser checks at 390 × 844 and 820 × 1180: store barter, fishing with a mistake
  and correction, assembly, connected stone corners, and no horizontal overflow.
  Desktop was also inspected. With the dedicated preview server stopped, the app
  reloaded its 3D scene, upgraded shelter, walls, backpack and resources from cache.
  Gentle motion and low power remained usable offline.
- Sample starter/town scene: 138 draw calls, 70,432 triangles, one renderer texture,
  approximately 0.7 ms average CPU render submission on the development desktop.
  Submission time is not GPU frame time or evidence of iPhone performance.
  The lazy scene/engine pack is approximately 756 KB raw / 193 KB gzip.

Before broad release, target 30 fps minimum on an iPhone 11/current school Chromebook,
60 fps where available, under 100 ms input feedback, and under 3 seconds for a warm
camp load. Aim below 250 draw calls for a typical furnished camp, below 100,000
visible triangles, and below 64 MB texture memory; test the 240-object safety cap
separately. Measure physical iOS keyboard, pinch, GPU time, heat and battery before
calling these budgets achieved. No external 3D textures or models are downloaded.

## Follow-on work

| Next investment | Priority | Benefit and cost | Main test |
|---|---|---|---|
| Physical-device performance and accessibility | Essential | Validate this foundation before adding assets; medium engineering effort, minimal art | iOS keyboard/VoiceOver, school Chromebook, 100-object camp, 20-minute battery run |
| Five-session economy and mastery playtest | Essential | Keep construction rewarding without displacing practice; medium design effort, small UI changes | Can children earn one wanted improvement each visit without farming easy facts? |
| More expressive assembly, fishing and resident interactions | Recommended | Make the space feel inhabited; medium engineering and animation/art effort | Do children notice and revisit interactions without prompting? |
| Mesh/material art pass and realm-themed architectural sets | Recommended | More visual identity for each child's fort; medium engineering, high original-art effort | Blind Camp 1/Camp 2 preference and mobile performance comparison |
| Freeform terrain, building interiors and dynamic siege | Optional later slice | Potentially richer play; high simulation, content and accessibility cost | Separate prototypes must outperform the current accessible grid builder |

Fluid simulation, freely sculpted terrain, arbitrary multi-storey architecture,
defensive combat, interiors, and production character rigs require separate slices.
Moats are connected construction pieces. The town is a compact destination, not a
population simulation. Townscaper/Tiny Glade quality is the long-term art direction,
not a claim of parity from this update.

## 0.16 world review — September 10, 2026

The review found disconnected street fragments (including the mill entrance), flat road tiles stepping on hills, front-heavy house detail, guardians embedded in the village, and a camera that changed its world target when orbiting away from camp.

- Camp parcel area doubles from 656 to 1,312 potential cells. Town Green and East Village Plot retain their 115 cells, giving 1,427 total. Story Stones, trees, footprints and access rules still reserve space within parcels. Westwood Reach adds 16 × 16, Cedar Rise 24 × 12, and Fern Hollow 14 × 8. They unlock at the existing 6-, 4-, and 8-family milestones through untimed review.
- The western woodland envelope grows from 33 × 53 to 51 × 69 cells (about 2×); the deterministic forest contains 492 present camp-side trees in the new envelope versus 220 in the previous envelope for a fresh save. Legacy tree IDs and existing parcel coordinates remain valid.
- All 432 public road cells form one network from Willow Bridge to every building entrance, the market, gardens and woodland trail. Paving uses one original 256 × 256 procedural atlas. Road meshes follow ground vertices, with exposed-edge curbs; streets never consume player parcels or building footprints.
- Guardian Grove is east of town, behind a winding lantern trail. Thirteen spaced habitats form a horseshoe inside a stone-base fence with metal rails, leaf-shaped finials and an ivy arch. The fence blocks walking except at its four-cell entrance. Weighted navigation favors roads; tapping open ground still permits exploration. Guardians retain their existing realm-victory requirements.
- Side and rear windows, shutters, flower boxes, cladding, foundation courses, downpipes, roof dormers and open chimney caps complete the building elevations. Clock faces appear on all four sides. Tents gain rear flaps and ropes, towers gain diagonal bracing, wells have buckets, gates have hardware on both faces, and logs have both end caps.
- Three forest bands and faceted mountain ridges enclose the valley. Terrain and roads are culled in local chunks. Architectural faces batch by vertex color; foliage retains instancing. Camera orbit, button zoom, wheel zoom and pinch retain the current world target. Resizing preserves the camera scale relationship.

Compatibility: save version 3 and world ID willowbrook-1 remain unchanged. New fields are content-only; saves keep layouts, inventory, cleared-tree IDs, resources, profiles and Camp 1. Existing Summit Testers receive the new parcels without a wallet reset. The 240-object cap remains in place. No external art/model downloads or new runtime dependencies were added.

Validation: 430 automated checks cover the original learning flows plus parcel area, tree compatibility, every street/doorway connection, trail routing, fenced entry, separated habitats, new-land placement/reload, unchanged tester wallets, and camera target invariance. Browser viewport checks and rendering measurements are recorded below; physical iPhone/iPad/Chromebook GPU, thermal and battery testing remains required.

### 0.16 browser verification

- Desktop, 390 × 844 phone portrait and 1024 × 768 tablet landscape exercised. Reverse town views show complete side/rear elevations; camera rotation retains the destination. A tapped guardian opened the correct family practice panel.
- Sample after architectural batching: phone town 291 draw calls / 70,116 triangles / 1.6 ms average CPU render submission; tablet grove 190 draw calls / 85,796 triangles / 2.5 ms (low power). These are development-desktop observations, not physical-device frame-rate results. The town remains above the earlier 250-call target and needs real-device profiling before broader rollout.
- Three or four live renderer textures were observed (including the optional shadow map). The lazy scene/engine pack is 782,552 bytes raw / 203,075 bytes gzip. The local development server serves raw files; gzip is a transfer-size estimate for a compressed production host.
- Stopped the isolated local server, reloaded the app, reopened Camp 2 and confirmed the 3D renderer and new parcels worked from the service-worker cache. Restored the ordinary browser viewport afterward.

The existing main-preview profile was updated through the app’s normal Update action. Its 56 backpack entries retained the same IDs, item types and grid positions; the displayed Camp 2 resource balances also remained unchanged. The illustrated map and Camp 1 were retained. Local preview: http://127.0.0.1:49305/.
