"""Split a 2x2 Grok flashcard sheet into four JPEG word cards."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SIZE = 768
JPEG_QUALITY = 82
# Trim a little gutter so panel borders do not leak into a card.
INSET_RATIO = 0.055


def split_image(image: Image.Image) -> list[Image.Image]:
    rgb = image.convert("RGB")
    width, height = rgb.size
    mid_x, mid_y = width // 2, height // 2
    inset_x = max(2, int(width * INSET_RATIO / 2))
    inset_y = max(2, int(height * INSET_RATIO / 2))
    boxes = [
        (inset_x, inset_y, mid_x - inset_x, mid_y - inset_y),
        (mid_x + inset_x, inset_y, width - inset_x, mid_y - inset_y),
        (inset_x, mid_y + inset_y, mid_x - inset_x, height - inset_y),
        (mid_x + inset_x, mid_y + inset_y, width - inset_x, height - inset_y),
    ]
    tiles = []
    for box in boxes:
        tile = rgb.crop(box)
        tiles.append(
            tile.resize((DEFAULT_SIZE, DEFAULT_SIZE), Image.Resampling.LANCZOS)
        )
    return tiles


def save_jpeg(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Split a 2x2 flashcard grid into JPEG cards")
    parser.add_argument("grid", type=Path, help="Path to the generated 2x2 image")
    parser.add_argument(
        "--slugs",
        nargs=4,
        required=True,
        metavar=("TL", "TR", "BL", "BR"),
        help="Four slugs in reading order: top-left, top-right, bottom-left, bottom-right",
    )
    parser.add_argument(
        "--wordbank",
        type=Path,
        default=ROOT / "public" / "content" / "wordbank.starters.json",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=ROOT / "public" / "assets" / "flashcards",
    )
    args = parser.parse_args()
    wordbank = json.loads(args.wordbank.read_text(encoding="utf-8"))
    by_slug = {item["slug"]: item for item in wordbank["words"]}
    image = Image.open(args.grid)
    tiles = split_image(image)
    for slug, tile in zip(args.slugs, tiles, strict=True):
        word = by_slug.get(slug)
        if not word:
            raise SystemExit(f"Unknown slug: {slug}")
        dest = args.out / word["theme"] / f"{slug}.jpg"
        save_jpeg(tile, dest)
        fallback = ROOT / "public" / word["fallback_image"]
        if fallback.exists() or slug in {
            "apple",
            "banana",
            "cat",
            "dog",
            "ball",
            "cup",
            "star",
            "fish",
        }:
            save_jpeg(tile, fallback)
        print(f"{slug} -> {dest.relative_to(ROOT)} ({dest.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
