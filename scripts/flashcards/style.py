"""Shared Grok Imagine prompt pieces for Starters flashcards."""

STYLE_PREFIX = (
    "Children's educational flashcard illustration, "
    "flat vector cartoon, bold clean outlines, "
    "bright saturated colors, friendly and simple, "
    "preschool safe, high clarity."
)

GRID_RULES = (
    "A perfect 2-by-2 contact sheet on a plain white background. "
    "Four equal square panels separated by a thick even white cross gutter. "
    "No text, no letters, no numbers, no watermark, no labels, no captions. "
    "Each panel contains exactly one object, centered, with empty white space around it. "
    "Objects do not cross the gutter. No extra props, no scenery, no shadows of other objects."
)


def cell_line(slot: str, object_prompt: str) -> str:
    return f"{slot} panel: only {object_prompt}. Plain white inside the panel."


def grid_prompt(objects: list[str]) -> str:
    if len(objects) != 4:
        raise ValueError("A 2x2 grid needs exactly four object prompts")
    slots = ["Top-left", "Top-right", "Bottom-left", "Bottom-right"]
    cells = " ".join(cell_line(slot, obj) for slot, obj in zip(slots, objects, strict=True))
    return f"{STYLE_PREFIX} {GRID_RULES} {cells}"


def single_prompt(object_prompt: str) -> str:
    return (
        f"{STYLE_PREFIX} Single object centered, plain white background, "
        f"no text, no letters, no watermark, no scary faces. {object_prompt}."
    )
