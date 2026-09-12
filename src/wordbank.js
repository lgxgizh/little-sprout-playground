/** Starters picture-listening engine: same-theme distractors, child-seeded shuffle. */

export function slugifyLemma(lemma = "") {
  return String(lemma)
    .trim()
    .replace(/^T-shirt$/i, "t-shirt")
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

export function seedFrom(...parts) {
  const source = parts.map((part) => String(part ?? "")).join("|");
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleCopy(items, random) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function wordImageSrc(word, assetBase = "/") {
  const base = assetBase.endsWith("/") ? assetBase : `${assetBase}/`;
  const path = word?.image || word?.fallback_image || "";
  return path ? `${base}${path.replace(/^\//, "")}` : "";
}

export function pickDistractors(
  target,
  words = [],
  random = Math.random,
  count = 3,
) {
  if (!target) return [];
  const others = words.filter(
    (word) => word.imageable !== false && word.slug !== target.slug,
  );
  const byLemma = new Map(others.map((word) => [word.slug, word]));
  const preferred = (target.distractor_pool || [])
    .map((item) => byLemma.get(slugifyLemma(item)))
    .filter(Boolean);
  const sameType = others.filter(
    (word) => word.theme === target.theme && word.type === target.type,
  );
  const sameTheme = others.filter(
    (word) => word.theme === target.theme && word.type !== target.type,
  );
  const adjacent = others.filter((word) =>
    (target.adjacent_types || []).includes(word.type),
  );
  const picked = [];
  const used = new Set();
  const take = (list) => {
    for (const word of shuffleCopy(list, random)) {
      if (used.has(word.slug)) continue;
      used.add(word.slug);
      picked.push(word);
      if (picked.length >= count) return true;
    }
    return false;
  };
  if (take(preferred)) return picked;
  if (take(sameType)) return picked;
  if (take(sameTheme)) return picked;
  if (take(adjacent)) return picked;
  take(others);
  return picked.slice(0, count);
}

export function buildListeningQuestion(
  target,
  words = [],
  { childId = "default", assetBase = "/", salt = "listen" } = {},
) {
  if (!target) return null;
  const random = mulberry32(seedFrom(childId, target.slug, salt));
  const distractors = pickDistractors(target, words, random, 3);
  const choices = shuffleCopy(
    [target, ...distractors].map((word) => ({
      label: word.lemma.replace(/^./, (letter) => letter.toUpperCase()),
      emoji: word.emoji || "🖼️",
      value: word.slug,
      color: word.color || "#9ed9c4",
      imageKey: word.slug,
      imageSrc: wordImageSrc(word, assetBase),
    })),
    random,
  );
  if (choices.length < 2) return null;
  const prompt = target.prompt_en || `Which one is the ${target.lemma}?`;
  return {
    id: `english-${target.slug}`,
    difficulty: 1,
    stage: target.age_min <= 2 ? 1 : 2,
    ageMin: target.age_min || 2,
    ageMax: target.age_max || 6,
    concept: target.slug,
    baseline: (target.age_min || 3) <= 3,
    visual: target.emoji || "🎧",
    prompt,
    speech: target.speech || prompt,
    answer: target.slug,
    choices,
  };
}

export function listeningPoolFromWordbank(
  wordbank,
  {
    childId = "default",
    assetBase = "/",
    availableSlugs = null,
    salt = "listen",
  } = {},
) {
  const words = Array.isArray(wordbank?.words) ? wordbank.words : [];
  const usable = words.filter((word) => {
    if (word.imageable === false) return false;
    if (word.status && word.status !== "approved") return false;
    if (availableSlugs && !availableSlugs.has(word.slug)) return false;
    return true;
  });
  const preferred = [
    "apple",
    "cat",
    "dog",
    "ball",
    "cup",
    "fish",
    "star",
    "banana",
  ];
  const ordered = [
    ...preferred
      .map((slug) => usable.find((word) => word.slug === slug))
      .filter(Boolean),
    ...usable.filter((word) => !preferred.includes(word.slug)),
  ];
  return ordered
    .map((word) =>
      buildListeningQuestion(word, usable, { childId, assetBase, salt }),
    )
    .filter(Boolean);
}
