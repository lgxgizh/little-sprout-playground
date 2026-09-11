import { createEnglishPlan, normalizeEnglishPlan } from "./learning-plan.js";

const DB_NAME = "little-sprout-playground";
const DB_VERSION = 2;
const PROFILE_STORAGE_KEY = "little-sprout-profile";
const LEGACY_PROFILE_KEY = "little-fun-profile";
const CHILDREN_STORAGE_KEY = "little-sprout-children";
const DEFAULT_PROFILE_ID = "default";

function safeString(value, maxLength, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/[<>]/g, "").trim().slice(0, maxLength) || fallback;
}

function safeInteger(value, min, max, fallback = min) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

function safeIso(value) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function safeDay(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : null;
}

function normalizeSkill(saved) {
  const attempts = safeInteger(saved?.attempts, 0, 100000);
  return {
    attempts,
    correct: Math.min(attempts, safeInteger(saved?.correct, 0, 100000)),
    lastPracticed: safeIso(saved?.lastPracticed),
  };
}

export function createDefaultProfile() {
  return {
    id: DEFAULT_PROFILE_ID,
    totalSessions: 0,
    totalAnswers: 0,
    correctAnswers: 0,
    stars: 0,
    streak: 0,
    lastActive: null,
    skills: {
      colors: { attempts: 0, correct: 0, lastPracticed: null },
      animals: { attempts: 0, correct: 0, lastPracticed: null },
      shapes: { attempts: 0, correct: 0, lastPracticed: null },
      english: { attempts: 0, correct: 0, lastPracticed: null },
      video: { attempts: 0, correct: 0, lastPracticed: null },
    },
    questionStats: {},
    events: [],
    awards: [],
  };
}

export function createDefaultChild(options = {}) {
  const now = new Date().toISOString();
  return {
    id:
      options.id ||
      `child-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`,
    nickname: safeString(options.nickname, 12, "小朋友"),
    age: safeInteger(options.age, 2, 6, 3),
    gender: ["unspecified", "girl", "boy"].includes(options.gender)
      ? options.gender
      : "unspecified",
    englishLevel: ["not-started", "songs", "words", "conversation"].includes(
      options.englishLevel,
    )
      ? options.englishLevel
      : "not-started",
    englishPlan: normalizeEnglishPlan(
      options.englishPlan || createEnglishPlan(),
    ),
    baseline: options.baseline || {
      status: "not-started",
      score: null,
      total: 10,
      completedAt: null,
      suggestedLevel: null,
      summary: null,
    },
    createdAt: options.createdAt || now,
    profile: options.profile || createDefaultProfile(),
  };
}

function localStorageValue(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function saveLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 无痕模式或存储空间不足时，内存中的会话仍然可用 */
  }
}

function mergeChild(saved) {
  const source = saved && typeof saved === "object" ? saved : {};
  const child = createDefaultChild(source);
  const baseline =
    source.baseline && typeof source.baseline === "object"
      ? source.baseline
      : {};
  return {
    ...child,
    id: safeString(source.id, 80, child.id),
    nickname: safeString(source.nickname, 12, child.nickname),
    age: safeInteger(source.age, 2, 6, child.age),
    gender: ["unspecified", "girl", "boy"].includes(source.gender)
      ? source.gender
      : child.gender,
    englishLevel: ["not-started", "songs", "words", "conversation"].includes(
      source.englishLevel,
    )
      ? source.englishLevel
      : child.englishLevel,
    createdAt: safeIso(source.createdAt) || child.createdAt,
    profile: mergeProfile(source.profile || source),
    baseline: {
      ...child.baseline,
      status: baseline.status === "complete" ? "complete" : "not-started",
      score:
        baseline.status === "complete"
          ? safeInteger(baseline.score, 0, 3, 0)
          : null,
      total: 3,
      completedAt:
        baseline.status === "complete" ? safeIso(baseline.completedAt) : null,
      suggestedLevel: ["not-started", "songs", "words"].includes(
        baseline.suggestedLevel,
      )
        ? baseline.suggestedLevel
        : null,
    },
    englishPlan: normalizeEnglishPlan(
      source.englishPlan || source.profile?.englishPlan,
    ),
  };
}

