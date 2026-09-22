# Connected learning and camp projects — 0.21.0-beta.1

This release implements three changes, in order: a simpler guardian encounter,
goals across the complete camp blueprint catalogue, and one interactive ×9 pilot.
Other families retain their existing guided lessons until this pilot is evaluated.

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
- All new modules and styles are in service-worker core cache v88. Update activation
  continues to use the existing explicit update action.

## Validation and the next decision

The automated suite covers conservation of quantities for 0–12, misconception
feedback, resume, independent-evidence isolation, all blueprint costs and locks,
projected grant delivery, stable-ID renovations, cancellation, corrupt camp recovery,
and forward restoration thresholds. Existing learning, save, camp, scene registration
and transition regressions remain in the full suite.

Browser checks used an isolated origin with simulated safe areas: 390×844, 320×568
and 1024×768. They exercised prediction, incorrect subtraction, exploration, undo,
transfer, project selection and cancellation. This is not physical iPhone Safari,
VoiceOver or child-learning validation.

Before extending this treatment, observe children using ×9 without adult directions:
can they explain why the subtraction is the size of a group, solve a fresh amount,
and use the strategy again on another day? Record where they seek help, rather than
judging by speed. If they merely follow highlighted buttons, improve the pilot before
producing the remaining family interactions.
