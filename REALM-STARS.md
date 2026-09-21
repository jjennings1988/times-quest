# A clear three-star adventure

Implemented in 0.20.0-beta.1; additive save schema 8.

## What was confusing

The old third star required all 13 family facts to reach the hidden catch rating
of four. Ordinary practice selected weighted random questions and a mistake could
lower an uncaught fact's rating. The realm page showed a catch count, but offered
a boss rematch after star two rather than a direct route to finish star three.
Children could repeat activities without knowing which facts remained or how many
successes each needed.

## New child-facing rules

1. **Pass the Realm Challenge.** A guided lesson opens an untimed check: answer
   five of six questions independently. The first Zero Marsh expedition retains
   its gentler three-question introduction. Existing readiness and catch-based
   access routes remain compatible.
2. **Help your guardian.** Complete the realm encounter to restore the realm and
   open the next destination. The third star never blocks adventure progression.
3. **Complete the Fact Trail.** All thirteen facts, from ×0 through ×12, appear
   as checked or still to explore. Answer each remaining fact correctly once on
   your own in the dedicated trail. Each round contains at most five unfinished
   facts, with no warm-up detours, timer, lives, or perfect-round requirement.

Help and corrections remain available. A supported answer does not check that
fact; it appears again in a subsequent round. Previously checked facts never
become unchecked. Already caught monsters count as completed trail facts.
Monster collection and later-day retention evidence continue separately: a
three-star adventure is not a claim of durable mastery.

The realm recommendation, map labels, question counter, and results explain the
same rules. Guardian victory offers an explicit third-star button as well as
continuing the adventure. Completing the trail celebrates the third star.

## Saves and rewards

- `realms[family].trailFacts` stores validated unique integer factors 0–12.
- Old claimed stars remain permanent; previous catches and balances are retained.
- The old three-star-to-caught migration runs only for pre-v8 saves. New trail
  stars do not silently manufacture monster catches on the next load.
- Each successful trail answer and its resume checkpoint are saved. Help requests
  are also checkpointed so reloading a revealed answer cannot grant independent
  credit.
- The final answer claims the existing star reward immediately and includes it
  in the existing idempotent round grant. Leaving during feedback or reloading
  cannot pay it twice or lose its camp supplies.
- No gem reward values or camp unlock thresholds changed. The new small rules
  module is part of the offline app shell.

## Verification

`node test/realm-trail.js` covers all thirteen families, gated entry, the complete
challenge/guardian/trail sequence, targeting, assisted answers, errors, exact
remaining counts, saved help, reloads, final-answer exit, once-only rewards,
camp delivery, legacy ownership, and profile isolation. The existing regression
suite remains required.

Browser QA uses disposable local profiles, including completing a 9/13 trail
to 13/13 at a 390 × 844 phone viewport and inspecting the realm at a 1024 × 768
tablet viewport. Physical-device and child-observation testing remain
necessary: ask a child with two stars to explain what remains and begin it
without adult guidance. Success means they can identify the unchecked facts,
understand why a supported answer remains, and see their progress after return.
