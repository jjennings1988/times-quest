# Times Quest: learning and adventure experience review

September 10, 2026 · `codex/camp-progression-v1` · 0.16.0-beta.1

## Recommendation

Times Quest has the ingredients of an unusually appealing learning game: a distinctive illustrated world, collectible creatures, a personal camp, and an emerging spaced-review system. The camp now gives the child a place to care about. The rest of the app does not yet consistently deliver an adventure worthy of that place.

The central weakness is the experience between rewards. Most activities still ask the child to enter products into the same quiz interface. “Learn” does little direct teaching before testing. Battles change their scenery and animation more than their decisions. Several progress indicators describe different things using similar language. A child can enjoy the destination while experiencing the multiplication as an admission fee.

**Make understanding and using multiplication the adventure itself.** First repair the interaction and assessment inconsistencies. Then build one complete, short realm experience that connects a guided mathematical discovery, a meaningful encounter, a permanent reward in the preferred camp, and a later retrieval visit. Validate that experience before expanding all thirteen realms.

More graphics alone will not solve the main problems. Preserve the adventure-map artwork, the camp, the creature art, large answer controls, independent profiles, and permanent earned rewards. Improve teaching, pacing, interaction, and continuity around them.

## Scope and evidence

This was a review, not an implementation pass. Existing source changes and real player profiles were preserved. The only project file added by this pass is this report.

I inspected the actual UI, HTML/CSS/JavaScript, math visual renderer, profile/progression/review logic, camp reward integration, manifest, service worker, documentation, and test harness. Browser testing used a separate local origin and a disposable ordinary profile, **Review Explorer**, rather than Summit Tester. I reviewed phone-size UI at 390 × 844, tablet landscape at 1024 × 768, and desktop at 1440 × 900.

The journey included welcome, avatar creation, map, Learn, mistakes and retries, realm access, guardian defeat and victory, rewards, Training, collection cards, parent information, and a custom reverse-fact round. A locked-boss keyboard bypass was deliberately exercised to verify an access bug; the resulting victory is not evidence of normal first-session progression. Two isolated jsdom probes checked the repeat-review queue and parent “slow” classification.

Evidence labels below:

- **Observed:** reproduced in the browser.
- **Code:** supported by the implementation, without claiming a child experienced it.
- **Inference:** a likely product consequence requiring child testing.

This was not a study with children or a physical iPhone/iPad accessibility, battery, or installed-PWA test. Viewport checks do not establish Safari performance or touch reliability on actual hardware. Multi-day retention behavior was inspected in code, not validated through a longitudinal learning study. The full automated suite was not rerun for this review-only pass.

## 1. Fix these before broadening the experience

| Priority | Finding and evidence | Why it matters | Recommended correction and acceptance check |
|---|---|---|---|
| P0 | **Invisible toast intercepts the first Learn button. Observed.** Center taps did nothing at phone size. `elementFromPoint` returned the hidden `#toast`; tapping the uncovered button edge worked. The toast uses opacity without disabling pointer events. | A new child can conclude the game is broken before the first question. | Make passive and hidden overlays noninteractive. Test the center and edges of the primary action with pointer input, before/during/after a toast. |
| P1 | **A locked boss starts from the keyboard. Observed.** Pressing Enter on “Boss Battle — Pass the Trial first” opened the battle before the Trial. `.locked` uses pointer suppression; `startBoss` lacks an eligibility check. | Rules differ between input methods, particularly on school hardware. | Use semantic disabled state and a shared domain-level eligibility check. Pointer, keyboard, and direct command tests must agree. |
| P1 | **Guardian power reaches zero while questions remain. Observed.** After nine correct answers in a twelve-question battle, the display showed 0% power at question 10/12. | The apparent victory condition contradicts the actual one. Three subsequent misses could still lose. | Choose one rule. For example, nine independent successes win immediately; three misses trigger recovery. Derive display, victory, and round end from that same rule. |
| P1 | **The last lost heart skips teaching feedback. Observed/code.** The third miss went to defeat rather than a hint. The early return precedes `showHint`. | The child most in need of support gets less of it. | Give a brief worked recovery before the result or a specific “Let’s solve that one” action. No mandatory rematch. |
| P1 | **Missed-fact review can keep extending the round. Code + isolated probe.** A missed appended review can append another review. Three calls extended a 13-question queue to 16 and reached `reviewRound: 3`; no cap exists. | A struggling child gets a moving finish line. The UI explicitly says to get it right there to finish. | Bound normal and rescue questions separately. After at most two rescue opportunities, teach, save, and schedule later. Leaving must retain earned progress. |
| P1 | **Reverse-fact help does not explain the unknown. Observed.** For `3 × ? = 36`, the hint taught `12 × 3 = 36`, showed a twelve-row array, and emphasized 36 rather than explaining why the missing factor is 12. It also mixed a 10+2 explanation with a 5+7 visual split. | Correct arithmetic can still be instructionally misleading. | Represent the actual unknown and use one coherent strategy. Test multiplication, division, missing factor, zero, and both factor orders. |
| P1 | **“Accurate but slow” is not based on measured slowness. Code + isolated probe.** The parent list selects `rating === 3 && c > 0`. A fact with zero slow responses and a 700 ms best time was labeled slow. | Parents receive an unsupported assessment. | Separate current accuracy, retention, and optional response-time summaries; use the relevant evidence for each label. |
| P1 | **An advertised ×9 rule has a counterexample in the supported range. Code.** The guardian says the answer’s digits add to nine; `9 × 11 = 99` has digit sum 18. | The game teaches an unqualified rule that fails its own questions. | Teach ten groups minus one. Qualify any digit pattern precisely and review all mathematical copy with an elementary mathematics specialist. |

