# Willowbrook recovery and single-camp transition — 0.19 beta

## What was found

The reported device failure has not been diagnosed to a specific trigger: its
device, browser, error output and saved profile were not supplied. The following
failure-path defects were confirmed in the implementation:

1. Missing command code and invalid camp saves offered Camp 1 as the escape route.
2. Failed scene downloads and renderer initialization shared a generic fallback.
   There was no restart or reload control within that fallback.
3. WebGL context loss only displayed a message. Although the renderer skipped
   drawing to a lost context, the controller continued running its frame loop and
   interactions. There was no persistent recovery control.
4. Frame and interaction exceptions had no boundary that could stop the failing
   graphics path and present recovery. Resize and thumbnail failures were also
   unhandled locally.
5. A scene download that never settled had no deadline. Construction exceptions
   could abandon a renderer before its normal disposal handle was returned.

Graphics pressure, tab backgrounding, driver resets, unavailable WebGL, missing
offline modules, and invalid saves are possible triggers; none is asserted to be
the cause of the user's original incident. Low power is a mitigation, not a
guarantee that every device supports WebGL 2. A browser/OS process kill or an
entirely blocked JavaScript main thread cannot be recovered by an in-page button.

## Implemented recovery

- Always-visible Camp help with Restart camp, Restart in low power, Reload app,
  Backpack controls and Adventure exit. A persistent Fix camp banner appears on
  failure. No action deletes progress or creates a replacement camp over bad data.
- Catch scene-load, initialization, resize, frame and interaction failures; pause
  the animation loop and preserve the save. Thumbnails fall back to HTML icons.
- Restart disposes the old session and creates a fresh canvas/context. Low power
  disables antialiasing at context creation, uses the existing reduced pixel ratio
  and disables shadows. Completed purchases/construction remain saved.
- Browser context restoration resumes drawing and clears the failure banner.
- A 15-second asynchronous load deadline; late resolutions cannot resurrect an
  abandoned/timed-out camp. Initialization failures release their renderer.
- Five local diagnostic records per profile: stage/code, short error text, time,
  build, quality, object count and online state where available. Parents exposes
  these records; nothing is uploaded. An invalid save exposes backup access and
  reload instead of claiming it can safely guess a repair.

Reload can resolve a failed browser module instance, but does not bypass offline
requirements. Missing files must be downloaded while connected. The service worker
uses cache v82 and retains the explicit between-rounds update flow.

## One playable camp

All ordinary Camp links, including old screen links and reward shortcuts, open
Willowbrook. The comparison switch and Camp 1 failure buttons are gone. The old
renderer/data contracts remain in source for compatibility regression coverage;
the old camp is no longer a gameplay destination.

On the first valid Willowbrook entry, a one-time archive records the earlier
collection, placed coordinates, background and wallet. Original profile fields
remain present in exports/imports. Parents shows the collection as a read-only
archive. Direct equivalents (shelters, fires, seating, lights, paths, trees, well,
flower beds and feeder) become Backpack inventory; no buildings are overwritten.
Unmapped decorations remain keepsakes rather than being discarded or represented
as an unrelated 3D item. Full new 3D models for those decorations remain future work.

For a profile with an earlier collection, wallet migration retains the larger
balance once rather than summing wallets that both received learning rewards.
That policy is explicit in the archive. Re-entry and export/import do not repeat
credits or grants. Legacy artwork is no longer eagerly downloaded; it loads on
demand when viewed. The title's camp background remains in the offline core.

## Verification and limits

- Automated recovery tests inject context loss/restoration, a frame exception,
  rejected downloads, constructor failure, a stalled download, and late completion.
- Migration tests cover item transfer, wallet maximum, existing placements,
  idempotence across reload and refusal to reset unsupported save versions.
- A disposable local browser fixture used the real WEBGL_lose_context extension:
  losing graphics exposed Fix camp; low-power restart rendered the same camp with
  the original 30 gems, 6 wood, tent and fire. A second loss followed by native
  context restoration also resumed the world. The injection fixture is removed
  from public files after QA.
- Existing learning, guardian, opening, camp-command and archived-renderer
  regression suites remain required. This is not physical iPhone/iPad/Chromebook
  certification. Test the affected machine with this build and capture Parents →
  Camp diagnostics if it fails again.

Local changes only; no deployment, commit or push was performed.
