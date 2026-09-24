# Times Quest beta QA

Use this checklist before a beta branch is merged or deployed. Record the device, build shown in the Parents tab, result, and a screenshot or note for every failure.

## Automated gate

```powershell
pnpm install
pnpm test
```

The GitHub Actions workflow runs the same suite on every pull request and on pushes to `main` or `codex/**`.

## Device matrix

| Device | Orientation | Required checks | Result |
|---|---|---|---|
| iPhone Safari / installed PWA | Portrait | Profile, map alignment, realm progress, Learn, Practice, Trial lock, Boss, Field Guide, camp pan/build, relaunch | Pending |
| iPad Safari / installed PWA | Portrait + landscape | Same flows; no clipped sheets, keypad, or camp dock | Pending |
| Android Chrome / installed PWA | Portrait | Install, offline launch, same core flows | Pending |
| Desktop Chrome | Responsive 390×844 and 820×1180 | Console clean, keyboard input, focus and dialogs | Pending |

## Connected adventure regression (0.21.0-beta.1)

### The world around the map (0.29.0-beta.1)

On screens wider than the map (tablet landscape, laptops, classroom displays):
- **Day (before 5 pm):** "The Cartographer's Chart". Parchment with topographic
  contours, a compass rose with 13 rays (gold for each restored realm, a gem for
  three stars), a title panel naming the explorer and realms restored, sepia field
  sketches of befriended guardians ("?" for uncharted ones), handwritten strategy
  notes that ink in as realms are restored, and a wax seal when all 13 are done.
- **Dusk (5–9 pm) and night:** "The Sky of Twelve". Star field, Milky Way, moon,
  shooting stars, and 13 constellations shaped like each realm's groups (×7 = five
  and two, ×9 = ten with one taken away). Restored realms light up in gold; Fact
  Trail facts appear as small stars; all 13 restored adds an aurora. Dusk adds a
  mountain horizon with village lights.
- **On the map:** fog over realms not yet reached; a 13-dot Fact Trail arc around
  every open realm; a gold laurel and pennant for restored realms; a sparkle for
  three-star realms; a summit sunburst (and fireworks after the Summit); the map
  darkens and realms glow like lanterns at night.
- The moonlit camp setting also turns the map sky to night. Everything is
  decorative (hidden from screen readers) and still in Calm or reduced motion.
- Phones and narrow screens are unchanged: no backdrop is built when the side
  margin is under 56px.

### Willowbrook: quick wins, growing homes, living valley (0.28.0-beta.1)

**Quick wins**
- Tapping a tree or unopened land shows "Clear this tree?" / "Open this land?"
  with Not now. No review starts from a stray tap.
- Tapping during a long walk arrives at once; Journal destinations "hop" there.
- No grid coordinates anywhere; objects show a place name ("Cedar Rise").
- The ☾/☀ button in the camera column switches the moonlit sky.
- Undo goes back up to 12 building steps.

**A home worth growing**
- Cabin (canvas roof, pennant), Timber Lodge (two storeys, porch, chimney),
  Stone Cottage (stone base, timbered upper floor, bay window, walled garden)
  and Stone Keep (four cone-roofed towers, central tower with flag, arched gate)
  each have their own shape. Every tier keeps the doorstep and porch lantern.
- Lodge, cottage and keep carry a name sign with the child's name.
- Five colour swatches replace "Change colour".
- A home renovation blocked by decorations offers "Make room", which moves them
  to the Backpack (undoable). Homes are never moved automatically.
- Trees open a see-through window around the explorer or the selected building;
  jumping to a building zooms out to show all of it.
- The header shows your home and what the next renovation needs.

**A living valley**
- The sky follows the device clock (morning, day, dusk from 5 pm, night from 9 pm);
  moonlit is a manual override. Windows glow at dusk and night.
- Chimneys smoke; fireflies circle campfires after dark; fish leap in the river;
  realm pennants flutter. Calm mode turns all motion off.
- A guardian whose Fact Trail is complete visits the Story Stones (one per day).
- Each restored realm sends one keepsake to the Backpack (13 in all, free to
  place, never sold). A completed Fact Trail gives it gold trim.
