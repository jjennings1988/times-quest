# Generating the art with ChatGPT — the working guide

`CAMP-ART.md` and `UI-ART.md` are the catalogues. This is how to actually sit down
and produce the files.

---

## Two facts that shape everything

**1. The ChatGPT app cannot output transparent PNGs.** GPT Image-2 rejects
transparent backgrounds outright; alpha is available through the API only. So every
sheet comes back with a background on it and gets cut out afterward. That's not a
failure mode to work around occasionally — it's the normal path, so the prompts all
specify a flat magenta background that keys out cleanly.

**2. The widest aspect ratio is 3:1.** ChatGPT Images 2.0 spans 3:1 to 1:3. My
first draft of these docs called for 7- and 8-panel sheets; those are impossible.
Both catalogues are now corrected to **three or four panels per sheet, maximum.**
That raises the character/UI work from 12 generations to about 22 — still not
much, but worth knowing before you start.

If you'd rather skip the cut-out step entirely, the API route (`gpt-image-1` with
`background: "transparent"`) returns real alpha. It costs per image and needs a key
and a few lines of script. For ~50 images the manual path is fine; if this grows,
say the word and I'll write the API script.

---

## Step 1 — Set up a Project, not a chat

### Create it

Sidebar → **Projects** → **New project**. Call it *Times Quest Art*.

### Add the instructions

Open the project, click the **⋯ menu at the top right → Project settings**, then
**Instructions** (some builds show an **Add instructions** button directly on the
project page instead — same field).

Paste the entire contents of **`chatgpt/project-instructions.txt`** from this repo.
It's already assembled — style bible, magenta background rule, palette, camera,
lighting and the text/numeral rule merged into one block. Nothing to stitch
together.

It runs about 3,000 characters. **Project instructions allow 8,000**, regardless
of plan, so there's comfortable headroom.

### Why the character rules are NOT in there

The project instructions govern *everything* the project generates, including
tents, lanterns and stone paths. "Roughly 1:5 head-to-body proportions" is
meaningless for a campfire and actively confusing for the model.

So the two addenda are separate files, pasted at the top of the relevant
conversation instead:

| File | Paste at the top of |
|---|---|
| `chatgpt/character-addendum.txt` | the realm-characters and monsters conversations |
| `chatgpt/boss-addendum.txt` | the bosses conversation (it stacks on the character one) |
| *(neither)* | the camp-objects conversation |

The project instructions already tell the model to expect them and apply them
on top when present.

### Optionally, add the catalogues as project files

Projects accept reference files — 5 on Free, 25 on Plus/Team, 40 on Pro. Adding
`CAMP-ART.md` and `UI-ART.md` lets you say *"generate monster sheet 4 from the
catalogue"* rather than pasting briefs each time.

**Rename them to `.txt` before uploading.** TXT, PDF and DOCX are reliably
supported; `.md` is not always accepted.

Honestly this is optional — pasting the four briefs directly is more reliable,
because the model follows text that's in the message better than text it has to
go looking for in an attached file.

### One conversation per set

Realm characters in one chat, monsters in another, camp in a third. Within a
conversation the model stays visually anchored on what it just made. Starting a
fresh chat for sheet 3 of the monsters is how you end up with two different art
styles in one Pokédex.

---

## Step 2 — Generate a style anchor first

Before any real asset, generate **one** image and iterate on it until it's exactly
right:

```
POOF (×0) — a tall, tattered spectre of pale mist and cream #FFF8EC, its
lower half fraying away into nothing. Straight through its chest is a clean
circular hole you can see clear through — a perfect void where a heart would
be. Narrow, sharp, cold-glowing eyes under a hooded brow. Ragged trailing
edges. Silent and unsettlingly calm.

Square, 1:1.
```

Poof is the right anchor precisely because he's the hardest: if the model can
make a ghost read as *cool* rather than *cute*, everything after it is easier.

Push on it until the texture, outline weight, eye style and light direction are
what you want. If it drifts cute, the three things to name explicitly are
**smaller narrower eyes**, **1:5 proportions, not chibi**, and **a closed mouth**.
Then say:

> **This is the reference. Every future image in this project must match this
> exact painting style, brush texture, outline weight, eye treatment and lighting.**

Keep that image. When a later sheet drifts — and one will — attach it and say
*"match this style exactly."* This single image is worth more than any amount of
prompt wording.

---

## Step 3 — Work sheet by sheet

