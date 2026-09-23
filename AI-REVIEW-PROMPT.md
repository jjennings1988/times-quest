# Times Quest — independent product, learning and technical review

Copy the prompt below into an AI with access to the latest repository and, ideally, a browser that can run the app.

---

Act as an independent senior children’s game designer, elementary mathematics educator, mobile UX/accessibility specialist, art director, and web-game technical architect. Critically review the latest Times Quest implementation. Your job is to find the most valuable improvements, not to endorse previous decisions or propose a larger game by default.

This is a review and recommendation task. Do not implement changes, replace artwork, commit, push, deploy, reset saves, or alter real child profiles. Use isolated test profiles and preserve existing uncommitted work. Make reasonable assumptions, label them, and complete the review without waiting for answers to optional questions.

## 1. Product intent and non-negotiables

Times Quest: The Climb to Mount Twelve is a mobile-first multiplication adventure PWA, primarily for grades 2–5. It should be a game parents feel good about children playing: mathematically worthwhile, creative, welcoming, and worth returning to. Broader mathematics and world expansion are possible later, but multiplication must work exceptionally well first.

Priority devices are iPhone, iPad, and school hardware, including modest laptops/Chromebooks. Touch and keyboard users both matter. Local/offline play is central; do not assume cloud synchronization exists.

The intended loop is: discover a meaningful realm problem → understand a multiplication strategy → practice and demonstrate independent understanding → help a guardian and advance the adventure → use earned progress to develop a personal camp → return for useful review and new discoveries. Sessions should have satisfying stopping points.

Principles:

- Speed must never block adventure progress. Accuracy, reasoning, independent retrieval, and later retention matter more than fast answers.
- Guided manipulation is learning support, not proof of independent mastery. Separate supported answers, independent evidence, and durable retention.
- Avoid punishment for absence, compulsory streaks, excessive grinding, purchases as the main motivation, or needless currencies and menus.
- Preserve the large illustrated, vertically scrolling adventure map. It is a central visual strength.
- Begin a new adventure at ×0 Zero Marsh rather than automatically opening ×2. Offer sensible routes for experienced and returning learners.
- Children should see how learning changes their world. Camp progress should be useful and visibly personal without overwhelming younger players.
- Use Minecraft/Dojo Island as high-level inspiration for agency and inhabited places, Townscaper/Tiny Glade for responsive construction and detail, and Pilgrimage for woodland exploration and building activity. Do not copy their artwork, characters, branding, distinctive layouts, or trade dress.
- Willowbrook, originally called Camp 2, is now the single playable camp. Preserve legacy ownership/save compatibility, but do not propose restoring Camp 1 as the default graphics-error fallback. Favor recovery, low-power rendering, and accessible management controls.

## 2. Verify the iteration before judging it

Repository: `C:\Users\jjenn\GitHub\times-quest\times-quest`

Working branch: `codex/camp-progression-v1`

At handoff, `package.json` reports **0.22.0-beta.1**. Important implementation files are uncommitted, including new family-lesson modules. Inspect the working tree, not just the latest commit. These details may change; report what you actually reviewed.

Hosted URL: https://times-quest-game.netlify.app/

The hosted site has previously lagged behind local development. Verify its version and service-worker state before treating it as current. Prefer the current local working tree. If you only have website access, explicitly identify the version and limits of your review. Never claim to have inspected code, devices, or flows you could not access.

Read relevant documentation, then verify against code and runtime. Start with:

- `README.md`, `package.json`, `LEARNING-CONNECTIONS.md`, `BETA-QA.md`, `ROADMAP.md`
- Realm-star, realm-scene, camp-upgrade, camp-recovery, camp-experience, and art documentation where present
- `public/manifest.webmanifest`, `public/sw.js`, `netlify.toml`

Some roadmap/README descriptions are historical. Distinguish implemented behavior, documented intention, and unvalidated claims. Ignore unrelated research folders.

The local development server is `node tools/dev-server.js`; inspect its configuration for the port. The package defines `pnpm test`. Run appropriate existing checks if available, and report failures or environment limitations accurately.

## 3. Current experience and layout

The app broadly follows this structure; inspect actual screens rather than assuming every detail is correct:

1. Illustrated title/landing screen, local profile creation, and explorer/avatar selection.
2. First expedition in Zero Marsh with Poof, introducing empty groups and zero.
3. Illustrated adventure map with thirteen multiplication realms, ×0–×12. The current strategy-based realm order is `[0,1,10,2,5,11,3,4,9,6,12,8,7]`; starting at zero does not mean the entire route is numerically ordered.
4. Realm detail with guardian, painted environment, restoration objective, next action, and star progression.
5. Guided learning, practice, Realm Challenge, guardian restoration encounter, Fact Trail, and spaced review. Legacy code may still use “Mastery Trial” or “boss battle.”
6. Results connecting learning progress to a pinned camp project, another learning activity, a camp visit, or finishing for today.
7. Main navigation across Adventure, Training, Monsters, Camp, and Parents.

