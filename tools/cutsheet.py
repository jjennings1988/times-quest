#!/usr/bin/env python3
"""
cutsheet.py — turn a ChatGPT character sheet into game-ready transparent PNGs.

ChatGPT can't output alpha, so sheets come back on a flat coloured field with
several characters at different sizes.

WHY FLOOD-FILL, NOT A CHROMA KEY
--------------------------------
A global colour key says "delete every pixel near the key colour", which also
deletes — or worse, quietly desaturates — any of that colour inside the artwork.
On a magenta key that wrecks anything coral, violet or pink.

This tool instead floods inward from the image border, so only background that is
actually *connected to the edge* is removed. A character can contain the exact
key colour and keep it. Despill runs only in a 4px band along the cut boundary,
so interior pixels are bit-for-bit identical to the source.

That also means the background colour barely matters — neutral grey works, and
avoids the coloured light the model bounces off a saturated backdrop.

Usage
-----
  python3 tools/cutsheet.py art-raw/realm-sheet-1.png \
      --out public/art/realm --names pet-0 pet-1 pet-10 pet-2 --size 512

  --dry-run           show the cuts without writing
  --splits 560 1070   place the cuts by hand
  --verify            report interior colour drift vs the source
"""

import argparse, os
import numpy as np
from PIL import Image
from scipy import ndimage


def sample_background(rgb, probe=12):
    """Median of the four corner patches — robust to a corner clipped by art."""
    p = [rgb[:probe, :probe], rgb[:probe, -probe:],
         rgb[-probe:, :probe], rgb[-probe:, -probe:]]
    return np.median(np.array([x.reshape(-1, 3).mean(0) for x in p]), axis=0)


def background_mask(rgb, bg, tol, min_hole=120):
    """
    Background = every backdrop-coloured region that is either connected to the
    border, or is an enclosed pocket bigger than min_hole.

    Pure edge-flooding leaves holes behind: the void through Poof's chest, the
    gap between a robot's legs, the loop of a vine. Those are backdrop showing
    through and must go. But a *small* backdrop-coloured speck deep inside the
    art is far more likely to be paint, so it stays.
    """
    dist = np.linalg.norm(rgb.astype(np.float32) - bg, axis=2)
    similar = dist < tol

    lab, n = ndimage.label(similar)
    if n == 0:
        return np.zeros_like(similar), dist

    border = set(np.unique(np.concatenate([lab[0, :], lab[-1, :],
                                           lab[:, 0], lab[:, -1]])))
    border.discard(0)
    sizes = ndimage.sum(similar, lab, range(1, n + 1))

    keep = np.zeros(n + 1, dtype=bool)
    for i in range(1, n + 1):
        keep[i] = (i in border) or (sizes[i - 1] >= min_hole)
    return keep[lab], dist


def soft_alpha(bgmask, dist, tol_in, feather, band_px=4):
    """
    Hard 1 inside, hard 0 outside, and a feathered ramp only in a thin band along
    the boundary. Interior alpha is never derived from colour, so art that happens
    to match the backdrop stays fully opaque.
    """
    alpha = (~bgmask).astype(np.float32)
    grown = ndimage.binary_dilation(bgmask, iterations=band_px)
    band = grown & ~bgmask
    ramp = np.clip((dist - tol_in) / max(feather, 1e-6), 0.0, 1.0)
    alpha[band] = np.minimum(alpha[band], ramp[band])
    return alpha


def despill_edge(rgb, bgmask, bg, band_px=4):
    """
    Pull the backdrop's hue out of the cut edge only. Weight ramps from full at
    the boundary to zero band_px inward, so nothing in the interior is touched.
    """
    out = rgb.astype(np.float32).copy()
    grown = ndimage.binary_dilation(bgmask, iterations=band_px)
    band = grown & ~bgmask
    if not band.any():
        return out.astype(np.uint8)

    # distance from the cut, 1.0 at the edge -> 0.0 band_px inward
    d = ndimage.distance_transform_edt(~bgmask)
    w = np.clip(1.0 - (d - 1.0) / band_px, 0.0, 1.0) * band

    # push each channel toward the backdrop-free estimate
    key = bg / max(bg.sum(), 1e-6)                 # backdrop hue direction
    proj = (out * key).sum(axis=2, keepdims=True)  # how much backdrop is present
    neutral = out - proj * key * 0.85
    out = out * (1 - w[..., None]) + neutral * w[..., None]
    return np.clip(out, 0, 255).astype(np.uint8)


