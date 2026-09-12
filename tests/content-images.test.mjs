import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, openSync, readSync, closeSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  catalogBankFiles,
  findListeningBank,
  listeningPoolForBank,
  listListeningBanks,
} from "../src/wordbank.js";

function isValidRaster(path) {
  if (!existsSync(path)) return { ok: false, reason: "missing" };
  const size = statSync(path).size;
  if (!size) return { ok: false, reason: "empty" };
  const fd = openSync(path, "r");
  try {
    const buf = Buffer.alloc(8);
    const n = readSync(fd, buf, 0, 8, 0);
    if (n < 3) return { ok: false, reason: "too-short" };
    const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const png =
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    if (!jpeg && !png) {
      return {
        ok: false,
        reason: `bad-magic:${buf.slice(0, 4).toString("hex")}`,
      };
    }
    return { ok: true, kind: jpeg ? "jpeg" : "png", size };
  } finally {
    closeSync(fd);
  }
}

function collectImagePaths(wordbank) {
  const paths = new Set();
  for (const word of wordbank?.words || []) {
    if (word?.image) paths.add(word.image);
    if (word?.fallback_image) paths.add(word.fallback_image);
  }
  for (const pair of wordbank?.pairs || []) {
    for (const choice of pair.choices || []) {
      if (choice?.image) paths.add(choice.image);
      if (choice?.fallback_image) paths.add(choice.fallback_image);
    }
  }
  return [...paths];
}

const catalog = JSON.parse(
  await readFile("public/content/wordbanks.json", "utf8"),
);
const bankFiles = catalogBankFiles(catalog);
const loadedBanks = {};
for (const fileName of bankFiles) {
  const payload = JSON.parse(
    await readFile(join("public/content", fileName), "utf8"),
  );
  loadedBanks[fileName] = payload;
  const id = fileName.replace(/^wordbank\./, "").replace(/\.json$/, "");
  loadedBanks[id] = payload;
}

test("catalog bank image and fallback_image files are valid JPEG/PNG", () => {
  const missing = [];
  for (const fileName of bankFiles) {
    const wordbank = loadedBanks[fileName];
    for (const rel of collectImagePaths(wordbank)) {
      // Primary flashcard paths must exist. Legacy assets/choices fallbacks
      // may be absent when the primary flashcard path is present.
      if (rel.startsWith("assets/choices/")) continue;
      const full = join("public", rel);
      const result = isValidRaster(full);
      if (!result.ok) missing.push(`${fileName}:${rel} (${result.reason})`);
    }
  }
  assert.deepEqual(missing, []);
});

test("every catalog bank builds questions with resolvable choice images", () => {
  const banks = listListeningBanks(catalog, loadedBanks);
  assert.ok(banks.length >= 7);
  const problems = [];
  for (const bank of banks) {
    const entry = findListeningBank(catalog, bank.id);
    const pool = listeningPoolForBank(entry, loadedBanks, {
      assetBase: "./",
      childId: "image-audit",
    });
    assert.ok(pool.length > 0, `${bank.id} pool empty`);
    for (const question of pool) {
      for (const choice of question.choices || []) {
        if (!choice.imageSrc) {
          problems.push(`${bank.id}:${question.id}:${choice.value}:empty-src`);
          continue;
        }
        const rel = String(choice.imageSrc).replace(/^\.?\//, "");
        const full = join("public", rel);
        const result = isValidRaster(full);
        if (!result.ok) {
          problems.push(
            `${bank.id}:${question.id}:${choice.value}:${choice.imageSrc} (${result.reason})`,
          );
        }
      }
    }
  }
  assert.deepEqual(problems, []);
});

test("feelings/actions/adjectives choice paths stay under flashcards/", () => {
  for (const id of ["feelings", "actions", "adjectives"]) {
    const entry = findListeningBank(catalog, id);
    const pool = listeningPoolForBank(entry, loadedBanks, {
      assetBase: "./",
      childId: "skill-paths",
    });
    for (const question of pool) {
      for (const choice of question.choices || []) {
        assert.match(
          choice.imageSrc,
          new RegExp(`assets/flashcards/${id}/`),
          `${id}:${choice.value}`,
        );
      }
    }
  }
});
