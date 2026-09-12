# Starters flashcard pipeline

Picture listening cards are **pre-generated**, reviewed, then frozen. The kid quiz never calls an image API.

## Why JPEG, not PNG or SVG

- Grok Imagine returns a raster image, so these cards cannot be true SVG.
- Flashcards are a single object on white. They do not need PNG transparency.
- JPEG at 768px, quality 82 is typically **5–8× smaller** than the same cartoon PNG.
- GitHub Pages is happiest under **1 GB**. 128 JPEG cards at ~30–50 KB is about **4–6 MB**.

Do not commit PNG grids. Raw 2×2 sheets stay in `grids/` (gitignored). Only split JPEG cards go into `public/assets/flashcards/`.

## Generate with Grok Imagine

```bash
copy .env.example .env
# put XAI_API_KEY from https://console.x.ai
python scripts/flashcards/export_wordbank.py
python scripts/flashcards/generate_grids.py --batch grid-01
python scripts/flashcards/split_grid.py scripts/flashcards/grids/grid-01.png --slugs apple banana orange pear
python scripts/flashcards/export_wordbank.py
```

`generate_grids.py` calls `POST https://api.x.ai/v1/images/generations` with `grok-imagine-image-2.0`. SuperGrok membership does not fill `XAI_API_KEY`.

## Review before shipping

1. Is it the named object (pear must not look like apple)?
2. No text, watermark, or second object.
3. Not scary, not over-anthropomorphized, preschool safe.
4. Four options together must not be the same color/size (that becomes an eyesight test).

Reject and regenerate the grid, or replace one cell later with a single-object call.
