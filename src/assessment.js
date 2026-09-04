/** English ability check helpers for ~3-year-olds (picture + listening). */

export const BASELINE_MIN_ITEMS = 6;
export const BASELINE_TARGET_ITEMS = 10;
export const BASELINE_MAX_ITEMS = 12;

/**
 * Prefer marked baseline items, then gentle age-safe stage-1/2 fillers.
 * Returns up to BASELINE_MAX_ITEMS unique questions.
 */
export function selectBaselineQuestions(questions = [], age = 3) {
  const ageCompatible = questions.filter((question) => {
    const minAge = Number(question.ageMin) || 2;
    const maxAge = Number(question.ageMax) || 6;
    return age >= minAge && age <= maxAge;
  });
  const pool = ageCompatible.length ? ageCompatible : questions;
  const marked = pool.filter((question) => question.baseline);
  const fillers = pool
    .filter((question) => !question.baseline)
    .sort((left, right) => {
      const stageDelta =
        (Number(left.stage) || left.difficulty || 1) -
        (Number(right.stage) || right.difficulty || 1);
      return stageDelta || (left.difficulty || 1) - (right.difficulty || 1);
    });
  const selected = [];
  const seen = new Set();
  for (const question of marked) {
    if (!question?.id || seen.has(question.id)) continue;
    seen.add(question.id);
    selected.push(question);
    if (selected.length >= BASELINE_MAX_ITEMS) break;
  }
  if (selected.length < BASELINE_MIN_ITEMS) {
    for (const question of fillers) {
      if (!question?.id || seen.has(question.id)) continue;
      seen.add(question.id);
      selected.push(question);
      if (selected.length >= BASELINE_MIN_ITEMS) break;
    }
  }
  return selected.slice(0, BASELINE_MAX_ITEMS);
}

/**
 * Adaptive stop: keep going until a gentle picture of readiness emerges,
 * without forcing a long quiz on a tired toddler.
 */
export function shouldStopBaseline({
  answered = 0,
  correct = 0,
  recentCorrect = [],
} = {}) {
  if (answered >= BASELINE_MAX_ITEMS) return true;
  if (answered < BASELINE_MIN_ITEMS) return false;
  const lastThree = recentCorrect.slice(-3);
  const lastThreeWrong =
    lastThree.length === 3 && lastThree.every((value) => value === false);
  const lastThreeRight =
    lastThree.length === 3 && lastThree.every((value) => value === true);
  const ratio = answered ? correct / answered : 0;
  if (answered >= BASELINE_TARGET_ITEMS) return true;
  if (answered >= 8 && (ratio >= 0.75 || ratio <= 0.25)) return true;
  if (answered >= BASELINE_MIN_ITEMS && lastThreeWrong && ratio < 0.4)
    return true;
  if (answered >= 8 && lastThreeRight && ratio >= 0.7) return true;
  return false;
}

export function suggestedLevelFromBaseline(
  score,
  total = BASELINE_TARGET_ITEMS,
) {
  const ratio = total ? score / total : 0;
  if (ratio >= 0.8) return "words";
  if (ratio >= 0.5) return "songs";
  return "not-started";
}

export function parentFacingLevelLabel(level) {
  if (level === "words") return "picture words";
  if (level === "songs") return "songs and picture words";
  return "sounds and pictures";
}

/**
 * Gentle caregiver summary: celebrate concepts heard, never rank or shame.
 */
export function summarizeBaseline({
  score = 0,
  total = 0,
  answers = [],
  questions = [],
} = {}) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const heard = [];
  const stillGrowing = [];
  for (const answer of answers) {
    const question = byId.get(answer.questionId);
    const label =
      question?.concept ||
      question?.answer ||
      String(answer.questionId || "").replace(/^english-/, "");
    if (!label) continue;
    if (answer.correct) {
      if (!heard.includes(label)) heard.push(label);
    } else if (!stillGrowing.includes(label) && !heard.includes(label)) {
      stillGrowing.push(label);
    }
  }
  const level = suggestedLevelFromBaseline(score, total);
  const readyFor = parentFacingLevelLabel(level);
  const heardText = heard.slice(0, 4).join(", ");
  const growText = stillGrowing.slice(0, 3).join(", ");
  const headline =
    score >= Math.ceil(total * 0.7)
      ? "Your little listener enjoyed these pictures!"
      : score >= Math.ceil(total * 0.4)
        ? "Nice listening warm-up together."
        : "A gentle start—looking and listening counts.";
  const detailParts = [];
  if (heardText) detailParts.push(`Heard well: ${heardText}`);
  if (growText) detailParts.push(`Play again later with: ${growText}`);
  detailParts.push(`Ready for: ${readyFor}`);
  return {
    headline,
    detail: detailParts.join(" · "),
    score,
    total,
    suggestedLevel: level,
    readyFor,
    heardConcepts: heard,
    growingConcepts: stillGrowing,
  };
}
