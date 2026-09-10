# Times Quest: follow-up audit and next design direction

September 10, 2026 · 0.17.0-beta.1 · cache v68

## Verdict

The correctness and continuity work substantially improved the game. The earlier
claim that all ten review priorities were implemented was too broad as a product
assessment: several have working foundations but do not yet achieve the intended
quality. Passing tests establishes defined behavior, not immersion, usability for
children, or educational effectiveness.

Keep the existing camp and illustrated map. Make the next release an integrated
opening experience: a compelling title screen, a short Zero Marsh adventure,
an expressive guardian scene, and the first visible improvement to a modest camp.
Begin the normal route at ×0, as the owner prefers. Do not restore the old lengthy
zero-fact grind.

This pass re-read the implementation and original review, inspected the supplied
screenshot and existing Zero Marsh artwork, used a fresh ordinary browser profile
on an isolated local origin, inspected camp land/upgrade rules, and reran all
667 automated checks successfully. No production code or existing player saves
were changed. Physical devices and child learning outcomes were not retested.

## What the previous review actually fixed

| Review area | Current assessment | Remaining issue |
|---|---|---|
| Tap interception, locked activities, battle victory, last-heart help, review bounds | Addressed in implementation and regression checks | Continue physical keyboard/touch testing. |
| Independent evidence, supported corrections, speed separation | Substantially addressed | Strategy-supported independent solving is still coarser than a diagnostic learning model; do not call collection or a short challenge proof of mastery. |
| Save/resume and learning-to-camp rewards | Substantially addressed | Result camp-goal cards still refer specifically to Camp 2 even when Camp 1 is preferred. |
| Guided teaching | Partial | A shared groups counter and four problems are an improvement, but the promised family-specific manipulatives are not implemented. |
| Coherent mathematical visuals | Partial | Division/missing-factor explanations improved. ×9 describes ten groups minus one, but the visual only draws the final nine rows; ×5 similarly describes halving without showing the ten-to-five transformation. |
| Guardian decisions and animation | Partial | Build/missing tasks primarily show number tiles above the keypad. A strategy choice changes a small model, not the environment. |
| Opening and route | Improved usability, wrong default for the owner | The prominent action bypasses Zero Marsh for Double River. There is no strong illustrated title screen before identity selection. |
| Navigation and stopping | Improved | Realm pages still duplicate guardian imagery and expose progression, rewards, collection and several modes together. Old “Trial” copy remains in camp/locked-button text. |
| Companionship and return | Foundation only | Team callbacks open cards; the feature is not yet a rich companion relationship or a long-running guardian story. |
| Visual polish and accessibility | Partial | New lesson scenery is visibly preliminary. Responsive fixes and semantic controls do not substitute for assistive-technology and physical-device validation. |

## Why the guardian screens look preliminary

The screenshot correctly identifies a weak point. `lessonLandscape(fam)` in
`public/journey-ui.js` builds the same CSS hills, diagonal stream and five-piece
bridge for every family. It swaps the guardian image but not the environment.
`journey.css` allocates the scene only 120px on narrow phones and 190px on larger
screens. It provides no coherent character grounding, detailed materials,
environmental change, or object interaction. The background color gradient is
doing much of the visual work.

The problem is not a lack of good existing art. The inspected
`public/art/battle/bg-battle-x0-portrait.webp` already contains a richly illustrated
marsh, stone ruins, water and foliage. Use this as the Zero Marsh environment,
with an intentional crop and accessible controls above a quiet contrast panel.
Do not replace a rich illustration with flat placeholder geometry.

Recommended guardian scene:

- A substantial illustrated stage with distinct background, foreground props,
  guardian, and interactive objects. Preserve the map's visual identity.
- Correct scale, contact shadows, warm/cool lighting and consistent prop materials.
  A character should stand on a bank or platform, not float on a flat card.
- One short guardian line and one task at a time. Reveal collection and detailed
  star requirements through secondary controls rather than repeating the avatar.
- State changes that teach: baskets empty, equal groups align, a ten-row formation
  loses one row, a bridge gains a missing section, or fog clears after a solution.
- Optional quiet motion and audio; an equally understandable still scene in calm
  mode. No equation or indispensable instruction baked into an image.
- Pointer manipulation plus equivalent tap/button controls. Keep the equation,
  help and answer action readable; never shrink the keypad to preserve scenery.

Use a lightweight DOM/SVG or canvas scene controller for these learning stages;
do not require a second Three.js world for every lesson. Represent scene state as
data: realm, step, groups, items per group, selected strategy, and resolved props.
The mathematical model should drive both visual actions and accessible text.

Art work is focused rather than a full redraw: first use the existing Zero Marsh
background and Poof, then create matching baskets/supplies, foreground accents,
and a few guardian poses. Approve one complete scene before producing thirteen.
Effort: medium engineering, medium art/content; essential next work. Test whether
a child can explain what changed and why, rather than only whether they liked it.

## A title screen that presents the actual game

Place a dedicated title/landing screen before profile selection on the first
visit. Returning players see their explorer and a prominent Continue action;
the title screen remains reachable without forcing an extra journey each time.

