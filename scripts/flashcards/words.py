"""Cambridge YLE Starters imageable nouns for picture listening cards.

This is a curated subset, not a dump of the official list. Abstract words,
function words, names, numbers, rooms-as-scenes, and scary animals are out.
Do not claim this is official Cambridge exam material.
"""

from __future__ import annotations

# lemma, theme, type, object_prompt, color, emoji, age_min
WORDS: list[tuple[str, str, str, str, str, str, int]] = [
    # food / fruit
    ("apple", "food", "fruit", "one red apple with a small green leaf", "#ff6b5e", "🍎", 2),
    ("banana", "food", "fruit", "one yellow banana with a slight curve", "#f7c94b", "🍌", 2),
    ("orange", "food", "fruit", "one round orange citrus fruit with a small green leaf", "#f4a24c", "🍊", 3),
    ("pear", "food", "fruit", "one yellow-green pear with a short brown stem", "#b5d56a", "🍐", 3),
    ("grape", "food", "fruit", "one small bunch of purple grapes", "#8b6bb5", "🍇", 3),
    ("lemon", "food", "fruit", "one bright yellow lemon", "#f7d35a", "🍋", 3),
    ("lime", "food", "fruit", "one bright green lime", "#7dcc6b", "🟢", 3),
    ("pineapple", "food", "fruit", "one pineapple with a green spiky crown", "#e2c15a", "🍍", 3),
    ("coconut", "food", "fruit", "one brown coconut with a small cut face showing white inside", "#c9a27a", "🥥", 3),
    ("kiwi", "food", "fruit", "one brown kiwi fruit beside one green kiwi slice", "#8fbf5a", "🥝", 3),
    ("watermelon", "food", "fruit", "one slice of red watermelon with black seeds and green rind", "#e85d5d", "🍉", 3),
    ("mango", "food", "fruit", "one yellow-orange mango with a small leaf", "#f0b04a", "🥭", 3),
    # food / other
    ("carrot", "food", "vegetable", "one orange carrot with a short green top", "#f08a3a", "🥕", 3),
    ("tomato", "food", "vegetable", "one red tomato with a small green calyx", "#e2554a", "🍅", 3),
    ("potato", "food", "vegetable", "one light brown potato", "#cbb07a", "🥔", 3),
    ("onion", "food", "vegetable", "one round onion with papery gold skin", "#d7c07a", "🧅", 3),
    ("bread", "food", "meal", "one loaf of bread", "#e0c08a", "🍞", 3),
    ("cake", "food", "meal", "one small slice of birthday cake with frosting", "#f3b6c8", "🍰", 2),
    ("burger", "food", "meal", "one simple hamburger", "#d9a05a", "🍔", 3),
    ("egg", "food", "meal", "one white egg", "#f4efe4", "🥚", 3),
    ("ice cream", "food", "meal", "one ice cream cone with a pink scoop", "#f7b7c9", "🍦", 2),
    ("juice", "food", "drink", "one glass of orange juice", "#f0a24a", "🧃", 3),
    ("milk", "food", "drink", "one glass of milk", "#f3f0ea", "🥛", 3),
    ("sausage", "food", "meal", "one cooked brown sausage", "#c47a5a", "🌭", 3),
    # animals
    ("cat", "animals", "pet", "one sitting orange tabby cat, cute, no background props", "#f3b56d", "🐱", 2),
    ("dog", "animals", "pet", "one sitting golden puppy, cute, no background props", "#d9a66f", "🐶", 2),
    ("bird", "animals", "pet", "one small blue bird perched, cute, no cage", "#6db6e8", "🐦", 2),
    ("fish", "animals", "pet", "one orange goldfish, no tank scenery", "#f08a4a", "🐟", 2),
    ("mouse", "animals", "pet", "one small grey mouse, cute, no cheese", "#c5c0b8", "🐭", 3),
    ("cow", "animals", "farm", "one friendly black-and-white cow standing", "#dfe4ea", "🐮", 3),
    ("horse", "animals", "farm", "one brown horse standing", "#c48a5a", "🐴", 3),
    ("sheep", "animals", "farm", "one fluffy white sheep", "#f2efe8", "🐑", 3),
    ("duck", "animals", "farm", "one yellow duckling", "#f7d35a", "🦆", 2),
    ("chicken", "animals", "farm", "one red-combed chicken", "#f0b04a", "🐔", 3),
    ("goat", "animals", "farm", "one white goat with small horns, friendly", "#e8e0d4", "🐐", 3),
    ("donkey", "animals", "farm", "one grey donkey, friendly", "#c0b8ae", "🫏", 3),
    ("bee", "animals", "small", "one cartoon bee, friendly, not scary", "#f6c84c", "🐝", 3),
    ("frog", "animals", "small", "one cute green frog sitting", "#7dcc6b", "🐸", 3),
    ("bear", "animals", "zoo", "one friendly brown bear sitting", "#c48a5a", "🐻", 3),
    ("elephant", "animals", "zoo", "one cute grey elephant", "#b7b7c2", "🐘", 3),
    ("giraffe", "animals", "zoo", "one giraffe with a long neck", "#e2b15a", "🦒", 3),
    ("monkey", "animals", "zoo", "one cute brown monkey sitting", "#c48a5a", "🐵", 3),
    ("hippo", "animals", "zoo", "one cute grey hippo", "#9aa4b2", "🦛", 3),
    ("tiger", "animals", "zoo", "one friendly cartoon tiger, not scary, no teeth bared", "#f08a3a", "🐯", 3),
    ("zebra", "animals", "zoo", "one zebra standing", "#3d3d3d", "🦓", 3),
    ("polar bear", "animals", "zoo", "one cute white polar bear sitting", "#f4f6f8", "🐻‍❄️", 3),
    # toys
    ("ball", "toys", "play", "one red rubber ball", "#ff6b5e", "⚽", 2),
    ("balloon", "toys", "play", "one round red balloon with a short string", "#ff6b5e", "🎈", 2),
    ("doll", "toys", "play", "one simple cloth doll, friendly, preschool safe", "#f3b6c8", "🧸", 3),
    ("kite", "toys", "play", "one diamond kite with a tail, no sky scene", "#6db6e8", "🪁", 3),
    ("robot", "toys", "play", "one friendly toy robot", "#8fb7d6", "🤖", 3),
    ("teddy", "toys", "play", "one brown teddy bear sitting", "#c48a5a", "🧸", 2),
    ("train", "toys", "vehicle", "one colorful toy train engine", "#e2554a", "🚂", 3),
    ("bike", "toys", "vehicle", "one small children's bicycle", "#6db6e8", "🚲", 3),
    ("boat", "toys", "vehicle", "one simple sailboat", "#6db6e8", "⛵", 3),
    ("plane", "toys", "vehicle", "one toy airplane", "#8fb7d6", "✈️", 3),
    ("helicopter", "toys", "vehicle", "one toy helicopter", "#9ed9c4", "🚁", 3),
    ("baseball", "toys", "sport", "one white baseball with red stitching", "#f4efe4", "⚾", 3),
    ("basketball", "toys", "sport", "one orange basketball", "#f08a3a", "🏀", 3),
    ("football", "toys", "sport", "one black-and-white soccer ball", "#3d3d3d", "⚽", 3),
    ("camera", "toys", "play", "one simple toy camera", "#8fb7d6", "📷", 3),
    # clothes
    ("hat", "clothes", "wear", "one blue sun hat", "#6db6e8", "🎩", 3),
    ("dress", "clothes", "wear", "one simple pink dress on a hanger, no person", "#f3b6c8", "👗", 3),
    ("shirt", "clothes", "wear", "one folded blue shirt", "#6db6e8", "👕", 3),
    ("T-shirt", "clothes", "wear", "one yellow T-shirt", "#f7c94b", "👕", 3),
    ("shoe", "clothes", "wear", "one red child's shoe", "#ff6b5e", "👟", 2),
    ("sock", "clothes", "wear", "one pair of striped socks", "#9ed9c4", "🧦", 3),
    ("boot", "clothes", "wear", "one pair of yellow rain boots", "#f7c94b", "👢", 3),
    ("jacket", "clothes", "wear", "one blue jacket", "#6db6e8", "🧥", 3),
    ("jeans", "clothes", "wear", "one pair of blue jeans", "#6b8fc4", "👖", 3),
    ("shorts", "clothes", "wear", "one pair of green shorts", "#7dcc6b", "🩳", 3),
    ("skirt", "clothes", "wear", "one simple blue skirt, no person", "#6db6e8", "👗", 3),
    ("glasses", "clothes", "wear", "one pair of round glasses", "#8fb7d6", "👓", 3),
    ("bag", "clothes", "wear", "one simple school bag", "#f08a3a", "🎒", 3),
    ("baseball cap", "clothes", "wear", "one blue baseball cap", "#6db6e8", "🧢", 3),
    ("watch", "clothes", "wear", "one simple wristwatch", "#d9a66f", "⌚", 3),
    ("handbag", "clothes", "wear", "one small red handbag", "#ff6b5e", "👜", 3),
    # home
    ("bed", "home", "furniture", "one simple child's bed", "#c9b9d9", "🛏️", 3),
    ("chair", "home", "furniture", "one wooden chair", "#d9a66f", "🪑", 3),
    ("table", "home", "furniture", "one small wooden table", "#d9a66f", "🪵", 3),
    ("sofa", "home", "furniture", "one blue sofa", "#6db6e8", "🛋️", 3),
    ("lamp", "home", "object", "one table lamp", "#f7c94b", "💡", 3),
    ("clock", "home", "object", "one round wall clock with a simple face and no numbers crowded", "#f4efe4", "🕒", 3),
    ("door", "home", "object", "one closed wooden door", "#c48a5a", "🚪", 3),
    ("window", "home", "object", "one simple window with a blue sky pane, no room scene", "#8fb7d6", "🪟", 3),
    ("house", "home", "place", "one simple cartoon house", "#ff8b76", "🏠", 2),
    ("bath", "home", "object", "one empty bathtub, no person", "#8fb7d6", "🛁", 3),
    ("box", "home", "object", "one cardboard box", "#e0c08a", "📦", 3),
    ("phone", "home", "object", "one simple toy telephone", "#9ed9c4", "📞", 3),
    ("computer", "home", "object", "one simple laptop computer, screen off", "#8fb7d6", "💻", 3),
    ("television", "home", "object", "one simple television, screen off", "#6b8fc4", "📺", 3),
    ("armchair", "home", "furniture", "one green armchair", "#7dcc6b", "🪑", 3),
    ("desk", "home", "furniture", "one school desk", "#d9a66f", "🪵", 3),
    # transport
    ("car", "transport", "vehicle", "one red toy car, side view", "#ff6b5e", "🚗", 2),
    ("bus", "transport", "vehicle", "one yellow school-style bus, side view", "#f7c94b", "🚌", 3),
    ("truck", "transport", "vehicle", "one blue toy truck, side view", "#6db6e8", "🚚", 3),
    ("motorbike", "transport", "vehicle", "one toy motorbike, no rider", "#3d3d3d", "🏍️", 3),
    ("ship", "transport", "vehicle", "one simple toy ship", "#6db6e8", "🚢", 3),
    # school
    ("book", "school", "tool", "one closed picture book", "#6db6e8", "📘", 2),
    ("pencil", "school", "tool", "one yellow pencil", "#f7c94b", "✏️", 3),
    ("pen", "school", "tool", "one blue pen", "#6db6e8", "🖊️", 3),
    ("crayon", "school", "tool", "one red crayon", "#ff6b5e", "🖍️", 3),
    ("ruler", "school", "tool", "one wooden ruler, no tiny numbers needed", "#e0c08a", "📏", 3),
    ("eraser", "school", "tool", "one pink eraser", "#f3b6c8", "🧽", 3),
    ("cup", "school", "tool", "one blue cup", "#6db6e8", "🥤", 2),
    ("star", "world", "nature", "one yellow five-pointed star", "#f7c94b", "⭐", 2),
    ("flower", "world", "nature", "one red flower with a green stem", "#ff6b5e", "🌸", 3),
    ("tree", "world", "nature", "one simple green tree", "#7dcc6b", "🌳", 3),
    ("sun", "world", "nature", "one bright yellow sun with short rays", "#f7c94b", "☀️", 2),
    ("guitar", "school", "tool", "one acoustic guitar", "#d9a66f", "🎸", 3),
]

