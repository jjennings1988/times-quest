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

1. Create a normal child profile and verify it starts at ×0 with zero gems.
2. Open the current realm and confirm the three-step progress card explains each star.
3. Verify Mastery Trial is locked before 10 monsters are caught.
4. Complete Learn and Practice; miss a fact and confirm the hint includes words plus a visual equal-groups model, then confirm the fact returns at the end.
5. Catch 10 monsters, pass the Trial, and confirm star one appears on both realm and map.
6. Defeat the guardian and confirm star two and the camp blueprint reveal.
7. Catch all 13 facts and confirm star three.
8. Open a caught Fact Monster, invite it to Base Camp, and verify it appears in the scene and Climber tray.
9. Export a backup and verify the Parents tab records the export time.
10. Close, relaunch, switch profiles, and confirm both children retain separate progress.

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
3. Confirm the map, 40 monster images, current realm, keypad, and camp render without broken art.
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

## Release decision

- No progress loss, profile mixing, blank screens, blocked navigation, or broken offline launch.
- No critical layout clipping at 390×844 or 820×1180.
- A child can state how to earn the next star and start that activity without adult explanation.
- Automated tests are green and the service-worker cache name changed for any `public/` update.
