"""Normalize a keyed camp sprite or three-frame sheet to its locked canvas.

The chroma-key helper runs first. This script then crops only transparent
padding, preserves aspect ratio, applies one shared scale across animation
frames, and anchors every frame consistently near the bottom of its cell.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def alpha_crop(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("sprite has no visible pixels")
    return image.crop(bbox)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--width", type=int, required=True)
    parser.add_argument("--height", type=int, required=True)
    parser.add_argument("--frames", type=int, default=1)
    parser.add_argument("--padding", type=float, default=0.08)
    parser.add_argument("--segment-inset", type=float, default=0.0)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    if args.frames < 1:
        raise ValueError("frame count must be positive")
    if args.width % args.frames:
        raise ValueError("output width must divide evenly into the frame count")

    output_frame_width = args.width // args.frames
    crops = []
    for i in range(args.frames):
        left = round(i * source.width / args.frames)
        right = round((i + 1) * source.width / args.frames)
        inset = round((right - left) * args.segment_inset)
        crops.append(alpha_crop(source.crop((left + inset, 0, right - inset, source.height))))

    usable_width = output_frame_width * (1 - 2 * args.padding)
    usable_height = args.height * (1 - 2 * args.padding)
    scale = min(
        usable_width / max(frame.width for frame in crops),
        usable_height / max(frame.height for frame in crops),
    )

    output = Image.new("RGBA", (args.width, args.height), (0, 0, 0, 0))
    bottom = round(args.height * (1 - args.padding))
    for index, frame in enumerate(crops):
        size = (max(1, round(frame.width * scale)), max(1, round(frame.height * scale)))
        resized = frame.resize(size, Image.Resampling.LANCZOS)
        x = index * output_frame_width + (output_frame_width - resized.width) // 2
        y = bottom - resized.height
        output.alpha_composite(resized, (x, y))

    destination = Path(args.out)
    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, optimize=True)
    print(f"Wrote {destination} {output.size} frames={args.frames}")


if __name__ == "__main__":
    main()