ADJACENT_TYPES = {
    "fruit": ["vegetable", "meal", "drink"],
    "vegetable": ["fruit", "meal"],
    "meal": ["fruit", "drink"],
    "drink": ["meal", "fruit"],
    "pet": ["farm", "zoo", "small"],
    "farm": ["pet", "zoo"],
    "zoo": ["farm", "pet"],
    "small": ["pet", "farm"],
    "play": ["sport", "vehicle"],
    "sport": ["play"],
    "vehicle": ["play"],
    "wear": [],
    "furniture": ["object"],
    "object": ["furniture"],
    "place": ["object", "furniture"],
    "tool": ["object"],
    "nature": ["object"],
}

# Same-theme groups of four for 2x2 Grok Imagine calls.
BATCHES: list[list[str]] = [
    ["apple", "banana", "orange", "pear"],
    ["grape", "lemon", "pineapple", "kiwi"],
    ["watermelon", "mango", "coconut", "lime"],
    ["carrot", "tomato", "potato", "onion"],
    ["bread", "cake", "egg", "burger"],
    ["ice cream", "juice", "milk", "sausage"],
    ["cat", "dog", "bird", "fish"],
    ["cow", "horse", "sheep", "duck"],
    ["chicken", "goat", "donkey", "mouse"],
    ["bee", "frog", "bear", "elephant"],
    ["giraffe", "monkey", "hippo", "tiger"],
    ["zebra", "polar bear", "ball", "balloon"],
    ["doll", "kite", "robot", "teddy"],
    ["train", "bike", "boat", "plane"],
    ["helicopter", "baseball", "basketball", "football"],
    ["hat", "dress", "shirt", "T-shirt"],
    ["shoe", "sock", "boot", "jacket"],
    ["jeans", "shorts", "skirt", "glasses"],
    ["bag", "baseball cap", "watch", "handbag"],
    ["bed", "chair", "table", "sofa"],
    ["lamp", "clock", "door", "window"],
    ["house", "bath", "box", "phone"],
    ["computer", "television", "armchair", "desk"],
    ["car", "bus", "truck", "ship"],
    ["book", "pencil", "pen", "crayon"],
    ["ruler", "eraser", "cup", "star"],
    ["flower", "tree", "sun", "guitar"],
    ["camera", "motorbike", "apple", "cat"],  # leftover pad — filtered at export
]


