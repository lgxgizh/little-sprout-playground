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

export const THEME_LABELS = {
  all: "全部",
  food: "食物",
  animals: "动物",
  toys: "玩具",
  clothes: "衣服",
  home: "家",
  transport: "交通",
  school: "学习用品",
  world: "自然",
};

export const LISTENING_COUNTS = [5, 8, 10, 12];

export const LISTENING_PREFS_KEY = "little-sprout-listening";

export function isUsableWord(word) {
  if (!word || word.imageable === false) return false;
  if (word.status && word.status !== "approved") return false;
  return true;
}

export function usableWords(wordbank, theme = "all") {
  const words = Array.isArray(wordbank?.words) ? wordbank.words : [];
  return words.filter((word) => {
    if (!isUsableWord(word)) return false;
    if (theme && theme !== "all" && word.theme !== theme) return false;
    return true;
  });
}

export function listWordbankThemes(wordbank) {
  const counts = new Map();
  for (const word of wordbank?.words || []) {
    if (!isUsableWord(word)) continue;
    counts.set(word.theme, (counts.get(word.theme) || 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return [
    { id: "all", label: THEME_LABELS.all, count: total },
    ...[...counts.entries()]
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([id, count]) => ({
        id,
        label: THEME_LABELS[id] || id,
        count,
      })),
  ];
}

/** Unique JSON files referenced by a catalog (ready for Movers etc.). */
export function catalogBankFiles(catalog) {
  return [
    ...new Set(
      (catalog?.banks || [])
        .map((bank) => bank?.file)
        .filter((file) => typeof file === "string" && file.length),
    ),
  ];
}

export function findListeningBank(catalog, bankId) {
  const banks = Array.isArray(catalog?.banks) ? catalog.banks : [];
  if (!banks.length) return null;
  return (
    banks.find((bank) => bank.id === bankId) ||
    banks.find((bank) => bank.id === catalog?.defaultBankId) ||
    banks[0]
  );
}

export function resolveLoadedBank(bankEntry, loadedBanks = {}) {
  if (!bankEntry) return null;
  if (loadedBanks[bankEntry.id]?.words) return loadedBanks[bankEntry.id];
  if (bankEntry.file && loadedBanks[bankEntry.file]?.words) {
    return loadedBanks[bankEntry.file];
  }
  return null;
}

/**
 * Concrete listening banks parents can pick: full JSON packs and/or theme
 * filters over a shared file (e.g. Starters food pack).
 */
export function listListeningBanks(catalog, loadedBanks = {}) {
  const banks = Array.isArray(catalog?.banks) ? catalog.banks : [];
  return banks
    .map((bank) => {
      const wordbank = resolveLoadedBank(bank, loadedBanks);
      const theme = bank.theme || "all";
      const words = usableWords(wordbank, theme);
      return {
        id: bank.id,
        label: bank.label || bank.id,
        description: bank.description || "",
        file: bank.file || "",
        theme,
        count: words.length,
        words,
        source: wordbank,
      };
    })
    .filter((bank) => bank.id);
}

export function bankPreviewWords(bank, limit = 8) {
  const words = (bank?.words || []).filter((word) => word.image);
  if (!words.length) return [];
  if ((bank?.theme || "all") !== "all") return words.slice(0, limit);
  const mixed = [];
  const seen = new Set();
  for (const word of words) {
    if (seen.has(word.theme)) continue;
    seen.add(word.theme);
    mixed.push(word);
  }
  mixed.push(...words.filter((word) => !mixed.includes(word)));
  return mixed.slice(0, limit);
}

export function clampListeningCount(requested, available) {
  const count = Number(requested) || 8;
  const pool = Math.max(0, Number(available) || 0);
  if (!pool) return 0;
  return Math.max(1, Math.min(count, pool));
}

export function listeningPoolFromWordbank(
  wordbank,
  {
    childId = "default",
    assetBase = "/",
    availableSlugs = null,
    salt = "listen",
    theme = "all",
    shuffle = false,
  } = {},
) {
  const usable = usableWords(wordbank, theme).filter((word) => {
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
  let ordered = [
    ...preferred
      .map((slug) => usable.find((word) => word.slug === slug))
      .filter(Boolean),
    ...usable.filter((word) => !preferred.includes(word.slug)),
  ];
  if (shuffle) {
    ordered = shuffleCopy(usable, mulberry32(seedFrom(childId, theme, salt)));
  }
  return ordered
    .map((word) =>
      buildListeningQuestion(word, usable, { childId, assetBase, salt }),
    )
    .filter(Boolean);
}

export function listeningPoolForBank(
  bankEntry,
  loadedBanks = {},
  options = {},
) {
  const wordbank = resolveLoadedBank(bankEntry, loadedBanks);
  if (!wordbank) return [];
  return listeningPoolFromWordbank(wordbank, {
    ...options,
    theme: bankEntry?.theme || options.theme || "all",
  });
}

export function pickListeningRound(pool = [], count = 8, random = Math.random) {
  const shuffled = shuffleCopy(pool, random);
  return shuffled.slice(0, clampListeningCount(count, shuffled.length));
}

export function loadListeningPrefs(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(LISTENING_PREFS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveListeningPrefs(prefs, storage = globalThis.localStorage) {
  try {
    storage?.setItem?.(
      LISTENING_PREFS_KEY,
      JSON.stringify({
        bankId: prefs?.bankId || prefs?.listeningBankId || "starters",
        count: Number(prefs?.count || prefs?.listeningCount) || 8,
        theme: prefs?.theme || "all",
      }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/** Map legacy theme id (all/food/…) onto a catalog bank id when possible. */
export function bankIdFromTheme(catalog, themeId = "all") {
  const theme = themeId || "all";
  if (theme === "all") {
    return (
      catalog?.defaultBankId || findListeningBank(catalog)?.id || "starters"
    );
  }
  const match = (catalog?.banks || []).find(
    (bank) => (bank.theme || "all") === theme,
  );
  return match?.id || catalog?.defaultBankId || "starters";
}