- Check frame pacing (Parents → Device check) on an iPhone and a Chromebook with
  a furnished camp at night; the new effects add a few dozen small meshes.

### iPhone top-edge fix (0.27.2-beta.1)

- Top bars no longer shrink on long screens. Before, on an iPhone the extra
  status-bar padding let the bar squeeze and pushed its icons under the clock,
  battery and camera area (map, realm, Monsters, Training, Parents). The map's
  Realms / Revisit / Resume chips now start below the status bar too.
- Monsters: the grid fits the screen width (three columns on phones). A fourth
  column was previously clipped off the right edge.
- Check on a real iPhone, both in Safari and after Add to Home Screen, in
  portrait and landscape.

### Review follow-ups (0.27.1-beta.1)

- Guardian encounters: a correct answer makes the scene glow; a miss dims it
  briefly. No shake, lunge, or hit animation. Calm and reduced motion disable both.
- Zero Marsh: the child predicts before opening the baskets and before sending
  them away. Baskets and the send button wait for the prediction; any guess is
  welcomed and compared afterwards.
- ×1: choose the equation that matches the tray (1 × n), instead of pressing
  a "Deliver" button. After discovery, the choices hide their totals.
- "I have multiplied before" → **Show what I know · 3 realms in one check**:
  12 untimed items. 4 of 4 on your own in a realm earns its star 1 and opens it.
- Title screen: a one-time note for grown-ups when saves may be cleared (not
  installed, and the browser did not agree to keep them). Asking the browser to
  keep saves happens only when a profile is created, never on boot.
- Camp: a small "?" button opens camp help; My land and Home upgrades are in
  Build and Journal.
- The camp catalog lives entirely in `camp-content.js`.
- Explorer screen: "Show all 19 explorers" sits above the grid; the button bar
  sticks to the screen edge.
- Question screen on landscape phones (height ≤ 520px): the keypad sits beside
  the question. Measured GO visible at 320×568, 375×667 and 667×375.

### Devices, returns, lesson variety and camp depth (0.24–0.27, shipped as 0.27.0-beta.1)

- **0.24 devices:** follow [DEVICE-AND-PILOT-PLAN.md](DEVICE-AND-PILOT-PLAN.md).
  Parents → Device check for testing copies a report (screen, safe areas,
  install state, saves kept, WebGL 2, camp frame timing). On a slow device,
  Willowbrook offers low power once after about 3 seconds; "Not now" dismisses it.
- **0.25 returns:** on a later day with 3+ due facts, the map offers a 4-fact
  warm-up; after that, or on "Not today", it offers a Fact Trail for a realm
  restored on an earlier day. It never offers a trail on the day the realm was
  restored. Parents now needs a grown-up answer (a two-digit fact beyond ×12,
  asked once per session). Family chips show on their own, with help, and
  remembered later separately.
- **0.26 lessons:** phase 2 starts with a PLAN choice for the strategy group
  (doubling, five-anchored, ten-anchored, identity) before PREDICT. Wrong plans
  get coaching. After the own-amount build, ×3/4/6/7/8/11/12 offer an optional
  "another way". With a related lesson completed, "I used a strategy like this"
  jumps to planning.
- **0.27 camp:** at the river, choose fishing or river stones (from 3 realms;
  two facts, +4 stone; three trips per learning adventure). Learning adds 2 stone
  from 3 realms. A finished home triggers a moving-in moment. The camp edge shows
  a pennant for each restored realm. Camp project cards show "Today's idea".

### Every answer counts (0.23.0-beta.1)

