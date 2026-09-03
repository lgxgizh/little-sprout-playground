const DB_NAME = "little-sprout-playground";
const DB_VERSION = 2;
const PROFILE_STORAGE_KEY = "little-sprout-profile";
const LEGACY_PROFILE_KEY = "little-fun-profile";
const DEFAULT_PROFILE_ID = "default";

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
    },
    events: [],
    awards: [],
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

function mergeProfile(saved) {
  const defaults = createDefaultProfile();
  return {
    ...defaults,
    ...(saved || {}),
    id: DEFAULT_PROFILE_ID,
    skills: { ...defaults.skills, ...(saved?.skills || {}) },
    events: saved?.events || [],
    awards: saved?.awards || [],
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
            ["profile", "events", "sessions", "attempts", "rewards"],
            "readwrite",
          );
          transaction.objectStore("profile").clear();
          transaction.objectStore("events").clear();
          transaction.objectStore("sessions").clear();
          transaction.objectStore("attempts").clear();
          transaction.objectStore("rewards").clear();
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
  } catch {
    /* no-op */
  }
}