For each sheet: paste the header from the catalogue, then the three or four briefs.
Nothing else. Don't add commentary or ask for options — it dilutes the instruction.

**Check each sheet against this before accepting it:**

- [ ] Exactly the right number of panels, evenly divided, no dividing lines
- [ ] Background is flat magenta, edge to edge, no gradient or vignette
- [ ] **No text, and no numerals except where the brief asks for one** (only Deca's
      chest plate and Tock's dial) — stray digits are the most common failure
- [ ] All subjects at consistent scale and the same camera angle
- [ ] Same light direction across every panel
- [ ] Nothing in the art is magenta or near-magenta
- [ ] **The number signature counts correctly** — five fingers, nine beads, six
      stripes, twelve tick marks. Count them every time.
- [ ] Proportions are heroic, not chibi — no oversized heads, no huge round eyes
- [ ] Expression is a smirk or a level stare, never a wide beaming grin

If one panel is wrong and the rest are good, don't regenerate the sheet — say
*"keep panels 1, 2 and 4 exactly as they are, redo panel 3 only: …"*. It usually
obliges, and you preserve the three that already matched.

**Turn on Thinking mode** for the character and boss sheets. It follows multi-part
instructions noticeably better, which matters when a prompt has four distinct
subjects with individual requirements.

---

## Step 4 — Cut, key and resize

Download the sheet as PNG. Then for each panel: crop it out, remove the magenta,
resize, name it.

Doing that by hand across ~50 sheets is miserable. **Offer stands: I'll build you a
single-page HTML tool that lives in the repo** — drag a sheet onto it, it splits
into N panels, chroma-keys the magenta with edge feathering, trims to content,
resizes to the target, and downloads correctly-named PNGs in one go. Runs entirely
in the browser, no install, no upload, no dependencies. It matches how the rest of
this project is built and it would turn an evening of fiddling into about a minute
per sheet.

If you'd rather do it manually: Photoshop, Affinity, Pixelmator and Photopea (free,
browser-based) all do select-by-colour → delete → trim → export.

### Naming — the one thing to be careful about

Monsters are the sharp edge. `monsterFor()` resolves to `MON_POOL[(lo*13+hi) % 40]`,
so **the file index is the creature's identity.** `mon-17.png` must be the shark,
because index 17 is where the shark is today. Get that wrong and every monster he
has already caught quietly becomes a different animal.

Everything else is keyed by name or family number and is much more forgiving.

---

## Step 5 — Drop them in and look at them on the iPad

Put files in `public/art/…`, bump `CACHE` in `sw.js`, deploy.

**Do this after the very first sheet, not after all fifty.** Painted art at 66px in
a circle is a different thing from painted art at 1024px on a laptop, and you want
to find that out four generations in rather than forty.

---

## The order I'd actually work in

| Session | What | Generations |
|---|---|---|
| 1 | Style anchor + realm sheet 1 | ~6 with iteration |
| — | *Ship it. Look at it on the iPad.* | |
| 2 | Realm sheets 2–4 | 3 |
| 3 | Camp backdrop + fire chain | 5 |
| 4 | Shelter chain (reference-chained, one at a time) | 5 |
| 5 | Climber strip + hats | 3 |
| 6+ | Monsters, ten sheets of four | 10 |
| | Bosses | 4 |
| | Remaining camp chains | ~15 |

Sessions 1 and 2 alone replace every emoji on the map screen — the first thing he
sees when he opens the app, and the cheapest possible test of whether this whole
direction is worth it.

---

## Before any of it lands

The art has nowhere to go until the code can show it. The smallest useful piece is
**the image layer with emoji fallback**: every glyph becomes a span with the emoji
as text and the PNG layered on top, so a missing or uncached file degrades to
exactly what's on screen today.

That one change makes the entire pipeline safe to ship one sheet at a time instead
of all-or-nothing. It's an afternoon. I'd build it before session 1, so the first
sheet has somewhere to land the moment it's cut.

---

**Sources for the two constraints above:**
[GPT Image 2 explained](https://www.mindstudio.ai/blog/what-is-gpt-image-2-openai) ·
[ChatGPT Images 2.0 transparent background guide](https://www.tenorshare.ai/chatgpt-tips/gpt-image-2-transparent-background.html) ·
[Which AI image generators support transparent PNGs](https://transparify.app/blog/ai-image-generators-transparent-background) ·
[OpenAI image API reference](https://developers.openai.com/api/reference/resources/images/methods/generate)