The intended three-star path is **Challenge → Guardian → Fact Trail**. Star two opens the next realm. Star three has an explicit thirteen-fact checklist and short untimed rounds, replacing the confusing instruction to “catch all 13 Fact Monsters.” Verify exact eligibility, evidence rules, remaining-fact feedback, and button destinations. Monster collection should enrich learning rather than obscure progression.

Guardians increasingly function as allies helped through restoration and welcomed into Guardian Grove. Examine whether narrative, hearts, failure states, and legacy battle language consistently support that direction.

Guardian scenes now have painted restoration states with registered transitions. The encounter uses one forward-filling restoration bar with three stages, one story prompt, optional visual support, and a scrollable task/keypad on short screens. Test whether the three encounter stages are confused with the three permanent realm stars.

Prior problems included iPhone status-bar overlap, inaccessible exits, crowded camp overlays, and vertically compressed tasks. Fixes exist, but actual Safari/PWA safe areas, landscape, keyboards, and scrolling still need scrutiny.

## 4. Latest learning work: evaluate it rigorously

Version 0.22 extends the interactive ×9 pilot across the remaining families while retaining the existing ×0 lesson. The new lessons generally use discovery with four items per group, prediction with seven, exploration from zero to twelve, then four fresh untimed independent questions. Guided actions themselves do not award mastery evidence, stars, gems, or resources.

Current models:

| Family | Strategy and interaction |
| --- | --- |
| ×0 | Inspect empty baskets and compare empty groups with no groups |
| ×1 | Deliver one seed tray; the amount stays the same |
| ×2 | Make a matching plank raft: double |
| ×3 | Double a vine bundle, then add one matching bundle |
| ×4 | Double stone trays twice |
| ×5 | Divide ten loaded boats between two docks; conserve the cargo |
| ×6 | Five cell racks plus one |
| ×7 | Five supply packs plus two |
| ×8 | Double crystal clusters three times |
| ×9 | Ten lantern racks minus one whole rack, retained in storage |
| ×10 | Regroup ten rows into bundles containing ten cells |
| ×11 | Ten tile bundles plus one |
| ×12 | Ten water trays plus two |

Models use countable SVG objects, targeted misconception feedback, exploration, and save/resume. The ×5 activity allows unbalanced docks and undo. ×10 conserves quantities during regrouping and uses numbered labels alongside color. ×11 must work beyond single-digit multipliers rather than teach an unreliable digit trick.

Do not assume interactivity produces learning. Ask:

- Does the child make mathematical decisions, or just press the indicated button?
- Are group count, group size, symbols, language, and quantities consistent?
- Do animations preserve quantities and reveal the intended relationship?
- Can children predict, explain, make mistakes, undo, and transfer the strategy?
- Do hints accidentally reveal answers or contaminate independent evidence?
- Do repeated four/seven examples and common lesson structure become predictable or tedious?
- Are reading demands, object density, working-memory demands, and explanations appropriate for grades 2–5?
- Are there respectful shortcuts for a child who already understands, without bypassing necessary evidence?
- Does the lesson feel like part of the realm rather than a worksheet overlay?
- Does later review establish retention, rather than simply immediate success?

These lessons are implemented, but their learning outcomes have not been validated through child studies. Automated checks and desktop viewport testing are not substitutes.

## 5. Camp strategy and current behavior

Willowbrook is a procedural 3D woodland with a camp clearing, forest, river/bridge, an explorable town and store, and a woodland route to a fenced Guardian Grove outside town. Trees/mountains contain the world visually. The selected explorer and pet inhabit it.

Camera controls include pan, rotation, zoom, and recentering. Building supports previews, footprints/collision, moving, eligible rotations, storage, undo, and construction activity. Paths and fences connect to neighbors, and repeated placement should remain active. Inspect all viewing angles, not just the default camera.

Progression should visibly evolve a primitive campsite into an individual home/fort: pup tent through larger tents, cabin, lodge, cottage, and keep; picket fencing through timber fortifications and stone walls, with late moat/drawbridge options. Verify actual catalog gates, costs, and compatibility rather than assuming every intended chain is complete.

Learning earns gems and useful supplies. Wood gathering, tree clearing, land activities, and fishing connect resources to short math review. Test whether this supports meaningful choices or becomes repeated quiz tolls. Clearing trees removes occupied space; it should not misleadingly imply that all gated future parcels are automatically unlocked. The faint current/future land grids should explain both available space and potential expansion.

Camp tools are Explore, Build, Backpack, and Journal, with contextual panels. The goal picker covers the complete catalog and distinguishes locked plans, missing supplies, stored kits, construction, ready projects, and completed objects. A pinned goal should lead to the correct learning, gathering, placement, or renovation action. Confirming a valid build spends resources; browsing a goal must not.