Further correctness issues should be included in that repair pass:

- Results label `qz.correct` as “first try,” although it includes correct answers to appended review questions. Separate independent first attempts from corrections and later same-session retrieval.
- Collection cards’ cumulative correct counter includes immediate correct retries after an answer was shown. That is useful participation data, but not independent retrieval accuracy.
- Parent heatmap gold says “mastered,” while permanent shiny ownership can come from repeated success within one day. Family “Strong” uses the permanent collection rating even after more recent difficulty.
- Accurate slow answers count toward adventure progress, which is good. However, they still accumulate `slow` and can enter the Weak Facts queue; the speed distinction remains entangled with need for instruction.
- Untimed custom questions still display “FAST STREAK · BONUS GEM,” and the answer handler still calculates speed bonuses. A calmer mode needs a coherent contract, not merely an invisible meter.
- “Heal up in the Training Hall” implies a health-restoration mechanic; battle hearts actually reset for the next attempt. Replace it with a precise learning invitation.

## 2. Opening and choosing an identity

### Current experience

The welcome explains Trial, guardian, thirteen monsters, ten required catches, thirty-nine stars, and a final Lodge before the child has done anything. These are rules without a meaningful reference point yet.

Avatar creation offers nineteen illustrated explorers. The range is a strength, but on the phone it becomes a long grid with the start action below it. Selection is styled visually rather than announced as selected. Labels such as “Choose explorer 7” provide little descriptive identity. Name entry receives immediate focus; the effect of the physical mobile keyboard still needs device testing.

### Better opening

Begin with a very short invitation: **“This is your expedition. Help the guardians, discover creatures, and build your camp.”** Let the child choose a climber and reach an interactive moment quickly. Explain each progression rule at the moment it matters.

Show six to eight initial explorer choices and a clear “More explorers” control. Preserve the full collection and existing selections. Put a larger selected-character preview and a persistent “Let’s go” action beside or below the visible choices. Add meaningful accessible descriptions and selected-state semantics. Allow later changes without payment or lost progress.

Ask about confidence through choices such as “Show me how” and “I’ve multiplied before,” not an age ranking. Offer a brief, untimed placement adventure that samples groups, an easy fact, a derived fact, and a transfer problem. Treat its result as a starting suggestion, not proof of mastery. An experienced fourth grader should not have to demonstrate dozens of zeros before finding an interesting challenge.

**Test:** can a grade 2 child begin without an adult explaining the screen? Can a grade 5 child find an appropriate starting challenge? Does each recognize their explorer after moving from selection to map, battle, and camp?

## 3. First-session pacing and realm progression

The current fixed route is ×0, ×1, ×10, ×2, ×5, ×11, ×3, ×4, ×9, ×6, ×12, ×8, ×7. A normal new profile starts at zero. Catching a fact generally needs four independent correct responses; ten caught facts open the Trial.

**A calculated example exposes the pacing problem:** under the default twelve-question setting, a perfect recommended path can involve Learn 13 + three Practice rounds of 12 + Trial 12 + Boss 12: approximately **73 correct responses with product zero before the next realm opens**. This is a code-derived example, not a measured average session. Choices, settings, and repetition patterns can change it. Nevertheless, the opening burden is disproportionate to the concept.

