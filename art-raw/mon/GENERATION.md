# Fact Monster generation record

The August 18, 2026 expansion used the built-in image-generation workflow with
the original 40-monster contact sheet as a style reference. Each output was
generated separately as a square, full-body collectible character and preserved
as `mon-41-master.png` through `mon-78-master.png`.

Shared prompt direction:

> Create one completely new Times Quest Fact Monster in the established richly
> rendered, painterly fantasy-game style: friendly children's collectible,
> tactile materials, explorer details, warm rim light, complete centered
> silhouette, and readable at 256px. Use genuine transparency when supported,
> otherwise a clean extraction background. One creature only; no text, numbers,
> card, frame, floor, scenery, watermark, or copied reference character.

Unique subject prompts, in canonical art order:

| PNG | Name | Subject direction |
|---|---|---|
| 41 | Clockwork Mantis | Emerald mantis with brass clockwork forearms and explorer harness |
| 42 | Lantern Axolotl | Turquoise axolotl with glowing coral gills and lantern pack |
| 43 | Quartz Mole | Charcoal miner mole with violet quartz backpack and goggles |
| 44 | Mossy Ram | Mountain ram with bark-textured horns and mossy wool |
| 45 | Comet Ferret | Midnight ferret with a silver comet tail and star-flecked fur |
| 46 | Coral Seahorse | Coral seahorse knight with turquoise crest and pearl armor |
| 47 | Thunder Yak | Shaggy slate yak with lightning-shaped golden horns |
| 48 | Copper Armadillo | Copper-plated armadillo tinkerer with articulated shell |
| 49 | Night Bat | Indigo bat scout with moonstone goggles and folded wings |
| 50 | Glacier Seal | Silvery-blue seal explorer with ice whiskers and snow gear |
| 51 | Ember Salamander | Black-and-orange salamander with glowing ember spots |
| 52 | Maple Moose | Russet moose ranger with maple-branch antlers |
| 53 | Prism Chameleon | Jewel-toned chameleon with faceted scales and crystal lens |
| 54 | Storm Crane | Silver crane with cobalt feathers and storm capelet |
| 55 | Gear Golem | Rounded slate-and-brass golem with a glowing gear core |
| 56 | Moon Moth | Pale-lilac luna moth with crescent wings and moon charms |
| 57 | Tide Walrus | Cinnamon walrus navigator with maps and compass harness |
| 58 | Canyon Coyote | Sandy trail-runner coyote with climbing ropes |
| 59 | Crystal Beetle | Sapphire stag beetle with translucent crystal mandibles |
| 60 | Lava Toad | Charcoal toad with magma cracks and obsidian armor |
| 61 | Aurora Lynx | Midnight lynx with teal-violet aurora markings |
| 62 | Bramble Pangolin | Forest pangolin with leaf-shaped bronze scales |
| 63 | Sky Bison | Cloud-maned flying bison calf with aviator harness |
| 64 | Reef Manta | Turquoise manta with coral markings and compass harness |
| 65 | Lantern Jellyfish | Golden glowing jellyfish with ribbonlike teal tentacles |
| 66 | Obsidian Gorilla | Gentle gorilla with volcanic-glass forearms |
| 67 | Mist Heron | Blue-gray heron alchemist with mist-edged wings |
| 68 | Grove Stag | Chestnut stag ranger with leafy branching antlers |
| 69 | Canyon Meerkat | Golden lookout meerkat with amber goggles |
| 70 | Frost Hare | Athletic arctic hare with icy tips and quilted trail gear |
| 71 | Clockwork Spider | Brass-and-blue mechanical spider with teal core |
| 72 | Sun Gryphon | Young golden gryphon with sunlit wings |
| 73 | Mist Raven | Black raven scout with smoky silver feather edges |
| 74 | Crystal Minotaur | Teal-gray minotaur with translucent quartz horns |
| 75 | Dune Scarab | Lapis-and-gold desert scarab adventurer |
| 76 | River Beaver | Chestnut beaver engineer with tool belt and bridge plans |
| 77 | Thunder Goat | Charcoal mountain goat with electric-blue horns |
| 78 | Starfish Sentinel | Upright coral-orange starfish guardian with pearl armor |

`tools/normalize_fact_monsters.py` removes only a neutral bright backdrop that is
connected to the master canvas edge, centers the subject, and produces the final
transparent 256×256 PNGs. It is deterministic and leaves the masters untouched.
