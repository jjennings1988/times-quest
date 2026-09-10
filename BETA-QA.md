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

## Core journey

1. Create a normal child profile. Verify eight initial explorer choices, More explorers, selected-state announcement, and a reachable Begin quest action.
2. Choose Show me how. Twix’s ×2 lesson should show a model, ask for two equal groups, then offer four new problems without a timer. Tap primary actions in the center before and after a toast.
3. Choose an experienced starting check on another profile. A pass opens that route without awarding a realm victory, creature collection, or retention mastery.
4. Before lesson/readiness/ten catches, confirm the Realm Challenge is locked. A completed lesson opens its six-question, five-independent-success requirement. A locked boss must also reject keyboard Enter.
5. Miss a multiplication, division, and missing-factor question. Help must explain the actual unknown; supported answers must not raise independent accuracy or collection. Rescue questions are capped at two.
6. Complete the challenge for star one. Restore the encounter for star two; victory happens on the answer that empties threat strength. On the last lost heart, help must appear before the result.
7. Check build, split-choice, and missing-part tasks. Guardian is the ally; speed is never needed. Keypad and help must remain reachable in both orientations.
8. Results show independent successes separately from supported corrections and reviews. Visit Camp 2 and confirm pending earnings plus the once-only Double River path/deck/lantern kit. Revisit/reload: no duplicate grants.
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
