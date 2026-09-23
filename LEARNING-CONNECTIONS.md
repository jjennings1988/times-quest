# Connected learning and camp projects — 0.22.0-beta.1

The simpler guardian encounter and complete camp goal catalogue from 0.21 remain.
Version 0.22 extends the interactive ×9 approach to the eleven remaining guardian
families. Zero Marsh keeps its existing hands-on basket lesson, and ×9 keeps its
lantern activity. These are implemented learning experiences, not yet validated
learning outcomes from child studies.

## Interactive family lessons

Each new lesson has discovery with four items in each group, a prediction and
guided problem using seven, then exploration with any amount from 0–12. After
exploring, children try four fresh, untimed questions. Manipulating the model does
not award independent evidence, stars, gems or camp resources.

| Family | What the child changes | Mathematical strategy |
|---|---|---|
| ×1 | Delivers one whole seed tray to Echo | One group keeps its amount |
| ×2 | Makes a matching raft of planks | Double |
| ×3 | Doubles a vine bundle, then adds a matching bundle | Two groups plus one |
| ×4 | Copies a stone tray, then copies both trays | Double twice |
| ×5 | Moves any of ten loaded boats between two docks | Half of ten equal groups |
| ×6 | Connects another cell rack beside five | Five groups plus one |
| ×7 | Adds two supply packs beside five | Five groups plus two |
| ×8 | Doubles crystal clusters from one to two, four and eight | Double three times |
| ×10 | Regroups ten power rows into columns containing ten cells | Bundles of ten |
| ×11 | Adds one full tile bundle beside ten | Ten groups plus one |
| ×12 | Brings two water trays beside ten | Ten groups plus two |

The boat activity preserves every boat and crate, including deliberately unbalanced
docks; Undo restores the previous move in either direction. The power station
keeps column colors and numbered bundle labels when regrouping. Neither the ×10
nor ×11 lesson depends on a digit-copying trick; twelve items per group work too.

New SVG seeds, planks, vines, stones, crates, cells, packs, crystals, tiles and cups
are individually countable. Zero has empty groups rather than phantom items.
Wrong totals receive strategy-specific coaching using partial amounts. The final
guided answer stays hidden until solved. There is no timer or loss penalty.

`family-lessons.js` owns the pure model, content and bounded manipulation history;
`family-lesson-ui.js` owns rendering, focus and input; `family-lessons.css` owns the
layout. Existing realm artwork and the separate ×9 model are retained. No new
framework, external asset dependency or generated illustration is required.

## Guardian encounters

- One restoration bar fills forward. Its three stages use the same thresholds as
  the painted scene. The HUD shows the guardian's goal and remaining hearts.
- A single story prompt sits beside the math task. The duplicate portrait and
  task card are removed; equal-group diagrams open on request. Split-strategy
  choices remain available without displaying the final answer.
- Existing battle rules, stars, independent evidence and Siege rules are unchanged.
- The header and exit remain in the safe area. On short screens the task and
  keypad scroll; they do not compress into tiny targets.

`guardian-encounter.css` owns the new guardian layout. `guardian-ui.js` owns its
progress display; `journey-ui.js` renders the task and optional support.

## Camp project goals

Choose a project from results, Camp Journal or Upgrades. Every catalogue entry is
offered under Homes, Fences/gates/forts, Paths/platforms, or Garden/camp life.
Future blueprints can be pinned without buying or unlocking them.

The card distinguishes built objects, stored kits, construction, unlocked projects
and future blueprints. It shows footprint, missing gems/wood/stone, and remaining
Realm Challenges. Pending rewards and earned kits are projected without claiming
them. The camp's existing grant delivery still performs the actual delivery.

- A locked goal leads to an available realm.
- Missing supplies open a focused panel with wood gathering, store and learning
  actions.
- A ready project opens a placement preview. If a placed predecessor exists, it
  previews a renovation using that object's stable ID. Larger footprints must
  still pass placement validation. Confirming is the only step that spends.
- A completed goal selects the existing object. Repeatable fences and paths retain
  their existing Build more brush.

`camp-goals.js` is a read-only model. CampV2 commands remain the authority for
costs, collision, construction and purchases. A damaged camp save produces a
recovery link instead of breaking learning results.

## ×9 pilot: ten groups minus one whole group

1. Begin with ten visible racks of four lanterns. Move any whole rack into storage;
   all forty lanterns remain visible. Explain whether one lantern or one group moved.
2. Predict how many lanterns move when each rack holds seven. Move the rack, then
   work out 70 − 7. Incorrect ideas receive specific coaching; the answer stays
   hidden until the child solves it. There is no timer or loss penalty.
3. Explore amounts from 0 through 12. Move a rack out and back, observing ten groups
   become nine. Zero has empty racks, rather than disappearing group boundaries.
4. Try four independent, untimed problems with different amounts: 2, 3, 6 and 5.

The guided manipulation awards no independent mastery evidence or stars.
Tap, keyboard and native number entry are supported; dragging is not required.
Calm mode and system reduced motion remove the storage animation. A Map exit saves
the current step. The original painted courtyard remains available in a disclosure.

The pure model is `nine-lesson.js`; DOM rendering and focus are in
`nine-lesson-ui.js`. Lanterns use small inline SVGs, with existing realm backgrounds;
no new illustration downloads or graphics framework are needed.

## Compatibility and offline behavior

- No profile, camp, inventory, currency or star reset; no camp save schema change.
- Existing goal IDs stay valid; obsolete `woodland-gate` resolves to `gate`.
- The lesson's additive `journey.current.nine` state has its own version and input
  validation. Completed legacy ×9 manipulation resumes at exploration. An unfinished
  legacy step starts the new model without altering any earned progress.
- New family progress is additive `journey.current.strategy` state with its own
  version and family validation. Completed legacy comparisons resume in exploration;
  unfinished old manipulation begins the new guided lesson. Earned progress stays
  intact. Existing older `build`-stage saves retain their compatible legacy flow.
- All new modules and styles are in service-worker core cache v89. Update activation
  continues to use the existing explicit update action.

## Validation and the next decision

The automated suite covers conservation of quantities for 0–12, misconception
feedback, resume, independent-evidence isolation, all blueprint costs and locks,
projected grant delivery, stable-ID renovations, cancellation, corrupt camp recovery,
and forward restoration thresholds. Existing learning, save, camp, scene registration
and transition regressions remain in the full suite. Version 0.22 passes 2,254
checks, including 567 checks for the eleven new family models and their UI flows.

Browser checks for the new lessons used an isolated origin with simulated safe
areas: 390×844, 320×568, 844×390 and 1024×768. They exercised doubling, two docks,
column regrouping, incorrect ideas, exploration, exact undo, transfer, keyboard
input and calm mode. At 320px, boat targets were over 47px wide without horizontal
overflow. This is not physical iPhone Safari, VoiceOver or child-learning validation.

Before public rollout, observe children using these lessons without adult directions:
can they explain the change in whole groups, solve a fresh amount, and use the
strategy again on another day? Record where they seek help, rather than judging by
speed. If they merely follow buttons, refine the interaction and its questions.
