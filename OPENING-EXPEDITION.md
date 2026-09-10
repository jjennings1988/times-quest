# The first expedition — 0.18 beta

This is the integrated opening slice from FOLLOW-UP-EXPERIENCE-AUDIT.md. Changes
remain local until explicitly published. The illustrated map and both camps are
preserved; existing profiles retain their progress, inventory and currency.

## What to try

1. Open the title screen, choose Play, and create an ordinary explorer.
2. Choose Show me how. The normal route begins in Zero Marsh, not Double River.
3. Inspect Poof's three empty baskets. Every basket must be inspected before
   continuing. Then send away three baskets of four supplies, watching the total
   decrease. Compare three empty groups with zero nonempty groups.
4. Solve three new problems independently. Help is available, but a supported
   completion does not grant the challenge star. A repeat attempt is short.
5. Clear the marsh with three independent successes. Each lights one lantern and
   removes part of the fog. Victory immediately opens One Woods.
6. Choose Make my tent cozy. The kit renovates the existing tent without spending
   gems or wood; the explorer assembles it. Rest with buddy seats the explorer
   outside and brings the dog alongside.
7. Open My land, then Homestead Meadow. The free parcel is first in the list,
   and the explorer walks there. The parcel map distinguishes open, available,
   locked and protected land. Trees only need clearing where they obstruct a
   desired footprint; clearing them never unlocks locked land.
8. Open Upgrades to compare the home chain, footprints, availability, prices,
   and owned kits. Keep an existing style or preview the next renovation.

## Delivered

- Illustrated title screen using the existing camp landscape, a clear Play or
  personalized Continue action, and concise information for grown-ups.
- Illustrated guardian environments on lessons and realm pages, using existing
  realm artwork instead of the shared placeholder river and bridge. Repeated
  guardian artwork was removed from the realm introduction.
- Stateful, accessible Zero Marsh manipulations and a distinct short opening
  challenge. The other families keep their existing six-question challenges.
- A three-success Zero Marsh encounter, visible fog removal and lantern lighting,
  and a larger scene while keeping phone answer controls usable.
- A new Cozy Pup Tent between Pup Tent and Canvas Tent. The model adds a timber
  doorstep, rolled bedding, glowing lantern and details on multiple sides.
  Canvas tents also gain structural poles, seams and a small awning.
- An upgrade preview covering Pup, Cozy Pup, Canvas, Cabin, Lodge, Cottage and Keep.
  Renovation kits can fund an upgrade in place rather than requiring a duplicate
  building. Regular renovations still charge the displayed target price.
- A direct My land button, numbered parcel diagram, sorted availability list,
  and explicit guidance about trees and the protected Story Stones garden.
- Newly created ordinary profiles begin Camp 2 with 30 gems, six wood, a pup tent,
  fire and a small path/fence kit. Existing profiles retain the previous starter
  economy and every placed object. Summit Tester retains its testing resources.
- The small daily expedition accepts three correct answers so the first short
  adventure can satisfy it. It remains capped at one grant per day.

## Save and technical contracts

No reset or schema-wide rewrite. New profile behavior is opt-in through the
saved `journey.openingEdition` flag assigned during profile creation. Manipulation
state lives in the existing resumable lesson record. Basket inspection indices
and stage values are sanitized during migration.

`zeroUnderstood` records completion of the guided comparison, not assessed
mastery. `zeroChapter` selects the short first chapter. Passing its three
independent problems sets the existing realm `trial` milestone. Three independent
encounter successes set the existing conquered milestone; later collection
progress is unchanged. Existing opened routes are never revoked.

The first zero victory records a kit entitlement; `zeroKitDelivered` prevents
duplicate delivery. The kit is saved as one `trailtent` inventory item. Placement
and renovation share the existing atomic command, footprint and access checks.
Invalid previews spend nothing. Building identity is retained on renovation;
construction, inventory and balances survive reload. Existing undo behavior
restores the prior building and kit.

`opening.js` / `opening.css` implement the title and Zero Marsh slice.
`camp-guide.js` renders camp guidance separately from the renderer and commands.
The PWA core includes the new modules, stylesheet, and first realm's existing
background/guardian artwork. The title uses an already-cached camp background;
there is no new image library, CDN, video dependency or compulsory WebGL on entry.

## Verification

697 automated checks: 32 camp, 10 3D, 28 expansion, 360 headless, 237 learning
journey, and 30 new opening checks. The new checks cover the full zero journey,
support versus independent success, saved manipulation state, exact victory,
kit delivery/consumption, immutable camp commands, new-versus-existing starters,
land restrictions and returning identity.

Browser validation uses an isolated origin and disposable normal profile. The
phone journey covered title, identity, both zero arrangements, challenge,
encounter, camp construction, renovation, resting and land guidance. A horizontal
overflow in the comparison was found and corrected with stacked phone panels.
Tablet/desktop layouts, update/reload and console errors were also checked.

Physical Safari/PWA, screen-reader and child-observation checks are still required
before wider rollout. The implementation does not establish improved learning
outcomes. The larger audit's remaining work—bespoke interactions for the other
families, full parallel camp tracks and replacing the 240-object cap with tile
layers—is outside this first slice.