def slug(lemma: str) -> str:
    return (
        lemma.replace("T-shirt", "t-shirt")
        .replace(" ", "-")
        .replace("_", "-")
        .lower()
    )


def article_for(lemma: str) -> str:
    return "an" if lemma[:1].lower() in "aeiou" else "the"


def record_for(row: tuple[str, str, str, str, str, str, int]) -> dict:
    lemma, theme, kind, prompt, color, emoji, age_min = row
    key = slug(lemma)
    same_type = [slug(w[0]) for w in WORDS if w[2] == kind and w[0] != lemma]
    return {
        "id": f"{theme}_{key.replace('-', '_')}",
        "lemma": lemma,
        "slug": key,
        "pos": "noun",
        "level": "starters",
        "theme": theme,
        "type": kind,
        "age_min": age_min,
        "age_max": 6,
        "audio": f"{key}.mp3",
        "prompt_en": f"Which one is the {lemma}?",
        "speech": f"Which one is the {lemma}?",
        "imageable": True,
        "distractor_pool": same_type[:6],
        "adjacent_types": ADJACENT_TYPES.get(kind, []),
        "image_id": f"img_{key}_v1",
        "image": f"assets/flashcards/{theme}/{key}.jpg",
        "fallback_image": f"assets/choices/{key}.jpg",
        "object_prompt": prompt,
        "color": color,
        "emoji": emoji,
        "status": "pending",
    }