Use a short concrete groups tutorial, with zero and one introduced as useful discoveries rather than prolonged opening gates. Preserve the map and realm identities. Separate map position from prerequisite logic so the child can take a supported route without repainting the artwork.

Recommended progression:

- **Discover:** understand the family’s main relationship with a guided task.
- **Use it:** solve a short mixture of supported and independent problems.
- **Complete the encounter:** apply the relationship to the realm’s challenge and open the next route.
- **Return and remember:** retain the facts over later visits; complete optional collection goals.

Keep existing earned stars. If three stars remain, give them three stable meanings and show those meanings consistently. In the first transition, preserve Trial / guardian / collection for save compatibility, but rename “Mastery Trial” to “Realm Challenge.” Remove competing round-performance stars. Later, an owner-approved redesign could distinguish understanding, independence, and return recall; do not silently reclassify old achievements.

A realm’s adventure completion and evidence of durable mastery should be related but separate. Children should continue exploring while review gently strengthens earlier facts. Do not turn calendar time, speed, or perfect recall into mandatory waiting gates.

## 4. Make Learn a lesson, not a quiz with a hint

`startLearn` builds the thirteen ordered equations and starts the shared answer-entry interface. A strategy toast appears briefly. The first question is not preceded by a persistent worked example or an opportunity to manipulate groups. In the observed opening, the main experience was `0 × 0` and a keypad. After one mistake and leaving, the recommendation switched to Practice because any positive rating counts as “seen,” including the rating created by a first wrong answer.

The teaching cycle should be:

1. **See:** a guardian demonstrates one mathematical relationship in the world.
2. **Do together:** the child completes one small step with support.
3. **Try:** answer a related problem independently, with “Show me” always available.
4. **Transfer:** use the same idea in a different representation or context.
5. **Recall later:** revisit after a delay without the answer visible.

Use mathematics to operate the world: make two equal rows of bridge stones, pack five supplies per boat, partition a rectangular garden, or share a known total among equal groups. Tapping plus/minus or choosing a grouping must work as alternatives to dragging. Avoid putting decorative “math” on a resource action that is otherwise just another random quiz.

