# Learning expedition implementation checklist

September 10, 2026 · 0.17.0-beta.1 · codex/camp-progression-v1

This implements the ten ranked initiatives in GAME-EXPERIENCE-REVIEW.md. The
implementation is ready for owner review; educational effectiveness and physical
device readiness still require the observation and device checks below. No
existing player data was reset, and neither camp nor the illustrated map was
replaced. Work is local and uncommitted.

## Completed, in review order

| # | Initiative | Implemented behavior | Verification |
|---|---|---|---|
| 1 | Correctness | Passive toasts cannot intercept taps; native and domain-level challenge/boss/summit locks; encounter victory on the exact successful answer; last-heart explanation; two-question rescue cap; accurate result labels. | Regression tests and phone encounter through victory, including support. |
| 2 | Teach before testing | Thirteen authored family ideas share demonstration, equal-group building, four new problems, and always-available help. Multiplication, division, and missing-factor help preserve the displayed unknown. Corrected zero, nine, ten, and eleven copy. | All 169 family explanations covered; guided Double River and missing-factor help exercised in browser. |
| 3 | Opening and starting route | Eight initial named explorers, full gallery on request, selected preview and accessible selected state, later identity editing. Confidence choices lead to the doubles lesson, a short starting check, or map exploration. Lesson/readiness/collection are alternative challenge prerequisites. | Fresh-profile, route and eligibility tests; phone welcome and avatar flow. |
| 4 | Honest learning evidence | Independent attempts, supported corrections, permanent collection, and spaced retention are separate. Parent summaries show evidence denominators and time windows; old saves do not acquire invented accuracy. Slow correct answers are not weaknesses. | Legacy migration, support, slowness, collection and reporting assertions. |
| 5 | Camp continuity | Camp navigation remembers the selected version. New profiles use Camp 2; legacy profiles retain Camp 1 until choosing otherwise. Pending learning grants survive the first camp visit and reload. Double River grants six paths, two decks and one lantern once; results show a selectable camp goal. | Before-first-visit, repeat-delivery and save/reload tests; browser reward handoff. |
| 6 | Guardian encounters | Build equal sections, choose a decomposition, and solve a missing quantity in a shared encounter framework. Guardian remains the helper; encounter strength and restored-section count use the same victory target. Three independent answers charge the flourish, without speed gating. | Pattern, exact victory and last-heart tests; phone encounter and operation-aware help. |
| 7 | Navigation and stopping | Keyboard map actions, realm chooser, recentering, optional short review, clear next action, simpler results, and Finish for today. Lessons and rounds checkpoint progress, including interrupted corrections. | Save/resume tests, browser reload/resume, onward route and inactive-screen checks. |
| 8 | Access and calmer play | Native controls, focus styles, named heatmap cells, explicit heart counts, modal keyboard guards, readable help, normal-flow phone encounters, landscape support. Ordinary adventure is untimed; optional speed modes stay separate. | Logic and DOM checks; phone, tablet-landscape and desktop viewport inspection. Physical assistive-technology testing remains open. |
| 9 | Companionship and return | Expedition-team creatures appear as accessible lesson/Journal callbacks; selected explorer identity carries into the camp header. Short guardian return letters and recall visits; weekly learning visits replace a prominent streak; earned rewards are not lost after absence. | Collection/companion checks, per-profile journey state and review logic tests. |
| 10 | Presentation and loading | Shared learning surfaces, compact explorer selection, improved tablet layouts, softer mistake sound, grouped parent tools. Current-realm art warms selectively; full optional-art download is explicit, with progress/retry. Updates defer during an active round. | Offline/update asset checks, clean browser error log and responsive inspection. |

## Learning and progression contracts

- A correct answer after seeing help is supported practice. It does not earn
  independent accuracy, collection advancement, or spaced-retrieval evidence.
- An independent correct answer progresses at any speed. Only explicitly timed
  activities offer speed bonuses.
- A guided lesson teaches one family relationship and checks four new problems.
  Completing it opens the challenge; it does not establish long-term mastery.
- A Realm Challenge uses six problems and needs five independent successes.
  The existing saved `trial` field remains compatible with camp unlocks and saves.
- Three permanent realm stars remain challenge, encounter victory, and full
  family collection. Round performance does not display another competing star scale.
- Review tails cannot extend themselves. Help is shown before a last-heart result.
- Currency grants use per-round identifiers and positive deltas. Reload, quit,
  resume, repeated lesson completion, and first camp entry cannot replay a grant.
- A nested version-one journey record is added to the existing version-seven
  player save. Existing inventory, progression, profiles and camps are preserved;
  no historical balance is copied into Camp 2 as a windfall.

## Architecture delivered

`public/learning-journey.js` holds authored family ideas, evidence operations,
journey migration, resume validation and reward-ledger rules without DOM effects.
`public/journey-ui.js` connects lessons, entry routes, encounter tasks, results,
camp grants, companions and resumable play to the existing application.
`public/journey.css` styles those surfaces. `public/math-visuals.js` renders the
operation-aware explanations. The app remains a static, locally cached PWA.

This is an incremental extraction, not a complete rewrite of the large existing
index file. The three encounter patterns and thirteen lessons share components;
they are not thirteen bespoke minigames or thirteen newly illustrated scenes.
Broader mathematics, cloud classroom accounts, narrated cutscenes, and expanded
avatar customization remain optional later work from the review.

## Verification recorded

The complete package test sequence passed: Camp 2 **32**, 3D **10**, expansion
**28**, headless **360**, and learning journey **237**: **667 checks, zero failures**.
The journey suite also loads the new stylesheet so an inactive battle cannot be
made visible by a later CSS rule. It covers end-to-end lessons, challenges,
encounters, support, legacy saves, grant delivery and interruption recovery.

Browser testing used a disposable normal profile at a separate local origin,
not Summit Tester or real child saves. Checks covered 390×844 phone, 1024×768
tablet landscape, and 1440×900 desktop viewports. The complete doubles route
reached victory with nine independent successes and one supported answer, then
opened Camp 2 with the supplies. Browser inspection exposed and corrected both
the toast interception and the old battle-positioning conflict. The browser
error log was empty during the checked flow.

## Required before wider rollout

These are validation tasks, not claims of completed testing:

1. Observe mixed-ability grade 2–5 children using the first session without
   coaching. Check explanation of equal groups, new-problem transfer, next-action
   discovery, and whether they voluntarily use the camp reward.
2. Repeat short retrieval visits after several days. Tutorial completion and
   same-day success do not establish retention or improved learning outcomes.
3. Have an elementary mathematics specialist review the family models, wording,
   and decomposition choices. Automated arithmetic coverage cannot validate pedagogy.
4. Run BETA-QA.md on physical iPhone/iPad Safari and installed PWAs, plus typical
   school hardware. Include virtual keyboards, touch, safe areas, 200% zoom,
   VoiceOver/TalkBack, reduced motion, offline relaunch and update recovery.
5. Measure cold/warm load, memory and battery on actual devices. Responsive
   Chromium checks are not Safari performance evidence.

For owner review, create a normal climber and choose **Show me how**. Existing
climbers can use **Realms → Double River → Learn** without resetting anything.
