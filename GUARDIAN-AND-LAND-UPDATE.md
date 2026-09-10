# Guardian discoveries and visible camp land

## Implemented

Zero Marsh retains its existing basket discovery. All twelve other guardians now
have an authored manipulation chapter: one group, doubles, double-plus-one,
double-twice, half of ten, five-plus-one, five-plus-two, three doubles,
ten-minus-one, ten rows, ten-plus-one, and ten-plus-two. Children change groups,
compare the strategy with another amount, then try four untimed transfer facts.
Chapter checkpoints survive profile saves and reloads. Existing lessons saved in
the old build stage can still finish normally.

The illustrated realm artwork remains central. Small original SVG landmarks
respond to chapter progress and to independent answers during guardian encounters.
Bridges, gardens, towers, harbor docks, crystals and beacons have three restoration
stages. Realm entry scenes reflect existing conquest. The challenge and collection
requirements, existing rewards, and Zero Marsh’s special first expedition are
preserved. Guided completion opens a challenge; it does not claim independent
mastery or award its challenge star. Camp Siege keeps its existing battle scene.

Camp 2 now shows a faint solid grid on owned land during Explore, with stronger
lines in Build. Future parcels use an amber dashed grid. Geometry follows the
ground one cell at a time; parcel joins are deduplicated. The protected Story Stones
are omitted. The legend and My land explain that ownership does not remove trees
or buildings. A normal starting camp has 168 owned cells plus 1,243 future cells,
after excluding the 16-cell shared garden. Summit Tester owns all parcels, so its
world correctly has no future grid.

The grid adds one render batch over the previous grid, approximately 2,960 total
line segments and no texture downloads. Both batches use the renderer’s existing
geometry/material disposal lifecycle. Camp saves, costs and placement rules are
unchanged. New guardian scripts are in the offline core cache (v78).

## Camp 2 as the production camp — recommendation

Commit product development to Willowbrook / Camp 2. Retire the side-by-side
experiment once these compatibility steps are ready:

1. Make the main Camp destination open Willowbrook for returning players as well
   as new profiles. Move the old camp into Parents as “Legacy camp”.
2. Preserve the complete Camp 1 save in exports and imports. Its illustrated
   furnishings, placed coordinates and separate balance must remain recoverable.
3. Define and test a one-time entitlement transfer for earned legacy items and
   realm rewards. Do not blindly copy balances: learning already credits both
   camps. Do not replace existing Camp 2 buildings or placements.
4. Verify Camp 2’s accessible building controls and WebGL failure path on the
   school devices being supported before removing the legacy rendering fallback.
5. Archive Camp 1 source and assets outside the shipped app only after migration
   and recovery tests pass. Then remove its downloads from the service worker.

This update implements the requested chapters and grid. It retains both camps;
the proposed retirement is a separate migration, not a destructive cleanup.

## Verification

The new regression suite covers all twelve chapter journeys, bounded manipulation,
saved comparisons, independent-check gates, restoration scenes and land topology.
Existing camp commands, learning, first expedition and headless regressions remain
in the test command. Browser checks use disposable local profiles: an ordinary
new explorer and Summit Tester, with phone and tablet viewport checks. Viewport
checks do not substitute for physical iPhone/iPad or school-device performance QA.

Manual release checks: replay Zero Marsh; use half at the harbor; use three doubles
in the ice caves; leave and resume a partially built lesson; miss an encounter fact
and use help; compare solid/dashed land in a normal profile; claim a future parcel
and see its grid become solid; check gentle motion and low power; switch to Camp 1
and confirm its inventory remains intact.
