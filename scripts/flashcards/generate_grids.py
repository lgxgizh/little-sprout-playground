"""Generate 2x2 Starters flashcard sheets with Grok Imagine (xAI images API).

Never call this from the kid quiz. Cards are pre-generated, split, reviewed,
then committed as JPEG files.

Requires XAI_API_KEY in the environment or a project .env file.
"""

from __future__ import annotations

import argparse
import json
import os
import time
import urllib.request
from pathlib import Path

from style import grid_prompt

ROOT = Path(__file__).resolve().parents[2]
GRIDS = Path(__file__).resolve().parent / "grids"
MODEL = "grok-imagine-image-2.0"
API_URL = "https://api.x.ai/v1/images/generations"


def load_env() -> None:
    for name in (".env.local", ".env"):
        path = ROOT / name
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            trimmed = line.strip()
            if not trimmed or trimmed.startswith("#") or "=" not in trimmed:
                continue
            key, value = trimmed.split("=", 1)
            key, value = key.strip(), value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


def generate_image(prompt: str, api_key: str) -> bytes:
    body = json.dumps(
        {
            "model": MODEL,
            "prompt": prompt,
            "n": 1,
            "aspect_ratio": "1:1",
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        API_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        payload = json.loads(response.read().decode("utf-8"))
    item = (payload.get("data") or [None])[0] or {}
    if item.get("b64_json"):
        import base64

        return base64.b64decode(item["b64_json"])
    url = item.get("url")
    if not url:
        raise RuntimeError(f"No image in response: {payload}")
    with urllib.request.urlopen(url, timeout=90) as image_response:
        return image_response.read()


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate 2x2 Grok flashcard grids")
    parser.add_argument("--batch", help="Only this batch id, e.g. grid-01")
    parser.add_argument("--limit", type=int, default=0, help="Max batches this run")
    args = parser.parse_args()
    load_env()
    api_key = os.environ.get("XAI_API_KEY", "").strip()
    if not api_key:
        raise SystemExit(
            "Missing XAI_API_KEY. SuperGrok membership cannot fill this. "
            "Put a console.x.ai key in .env"
        )

    wordbank = json.loads(
        (ROOT / "public" / "content" / "wordbank.starters.json").read_text(encoding="utf-8")
    )
    by_slug = {item["slug"]: item for item in wordbank["words"]}
    batches = wordbank["batches"]
    if args.batch:
        batches = [item for item in batches if item["id"] == args.batch]
    if args.limit:
        batches = batches[: args.limit]

    GRIDS.mkdir(parents=True, exist_ok=True)
    for batch in batches:
        slugs = batch["slugs"]
        objects = [by_slug[item]["object_prompt"] for item in slugs]
        prompt = grid_prompt(objects)
        out = GRIDS / f"{batch['id']}.png"
        print(f"Generating {batch['id']} {slugs}")
        raw = generate_image(prompt, api_key)
        out.write_bytes(raw)
        (GRIDS / f"{batch['id']}.prompt.txt").write_text(prompt + "\n", encoding="utf-8")
        print(f"  saved {out} ({out.stat().st_size} bytes)")
        time.sleep(1.2)

    print("Next: python split_grid.py grids/grid-01.png --slugs apple banana orange pear")


if __name__ == "__main__":
    main()
