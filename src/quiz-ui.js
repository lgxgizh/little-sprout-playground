/** Shared picture-choice quiz markup (A–D cards with optional PNG images). */

export function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

export function choiceLetter(index) {
  return ["A", "B", "C", "D"][index] || String(index + 1);
}

/**
 * Build a 2×2 (or fewer) grid of large picture cards.
 * Prefer `imageSrc`; fall back to emoji when no image is set.
 */
export function choiceGridMarkup(
  choices = [],
  {
    answer = "",
    selectedChoice = null,
    answered = false,
    disabled = false,
    prompt = "Choose a picture",
    showLabels = true,
  } = {},
) {
  return `<div class="choice-grid choice-grid-pictures" role="group" aria-label="${escapeHtml(prompt)}">${choices
    .map((choice, index) => {
      const isCorrect = answered && choice.value === answer;
      const isWrong =
        answered && selectedChoice === choice.value && choice.value !== answer;
      const letter = choiceLetter(index);
      const media = choice.imageSrc
        ? `<img class="choice-image" src="${escapeHtml(choice.imageSrc)}" alt="" loading="lazy" />`
        : `<span class="choice-emoji">${escapeHtml(choice.emoji || "⭐")}</span>`;
      const label = showLabels
        ? `<span class="choice-label">${escapeHtml(choice.label || letter)}</span>`
        : "";
      return `<button type="button" class="choice choice-picture ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}" data-choice="${escapeHtml(choice.value)}" aria-label="${escapeHtml(prompt)}: ${escapeHtml(choice.label || letter)}" style="--choice-color:${escapeHtml(choice.color || "#9ed9c4")}" ${answered || disabled ? "disabled" : ""}><span class="choice-letter">${letter}</span>${media}${label}${isCorrect ? '<b class="check">✓</b>' : ""}</button>`;
    })
    .join("")}</div>`;
}

export function listenButtonMarkup({ disabled = false } = {}) {
  return `<button type="button" class="voice-btn" id="voicePrompt" ${disabled ? "disabled" : ""}><span>🔊</span> Listen</button>`;
}
