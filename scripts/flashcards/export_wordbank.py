"""Write public/content/wordbank.starters.json and batches.json."""

from __future__ import annotations

import json
from pathlib import Path

from words import BATCHES, WORDS, record_for, slug

ROOT = Path(__file__).resolve().parents[2]
OUT_JSON = ROOT / "public" / "content" / "wordbank.starters.json"
OUT_BATCHES = Path(__file__).resolve().parent / "batches.json"


def mark_status(word: dict) -> dict:
    flashcard = ROOT / "public" / word["image"]
    fallback = ROOT / "public" / word["fallback_image"]
    if flashcard.exists():
        word["status"] = "approved"
    elif fallback.exists():
        word["status"] = "approved"
        word["image"] = word["fallback_image"]
    else:
        word["status"] = "pending"
    return word


def main() -> None:
    words = [mark_status(record_for(row)) for row in WORDS]
    by_slug = {item["slug"]: item for item in words}
    batches = []
    used = set()
    for i, group in enumerate(BATCHES, start=1):
        slugs = []
        for lemma in group:
            key = slug(lemma)
            if key in by_slug and key not in used:
                slugs.append(key)
                used.add(key)
        if len(slugs) == 4:
            batches.append({"id": f"grid-{i:02d}", "slugs": slugs})
        elif slugs:
            # keep leftovers for a later incomplete grid
            batches.append({"id": f"grid-{i:02d}", "slugs": slugs, "incomplete": True})

    payload = {
        "schemaVersion": 1,
        "source": "Cambridge English Pre A1 Starters thematic nouns, curated for picture listening. Not official exam content.",
        "style": "children-flashcard-v1",
        "imageFormat": "jpeg",
        "imageSize": 768,
        "model": "grok-imagine-image-2.0",
        "words": words,
        "batches": [{"id": b["id"], "slugs": b["slugs"]} for b in batches if len(b["slugs"]) == 4],
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    OUT_BATCHES.write_text(
        json.dumps({"schemaVersion": 1, "format": "jpeg", "batches": payload["batches"]}, indent=2)
        + "\n",
        encoding="utf-8",
    )
    print(f"words={len(words)} batches={len(payload['batches'])} -> {OUT_JSON}")


if __name__ == "__main__":
    main()
