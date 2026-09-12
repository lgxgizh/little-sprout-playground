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

export function isContrastBank(wordbank) {
  return (
    wordbank?.question_type === "contrast" ||
    (Array.isArray(wordbank?.pairs) && wordbank.pairs.length > 0)
  );
}

function choiceFromConcept(choice, assetBase = "/") {
  return {
    label: String(choice.lemma || choice.slug || "").replace(/^./, (letter) =>
      letter.toUpperCase(),
    ),
    emoji: choice.emoji || "🖼️",
    value: choice.slug,
    color: choice.color || "#9ed9c4",
    imageKey: choice.slug,
    imageSrc: wordImageSrc(
      { image: choice.image, fallback_image: choice.fallback_image },
      assetBase,
    ),
  };
}

/** Attribute families that should stay as pure 2-choice contrasts. */
const STRICT_CONTRAST_ATTRS = new Set([
  "big",
  "small",
  "tall",
  "short",
  "full",
  "empty",
]);

const ATTR_FAMILY = {
  big: "size",
  small: "size",
  tall: "height",
  short: "height",
  full: "fill",
  empty: "fill",
  red: "color",
  yellow: "color",
  green: "color",
  blue: "color",
};

function attrFamily(attr) {
  return ATTR_FAMILY[attr] || null;
}

function isNeutralPadChoice(choice, targetAttr) {
  const attrs = choice?.attrs || [];
  if (attrs.includes(targetAttr)) return false;
  const targetFamily = attrFamily(targetAttr);
  if (!targetFamily) return true;
  // Competing attrs from a *different* strict family confuse kids
  // (e.g. tree-tall inside "Which one is big?").
  for (const attr of attrs) {
    const family = attrFamily(attr);
    if (family && family !== targetFamily && STRICT_CONTRAST_ATTRS.has(attr)) {
      return false;
    }
  }
  return true;
}

/**
 * Build one contrast / attribute listening question from a pair + prompt.
 * Size/height/fill stay pure 2-choice; color packs may pad within family
 * or with neutral non-competing distractors only.
 */
export function buildContrastQuestion(
  pair,
  promptSpec,
  {
    childId = "default",
    assetBase = "/",
    salt = "contrast",
    padChoices = [],
    allowPad = true,
  } = {},
) {
  if (!pair || !promptSpec?.value) return null;
  const targetAttr = promptSpec.value;
  const answerChoice = (pair.choices || []).find((choice) =>
    (choice.attrs || []).includes(targetAttr),
  );
  if (!answerChoice) return null;
  const primary = [...(pair.choices || [])];
  const used = new Set(primary.map((choice) => choice.slug));
  const shouldPad =
    allowPad &&
    !STRICT_CONTRAST_ATTRS.has(targetAttr) &&
    Array.isArray(padChoices) &&
    padChoices.length;
  if (shouldPad) {
    for (const extra of padChoices) {
      if (primary.length >= 4) break;
      if (!extra?.slug || used.has(extra.slug)) continue;
      if (!isNeutralPadChoice(extra, targetAttr)) continue;
      used.add(extra.slug);
      primary.push(extra);
    }
  }
  if (primary.length < 2) return null;
  const random = mulberry32(seedFrom(childId, pair.id, targetAttr, salt));
  const choices = shuffleCopy(
    primary.map((choice) => choiceFromConcept(choice, assetBase)),
    random,
  );
  const prompt = promptSpec.prompt_en || `Which one is ${targetAttr}?`;
  return {
    id: `english-contrast-${pair.id}-${targetAttr}`,
    difficulty: 2,
    stage: 2,
    ageMin: 3,
    ageMax: 6,
    concept: `${pair.attribute || "contrast"}-${targetAttr}`,
    baseline: false,
    visual: answerChoice.emoji || "🎧",
    prompt,
    speech: promptSpec.speech || prompt,
    answer: answerChoice.slug,
    question_type: "contrast",
    choices,
  };
}

export function contrastQuestionSpecs(wordbank) {
  const specs = [];
  for (const pair of wordbank?.pairs || []) {
    for (const promptSpec of pair.prompts || []) {
      specs.push({ pair, promptSpec });
    }
  }
  return specs;
}

