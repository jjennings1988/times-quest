"""Lock stationary camp-sprite geometry across three-frame PNG strips.

The generated animation frames intentionally change flames, water, cloth, or
character details, but some sheets also translated the whole object. These
per-frame offsets were measured against the part that touches the ground: the
stake, pole, stone ring, support posts, masonry, or climber boots.

Run from the repository root:
    python tools/lock_camp_animation_anchors.py

The operation is deterministic and keeps every existing canvas dimension.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]

# (dx, dy) moves each complete frame inside its existing transparent canvas.
OFFSETS: dict[str, tuple[tuple[int, int], tuple[int, int], tuple[int, int]]] = {
    "art/camp/camp-activity-kite-strip3.png": ((0, 0), (13, 0), (19, 0)),
    "art/camp/camp-banner-t1-strip3.png": ((0, 0), (10, 0), (17, 1)),
    "art/camp/camp-banner-t2-strip3.png": ((0, 0), (-3, 0), (1, 0)),
    "art/camp/camp-banner-t3-strip3.png": ((0, 0), (3, 0), (6, 0)),
    "art/camp/camp-fire-t2-strip3.png": ((0, 0), (0, 0), (0, 0)),
    "art/camp/camp-fire-t3-strip3.png": ((0, 0), (12, -2), (2, -1)),
    "art/camp/camp-fire-t4-strip3.png": ((0, 0), (0, 1), (3, 0)),
    "art/camp/camp-light-t3-strip3.png": ((0, 0), (3, 0), (4, 0)),
    "art/camp/camp-water-t3-strip3.png": ((0, 0), (0, 0), (0, 0)),
    "art/climber.png": ((0, 0), (-17, 0), (-23, 0)),
}


def shift(frame: Image.Image, dx: int, dy: int) -> Image.Image:
    output = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    output.alpha_composite(frame, (dx, dy))
    return output


def connected_components(alpha: Image.Image) -> list[list[tuple[int, int]]]:
    """Return 8-connected visible components for one small RGBA frame."""
    pixels = alpha.load()
    width, height = alpha.size
    seen: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []
    for y in range(height):
        for x in range(width):
            if pixels[x, y] == 0 or (x, y) in seen:
                continue
            pending = [(x, y)]
            seen.add((x, y))
            component: list[tuple[int, int]] = []
            while pending:
                px, py = pending.pop()
                component.append((px, py))
                for ny in range(max(0, py - 1), min(height, py + 2)):
                    for nx in range(max(0, px - 1), min(width, px + 2)):
                        if pixels[nx, ny] and (nx, ny) not in seen:
                            seen.add((nx, ny))
                            pending.append((nx, ny))
            components.append(component)
    return components


def remove_pennant_specks(frame: Image.Image) -> Image.Image:
    """Keep the main pennant component and remove disconnected generated dust."""
    components = connected_components(frame.getchannel("A"))
    if len(components) < 2:
        return frame
    keep = set(max(components, key=len))
    cleaned = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    source = frame.load()
    target = cleaned.load()
    for x, y in keep:
        target[x, y] = source[x, y]
    return cleaned


def lock_strip(relative_path: str, offsets: tuple[tuple[int, int], ...]) -> None:
    path = ROOT / "public" / relative_path
    source_path = ROOT / "art-raw" / "camp-animation-originals" / Path(relative_path).name
    if not source_path.exists():
        raise FileNotFoundError(f"missing immutable source strip: {source_path}")
    source = Image.open(source_path).convert("RGBA")
    if source.width % 3:
        raise ValueError(f"{relative_path} is not an equal three-frame strip")
    frame_width = source.width // 3
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    for index, (dx, dy) in enumerate(offsets):
        frame = source.crop((index * frame_width, 0, (index + 1) * frame_width, source.height))
        if relative_path.endswith("camp-banner-t1-strip3.png"):
            frame = remove_pennant_specks(frame)
        output.alpha_composite(shift(frame, dx, dy), (index * frame_width, 0))
    output.save(path, optimize=True)
    print(f"locked {relative_path}: {offsets}")


def main() -> None:
    for relative_path, offsets in OFFSETS.items():
        lock_strip(relative_path, offsets)


if __name__ == "__main__":
    main()