These instructional priorities align with the IES elementary mathematics practice guide’s emphasis on systematic instruction, clear language, representations, number lines, and word problems. That guide also includes timed activity as one fluency tool; it does not establish that this particular game design is effective. Keep optional speed practice separate from adventure access and evaluate learning directly. [IES / What Works Clearinghouse, 2021](https://ies.ed.gov/ncee/wwc/PracticeGuide/26)

### A reusable teaching language for all thirteen families

| Family | Core idea | A meaningful interaction |
|---|---|---|
| ×0 | Zero groups versus groups with nothing in them; both total zero | Empty baskets and absent baskets, with clear factor labels |
| ×1 | One group preserves the amount | Copy a single supply tray and match its total |
| ×2 | Two equal groups; doubling | Complete the matching half of a bridge |
| ×3 | Double plus one more equal group | Add a third vine of supplies to a matched pair |
| ×4 | Double, then double again | Grow a two-part layout into four equal sections |
| ×5 | Equal groups of five; five as half of ten | Pack harbor crates and compare five-group and ten-group totals |
| ×6 | Five groups plus one | Add the spare power cell to five working cells |
| ×7 | Five groups plus two | Split a storm shield into known sections and recombine |
| ×8 | Three doubles, or two groups of four | Expand an ice array without recounting every object |
| ×9 | Ten groups minus one | Remove one equal group from a ten-group formation |
| ×10 | Place value and ten equal groups | Exchange ten individual units for a bundle, with labels |
| ×11 | Ten groups plus one | Add a matching group beside ten tower sections |
| ×12 | Ten groups plus two | Build a dozen from ten and a double |

These are strategy candidates, not a mandate to teach one rigid method. Let a child use another correct method. Once the representation is understood, fade it so retrieval practice actually requires recall. Do not require counting every tile on every successful answer.

### Better correction

For `7 × 8 = 54`, a useful response is: “Let’s use five groups and two groups.” Show 40 + 16, linked to the same array, then ask the child to complete the final step. Follow with a different, related problem before revisiting the original later. Do not infer a specific misconception from one wrong number alone; confirm with a diagnostic choice if needed.

For `3 × ? = 36`, keep the total 36 visible and partition it into three equal groups. Explain that the unknown is the amount in each group. If using the commuted twelve-groups-of-three interpretation, explicitly connect the equivalent equations. Never assume a learner already understands that relationship.

The current twelve-row hint can push its continue action below the phone viewport. Use a compact model, reveal one instructional step at a time, and keep the next action accessible. Persistent help belongs near the question, not solely in a temporary toast or only after failure.

## 5. Guardians should create encounters with decisions

The illustrated battle scenes, realm colors, phase labels, and hit effects are worth keeping. The shared battle engine is a sensible technical foundation. However, the thirteen configuration entries mostly reskin the same correct/incorrect sequence. The child has little agency beyond giving the next answer. A named special move fires after fast answers but does not add a meaningful mathematical decision.

There is also a story ambiguity: Poof is introduced as the friendly realm guardian, the opponent is the Vanishing Fog, and progression says to defeat the guardian. Choose a consistent story. My recommendation: **guardians are allies; a realm threat disrupts their home; solving the encounter restores the realm and invites the ally to the camp’s grove.** This explains the existing friendly characters and makes victory about restoration.

Create three reusable encounter mechanics before attempting thirteen bespoke games:

- **Build or complete:** equal groups restore a crossing or structure.
- **Split and combine:** a large challenge becomes two known facts, visibly joined.
- **Find the missing part:** use a total and one known quantity to restore a broken pattern.

Each encounter can have a short demonstration, two independent turns, a twist using the same relationship, and a decisive finish. Keep attention on the current mathematical action. Animation should show why the action worked; the next input should not wait for a long cinematic.

Let the guardian offer a strategy support once the child asks, with no loss of collectibles. Accuracy and purposeful strategy use can charge a special ability; speed should be an optional flourish. A loss should produce a small, specific learning route and an immediate low-pressure alternative. Do not destroy camp buildings or reclaim earned creatures.

## 6. Navigation, map, and the feeling of a continuous game

The illustrated adventure map is the product’s strongest non-camp visual asset. Preserve it. It should be an explorable invitation, not mostly a wall of lock icons.

Keep one obvious “Continue adventure” action and give two subordinate choices: “Visit camp” and “Practice something.” For due review, offer a small invitation with a visible count and allow the child to choose adventure instead. The current next-action function always prioritizes any due fact; that is a recommendation rather than a hard gate, but it can still make returning feel like an overdue-work screen.

Provide a reliable “Find my explorer” control, maintain purposeful scroll position, and offer a compact accessible realm list. Map nodes are currently non-focusable divs with click handlers; keyboard users need real buttons with names, availability, and earned-star status. Check the current destination after resizing or orientation changes; the desktop resize in this review left the visible map on distant locked realms while the continue action referenced One Woods.

On larger screens, the map expands impressively but Training and other screens stay in a narrow, vertically stacked panel. Use the additional width for a guardian/model on one side and the current interaction on the other, not for displaying extra distractions. Phone should retain one primary task per view.

Training currently presents six workout types plus a family selector. Start with “Recommended,” “Choose a family,” and “More ways to practice.” Give Practice the same timing behavior wherever it appears. Replace “Weak Facts” in child-facing copy with “Tricky facts” or a specific invitation: “Let’s help these two creatures.”

Results should make the next event clear. Use a short order: what changed in the world, what the child learned, what they earned, then one primary next action. A good stopping option belongs here: “Your expedition is saved. Visit camp or finish for today.” “Map” and “Again” alone do not close an adventure or explain progress.

## 7. Creatures, motivation, and connection to the camp

The creature art and stable commutative identities are strong. There are 91 unique unordered facts including square facts; the Field Guide’s displayed total currently depends on unlocked families. The same creature can appear in more than one family section. Explain that mirror equations share a creature rather than allowing collection totals to feel inconsistent.

Use a child-facing relationship progression such as discovered → befriending → companion. Show one small next step. Keep long-term recall information separate from the permanence of friendship. A creature should never imply abandonment because its fact needs review. “Sleepy” is currently a rating category, not a clear delayed-retention state.

Let a child select a small expedition team and see those creatures react during lessons and return visits. Their roles can express mathematics: a doubling helper, a group counter, a pattern spotter. Begin with a few interactions using existing art; do not commission ninety-one animation sets at once.

The reward handoff needs particular attention now that Camp 2 is compelling:

- “Place it at camp,” new-blueprint links, favorite-monster residents, and the main Camp destination still use Camp 1 flows.
- Camp 2 maintains a separate experimental wallet. Learning awards are forwarded only when its save already exists; opening it after earlier rounds does not automatically transfer all prior earnings.
- These separations were sensible for a prototype, but they can make a child’s mental model of “my camp and my rewards” fail.

Remember the preferred camp and route rewards there with an item-specific preview. Use a stable reward ledger so a grant can be claimed once, retried safely, and translated to the relevant camp representation. Preserve both camp versions during comparison; do not merge balances by addition without an explicit accounting rule. Distinguish cosmetic collection unlocks from spendable resources.

Reward meaningful learning milestones and thoughtful participation with predictable progress toward chosen projects. Avoid making extra speed the main way to afford creativity. Let the child pin one goal—“Build the woodland gate”—and see exactly how an expedition helps. Mix a small session reward with larger realm rewards; do not celebrate every answer as though it were a major discovery.

The login streak and randomized returning chest are less distinctive than the world itself. Favor “three expeditions this week,” a guardian letter, a newly available story, or a child-chosen construction goal. Nothing should decay or be lost for taking days off. A successful session ends with satisfaction, not an obligation to keep a streak alive.

## 8. Parent confidence and trustworthy learning information

Independent profiles, local data, protected family backups, and the existing delayed-review safeguards are important strengths. In particular, retries and appended reviews are excluded from retention advancement, and same-day success cannot repeatedly extend the review interval. Build on that logic rather than replacing it with a simplistic star total.

The parent’s first view should answer four questions:

1. What is my child learning now?
2. What can they do independently, and what still needs support?
3. What did they remember after a meaningful gap?
4. What is one useful five-minute activity together?

Separate three dimensions in the data and language:

| Dimension | Meaning | Example |
|---|---|---|
| Earned collection | Permanent game accomplishment | “Bramble is your companion.” |
| Current independent performance | First attempts without displayed answers or immediate coaching | “Answered four of five recent doubling facts independently.” |
| Delayed retention | Recall after a recorded interval | “Remembered this fact after fourteen days.” |

Show denominators and dates when reporting percentages. The current seven-day history is capped at 240 events, so heavy use can truncate the period; label the sample honestly or aggregate daily totals separately. Avoid “learned” for a fact merely attempted once incorrectly. Avoid “mastered” for a permanent cosmetic milestone.

Keep optional response time subordinate and contextual. It is not a measure of intelligence or a sufficient diagnosis of difficulty. Distinguish careful accurate thinking from uncertain guessing through response evidence, not just a four-second cutoff.

Move custom quiz tools, preferences, and backups behind clear parent sections instead of one long mixed dashboard. Use neutral language—the current bonus-window copy says “he.” Offer a modest adult-area entry barrier for shared-device usability if desired; it is not a security boundary. Never put child accessibility settings behind a difficult arithmetic gate.

Before adding classroom accounts, validate local classroom workflows: switching children, resuming after interruption, keyboard controls, offline availability, and an adult choosing families. Cloud dashboards are optional later scope, not a prerequisite for a good school-device game.

## 9. Accessibility, visual polish, sound, and loading

The phone keypad and large primary controls are good foundations. Calm mode, separate sound preferences, system reduced-motion handling, and hidden-page ambience suspension are worth preserving.

Essential improvements:

- Every action must work with keyboard and visible focus, including map nodes, avatar selection, dialogs, and visual math controls.
- Announce the new problem and answer feedback clearly without reading the entire decorative scene or a long changing hint repeatedly. Provide explicit earned-star labels instead of relying on gray stars or color.
- Use at least 44 × 44 CSS-pixel primary touch targets as a product target; ensure small labels and body copy remain readable at enlarged text. Test 200% text sizing and safe-area/keyboard overlap.
- Give color-coded heatmap cells names and keyboard-accessible details or an equivalent fact list. Color and hover titles alone are insufficient.
- Let reduced-motion users see an immediate static state change that carries the same meaning as the animation. No math answer should depend on tracking moving sprites.
- Support tap alternatives to drag, accessible group increment/decrement, and a text description for every visual model.
- Validate installed landscape behavior on iPad and school devices; the manifest currently requests portrait. Browser responsiveness does not resolve installed orientation restrictions.

Polish the non-camp screens with consistent typography, iconography, guardian portraits, surfaces, and transitions. The contrast between a rich map/battle and a largely empty equation screen is abrupt. A small realm vignette and a meaningful interactive model can connect them without loading 3D into every question. Leave generous space where it helps concentration; fill space with purpose, not particles.

The current audio is largely synthesized feedback. Add a restrained, recognizable success motif, gentler correction feedback, and a few guardian voice lines or optional narration after core usability is sound. Keep music, effects, voice, and motion independently controllable. Provide text equivalents and offline availability for any essential instruction. Audio quality was inspected in code, not evaluated through a physical speaker/headphone session here.

Loading deserves measurement before adding more audiovisual content. The service-worker CORE list accounts for approximately **4.81 MiB of unique raw files**, including a 3.26 MiB map PNG and 1.06 MiB Camp 1 background. The optional list before its CORE exclusion references approximately 36.02 MiB of files. These are filesystem totals, **not measured cold-start transfer or download times**, and they overlap. The optional warmer batches requests but still aims to fetch the large library.

Preserve the map’s art while testing equivalent optimized encodings and responsive delivery. Prioritize shell, selected avatar, current map/realm, and the next lesson; make complete offline downloads understandable and optional. Do not make a child wait for unrelated camp or creature assets before learning.

Proposed non-camp acceptance targets, to be measured on representative hardware:

- Initial interactive choice within 3 seconds on a simulated 10 Mbps / 100 ms connection; useful shell/lesson before bulk optional art.
- Cached return to the current destination within 1 second; visible input acknowledgement within 100 ms.
- No persistent long tasks over 50 ms during answer entry; animations remain responsive with low-motion mode available.
- Core input, lesson, and correction flows work offline once their content is confirmed downloaded.
- No surprise app refresh in an active round, no lost earned progress after interruption, and a clear save/update status.

These are proposed engineering targets, not results achieved in this review.

## 10. Architecture changes that make the design achievable

The existing frontend can support this direction. A framework rewrite or conversion of all learning to 3D is not necessary. However, progression, assessment, presentation, persistence, and rewards are too tightly coupled in the large main HTML script.

Extract gradually behind the current UI:

1. **Learning evidence and scheduling:** independent attempts, support used, representation, response time, review interval, and delayed recall. Keep existing fact keys and preserve permanent ownership.
2. **Activity engine:** explicit states for demonstration, supported action, independent answer, correction, bounded review, completion, and leaving. Use one event path per answer.
3. **Eligibility and progression:** shared rules queried by every launcher and map button; do not use CSS as authorization for a game state transition.
4. **Lesson content:** validated data describing objectives, examples, representations, hints, and encounter variations. Keep mathematical rendering code separate from story text.
5. **Reward delivery:** stable grant IDs, source event, target camp, claim state, and safe replay. Keep experimental camp migration explicit.
6. **Navigation and UI:** focus handling, return destination, preferred camp, and resumable activity state. A page refresh should not turn “continue” into a different task without explanation.

A useful attempt record includes `factKey`, `operation`, `unknownPosition`, `activityId`, `firstAttemptCorrect`, `supportUsed`, `elapsedMs`, `occurredAt`, and `reviewDueAt`. Store bounded detail plus aggregate summaries; avoid indefinite raw event accumulation. Lesson examples can be authored and checked deterministically—there is no need for live AI-generated teaching content.

Migration must preserve profile IDs, caught/shiny creatures, conquered realms, stars, camp possessions, and existing saves. Where historic data cannot distinguish supported and independent answers, label it legacy evidence rather than inventing confidence. Back up and test migration with new, mid-game, completed, multi-profile, and experimental Camp 2 saves.

The existing jsdom harness explicitly does not test layout. Add a small browser suite that tests real pointer hit targets and keyboard behavior, then physical-device checks. Essential invariants include: locked means locked for every input path; zero opponent health agrees with victory; every incorrect answer has a learning route; rounds have a finite bound; assistance cannot masquerade as independent mastery; rewards are granted exactly once; slow accurate play can reach every adventure destination.

## 11. Ranked improvement portfolio

Effort is relative for the current small-team codebase: S = localized; M = a feature spanning several systems; L = substantial content and system work. These are scope estimates, not delivery promises.

| Rank | Initiative and necessity | Child/parent benefit | Engineering / art-content effort | Main risk | Validation |
|---|---|---|---|---|---|
| 1 | Repair tap, eligibility, battle, review-bound, and reporting defects — **essential** | The game behaves predictably and tells the truth | M / S | A local fix disagrees with another launch/result path | Browser regressions plus state invariants and save tests |
| 2 | Guided Learn with coherent, operation-aware help — **essential** | Children understand how to solve, not only which answer to type | L / M, with math review | Over-scaffolding prevents independent retrieval | New-problem transfer and delayed recall, not tutorial completion alone |
| 3 | Shorter onboarding and evidence-based starting route — **essential** | Faster first success; less repetition for older pupils | M / S | Placement overestimates readiness | Observe mixed-ability grade 2–5 children and retain easy route changes |
| 4 | Separate earned collection, current performance, and retention — **essential** | Credible motivation and parent information | M / S | Legacy data misclassified during migration | Hand-checked event examples, denominator tests, parent comprehension |
| 5 | Deliver learning rewards to the preferred camp — **essential** | Effort produces an immediately usable, personal result | M / S–M | Duplicate grants or currency inflation | Claim/reload/profile-switch tests with both camp versions |
| 6 | One genuinely interactive guardian encounter, then reusable variants — **recommended** | Mathematical decisions make the adventure memorable | L / M | More animation without more learning; content cost growth | Compare with the existing battle for understanding, delight, and friction |
| 7 | Simpler navigation, a clear result, and a satisfying stopping point — **essential** | Children know what happened and what to do next | M / S | Hiding useful choices | Unprompted navigation and return-session tasks |
| 8 | Keyboard, assistive technology, text sizing, touch, and calmer modes — **essential** | More children can participate comfortably | M / S | Custom visual controls exclude alternative input | Physical keyboard, VoiceOver/TalkBack, enlarged text, reduced motion |
| 9 | Creature companionship and guardian stories across days — **recommended** | Reasons to return beyond currency | M / M | Story becomes reading homework or streak pressure | Voluntary return interviews and content comprehension |
| 10 | Consistent non-camp art direction, sound, tablet layouts, and loading — **recommended** | The whole app feels like the same polished game | M / M | Bigger downloads and distractions | Cold/warm load, device responsiveness, listening and visual reviews |

Optional later work: broader mathematics topics, classroom cloud accounts, more elaborate cutscenes, and a larger avatar customization system. None should precede reliable teaching and the complete first-session experience.

## 12. Implementation sequence and the smallest useful prototype

### Phase A — correctness and a trustworthy baseline

Fix the P0/P1 findings. Write down the definitions of independent success, assisted correction, collection, retention, battle victory, and round completion. Add browser checks alongside the existing logic tests. Measure the current first session and interview a small set of children and parents before changing all progression rules.

### Phase B — one complete learning expedition

Build **“Twix’s Double River Bridge”**, using the existing illustrated map and realm art:

- A compact avatar introduction with the existing explorer options and a persistent start action.
- Twix explains one problem: two equal bridge sections need the same number of stones.
- One demonstration of `2 × 4`, one supported action completing a matching group, and three independent questions including a simple transfer task.
- An always-available help action using the same doubling model; at most two rescue tasks; no timer or speed-dependent access.
- A short River Serpent encounter with a visible, consistent completion rule and one missing-part variation. Twix is clearly the ally.
- A permanent, useful bridge-themed camp reward routed into the selected camp with a preview and a “Use it” action. Reuse an existing camp object if that avoids unnecessary asset scope.
- A result that states what changed, what was learned, and offers camp, another expedition, or finish for today.
- On a later day, a three-question recall visit using the same facts in changed presentation, recorded separately from immediate corrections.

This is a prototype of the complete loop, not a claim that five questions establish a whole family’s mastery. Keep it behind a reviewable entry point; do not reset existing accounts or reaward their completed milestones.

### Phase C — generalize the foundation

Extract the activity, evidence, progression, navigation, and reward modules around the successful slice. Migrate saves conservatively. Add two more encounter patterns and validated lesson templates. Adjust entry routes and reduce redundant gates while retaining earned progression.

### Phase D — expand content, then polish

Apply the validated pattern across all thirteen realms. Add companion callbacks and short return stories. Improve parent summaries, tablet layouts, sound, and offline asset delivery. Recheck physical devices and assistive technology before widening rollout.

### Prototype success criteria

Use a formative sample of roughly 8–12 children spanning grades 2–5 and different multiplication confidence, with parent permission. This is for finding design problems, not proving educational efficacy. Include slower accurate learners and children who use keyboard or accessibility support where feasible.

- At least 80% begin and complete the first supported activity without an adult explaining the controls.
- Most can explain what the two groups represent and solve a new doubling example after support is removed.
- Children can identify the ally, the opponent, the current objective, and why the encounter ended.
- Every participant can reach a camp reward without responding within a speed window.
- No participant encounters an endless rescue loop, lost progress, contradictory victory, or blocked primary action.
- At least 80% find and use the reward without prompting and can explain what they earned it for.
- Check next-day and later recall of practiced facts, and compare supported versus independent responses. For an existing-versus-new comparison, counterbalance order and use matched fact sets to limit practice effects.
- Parents can distinguish “earned,” “answered independently,” and “remembered later” from the revised summary.
- Measure enjoyment and confusion alongside learning. Do not optimize session length or daily logins at the expense of understanding and a comfortable stopping point.

If children enjoy the animations but cannot transfer the relationship, revise the lesson rather than adding more spectacle. If they understand the lesson but cannot navigate to its reward, revise the handoff. Expand only when both work.

## 13. Owner decisions worth making

These do not block the repair pass. Recommended defaults are included.

| Decision | Recommended default |
|---|---|
| Are guardians friends or enemies? | Friends whose realms are restored after a separate threat is overcome. |
| Is the app teaching multiplication from the beginning or mainly consolidating school learning? | Support both with different starting routes; do not claim complete curriculum coverage until validated. |
| Should the main route keep its current strict family order? | Preserve map art and identities, allow demonstrated readiness to shorten prerequisite practice. |
| What does “mastery” mean? | Reserve it for defined evidence including independent and delayed retrieval; keep collection permanent and separately named. |
| Which camp receives new rewards? | Remember the player’s chosen version, with Camp 2 favored in the new prototype and both saves preserved. |
| What is an ideal session? | One satisfying 5–8 minute expedition with permission to stop or continue; no forced timer. Validate with children. |
| How much voiced content is sustainable? | Start with replayable essential prompts and a few guardian lines, fully usable without audio. |
| How should grade 4–5 confidence be respected? | Optional short placement adventure and calm, age-inclusive language rather than mandatory easy-fact repetition. |

## Source anchors

Line numbers describe the reviewed working tree and may move after subsequent edits.

- [Toast styling and overlay behavior](C:/Users/jjenn/GitHub/times-quest/times-quest/public/index.html:855)
- [Profile creation and welcome](C:/Users/jjenn/GitHub/times-quest/times-quest/public/index.html:1087)
- [Guardian teaching descriptions](C:/Users/jjenn/GitHub/times-quest/times-quest/public/index.html:1166)
- [Collection ratings and spaced-retrieval evidence](C:/Users/jjenn/GitHub/times-quest/times-quest/public/index.html:1714)
- [Next-action recommendation](C:/Users/jjenn/GitHub/times-quest/times-quest/public/index.html:1994)
- [Question queue, answer processing, and help](C:/Users/jjenn/GitHub/times-quest/times-quest/public/index.html:2196)
- [Results and camp learning awards](C:/Users/jjenn/GitHub/times-quest/times-quest/public/index.html:2401)
- [Learn, Trial, and guardian configuration](C:/Users/jjenn/GitHub/times-quest/times-quest/public/index.html:2496)
- [Battle resolution and eligibility](C:/Users/jjenn/GitHub/times-quest/times-quest/public/index.html:2605)
- [Weak-fact recommendations](C:/Users/jjenn/GitHub/times-quest/times-quest/public/index.html:2734)
- [Parent reporting](C:/Users/jjenn/GitHub/times-quest/times-quest/public/index.html:2832)
- [Worked mathematical visual renderer](C:/Users/jjenn/GitHub/times-quest/times-quest/public/math-visuals.js:1)
- [Offline asset loading](C:/Users/jjenn/GitHub/times-quest/times-quest/public/sw.js:1)
- [Installed PWA configuration](C:/Users/jjenn/GitHub/times-quest/times-quest/public/manifest.webmanifest:1)
- [Existing logic-test scope](C:/Users/jjenn/GitHub/times-quest/times-quest/test/headless.js:1)

**Definitive recommendation:** repair the interaction and learning-evidence defects first, then build the single Double River expedition from introduction through next-day recall and camp reward. Make that journey excellent before expanding the rest of the world.