export function listeningPoolFromContrast(
  wordbank,
  { childId = "default", assetBase = "/", salt = "contrast" } = {},
) {
  const pairs = wordbank?.pairs || [];
  const byAttribute = new Map();
  for (const pair of pairs) {
    const key = pair.attribute || "contrast";
    if (!byAttribute.has(key)) byAttribute.set(key, []);
    byAttribute.get(key).push(...(pair.choices || []));
  }
  return contrastQuestionSpecs(wordbank)
    .map(({ pair, promptSpec }) => {
      const family =
        pair.attribute || attrFamily(promptSpec.value) || "contrast";
      const sameFamily = byAttribute.get(family) || pair.choices || [];
      const strict = STRICT_CONTRAST_ATTRS.has(promptSpec.value);
      return buildContrastQuestion(pair, promptSpec, {
        childId,
        assetBase,
        salt,
        // Size/height/fill: keep the pair as-is (usually 2 choices).
        // Color: pad only within the same attribute family.
        padChoices: strict ? [] : sameFamily,
        allowPad: !strict,
      });
    })
    .filter(Boolean);
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

/** Legacy localStorage / prefs ids → current catalog ids. */
const LEGACY_BANK_IDS = {
  "movers-lite": "movers",
};

export function normalizeListeningBankId(bankId) {
  if (!bankId) return bankId;
  return LEGACY_BANK_IDS[bankId] || bankId;
}

export function findListeningBank(catalog, bankId) {
  const banks = Array.isArray(catalog?.banks) ? catalog.banks : [];
  if (!banks.length) return null;
  const id = normalizeListeningBankId(bankId);
  return (
    banks.find((bank) => bank.id === id) ||
    banks.find((bank) => bank.id === catalog?.defaultBankId) ||
    banks[0]
  );
}

function bankHasContent(bank) {
  if (!bank || typeof bank !== "object") return false;
  if (Array.isArray(bank.words) && bank.words.length) return true;
  if (Array.isArray(bank.pairs) && bank.pairs.length) return true;
  return false;
}

export function resolveLoadedBank(bankEntry, loadedBanks = {}) {
  if (!bankEntry) return null;
  if (bankHasContent(loadedBanks[bankEntry.id])) {
    return loadedBanks[bankEntry.id];
  }
  if (bankEntry.file && bankHasContent(loadedBanks[bankEntry.file])) {
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
      const count = isContrastBank(wordbank)
        ? contrastQuestionSpecs(wordbank).length
        : words.length;
      return {
        id: bank.id,
        label: bank.label || bank.id,
        description: bank.description || "",
        file: bank.file || "",
        theme,
        count,
        words,
        source: wordbank,
        question_type: wordbank?.question_type || "identify",
      };
    })
    .filter((bank) => bank.id);
}

export function bankPreviewWords(bank, limit = 8) {
  if (isContrastBank(bank?.source || bank)) {
    const fromPairs = [];
    const seen = new Set();
    for (const pair of (bank?.source || bank)?.pairs || []) {
      for (const choice of pair.choices || []) {
        if (!choice.image || seen.has(choice.slug)) continue;
        seen.add(choice.slug);
        fromPairs.push({
          lemma: choice.lemma || choice.slug,
          image: choice.image,
          slug: choice.slug,
          theme: "concepts",
        });
      }
    }
    return fromPairs.slice(0, limit);
  }
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

export function recommendedListeningCount(available, preferred = 8) {
  const pool = Math.max(0, Number(available) || 0);
  if (!pool) return preferred;
  const allowed = LISTENING_COUNTS.filter((c) => c <= pool);
  if (allowed.includes(preferred)) return preferred;
  if (allowed.length) {
    const under = allowed.filter((c) => c <= preferred);
    return under.length ? under[under.length - 1] : allowed[allowed.length - 1];
  }
  return Math.min(preferred, pool);
}

export function visibleListeningCounts(available, counts = LISTENING_COUNTS) {
  const pool = Math.max(0, Number(available) || 0);
  if (!pool) return [...counts];
  const visible = counts.filter((c) => c <= pool);
  if (visible.length) return visible;
  return [pool];
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
  if (isContrastBank(wordbank)) {
    let pool = listeningPoolFromContrast(wordbank, {
      childId,
      assetBase,
      salt,
    });
    if (shuffle) {
      pool = shuffleCopy(pool, mulberry32(seedFrom(childId, "contrast", salt)));
    }
    return pool;
  }
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
    if (!parsed || typeof parsed !== "object") return {};
    if (parsed.bankId || parsed.listeningBankId) {
      parsed.bankId = normalizeListeningBankId(
        parsed.bankId || parsed.listeningBankId,
      );
    }
    return parsed;
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