def find_splits(alpha, expect=None, min_gap=8, col_thresh=0.004):
    h, w = alpha.shape
    col = alpha.sum(axis=0) / h
    empty = col < col_thresh
    runs, start = [], None
    for x in range(w):
        if empty[x] and start is None:
            start = x
        elif not empty[x] and start is not None:
            runs.append((start, x)); start = None
    if start is not None:
        runs.append((start, w))

    interior = [(a, b) for a, b in runs if a > 0 and b < w and (b - a) >= min_gap]
    interior.sort(key=lambda r: r[1] - r[0], reverse=True)
    if expect:
        interior = interior[: expect - 1]
    splits = sorted((a + b) // 2 for a, b in interior)

    # Wisps, tails and auras often bridge the gap. Fall back to deepest valleys.
    if expect and len(splits) < expect - 1:
        k = 25
        smooth = np.convolve(col, np.ones(k) / k, mode="same")
        edge, min_sep = int(w * 0.06), int(w / (expect * 2.2))
        picked = []
        for x in np.argsort(smooth):
            if x < edge or x > w - edge:
                continue
            if all(abs(x - p) >= min_sep for p in picked):
                picked.append(int(x))
            if len(picked) == expect - 1:
                break
        splits = sorted(picked)
    return splits


def bbox(alpha, thresh=0.06):
    ys, xs = np.where(alpha > thresh)
    return None if len(xs) == 0 else (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)


def square_pad(img, size, margin=0.04):
    w, h = img.size
    side = int(max(w, h) * (1 + margin * 2))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - w) // 2, (side - h) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet")
    ap.add_argument("--out", default="public/art")
    ap.add_argument("--names", nargs="*", default=None)
    ap.add_argument("--size", type=int, default=512)
    ap.add_argument("--tol", type=float, default=90.0, help="flood tolerance")
    ap.add_argument("--tol-in", type=float, default=60.0, help="edge ramp start")
    ap.add_argument("--feather", type=float, default=40.0)
    ap.add_argument("--band", type=int, default=4, help="despill band width px")
    ap.add_argument("--min-hole", type=int, default=120, help="enclosed backdrop pockets >= this are removed")
    ap.add_argument("--min-gap", type=int, default=8)
    ap.add_argument("--splits", nargs="*", type=int, default=None)
    ap.add_argument("--expect", type=int, default=None)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--verify", action="store_true")
    a = ap.parse_args()

    rgb = np.array(Image.open(a.sheet).convert("RGB"))
    h, w, _ = rgb.shape
    bg = sample_background(rgb)
    bgmask, dist = background_mask(rgb, bg, a.tol, a.min_hole)
    alpha = soft_alpha(bgmask, dist, a.tol_in, a.feather, a.band)
    cleaned = despill_edge(rgb, bgmask, bg, a.band)

    expect = a.expect or (len(a.names) if a.names else None)
    splits = a.splits if a.splits else find_splits(alpha, expect, a.min_gap)
    bounds = [0] + list(splits) + [w]

    print(f"sheet      {a.sheet}  {w}x{h}")
    print(f"background rgb({bg[0]:.0f},{bg[1]:.0f},{bg[2]:.0f})  (sampled, not assumed)")
    print(f"removed    {100*bgmask.mean():.1f}% of frame  (edge-connected only)")
    print(f"splits     {splits or '(none)'}")
    print(f"segments   {len(bounds)-1}"
          + (f"   EXPECTED {expect}" if expect and len(bounds)-1 != expect else ""))

    if a.verify:
        interior = (~ndimage.binary_dilation(bgmask, iterations=a.band + 2))
        d = np.abs(cleaned.astype(int) - rgb.astype(int))[interior]
        print(f"interior   max drift {d.max()}  mean {d.mean():.3f}"
              f"   {'UNTOUCHED' if d.max()==0 else 'DRIFTED'}")
    print()

    os.makedirs(a.out, exist_ok=True)
    for i in range(len(bounds) - 1):
        x0, x1 = bounds[i], bounds[i + 1]
        seg = alpha[:, x0:x1]
        bb = bbox(seg)
        if bb is None:
            print(f"  [{i}] empty, skipped"); continue
        bx0, by0, bx1, by1 = bb
        piece = np.dstack([cleaned[:, x0:x1][by0:by1, bx0:bx1],
                           (seg[by0:by1, bx0:bx1] * 255).astype(np.uint8)])
        img = square_pad(Image.fromarray(piece, "RGBA"), a.size)
        name = a.names[i] if a.names and i < len(a.names) else f"piece-{i}"
        path = os.path.join(a.out, f"{name}.png")
        print(f"  [{i}] {name:<10} x{x0}-{x1}  content {bx1-bx0}x{by1-by0}  -> {path}")
        if not a.dry_run:
            img.save(path)

    if a.dry_run:
        print("\n(dry run — nothing written)")


if __name__ == "__main__":
    main()
