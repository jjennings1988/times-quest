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
4. Complete Learn and Practice; miss a fact and confirm it returns at the end after coaching.
5. Catch 10 monsters, pass the Trial, and confirm star one appears on both realm and map.
6. Defeat the guardian and confirm star two and the camp blueprint reveal.
7. Catch all 13 facts and confirm star three.
8. Open a caught Fact Monster, invite it to Base Camp, and verify it appears in the scene and Climber tray.
9. Export a backup and verify the Parents tab records the export time.
10. Close, relaunch, switch profiles, and confirm both children retain separate progress.

## Offline and update checks

1. Load the app online once, including Map, one Realm, Field Guide, and Camp.
2. Enable airplane mode and relaunch the installed app.
3. Confirm the map, 40 monster images, current realm, keypad, and camp render without broken art.
4. Reconnect, deploy a test build with a new service-worker cache number, and confirm reopening receives the new build while progress remains.

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