- **Independent checks:** after any lesson, the four checks never use an amount the
  lesson displayed (4, the 6–8 prediction amount, or the child's own amount). One
  item is reversed (b × f). "Try again" always draws a new set. Zero Marsh,
  starting checks, guardian encounters and Fact Trail rounds are shuffled.
- **Lessons:** each phase needs a decision. Predictions ask for a partial or total
  that is not printed in the question. Phase 3 needs a chosen amount, a build and a
  typed total before "Try four new problems" appears. "I already know this
  strategy" skips to the check; fewer than 3 of 4 correct sends the child back.
- **Guardian:** no hearts or "boss" copy. A first-try miss adds one fresh fact (up
  to three). Five misses pause the round kindly; the first button retries with
  new facts.
- **Results:** exactly one gold button, one outlined alternative, one summary
  line, collapsed camp news, then "Finish for today". After star 2 the primary
  button continues to the next realm; the Fact Trail is the alternative.
- **Starting check:** 5 of 6 earns star 1 and leads to the guardian.
- **Small screens:** at 320×568, 375×667 and 667×375, prediction choices and the
  GO key are visible without scrolling, with the software keyboard hidden.
- **Camp:** the store no longer sells wood or stone. Gathering reviews are two
  facts, due facts first. The land key appears only while building.
- **Saves:** Parents shows whether the browser agreed to keep saves. Verify the
  warning appears in Safari when the game is not installed to the Home Screen.

### Family strategy expansion (0.22.0-beta.1)

- In each realm's Learn activity, complete discovery, explain the whole-group
  change, predict for seven items, manipulate, solve, then explore 0 and 12.
  Check that wrong ideas receive coaching without losing hearts or supplies.
- ×5: move arbitrary boats until the docks are equal. Return a boat, then Undo;
  the previous arrangement and all cargo must return exactly. Try 6/4 docks too.
- ×10: verify columns become the matching numbered/color bundles of ten without
  adding cells. Try twelve columns and zero columns. ×11 with twelve tiles should
  show 120 + 12 = 132, never a repeated-digit shortcut.
- Double/undo through ×4 and ×8; check whole trays/clusters remain equal. In ×7
  and ×12, verify both extra groups are full, not two single items.
- Save and leave in the middle of a prediction or boat experiment. Resume after
  relaunch and after switching back to the child profile. Complete a legacy
  comparison save and confirm it still opens exploration without losing stars.
- Use keyboard-only controls and Calm. On a small phone, scroll all content and
  ensure controls clear the status area and software keyboard. Physical Safari,
  VoiceOver, offline PWA relaunch and child observation are still release checks.

See [LEARNING-CONNECTIONS.md](LEARNING-CONNECTIONS.md) for behavior and save compatibility.

- Guardian: one prompt and one forward restoration bar; correct answers move it
  toward three restored stages. Equal groups expand without hiding the exit or
  making the keypad unreachable. Check ×0, ×4, ×9 and ×12, then ordinary practice
  and Siege to catch leaked layout or accessibility state.
- Camp goal: choose an unlocked home renovation, a locked Stone Keep, a stored kit,
  a path and a wall. Check exact missing supplies, earned kit delivery, and that
  Preview/Cancel never charge. Confirm once, then verify the saved object ID and
  wallet after reload. A locked goal should open a realm; missing supplies should
  show gathering actions.
- ×9 Learn: move a rack, answer “Just one lantern,” then explain a whole group.
  Predict one incorrectly, then seven; try 69 before 63. Verify coaching without
  hearts lost, explore 0 and 12, and put a rack back. Resume mid-lesson, then try the
  four independent questions. Guided activity must not award mastery evidence.
- Repeat with Calm on, keyboard navigation, and phone landscape. Check Map and
  all controls against status bar, home indicator and an open software keyboard.
- After accepting the update, relaunch offline and repeat these three flows.

Physical Safari/PWA, VoiceOver and child observation remain release checks.

## Safe-area navigation regression (0.20.4-beta.1)

The guardian stylesheet previously replaced the quiz header's safe-area padding
with 10px. Camp shortcuts used independent absolute top offsets, allowing Camp
help to cover the back button when the status-bar inset pushed the header down.
Camp now reserves separate grid rows for its header/shortcuts, world controls and
dock. Panels scroll inside the remaining world space. Short landscape screens
place panels alongside navigation. Quiz exits have a minimum 44×44 touch target.

Browser verification on an isolated profile origin used simulated 59px top and
34px bottom insets, and 59px side/21px bottom insets in landscape:

- 390×844, 320×568, 844×390 and 1024×768: all 13 camp navigation/camera/dock
  button centers passed hit testing; none were covered by other controls.
- Camp help and My land remained scrollable; the back button and dock stayed
  outside the panel. Back to Adventure returned to the map.
- Guardian exit was below the status bar and remained tappable after scrolling
  to the last keypad row. Leaving returned to the realm.
- Practice exit returned to the map on the tablet viewport.
- Full automated suite: 1,587 checks. Existing saves and camp controls preserved.

Before release, repeat on **physical iPhone Safari and installed PWA**: portrait,
landscape, after background/relaunch, and with larger text. Check map, lesson and
profile navigation too. Long rounds may scroll; the exit must stay visible. On
small phones, scroll Camp help to its final action and confirm Explore still
closes it. Confirm the build shown in Parents is 0.20.4-beta.1 or newer. Browser
inset simulation does not establish the actual inset values reported by iOS.

## Core journey

1. Create a normal child profile. Verify eight initial explorer choices, More explorers, selected-state announcement, and a reachable Begin quest action.
2. Choose Play, create a climber, then Show me how. Poof’s ×0 lesson starts at Zero Marsh. Inspect three empty baskets, send away three baskets of four, compare the arrangements, then solve three independent problems. Tap primary actions in the center before and after a toast.
3. Choose an experienced starting check on another profile. A pass opens that route without awarding a realm victory, creature collection, or retention mastery.
4. Before lesson/readiness/ten catches, confirm the Realm Challenge is locked. A completed lesson opens its six-question, five-independent-success requirement. The authored Zero Marsh opening instead earns the first challenge star through three independent discoveries. A locked boss must also reject keyboard Enter.
5. Miss a multiplication, division, and missing-factor question. Help must explain the actual unknown; supported answers must not raise independent accuracy or collection. Rescue questions are capped at two.
6. Complete the challenge for star one. Restore the encounter for star two; victory happens on the answer that empties threat strength. On the last lost heart, help must appear before the result.
7. Check build, split-choice, and missing-part tasks. Guardian is the ally; speed is never needed. Keypad and help must remain reachable in both orientations.
8. Results show independent successes separately from supported corrections and reviews. Visit Camp 2 and confirm pending earnings and the once-only Cozy Pup Tent kit from the opening victory. Use it to renovate the same tent for free. The later Double River kit also remains once-only. Revisit/reload: no duplicate grants.
9. Complete the full collection for star three. Choose an expedition-team creature; its card should be reachable during lessons and in the Camp 2 Journal.
10. Leave or reload a partially answered round and a lesson. Resume the next unanswered task; an interrupted correction returns to help and remains supported. Earned supplies remain saved.
11. Use Finish for today, return on another day, and find a short review. There must be no lost-streak or lost-reward message.
12. Change explorer identity, cancel with Escape, then create another climber. Neither action should overwrite the prior profile. Export/restore and switch profiles to verify isolated progress.
13. Inspect Parents: recent independent accuracy includes its denominator/time window, collection does not claim retention, and slower accurate answers are not classified as weak.
14. After a battle, navigate to map/results/camp: inactive battle controls must disappear from the accessibility tree. Check focus, text contrast, and the normal-flow phone battle layout.

## Protected family backup

1. Create two climbers with visibly different gems, realm progress, and camps.
2. In Parents, enter and confirm a 12+ character passphrase, then create a protected family backup.
3. Save the `.tqbackup` file through the iOS/iPadOS share sheet to Files or a family cloud drive; confirm no profile name is visible by opening the file as text.
4. Change both local profiles, enter the passphrase, restore the file, accept the replacement warning, and confirm both exact earlier saves return.
5. Repeat with the wrong passphrase and a non-backup JSON file; confirm neither changes any profile.
6. Cancel both the share sheet and the replacement warning; confirm the UI reports cancellation and no progress changes.
7. Forget the passphrase test: confirm the copy explains that Times Quest cannot recover it and never claims otherwise.

## Retention and accessibility pass

1. Learn at least four new facts, then confirm Parents → Retention across days shows the learned count and next review timing.
2. Return on a later calendar day and confirm Training recommends Daily Review with the due facts first.
3. Miss one due fact, finish its same-round retry, and confirm it is due again the next day rather than disappearing.
4. Turn on iOS/Android reduced motion and confirm camp motes, sprite motion, confetti, smooth panning, and battle flourishes hold still while every action remains usable.
5. Mute reward sounds, clicks, and camp ambience separately; background the app and confirm ambience stops.
6. Navigate the desktop build by keyboard, including switches, dialogs, camp tools, answer keys, and update action. Confirm focus is always visible.
7. At 200% browser zoom, confirm no primary control is clipped or hidden behind the camp sheet or bottom navigation.
8. On installed iPhone and iPad builds, confirm the camp scene reaches the physical bottom, the tool dock sits just above the safe area, and opening Build leaves no purple gap below it.

## Offline and update checks

1. Load the app online once, including Map, one Realm, Field Guide, and Camp.
2. Enable airplane mode and relaunch the installed app.
3. Confirm the map, visited realm art, keypad, lessons, and previously loaded camp work. Full optional artwork requires Parents → Download all adventure artwork before disconnecting; confirm progress, completion, and retry after interruption.
4. Reconnect, deploy a test build with a new service-worker cache number, and confirm the in-app “update ready” card appears.
5. Finish or leave the active round, tap **Update**, and confirm the new build loads once while profiles, progress, and camp placement remain intact.

## Five-session child observation log

Do not coach unless the child is stuck for more than 20 seconds. Capture what they expected to happen.

| Session | Could explain 1★ / 2★ / 3★? | Found next action unaided? | Understood monster status? | Biggest hesitation | Change requested |
|---|---|---|---|---|---|
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |
| 4 |  |  |  |  |  |
| 5 |  |  |  |  |  |

## Camp 2 comparison gate

Follow [CAMP-V2-PROTOTYPE.md](CAMP-V2-PROTOTYPE.md) for scope and learning changes.

- Compare Camp 1 and Camp 2 at 390×844, 430×932, 768×1024, 1024×768, and desktop.
- Load a prior schema-1 Camp 2 save. Its objects, upgrades, gems, and inventory
  should survive migration to the 3D woodland. Camp 1 must stay unchanged.
- Turn the camera through every angle, then pick, move, and rotate an object.
- Visit all three Journal destinations; cross water only on the bridge. Reload
  while outside the clearing and confirm the explorer and discoveries persist.
- Check gate opening, sitting, dog movement, bird visits, and calm mode.
- Visit Camp 2 online, then reload offline. Also test WebGL 2 unavailable: the
  saved camp must remain intact and Camp 1/Backpack must stay usable.
- Enter/exit Camp 2 ten times; inspect GPU memory/context count and frame pacing.
- Place, move, rotate the bench/fence, store, cancel, and undo an upgrade. Verify
  both placement and supplies restore. Put furniture on a deck.
- Gather wood, use the bench, complete a construction goal, and confirm neither
  revisiting nor rebuilding repeats a claimed goal reward.
- Switch between two profiles after editing each camp; no undo crosses profiles.
- Reload and export/restore both camps, including low power and reduced motion.
- Finish a learning round; Camp 2 gains its matching gems and wood piles replenish.
- Verify slow accurate answers can catch a creature; a miss never removes an
  earned creature or third star; same-day repetition cannot establish 14-day recall.
- Installed iOS/Android PWA offline, update, battery, and screen-reader checks
  remain required on physical devices before release.

## Release decision

- No progress loss, profile mixing, blank screens, blocked navigation, or broken offline launch.
- No critical layout clipping at 390×844 or 820×1180.
- A child can state how to earn the next star and start that activity without adult explanation.
- Automated tests are green and the service-worker cache name changed for any `public/` update.
# Camp expansion release checks (0.14)

## Additional 0.15 world and brush checks

- [ ] Place four connected fences by four ground taps without reopening Build.
- [ ] Tap an occupied/locked square; confirm no charge. Drag to pan; confirm no placement.
- [ ] Undo the last brush piece, exit with Done, and use Build more on an existing wall.
- [ ] Visit an open parcel from Journal; build there without the camera returning to the old plot.
- [ ] Verify Homestead Meadow is free, other parcels follow milestones, and Story Stones stay clear.
- [ ] Normal child: only defeated realm guardians appear; locked guardians cannot launch practice.
- [ ] Summit Tester: visit all thirteen guardian habitats and the correct family practice link.
- [ ] Inspect the village, gardens, river and grove in low power and gentle motion.
- [ ] Reload offline after downloading the new camp-world-details module.
- [ ] Profile dense brush-built camps and repeated scene edits on real iOS/school hardware.

- [ ] Compare Camp 1 and Camp 2 on the same child; verify independent wallets/layouts.
- [ ] Import schema-1 and schema-2 Camp 2 saves; verify owned upgrades and coordinates.
- [ ] Normal child: complete trials at any speed; confirm blueprint and parcel milestones.
- [ ] Summit Tester: verify wood, stone, fish, rod, land, inventory, and Journal refill.
- [ ] Place connected straight/corner/T/cross paths and mixed-tier walls; move/store one.
- [ ] Upgrade a shelter; watch the explorer assemble it; test Finish now and Undo.
- [ ] Travel across the bridge; buy wood/stone/rod; trade fish; reject unaffordable trades.
- [ ] Fish and clear a tree/parcel: miss a fact, count groups, retry, finish, reload.
- [ ] Leave a review midway, reload it, and finish without duplicate resource rewards.
- [ ] Build a moat; reject overlapping paths; cross via a drawbridge.
- [ ] Test 390 × 844, 820 × 1180, and desktop; real iOS keyboard and pinch gestures.
- [ ] Test gentle motion, low power, VoiceOver, WebGL loss, and no-WebGL controls.
- [ ] Visit camp online, go offline, reload, edit and complete a review, then reconnect.
- [ ] Stress 100/240 placed objects and long editing sessions on physical school hardware.
- [ ] Observe five child sessions before deciding final prices and fishing-trip limits.

## 0.16 world review checks

- [ ] Compare a pre-update Camp 2 backpack: object IDs, positions, upgrades and supplies must survive.
- [ ] Rotate through eight camera steps while visiting the store, grove and expanded camp: keep the same view center and inspect side/rear windows, roofs and gate hardware.
- [ ] Follow roads from the bridge to all ten front doors, including the mill; check continuous paving on sloped streets.
- [ ] Visit Guardian Grove through the woodland lantern trail. Check its fence blocks crossing, its arch stays open and all thirteen habitats are reachable.
- [ ] Open Westwood Reach, Cedar Rise and Fern Hollow through untimed reviews; clear trees, build at the parcel edges and reload.
- [ ] Verify forest and mountain boundaries when panning and rotating at the world edges.
- [ ] Test iPhone portrait, iPad landscape, low power, gentle motion, pinch, and tap placement. Measure real-device GPU time and a 20-minute battery session before broad release.

## Illustrated opening slice

Follow [OPENING-EXPEDITION.md](OPENING-EXPEDITION.md). Check the title at phone and tablet sizes, parent information, both zero arrangements, manipulation reload, supported failure, three-success fog encounter, in-place free renovation, undo/reload, and My land → Homestead Meadow. Existing camps must retain their prior furniture and balance. New camps use the modest starter. Repeat with calm mode, keyboard, and a device with WebGL unavailable.

### Guardian chapters and persistent land grid

- Exercise each family’s manipulation, save halfway, reload, and finish the comparison.
- Check half of ten at the harbor, ten minus one at the temple, and three doubles in the ice caves.
- Verify independent answers restore scene stages; help and retry remain available.
- With an ordinary profile, compare solid owned cells and dashed future cells while exploring. Summit Tester owns all parcels and therefore shows no future grid.
- Claim land through its review activity: dashed cells become solid without moving any buildings.
- Verify Story Stones have no interior grid, and trees still block placement within owned land.
- Check phone/tablet portrait and landscape, gentle motion, low power, and legacy camp recovery.

### 0.19 camp recovery and migration

- Force graphics context loss; verify persistent Fix camp, native restoration, and restart in low power.
- Confirm failed module loading and invalid saves offer recovery/backup access without resetting anything.
- Test returning legacy profiles: direct equivalents arrive once, the larger wallet is retained, and existing Willowbrook placements remain unchanged. Export/import and retry must not duplicate grants.
- All Camp links lead to Willowbrook; Parents retains the earlier collection archive.
- Test the originally affected hardware and capture Parents → Camp diagnostics if it fails again.