Composition: the existing illustrated adventure map establishes the distant
world; an original camp foreground provides warmth and a sense of home. Frame
the logo with trees, a stream and a small inhabited campsite. Show a readable
silhouette of the wider journey without covering the illustration in buttons.
If blending existing assets proves incoherent, commission one matching hero
illustration rather than assembling an obvious collage.

Suggested message: **“Learn your facts. Build your world.”** One primary **Play**
button opens Continue / Choose explorer / New explorer as appropriate. A quieter
**For grown-ups** action explains multiplication practice, untimed adventure,
offline availability after download, and device-local saves. Claims about
effectiveness must remain evidence-based; do not advertise proven learning gains.

On a phone, logo, promise and Play must fit without scrolling. Use a static
responsive image first, restrained optional ambience after interaction, and no
autoplay video or mandatory WebGL load. Proposed incremental hero budget:
under 500 KB on phones, with responsive WebP/AVIF variants and a fallback.
This is a target to measure, not a measured current result.

Effort: medium engineering and medium art; recommended. Test first-tap clarity,
readability, returning-player friction, slow-network loading, and whether a
parent understands what the child will do.

## Restore the ×0 beginning without restoring the grind

Keep the map's existing route:
**0 → 1 → 10 → 2 → 5 → 11 → 3 → 4 → 9 → 6 → 12 → 8 → 7.**

The current zero lesson reveals a real weakness: “Make 0 equal groups” begins
with zero groups, so the child can press Check without changing anything. The
visual renderer also collapses zero groups and several empty groups into the
same “Nothing to count” panel. A stronger opening must distinguish these cases.

Proposed first expedition, aiming for 3–5 minutes but subject to child testing:

1. Meet Poof at the marsh. Show three baskets containing zero supplies; inspect
   the empty baskets and identify the total.
2. Compare with zero baskets of four supplies. Label the factors and show why
   both totals are zero, despite the different arrangements.
3. Solve three short, varied independent tasks, including a new context.
4. Resolve a brief marsh encounter with an explicit three-success objective.
   Offer help and another learning route if needed; speed never gates progress.
5. Receive a starter-camp improvement and open One Woods. Full fact collection
   remains optional for the third star, and delayed recall occurs later.

Keep an optional readiness route in a quieter choice, rather than making ×2
the opening. Preserve existing opened routes, stars and active adventures;
change new-profile defaults without taking progress away. Zero/one chapters
need shorter authored encounters, not a global reduction in every challenge.

Effort: medium engineering/content; essential given the owner direction.
Test zero-factor understanding, independent transfer, session length, and
whether children can find both camp and the next realm unaided.

## Camp size: what exists now

The source confirms the expansion. Counts below are unions of grid parcels,
before trees, placed objects, protected scenery and walking access exclusions.

| Area | Potential cells |
|---|---:|
| Original central clearing, still 12×10 | 120 |
| Free Homestead Meadow, 8×8 | 64 |
| Mainland before the latest three added parcels | 656 |
| Current mainland with all parcels opened | 1,312 |
| Town building plots, unchanged | 115 |
| Current total including town | 1,427 |

Thus the mainland really doubled. The central starting clearing did not.
Homestead Meadow is already open for ordinary profiles and legacy profiles
after progress synchronization. Its 64 cells include a protected 4×4 Story
Stones garden where placement is deliberately forbidden.

Current instructions: **Camp 2 → Journal → More room to build → Homestead
Meadow**. The explorer walks there and the camera focuses on the parcel. Other
parcels require completed Realm Challenges, although some UI still calls them
“Mastery Trials.” At the marker, three untimed review answers open the parcel,
award six wood and clear at most one tree. Remaining trees only need clearing
where their trunks overlap a desired building footprint. Other open spaces are
buildable immediately. Clearing a tree does not unlock an otherwise locked parcel.

The main later additions are Cedar Rise (288 cells; four challenges), Westwood
Reach (256; six), and Fern Hollow (112; eight). In a fresh camp, much of this
expansion remains locked and off-camera. Even Summit Tester, which opens all
parcels, does not automatically remove forest trees.

The UX explains too little. Add **My land** beside Build, a small parcel map,
and visible states: open, available to open, locked, occupied by tree, and
protected garden. Display the exact reason on an invalid preview. Put the free
meadow first and show a brief one-time camera reveal. Sort available parcels
before locked ones. Tree actions on locked land should explicitly warn that
clearing earns wood but does not yet grant building access.

Avoid requiring hundreds of review questions merely to clear woodland. Offer
an optional small clearing project that opens a useful patch after a bounded
review, while letting children retain trees as part of their design.

## Make camp upgrades the long-term creative game

The shelter chain already exists:
**Pup Tent → Canvas Tent → Cabin Tent → Timber Lodge → Stone Cottage → Stone Keep.**
Fences, gates and wells also have upgrade chains. The missing pieces are an
obvious preview of the whole journey, more functional differences, richer model
detail, and several independent upgrade tracks. Fire, seating and much of the
scenery currently have no comparable chain. Only three construction goals are
defined. The initial camp already has a tent, fire, bench, feeder, pine, paths,
120 gems and a building kit, weakening the primitive-to-personal-home contrast.