function localChildrenValue() {
  const saved = localStorageValue(CHILDREN_STORAGE_KEY);
  return Array.isArray(saved) ? saved.map(mergeChild) : [];
}

function mergeProfile(saved) {
  const defaults = createDefaultProfile();
  const source = saved && typeof saved === "object" ? saved : {};
  const skills = Object.fromEntries(
    Object.keys(defaults.skills).map((key) => [
      key,
      normalizeSkill(source.skills?.[key]),
    ]),
  );
  const questionStats = {};
  if (source.questionStats && typeof source.questionStats === "object") {
    for (const [questionId, savedStat] of Object.entries(
      source.questionStats,
    ).slice(0, 300)) {
      const id = safeString(questionId, 100);
      if (!id || !savedStat || typeof savedStat !== "object") continue;
      const attempts = safeInteger(savedStat.attempts, 0, 100000);
      questionStats[id] = {
        attempts,
        correct: Math.min(attempts, safeInteger(savedStat.correct, 0, 100000)),
        lastPracticed: safeIso(savedStat.lastPracticed),
        lastCorrect:
          typeof savedStat.lastCorrect === "boolean"
            ? savedStat.lastCorrect
            : null,
      };
    }
  }
  const events = Array.isArray(source.events)
    ? source.events
        .filter((event) => event && typeof event === "object")
        .slice(-60)
        .map((event) => ({
          type: safeString(event.type, 40, "unknown"),
          courseId: safeString(event.courseId, 40, "unknown"),
          questionId: safeString(event.questionId, 100, ""),
          difficulty: safeInteger(event.difficulty, 1, 3, 1),
          correct:
            typeof event.correct === "boolean" ? event.correct : undefined,
          at: safeIso(event.at),
          durationMs: safeInteger(event.durationMs, 0, 86400000, 0),
        }))
        .filter((event) => event.at)
    : [];
  const awards = Array.isArray(source.awards)
    ? source.awards
        .filter((award) => award && typeof award === "object")
        .slice(-100)
        .map((award) => ({
          id: safeString(award.id, 100, `award-${Date.now()}`),
          label: safeString(award.label, 120, "A little win"),
          at: safeIso(award.at) || new Date().toISOString(),
        }))
    : [];
  return {
    ...defaults,
    ...source,
    id: DEFAULT_PROFILE_ID,
    totalSessions: safeInteger(source.totalSessions, 0, 100000),
    totalAnswers: safeInteger(source.totalAnswers, 0, 1000000),
    correctAnswers: Math.min(
      safeInteger(source.totalAnswers, 0, 1000000),
      safeInteger(source.correctAnswers, 0, 1000000),
    ),
    stars: safeInteger(source.stars, 0, 1000000),
    streak: safeInteger(source.streak, 0, 100000),
    lastActive: safeDay(source.lastActive),
    skills,
    questionStats,
    events,
    awards,
  };
}

function openDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("profile")) {
        db.createObjectStore("profile", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("events")) {
        const events = db.createObjectStore("events", {
          keyPath: "id",
          autoIncrement: true,
        });
        events.createIndex("by-time", "at");
        events.createIndex("by-course", "courseId");
      }
      if (!db.objectStoreNames.contains("children")) {
        db.createObjectStore("children", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("sessions")) {
        const sessions = db.createObjectStore("sessions", { keyPath: "id" });
        sessions.createIndex("by-start", "startedAt");
        sessions.createIndex("by-course", "courseId");
      }
      if (!db.objectStoreNames.contains("attempts")) {
        const attempts = db.createObjectStore("attempts", { keyPath: "id" });
        attempts.createIndex("by-session", "sessionId");
        attempts.createIndex("by-course", "courseId");
      }
      if (!db.objectStoreNames.contains("rewards")) {
        const rewards = db.createObjectStore("rewards", { keyPath: "id" });
        rewards.createIndex("by-time", "at");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withDatabase(action) {
  const db = await openDatabase();
  try {
    return await action(db);
  } finally {
    db.close();
  }
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadProfile() {
  try {
    const saved = await withDatabase((db) =>
      requestToPromise(
        db
          .transaction("profile", "readonly")
          .objectStore("profile")
          .get(DEFAULT_PROFILE_ID),
      ),
    );
    if (saved) return mergeProfile(saved);

    // One-time migration from the original localStorage implementation.
    const legacy =
      localStorageValue(PROFILE_STORAGE_KEY) ||
      localStorageValue(LEGACY_PROFILE_KEY);
    const profile = mergeProfile(legacy);
    await saveProfile(profile);
    return profile;
  } catch {
    return mergeProfile(
      localStorageValue(PROFILE_STORAGE_KEY) ||
        localStorageValue(LEGACY_PROFILE_KEY),
    );
  }
}

export async function saveProfile(profile) {
  saveLocalStorage(PROFILE_STORAGE_KEY, profile);
  try {
    await withDatabase((db) =>
      requestToPromise(
        db
          .transaction("profile", "readwrite")
          .objectStore("profile")
          .put(profile),
      ),
    );
  } catch {
    // localStorage backup above is the graceful fallback for unsupported browsers.
  }
}

export async function loadChildren() {
  try {
    const records = await withDatabase((db) =>
      requestToPromise(
        db.transaction("children", "readonly").objectStore("children").getAll(),
      ),
    );
    if (records.length) {
      const normalized = records.map(mergeChild);
      saveLocalStorage(CHILDREN_STORAGE_KEY, normalized);
      return normalized;
    }
    const local = localChildrenValue();
    if (local.length) return local;
  } catch {
    const local = localChildrenValue();
    if (local.length) return local;
  }

  const legacyProfile = await loadProfile();
  const child = createDefaultChild({
    id: "child-default",
    nickname: "小朋友",
    profile: legacyProfile,
  });
  await saveChild(child);
  return [child];
}

export async function saveChild(child) {
  const normalized = mergeChild(child);
  const children = localChildrenValue().filter(
    (item) => item.id !== normalized.id,
  );
  children.push(normalized);
  saveLocalStorage(CHILDREN_STORAGE_KEY, children);
  try {
    await withDatabase((db) =>
      requestToPromise(
        db
          .transaction("children", "readwrite")
          .objectStore("children")
          .put(normalized),
      ),
    );
  } catch {
    // localStorage backup above is the graceful fallback.
  }
  return normalized;
}

export async function deleteChild(childId) {
  const children = localChildrenValue().filter((item) => item.id !== childId);
  saveLocalStorage(CHILDREN_STORAGE_KEY, children);
  try {
    await withDatabase((db) =>
      requestToPromise(
        db
          .transaction("children", "readwrite")
          .objectStore("children")
          .delete(childId),
      ),
    );
  } catch {
    // localStorage remains available if IndexedDB is unavailable.
  }
}

export function serializeLearningData(children, modelSettings = {}) {
  return JSON.stringify(
    {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      children: children.map((child) => mergeChild(child)),
      modelSettings: {
        image: modelSettings.image,
        voice: modelSettings.voice,
        vocab: modelSettings.vocab,
        video: modelSettings.video,
        custom: modelSettings.custom || undefined,
      },
    },
    null,
    2,
  );
}

export function parseLearningData(input) {
  let payload;
  try {
    payload = typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    throw new Error("学习档案不是有效的 JSON 文件");
  }
  if (!payload || payload.schemaVersion !== 1)
    throw new Error("学习档案版本不受支持");
  if (!Array.isArray(payload.children) || payload.children.length < 1)
    throw new Error("至少需要一个孩子档案");
  if (payload.children.length > 8) throw new Error("孩子档案最多支持 8 个");
  const childIds = new Set();
  const children = payload.children.map((saved) => {
    if (!saved || typeof saved !== "object")
      throw new Error("孩子档案格式不正确");
    if (typeof saved.nickname !== "string" || !saved.nickname.trim())
      throw new Error("孩子昵称不能为空");
    if (saved.nickname.trim().length > 12)
      throw new Error("孩子昵称不能超过 12 个字");
    if (
      !Number.isInteger(Number(saved.age)) ||
      Number(saved.age) < 2 ||
      Number(saved.age) > 6
    )
      throw new Error("孩子年龄必须在 2 到 6 岁之间");
    if (saved.gender && !["unspecified", "girl", "boy"].includes(saved.gender))
      throw new Error("孩子性别字段不受支持");
    if (
      saved.englishLevel &&
      !["not-started", "songs", "words", "conversation"].includes(
        saved.englishLevel,
      )
    )
      throw new Error("英语基础字段不受支持");
    if (saved.id && childIds.has(saved.id))
      throw new Error("孩子档案 ID 不能重复");
    if (saved.id) childIds.add(saved.id);
    if (!saved.profile || typeof saved.profile !== "object")
      throw new Error("学习档案数据不完整");
    return mergeChild({
      ...saved,
      nickname: saved.nickname.trim(),
      profile: {
        ...saved.profile,
        events: Array.isArray(saved.profile.events)
          ? saved.profile.events.slice(-60)
          : [],
        awards: Array.isArray(saved.profile.awards)
          ? saved.profile.awards.slice(-100)
          : [],
      },
    });
  });
  const modelSettings = {};
  for (const key of ["image", "voice", "vocab", "video"]) {
    if (typeof payload.modelSettings?.[key] === "string")
      modelSettings[key] = payload.modelSettings[key].slice(0, 80);
  }
  if (
    payload.modelSettings?.custom &&
    typeof payload.modelSettings.custom === "object"
  ) {
    modelSettings.custom = payload.modelSettings.custom;
  }
  return { schemaVersion: 1, children, modelSettings };
}

export async function replaceLearningData(payload) {
  const parsed = parseLearningData(payload);
  await clearLearningData();
  for (const child of parsed.children) await saveChild(child);
  return parsed;
}

export async function addLearningEvent(event) {
  try {
    await withDatabase((db) =>
      requestToPromise(
        db.transaction("events", "readwrite").objectStore("events").add(event),
      ),
    );
  } catch {
    /* Profile.events still keeps a compact local history if IndexedDB is unavailable. */
  }
}

export async function saveSession(session) {
  try {
    await withDatabase((db) =>
      requestToPromise(
        db
          .transaction("sessions", "readwrite")
          .objectStore("sessions")
          .put(session),
      ),
    );
  } catch {
    /* The compact profile event remains the fallback. */
  }
}

export async function saveAttempt(attempt) {
  try {
    await withDatabase((db) =>
      requestToPromise(
        db
          .transaction("attempts", "readwrite")
          .objectStore("attempts")
          .put(attempt),
      ),
    );
  } catch {
    /* The compact profile event remains the fallback. */
  }
}

export async function saveReward(reward) {
  try {
    await withDatabase((db) =>
      requestToPromise(
        db
          .transaction("rewards", "readwrite")
          .objectStore("rewards")
          .put(reward),
      ),
    );
  } catch {
    /* Rewards are also summarized in profile.awards. */
  }
}

export async function clearLearningData() {
  try {
    await withDatabase(
      (db) =>
        new Promise((resolve, reject) => {
          const transaction = db.transaction(
            [
              "profile",
              "events",
              "sessions",
              "attempts",
              "rewards",
              "children",
            ],
            "readwrite",
          );
          transaction.objectStore("profile").clear();
          transaction.objectStore("events").clear();
          transaction.objectStore("sessions").clear();
          transaction.objectStore("attempts").clear();
          transaction.objectStore("rewards").clear();
          transaction.objectStore("children").clear();
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error);
        }),
    );
  } catch {
    /* Continue clearing the compatibility copy. */
  }
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(LEGACY_PROFILE_KEY);
    localStorage.removeItem(CHILDREN_STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
