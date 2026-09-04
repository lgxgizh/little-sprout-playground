/**
 * Compatibility shim — animation/GIF comprehension lives in animation-quiz.js.
 * Prefer importing from "./animation-quiz.js" in new code.
 */
export {
  createDemoAnimations as createDemoVideos,
  createDemoAnimations,
  normalizeAnimationEntry as normalizeVideoEntry,
  normalizeAnimationEntry,
  normalizeAnimationQuestion as normalizeVideoQuestion,
  normalizeAnimationQuestion,
  loadAnimationLibrary as loadVideoLibrary,
  loadAnimationLibrary,
  saveAnimationLibrary as saveVideoLibrary,
  saveAnimationLibrary,
  mergeAnimationShelf as mergeVideoShelf,
  mergeAnimationShelf,
  summarizeAnimationAttempts as summarizeVideoAttempts,
  summarizeAnimationAttempts,
  parentAnimationSummary as parentVideoSummary,
  parentAnimationSummary,
  ANIMATION_FEATURE,
} from "./animation-quiz.js";
