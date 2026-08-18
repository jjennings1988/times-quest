"""Build transparent 256px Fact Monster assets from preserved masters.

New image-generation masters sometimes arrive on a nearly-white or baked
checkerboard backdrop even when transparency was requested. This tool removes
only neutral, bright pixels connected to the canvas edge, keeps interior light
details intact, centers the visible creature, and writes the app-sized PNG.

Run from the repository root:
    python tools/normalize_fact_monsters.py
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
MASTER_DIR = ROOT / "art-raw" / "mon"
OUTPUT_DIR = ROOT / "public" / "art" / "mon"
FIRST_NEW_MONSTER = 41
LAST_MONSTER = 78
OUTPUT_SIZE = 256
CONTENT_SIZE = 226


def is_backdrop(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, _alpha = pixel
    return min(red, green, blue) >= 218 and max(red, green, blue) - min(red, green, blue) <= 38


def extract_foreground(source: Image.Image) -> Image.Image:
    image = source.convert("RGBA")
    alpha = image.getchannel("A")
    if alpha.getextrema()[0] < 255:
        return image

    width, height = image.size
    pixels = image.load()
    backdrop = bytearray(width * height)
    pending: deque[tuple[int, int]] = deque()

    def add(x: int, y: int) -> None:
        offset = y * width + x
        if backdrop[offset] or not is_backdrop(pixels[x, y]):
            return
        backdrop[offset] = 1
        pending.append((x, y))

    for x in range(width):
        add(x, 0)
        add(x, height - 1)
    for y in range(height):
        add(0, y)
        add(width - 1, y)

    while pending:
        x, y = pending.popleft()
        if x:
            add(x - 1, y)
        if x + 1 < width:
            add(x + 1, y)
        if y:
            add(x, y - 1)
        if y + 1 < height:
            add(x, y + 1)

    mask = Image.new("L", image.size, 255)
    mask.putdata([0 if value else 255 for value in backdrop])
    # A light feather becomes a clean antialiased edge after the 5× downscale.
    mask = mask.filter(ImageFilter.GaussianBlur(0.7))
    image.putalpha(mask)
    return image


def fit_to_canvas(image: Image.Image) -> Image.Image:
    box = image.getchannel("A").getbbox()
    if not box:
        raise ValueError("foreground extraction produced an empty image")
    cropped = image.crop(box)
    scale = min(CONTENT_SIZE / cropped.width, CONTENT_SIZE / cropped.height)
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )
    output = Image.new("RGBA", (OUTPUT_SIZE, OUTPUT_SIZE), (0, 0, 0, 0))
    x = (OUTPUT_SIZE - resized.width) // 2
    y = (OUTPUT_SIZE - resized.height) // 2
    output.alpha_composite(resized, (x, y))
    return output


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for monster_id in range(FIRST_NEW_MONSTER, LAST_MONSTER + 1):
        source_path = MASTER_DIR / f"mon-{monster_id:02d}-master.png"
        output_path = OUTPUT_DIR / f"mon-{monster_id:02d}.png"
        if not source_path.exists():
            raise FileNotFoundError(f"missing Fact Monster master: {source_path}")
        with Image.open(source_path) as source:
            output = fit_to_canvas(extract_foreground(source))
        output.save(output_path, optimize=True)
        print(f"built {output_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
