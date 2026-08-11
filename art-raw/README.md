# art-raw

Drop raw ChatGPT sheets here. Nothing in this folder ships — it's the input side
of the pipeline. Save each generated sheet as PNG, then run:

```
python3 tools/cutsheet.py art-raw/<sheet>.png \
    --out public/art/realm \
    --names pet-0 pet-1 pet-10 pet-2 \
    --size 512
```

Add `--dry-run` first to see where it wants to cut without writing anything.
If the auto-split guesses wrong, pass `--splits x1 x2 x3` to place the cuts by hand.

## Naming for the realm sheets

Files are named by **family number**, not sheet order — that's what the game
looks up.

| Sheet | Characters                  | `--names`                  |
|-------|-----------------------------|----------------------------|
| 1     | Poof, Echo, Deca, Twix      | `pet-0 pet-1 pet-10 pet-2` |
| 2     | Slap, Copy, Trio, Boulder   | `pet-5 pet-11 pet-3 pet-4` |
| 3     | Sensei, Buzz, Tock, Glacier | `pet-9 pet-6 pet-12 pet-8` |
| 4     | Tempest (alone)             | `pet-7`                    |

`_synthetic-test.png` is a generated fixture used to validate the cutter. Safe
to delete.
