/** Listening-test helpers: choice PNG map + gentle level summary glue. */

export const CHOICE_ASSET_FILES = {
  apple: "apple.png",
  banana: "banana.png",
  cat: "cat.png",
  dog: "dog.png",
  ball: "ball.png",
  cup: "cup.png",
  star: "star.png",
  fish: "fish.png",
};

export const LISTENING_FEATURE = {
  id: "listening",
  courseId: "english",
  title: "Listening test",
  titleZh: "听力测试",
  subtitle: "Hear an English question, then tap a picture",
  subtitleZh: "听英文提问，点选大图卡片",
  emoji: "🎧",
  tone: "sky",
};

export function choiceImageSrc(key, assetBase = "/") {
  const file = CHOICE_ASSET_FILES[key];
  if (!file) return "";
  const base = assetBase.endsWith("/") ? assetBase : `${assetBase}/`;
  return `${base}assets/choices/${file}`;
}

export function withChoiceImages(choices = [], assetBase = "/") {
  return choices.map((choice) => {
    const key = String(choice?.imageKey || choice?.value || "")
      .toLowerCase()
      .replace(/\s+/g, "-");
    const mapped = choiceImageSrc(key, assetBase);
    const imageSrc = choice?.imageSrc || mapped || "";
    return {
      ...choice,
      imageSrc,
      emoji: choice?.emoji || (imageSrc ? "🖼️" : "⭐"),
    };
  });
}

/**
 * Attach absolute imageSrc paths for known keys (and keep emoji fallback).
 */
export function enrichQuestionImages(question, assetBase = "/") {
  if (!question || typeof question !== "object") return question;
  return {
    ...question,
    choices: withChoiceImages(question.choices || [], assetBase),
  };
}

export function enrichQuestionBank(bank, assetBase = "/") {
  const next = { ...bank };
  for (const key of Object.keys(next)) {
    if (!Array.isArray(next[key])) continue;
    next[key] = next[key].map((question) =>
      enrichQuestionImages(question, assetBase),
    );
  }
  return next;
}