Evaluate creativity, inhabited behavior, construction satisfaction, resource balance, upgrades across all thirteen families, discoverability, and reasons to return. More objects or bigger land are not automatically the answer.

Test graphics recovery, low-power mode, reload, and management access without risking saves. Use Summit Tester for content coverage only: its generous resources and unlocks can hide serious beginner pacing/economy problems. Also test a genuinely fresh profile.

## 6. Technical context

This is a static HTML/CSS/vanilla-JavaScript app with substantial logic still in `public/index.html`, plus extracted systems. It has local saves and a service worker. Camp uses locally vendored Three.js 0.180.0, loaded separately from the learning experience.

Inspect relevant boundaries:

- Learning/progression: `learning-journey.js`, `journey-ui.js`, `opening.js`, `realm-trail.js`
- Lessons: `family-lessons.js`, `family-lesson-ui.js`, `family-lessons.css`, and the separate `nine-lesson*` modules
- Guardians/art: `guardian-chapters.js`, `guardian-ui.js`, `guardian-encounter.css`, `realm-scenes*`, `realm-scene-registration.js`, `scene-transitions*`
- Camp: `camp-v2.js`, `camp-v2-scene.js`, `camp-world-details.js`, `camp-content.js`, `camp-guide.js`, `camp-goals.js`, `camp-recovery.js`
- Tests under `test/`, asset loading, service-worker cache/version behavior, and save migrations

Favor small, justified improvements over framework replacement. Review save durability, profile isolation, migration, duplicate rewards, pending grants, authoritative placement/purchase validation, stale caches, offline updates, recovery, accessibility, and module ownership. Existing progress and stable object IDs must survive.

Measure performance where possible: initial and camp downloads, loading time, interaction response, frame pacing, texture/memory pressure, and long-session stability. Label proposed budgets separately from measurements. Do not equate a desktop resize with physical iPhone or low-end Chromebook performance.

## 7. Required review method

Trace complete journeys rather than collecting disconnected screenshots:

- New child: title → avatar → Zero Marsh → supported lesson → independent questions → guardian → next realm.
- Two-star learner: identify exactly how to earn star three, complete some facts, leave, and resume.
- Struggling learner: wrong answers, support, recovery, and successful progression without speed pressure.
- Experienced learner: appropriate entry and efficient progress without excessive forced instruction.
- Camp builder: choose a future goal → understand its requirements → earn supplies → build/upgrade → see what changed → choose a new goal.
- Returning learner: resume a lesson/project, understand review priorities, and finish comfortably.
- Parent: understand independent learning versus support, progress, settings, and save/backup limitations.

Use narrow/short phones, a modern phone, iPad portrait and landscape, and a keyboard-operated school-laptop viewport. Include reduced motion, zoom/larger text, keyboard focus, screen-reader semantics where available, interrupted sessions, and offline/recovery states. Preserve real user data. Record what you could not test.

For every finding, distinguish **observed behavior**, **code-supported inference**, and **hypothesis requiring child testing**. Include reproducible steps, screen/module and file/line references where practical. Never invent measurements or research evidence.

## 8. Deliverable

Return a concise but substantial review organized as follows:

1. **Executive assessment:** Does the current game deliver its promise? Name the three largest remaining obstacles.
2. **What is working:** Specific strengths to preserve and previous problems demonstrably resolved. Identify partial fixes separately.
3. **Journey review:** Opening/avatar, map, lesson, challenge, guardian, stars, results, collection, camp, return session, and parents. Identify confusing transitions and dead ends.
4. **Learning analysis:** Mathematical accuracy, conceptual value, independence, transfer, retention, misconceptions, age suitability, and lesson repetition.
5. **Visual and interaction critique:** Hierarchy, story/art integration, guardian transitions, touch targets, safe areas, scrolling, sound, motion, accessibility, and areas that still feel like a web form.
6. **Camp and reward analysis:** Agency, upgrade motivation, project clarity, resource balance, world interactions, and relationship to learning.
7. **Technical risks:** Evidence-based reliability, save, offline, performance, accessibility, and maintenance findings.
8. **Ranked top ten improvements:** For each give the user problem, evidence/confidence, proposed fix, expected benefit, engineering effort, art/content effort, risk, acceptance test, and whether essential, recommended, or optional. Separate bugs from design hypotheses.
9. **Next release plan:** Immediate fixes, the next coherent improvement package, and later ideas. Explicitly identify features to defer to avoid bloat. Show one concrete revised flow or screen layout for the highest-impact UX issue.
10. **Validation plan and owner decisions:** Practical child/parent playtests with observable success criteria, technical checks, and only decisions that materially affect direction.

Be candid and specific. Avoid generic advice such as “add more rewards,” “improve onboarding,” or “make it more immersive” without explaining exactly what changes and why. Challenge our assumptions when evidence warrants it. Do not recommend rebuilding working systems merely because another technology is fashionable.

End with **the three highest-value actions to take next and the exact smallest prototype or change that should be built first**, including how we would know it succeeded.
