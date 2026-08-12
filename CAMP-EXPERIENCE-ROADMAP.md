# Base Camp Experience Roadmap

## Product direction

Base Camp should feel like a place the child enters, not a card embedded in a
normal app page. The default Camp tab should therefore be the immersive view:
the illustrated world fills almost the entire phone or tablet, the camera opens
near the climber, and compact controls float over the artwork.

The useful lesson from Focus Friend is its hierarchy rather than a pixel-for-
pixel copy. The character's decorated world is the main surface. Currency and
navigation are small overlays, while decorating tools appear only when asked
for. Its current product also treats room customization, alternate rooms,
wall/floor changes, camera smoothness, and reliable touch targets as core parts
of the experience.

References:

- [Official Focus Friend App Store page](https://apps.apple.com/us/app/focus-friend-by-hank-green/id6742278016)
- [Focus Friend room-decoration screenshot](https://imag.malavida.com/mvimgbig/download-fs/focus-friend-40580-13.jpg)
- [Focus Friend empty-room placement screenshot](https://imag.malavida.com/mvimgbig/download-fs/focus-friend-40580-1.jpg)

## What is wrong with the current camp

At 390 x 844, the actual camp is a short 16:9 card. The title, purple page,
instructions, camp dock, and global navigation consume more space than the
world. That makes the clearing feel distant even though the scene is technically
panoramic.

The current code also has two separate concepts—an embedded camp and an optional
full-screen camp. The better model is one scene-first camp shell at every size.
The existing full-screen button should become unnecessary.

Finally, the 12-column placement plane spans the whole artwork. When the scene
is enlarged to several screen widths, those columns become too broad to create
a detailed camp. The panoramic camera and expanded build plane need to ship
together.

## Target experience

### Closed / explore state

- Fill `100dvh`, including the space currently occupied by the page header and
  normal navigation. Respect iPhone and iPad safe areas.
- Show the background edge-to-edge with no rounded scene card and no empty
  purple area below it.
- Scale the background by height. In portrait this naturally makes the 1180 x
  640 artwork about 2.3 tablet screens or 3.5 phone screens wide.
- Open centered on the climber. Remember the last horizontal camera position for
  each profile and each environment after that.
- Allow one-finger horizontal panning across the camp. Keep vertical movement
  locked, except for a small optional overscroll effect, so the interface never
  feels lost or floaty.
- Keep only a compact translucent top HUD: back to Adventure, `Base Camp`, gems,
  and a recenter-on-climber action.
- Put the camp actions in a safe-area-aware bottom dock over the scene.

Recommended bottom dock:

1. **Build** — shelter, fire, light, seating, kitchen, water, garden, storage,
   lookout, and banners.
2. **Paths** — paths, decks, and camp-life/activity objects.
3. **Treasures** — realm trophies and pets.
4. **Climber** — move the climber and choose a buddy.
5. **Scenery** — switch among Dusk, Morning, Autumn, and Moonlit.

Adventure is a small top-left back control rather than another large bottom tab.
This keeps the bottom dock focused on things the child can do in the camp.

### Open menu state

- A dock action raises a bottom sheet; it does not navigate away or shrink the
  scene.
- Use a 34–42% screen-height sheet on phones and a centered 360–440 px floating
  tray on tablets.
- Keep the upper part of the camp visible while browsing.
- Use horizontal category chips and a horizontal item shelf instead of one very
  tall catalogue. A secondary expanded view can show every item in a category.
- Show the true relative object scale in every item thumbnail.
- Close with a downward swipe, the close handle, tapping the scene, or selecting
  an item.

### Placement state

- Preserve the dependable child-friendly interaction: tap an item, then tap a
  valid ground location. Do not require precise drag-and-drop on mobile Safari.
- Show only nearby valid cells, not the entire grid.
- Display a translucent correctly-scaled preview before the final tap.
- Pan by swiping empty ground; add gentle edge auto-pan while an item is held.
- Keep `Put away`, rotate if eventually supported, and confirm/cancel controls in
  a compact bar immediately above the bottom dock.
- After placement, keep the camera where it is instead of snapping back to the
  middle.

## World and placement model

### Panoramic canvas

Use a height-driven canvas rather than `width:max(135%,520px)`:

```text
viewport: 100dvh x 100vw
scene height: 100dvh
scene width: scene height x 1.84375
minimum portrait width: 230vw on tablet, 320vw on phone
```

The four current backgrounds already share the same 1180 x 640 contract and can
support the first panoramic implementation. A later art pass can create true
ultrawide versions if landscape tablets need more horizontal territory.

### Expanded build plane

- Expand from 12 x 8 to 24 x 8 cells.
- Keep the same dramatic depth curve so distant rows remain compressed and
  foreground items become visibly larger.
- Preserve six rows of general-purpose space plus two wider foreground rows.
- Reserve rocky edge masks separately for each environment only if visual QA
  proves the common mask is insufficient.
- Store camera position independently from placed-item coordinates.

### Save migration

Existing camps must land in the middle third of the new world:

```text
newX = oldX + 6
newY = oldY
```

Run this once behind a new save-schema version. Resolve any old overlap with the
existing nearest-valid-spot routine, never delete an item, and keep the original
environment choice. The migration must also work for the secret Summit Tester
profile.

## Delivery phases

### Phase 1 — Scene-first shell

- Make Camp immersive by default on iPhone and iPad.
- Remove the full-screen toggle and the duplicate embedded mode.
- Replace the normal page header/navigation with the small camp HUD and floating
  five-action dock.
- Convert every current panel into a safe-area bottom sheet.
- Preserve all current camp data and the 12 x 8 grid in this phase.

This produces the largest immediate visual improvement with the least migration
risk.

### Phase 2 — Panoramic camera

- Make the scene height-driven and horizontally scrollable.
- Center on the climber on first entry and add a recenter control.
- Save camera position by profile and environment.
- Add subtle left/right discovery cues that disappear after the first pan.
- Keep the camera stable through panel opens, purchases, placement, and rerender.

### Phase 3 — Wider campsite

- Expand the placement plane to 24 x 8.
- Add the one-time coordinate migration.
- Re-tune blocked edge cells and footprint collision checks.
- Add preview ghosts, local valid-cell highlighting, and edge auto-pan.
- Recheck all 41 physical item sizes at rear, middle, and front depth.

### Phase 4 — Faster decorating

- Split the large Build sheet into category chips and a horizontal inventory
  shelf.
- Add `Owned`, `New`, and `Can afford` filters.
- Keep locked future upgrades visible as silhouettes with their star requirement.
- Add undo for the last move and a `Return to inventory` action for selected
  objects.
- Make environment selection its own one-tap Scenery sheet.

### Phase 5 — Atmosphere and polish

- Add environment-specific ambience: morning birds, autumn leaves, dusk
  fireflies, and restrained moonlit sparkles.
- Add a very slow parallax shift to distant mountains during horizontal pans.
- Give the climber and pets small idle motion without moving their ground anchor.
- Add optional reduced-motion handling for all ambience and camera animation.
- Consider true ultrawide background extensions only after the camera and layout
  are proven with the existing art.

## Acceptance criteria

### Layout

- On a 390 x 844 iPhone viewport, the unobstructed camp occupies at least 78% of
  the visible height with menus closed.
- On a 768 x 1024 iPad viewport, it occupies at least 82%.
- There is no purple dead zone below the scene and no separate full-screen mode.
- Every dock action is at least 44 x 44 CSS px and clears the bottom safe area.
- The closed dock and top HUD together obscure less than 18% of the scene.

### Camera and interaction

- A phone has at least 2.75 screen widths of useful horizontal travel; a portrait
  tablet has at least 1.75.
- The first entry centers the chosen climber within 100 ms after layout.
- Opening/closing sheets and placing/buying items changes camera position by less
  than 2 px.
- Panning empty ground never picks up an object accidentally.
- A child can place an item using two taps; no drag is required.
- Existing camps migrate without missing items, overlap, or changed upgrade
  ownership.

### Quality

- Test at 390 x 844, 430 x 932, 768 x 1024, and 1024 x 768.
- Maintain the existing migration, progression, offline, and camp-placement test
  coverage, then add camera-persistence and coordinate-migration cases.
- No horizontal scroll hitch during normal panning on current iPhone/iPad Safari.
- No browser console errors, clipped sheets, or controls under device safe areas.
- Reduced-motion mode disables parallax, auto-pan animation, and ambient motion.

## Recommended next build slice

Implement Phases 1 and 2 together, but leave the placement data at 12 x 8 for the
first review. That will let us judge the scene scale, camera range, dock, and
bottom-sheet feel on a real iPhone before introducing a save migration. Once the
shell feels right, Phase 3 can widen the camp safely and retune every placement
location against the approved camera.