Recommended milestone schedule (proposed design, not current behavior):

| Completed chapter | Main visible opportunity |
|---|---|
| Start | Pup tent, bedroll and a small gathering place |
| 1: ×0 | First warm light and a personalized camp pennant |
| 2: ×1 | Picket boundary, gate and simple seating |
| 3: ×10 | Canvas shelter, storage and matching supply crates |
| 4: ×2 | Cabin tent, deck and first substantial new clearing |
| 5: ×5 | Timber palisade and cooking area |
| 6: ×11 | Timber lodge and fort entrance |
| 7: ×3 | Watchtower and a useful lookout interaction |
| 8: ×4 | Complete timber courtyard, workshop and orchard options |
| 9: ×9 | Stone cottage and stone walls |
| 10: ×6 | Stone gateway and working courtyard well |
| 11: ×12 | Keep and paved courtyard |
| 12: ×8 | Observatory/library or garden specialization |
| 13: ×7 | Optional moat, drawbridge and a personal expedition crest |

Provide parallel tracks: shelter, defenses, light/fire, seating/gathering,
water/garden, paths/landscaping, and pets/guardian hospitality. Every upgrade
should improve at least two of appearance, interaction, usable space, or character
behavior. Examples: a lodge porch hosts a pet; a hearth invites an evening
gathering; a well waters the garden; a lookout reveals a distant discovery.

Every tier needs a distinctive silhouette and detail from every camera angle.
Tent progression should show fabric tension, seams, guy ropes and a usable door;
lodges need timber structure, porches, windows and smoke; stone buildings need
masonry variation, depth around openings, crenellations and inhabited interiors
or credible window activity. Reuse material families and instanced details.

Let children keep a favorite tent or choose a garden settlement instead of a
fortress. Higher tiers unlock choices rather than making earlier aesthetics
obsolete. Defenses remain creative and theatrical; do not destroy earned homes
or imply safety requires constant practice.

Blueprint availability should correspond to game chapter milestones, with
resources funding construction. Call these completed chapters, not demonstrated
long-term mathematical mastery. If moving existing unlocks from Challenge counts
to realm restoration, preserve all already unlocked tiers during migration.

Show current → next → later models, costs and new interactions together. Use
explicit incremental renovation costs: today upgrading charges the full target
item price. Preview any expanded footprint and allow relocation or cancellation
without trapping a child's layout. Pin goals from the real catalog instead of
limiting results to gate, canvas tent or bird feeder.

Keep resources understandable: gems, wood and stone are sufficient for core
building. Fish can remain a trade good. Price a meaningful early improvement
within a short expedition and a larger build across several chosen sessions;
measure actual earnings before assigning final prices. Never reduce existing
players' balances to impose the new starter economy.

One technical constraint matters before encouraging elaborate forts: saves and
commands currently cap the camp at 240 objects, including individual paths and
fence pieces. A 1,427-cell world can hit that ceiling quickly. Move connected
terrain/path/wall cells to chunked tile layers with compatible migration and
instanced rendering. Keep furniture/buildings as individual entities. Measure
placement validation and navigation on realistic dense camps before raising limits.

Effort: large engineering/content, large staged art work; recommended in small
vertical slices. Test whether children can name their next upgrade, afford it
through ordinary untimed play, place it without losing their layout, and see a
meaningful improvement beyond size.

## Exact next slice and release order

1. Fix expansion discoverability and restore ×0 as the default new journey.
2. Build the title screen using the approved existing visual language.
3. Finish one Zero Marsh scene: two genuinely different zero representations,
   coherent animated objects, a short encounter, and accessible equivalent controls.
4. Connect its reward to the existing pup tent, one small functional camp upgrade,
   and a guided view of the already-open Homestead Meadow.
5. Prototype three shelter tiers with upgrade previews and meaningful interactions;
   keep the same scene/assets usable in both rendering quality modes.
6. Test the complete loop with children and physical devices, then extend the
   scene framework and camp tracks. Do not commission thirteen full scenes first.

Acceptance: a new child starts in Zero Marsh, can explain both zero arrangements,
knows which guardian is helping, finds the open building space, and can describe
what their first upgrade changed. Returning players retain all progress. Phone
controls stay legible, calm mode retains meaning, and interrupted/offline play
preserves the new scene and upgrade state.

Source anchors: `public/journey-ui.js` (lessonLandscape, renderJourney,
renderEncounter, campGoalMarkup); `public/math-visuals.js` (render, explain);
`public/camp-content.js` (zones, milestones, catalog);
`public/camp-v2.js` (fresh, placementReason, buildable, command, goals, Journal);
`public/camp-v2-scene.js` (syncLand, model, grid visibility);
`GAME-EXPERIENCE-REVIEW.md`; `LEARNING-UPGRADE-CHECKLIST.md`.