/** Built-in listening/vocab items that use the shipped choice PNGs. */
export function createListeningSeedQuestions(assetBase = "/") {
  const img = (key) => choiceImageSrc(key, assetBase);
  const card = (value, label, color, emoji) => ({
    label,
    value,
    color,
    emoji,
    imageSrc: img(value),
    imageKey: value,
  });

  return [
    {
      id: "english-apple",
      baseline: true,
      difficulty: 1,
      stage: 1,
      ageMin: 2,
      ageMax: 4,
      concept: "apple",
      visual: "🍎",
      prompt: "Which one is an apple?",
      speech: "Which one is an apple?",
      answer: "apple",
      choices: [
        card("apple", "Apple", "#ff6b5e", "🍎"),
        card("banana", "Banana", "#f7c94b", "🍌"),
        card("cat", "Cat", "#f3b56d", "🐱"),
        card("ball", "Ball", "#6db6e8", "⚽"),
      ],
    },
    {
      id: "english-cat",
      baseline: true,
      difficulty: 1,
      stage: 1,
      ageMin: 2,
      ageMax: 4,
      concept: "cat",
      visual: "🐱",
      prompt: "Which one is a cat?",
      speech: "Which one is a cat?",
      answer: "cat",
      choices: [
        card("dog", "Dog", "#d9a66f", "🐶"),
        card("cat", "Cat", "#f3b56d", "🐱"),
        card("fish", "Fish", "#6db6e8", "🐟"),
        card("cup", "Cup", "#9ed9c4", "🥤"),
      ],
    },
    {
      id: "english-dog",
      baseline: true,
      difficulty: 1,
      stage: 1,
      ageMin: 2,
      ageMax: 5,
      concept: "dog",
      visual: "🐶",
      prompt: "Which one is a dog?",
      speech: "Which one is a dog?",
      answer: "dog",
      choices: [
        card("dog", "Dog", "#d9a66f", "🐶"),
        card("fish", "Fish", "#6db6e8", "🐟"),
        card("cat", "Cat", "#f3b56d", "🐱"),
        card("star", "Star", "#f7c94b", "⭐"),
      ],
    },
    {
      id: "english-ball-noun",
      baseline: true,
      difficulty: 1,
      stage: 1,
      ageMin: 2,
      ageMax: 4,
      concept: "ball",
      visual: "⚽",
      prompt: "Which one is a ball?",
      speech: "Which one is a ball?",
      answer: "ball",
      choices: [
        card("ball", "Ball", "#6db6e8", "⚽"),
        card("cup", "Cup", "#9ed9c4", "🥤"),
        card("star", "Star", "#f7c94b", "⭐"),
        card("apple", "Apple", "#ff6b5e", "🍎"),
      ],
    },
    {
      id: "english-cup",
      baseline: true,
      difficulty: 1,
      stage: 1,
      ageMin: 2,
      ageMax: 4,
      concept: "cup",
      visual: "🥤",
      prompt: "Find the cup",
      speech: "Can you find the cup?",
      answer: "cup",
      choices: [
        card("cup", "Cup", "#9ed9c4", "🥤"),
        card("ball", "Ball", "#6db6e8", "⚽"),
        card("fish", "Fish", "#6db6e8", "🐟"),
        card("banana", "Banana", "#f7c94b", "🍌"),
      ],
    },
    {
      id: "english-fish",
      baseline: true,
      difficulty: 1,
      stage: 2,
      ageMin: 2,
      ageMax: 5,
      concept: "fish",
      visual: "🐟",
      prompt: "Which one is a fish?",
      speech: "Which one is a fish?",
      answer: "fish",
      choices: [
        card("fish", "Fish", "#6db6e8", "🐟"),
        card("dog", "Dog", "#d9a66f", "🐶"),
        card("cat", "Cat", "#f3b56d", "🐱"),
        card("apple", "Apple", "#ff6b5e", "🍎"),
      ],
    },
    {
      id: "english-star",
      baseline: true,
      difficulty: 1,
      stage: 2,
      ageMin: 2,
      ageMax: 5,
      concept: "star",
      visual: "⭐",
      prompt: "Find the star",
      speech: "Can you find the star?",
      answer: "star",
      choices: [
        card("star", "Star", "#f7c94b", "⭐"),
        card("ball", "Ball", "#6db6e8", "⚽"),
        card("cup", "Cup", "#9ed9c4", "🥤"),
        card("banana", "Banana", "#f7c94b", "🍌"),
      ],
    },
    {
      id: "english-banana",
      baseline: true,
      difficulty: 1,
      stage: 2,
      ageMin: 2,
      ageMax: 5,
      concept: "banana",
      visual: "🍌",
      prompt: "Which one is a banana?",
      speech: "Which one is a banana?",
      answer: "banana",
      choices: [
        card("apple", "Apple", "#ff6b5e", "🍎"),
        card("banana", "Banana", "#f7c94b", "🍌"),
        card("cup", "Cup", "#9ed9c4", "🥤"),
        card("dog", "Dog", "#d9a66f", "🐶"),
      ],
    },
    {
      id: "english-eat-apple",
      difficulty: 2,
      stage: 3,
      ageMin: 3,
      ageMax: 6,
      concept: "apple",
      visual: "🍎",
      prompt: "Eat the apple",
      speech: "Eat the apple.",
      answer: "apple",
      choices: [
        card("apple", "Apple", "#ff6b5e", "🍎"),
        card("ball", "Ball", "#6db6e8", "⚽"),
        card("star", "Star", "#f7c94b", "⭐"),
        card("fish", "Fish", "#6db6e8", "🐟"),
      ],
    },
    {
      id: "english-find-dog",
      difficulty: 2,
      stage: 3,
      ageMin: 3,
      ageMax: 6,
      concept: "dog",
      visual: "🐶",
      prompt: "Find the dog",
      speech: "Find the dog.",
      answer: "dog",
      choices: [
        card("cat", "Cat", "#f3b56d", "🐱"),
        card("dog", "Dog", "#d9a66f", "🐶"),
        card("fish", "Fish", "#6db6e8", "🐟"),
        card("cup", "Cup", "#9ed9c4", "🥤"),
      ],
    },
  ];
}
