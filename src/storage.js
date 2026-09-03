const DB_NAME = "little-fun-learning";
const DB_VERSION = 1;
const PROFILE_KEY = "default";

export function createDefaultProfile() {
  return {
    id: PROFILE_KEY,
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
    id: PROFILE_KEY,
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
          .get(PROFILE_KEY),
      ),
    );
    if (saved) return mergeProfile(saved);

    // One-time migration from the original localStorage implementation.
    const legacy = localStorageValue("little-fun-profile");
    const profile = mergeProfile(legacy);
    await saveProfile(profile);
    return profile;
  } catch {
    return mergeProfile(localStorageValue("little-fun-profile"));
  }
}

export async function saveProfile(profile) {
  saveLocalStorage("little-fun-profile", profile);
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

export async function clearLearningData() {
  try {
    await withDatabase(
      (db) =>
        new Promise((resolve, reject) => {
          const transaction = db.transaction(
            ["profile", "events"],
            "readwrite",
          );
          transaction.objectStore("profile").clear();
          transaction.objectStore("events").clear();
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error);
        }),
    );
  } catch {
    /* Continue clearing the compatibility copy. */
  }
  try {
    localStorage.removeItem("little-fun-profile");
  } catch {
    /* no-op */
  }
}
