function sticker(name) {
  return `assets/questions/${name}.jpg`;
}

export const courses = [
  {
    id: "colors",
    label: "找颜色",
    labelEn: "Color Hunt",
    subtitle: "看图找出颜色",
    emoji: "🌈",
    cover: sticker("blueberry"),
    tone: "peach",
    duration: "5 分钟",
    tag: "今天推荐",
  },
  {
    id: "animals",
    label: "小动物",
    labelEn: "Animal Sounds",
    subtitle: "听声音找动物",
    emoji: "🐼",
    cover: sticker("cat"),
    tone: "mint",
    duration: "5 分钟",
    tag: "好玩声音",
  },
  {
    id: "shapes",
    label: "找形状",
    labelEn: "Shape Search",
    subtitle: "找出圆和方",
    emoji: "🔵",
    cover: sticker("circle"),
    tone: "lavender",
    duration: "5 分钟",
    tag: "动手玩",
  },
  {
    id: "english",
    label: "英语耳朵",
    labelEn: "English Ears",
    subtitle: "听英语，选图片",
    emoji: "🔤",
    cover: sticker("apple"),
    tone: "sky",
    duration: "5 分钟",
    tag: "英语启蒙",
  },
];

export const questionBank = {
  colors: [
    {
      id: "color-blue-fruit",
      difficulty: 1,
      visual: "🫐",
      image: sticker("blueberry"),
      prompt: "Find the blue fruit",
      speech: "Can you find the blue fruit?",
      answer: "blue",
      choices: [
        {
          label: "Red",
          emoji: "🍎",
          value: "red",
          color: "#ff6b5e",
          image: sticker("apple"),
        },
        {
          label: "Yellow",
          emoji: "🍌",
          value: "yellow",
          color: "#f7c94b",
          image: sticker("banana"),
        },
        {
          label: "Blue",
          emoji: "🫐",
          value: "blue",
          color: "#6db6e8",
          image: sticker("blueberry"),
        },
      ],
    },
    {
      id: "color-red-flower",
      difficulty: 1,
      visual: "🌹",
      image: sticker("rose"),
      prompt: "Which flower is red?",
      speech: "Can you find the red flower?",
      answer: "red",
      choices: [
        {
          label: "Red",
          emoji: "🌹",
          value: "red",
          color: "#ff6b5e",
          image: sticker("rose"),
        },
        {
          label: "Yellow",
          emoji: "🌻",
          value: "yellow",
          color: "#f7c94b",
          image: sticker("sunflower"),
        },
        {
          label: "Blue",
          emoji: "🪻",
          value: "blue",
          color: "#6db6e8",
          image: sticker("hyacinth"),
        },
      ],
    },
    {
      id: "color-yellow-sun",
      difficulty: 2,
      visual: "⭐",
      image: sticker("star-yellow"),
      prompt: "Give the yellow one to the bear",
      speech: "Find the yellow one and give it to the bear.",
      answer: "yellow",
      choices: [
        {
          label: "Blue",
          emoji: "🧢",
          value: "blue",
          color: "#6db6e8",
          image: sticker("cap-blue"),
        },
        {
          label: "Yellow",
          emoji: "⭐",
          value: "yellow",
          color: "#f7c94b",
          image: sticker("star-yellow"),
        },
        {
          label: "Red",
          emoji: "🧣",
          value: "red",
          color: "#ff6b5e",
          image: sticker("scarf-red"),
        },
      ],
    },
  ],
  animals: [
    {
      id: "animal-cat",
      difficulty: 1,
      visual: "🐱",
      image: sticker("cat"),
      prompt: "Who says meow?",
      speech: "Find the animal that says meow.",
      answer: "cat",
      choices: [
        {
          label: "Cat",
          emoji: "🐱",
          value: "cat",
          color: "#f3b56d",
          image: sticker("cat"),
        },
        {
          label: "Duck",
          emoji: "🦆",
          value: "duck",
          color: "#f7c94b",
          image: sticker("duck"),
        },
        {
          label: "Cow",
          emoji: "🐮",
          value: "cow",
          color: "#9ed9c4",
          image: sticker("cow"),
        },
      ],
    },
    {
      id: "animal-duck",
      difficulty: 2,
      visual: "🦆",
      image: sticker("duck"),
      prompt: "Find the animal that says quack",
      speech: "Can you find the animal that says quack?",
      answer: "duck",
      choices: [
        {
          label: "Dog",
          emoji: "🐶",
          value: "dog",
          color: "#d9a66f",
          image: sticker("dog"),
        },
        {
          label: "Duck",
          emoji: "🦆",
          value: "duck",
          color: "#f7c94b",
          image: sticker("duck"),
        },
        {
          label: "Sheep",
          emoji: "🐑",
          value: "sheep",
          color: "#e8e8dc",
          image: sticker("sheep"),
        },
      ],
    },
  ],
  shapes: [
    {
      id: "shape-circle",
      difficulty: 1,
      visual: "🔵",
      image: sticker("circle"),
      prompt: "Find a round shape",
      speech: "Can you find the round shape?",
      answer: "circle",
      choices: [
        {
          label: "Circle",
          emoji: "⚪",
          value: "circle",
          color: "#6db6e8",
          image: sticker("circle"),
        },
        {
          label: "Square",
          emoji: "🟨",
          value: "square",
          color: "#f7c94b",
          image: sticker("square"),
        },
        {
          label: "Triangle",
          emoji: "🔺",
          value: "triangle",
          color: "#ff8b76",
          image: sticker("triangle"),
        },
      ],
    },
    {
      id: "shape-square",
      difficulty: 2,
      visual: "🟨",
      image: sticker("square"),
      prompt: "Which shape looks like a block?",
      speech: "Which shape looks like a block?",
      answer: "square",
      choices: [
        {
          label: "Triangle",
          emoji: "🔺",
          value: "triangle",
          color: "#ff8b76",
          image: sticker("triangle"),
        },
        {
          label: "Circle",
          emoji: "⚪",
          value: "circle",
          color: "#6db6e8",
          image: sticker("circle"),
        },
        {
          label: "Square",
          emoji: "🟨",
          value: "square",
          color: "#f7c94b",
          image: sticker("square"),
        },
      ],
    },
  ],
  english: [
    {
      id: "english-apple",
      baseline: true,
      difficulty: 1,
      visual: "🍎",
      image: sticker("apple"),
      prompt: "Which one is an apple?",
      speech: "Which one is an apple?",
      answer: "apple",
      choices: [
        {
          label: "Apple",
          emoji: "🍎",
          value: "apple",
          color: "#ff6b5e",
          image: sticker("apple"),
        },
        {
          label: "Banana",
          emoji: "🍌",
          value: "banana",
          color: "#f7c94b",
          image: sticker("banana"),
        },
        {
          label: "Cat",
          emoji: "🐱",
          value: "cat",
          color: "#f3b56d",
          image: sticker("cat"),
        },
      ],
    },
    {
      id: "english-cat",
      baseline: true,
      difficulty: 1,
      visual: "🐱",
      image: sticker("cat"),
      prompt: "Which one is a cat?",
      speech: "Which one is a cat?",
      answer: "cat",
      choices: [
        {
          label: "Dog",
          emoji: "🐶",
          value: "dog",
          color: "#d9a66f",
          image: sticker("dog"),
        },
        {
          label: "Cat",
          emoji: "🐱",
          value: "cat",
          color: "#f3b56d",
          image: sticker("cat"),
        },
        {
          label: "Duck",
          emoji: "🦆",
          value: "duck",
          color: "#f7c94b",
          image: sticker("duck"),
        },
      ],
    },
    {
      id: "english-red",
      baseline: true,
      difficulty: 1,
      visual: "🔴",
      image: sticker("circle-red"),
      prompt: "Find the red one",
      speech: "Find the red one.",
      answer: "red",
      choices: [
        {
          label: "Blue",
          emoji: "🔵",
          value: "blue",
          color: "#6db6e8",
          image: sticker("circle"),
        },
        {
          label: "Yellow",
          emoji: "🟡",
          value: "yellow",
          color: "#f7c94b",
          image: sticker("circle-yellow"),
        },
        {
          label: "Red",
          emoji: "🔴",
          value: "red",
          color: "#ff6b5e",
          image: sticker("circle-red"),
        },
      ],
    },
    {
      id: "english-dog",
      difficulty: 1,
      visual: "🐶",
      image: sticker("dog"),
      prompt: "Which one is a dog?",
      speech: "Which one is a dog?",
      answer: "dog",
      choices: [
        {
          label: "Dog",
          emoji: "🐶",
          value: "dog",
          color: "#d9a66f",
          image: sticker("dog"),
        },
        {
          label: "Fish",
          emoji: "🐟",
          value: "fish",
          color: "#6db6e8",
          image: sticker("fish"),
        },
        {
          label: "Bird",
          emoji: "🐦",
          value: "bird",
          color: "#9ed9c4",
          image: sticker("bird"),
        },
      ],
    },
    {
      id: "english-yellow",
      difficulty: 1,
      visual: "⭐",
      image: sticker("star-yellow"),
      prompt: "Find the yellow one",
      speech: "Can you find the yellow one?",
      answer: "yellow",
      choices: [
        {
          label: "Green",
          emoji: "🟢",
          value: "green",
          color: "#9ed9c4",
          image: sticker("circle-green"),
        },
        {
          label: "Yellow",
          emoji: "⭐",
          value: "yellow",
          color: "#f7c94b",
          image: sticker("star-yellow"),
        },
        {
          label: "Blue",
          emoji: "🔵",
          value: "blue",
          color: "#6db6e8",
          image: sticker("circle"),
        },
      ],
    },
    {
      id: "english-ball",
      difficulty: 2,
      visual: "⚽",
      image: sticker("ball-red"),
      prompt: "Touch the big red ball",
      speech: "Touch the big red ball.",
      answer: "red-ball",
      choices: [
        {
          label: "Big red ball",
          emoji: "🔴",
          value: "red-ball",
          color: "#ff6b5e",
          image: sticker("ball-red"),
        },
        {
          label: "Blue hat",
          emoji: "🧢",
          value: "blue-hat",
          color: "#6db6e8",
          image: sticker("cap-blue"),
        },
        {
          label: "Yellow star",
          emoji: "⭐",
          value: "yellow-star",
          color: "#f7c94b",
          image: sticker("star-yellow"),
        },
      ],
    },
    {
      id: "english-big",
      difficulty: 2,
      visual: "🐘",
      image: sticker("elephant"),
      prompt: "Which animal is big?",
      speech: "Which animal is big?",
      answer: "elephant",
      choices: [
        {
          label: "Mouse",
          emoji: "🐭",
          value: "mouse",
          color: "#c9b9d9",
          image: sticker("mouse"),
        },
        {
          label: "Elephant",
          emoji: "🐘",
          value: "elephant",
          color: "#9da9b6",
          image: sticker("elephant"),
        },
        {
          label: "Ant",
          emoji: "🐜",
          value: "ant",
          color: "#d9a66f",
          image: sticker("ant"),
        },
      ],
    },
    {
      id: "english-wash",
      difficulty: 2,
      visual: "🧼",
      image: sticker("soap"),
      prompt: "What do we use to wash our hands?",
      speech: "What do we use to wash our hands?",
      answer: "soap",
      choices: [
        {
          label: "Soap",
          emoji: "🧼",
          value: "soap",
          color: "#9ed9c4",
          image: sticker("soap"),
        },
        {
          label: "Shoe",
          emoji: "👟",
          value: "shoe",
          color: "#d9a66f",
          image: sticker("shoe"),
        },
        {
          label: "Ball",
          emoji: "⚽",
          value: "ball",
          color: "#6db6e8",
          image: sticker("ball"),
        },
      ],
    },
  ],
};

export const demoQuestion = questionBank.english.find(
  (question) => question.id === "english-apple",
);

export const offlineTasks = {
  colors: {
    title: "家里找颜色",
    prompt: "和大人一起找出三件蓝色的东西",
    emoji: "🔎",
  },
  animals: {
    title: "动物声音游戏",
    prompt: "学一学你最喜欢的小动物叫什么",
    emoji: "🐾",
  },
  shapes: {
    title: "形状寻宝",
    prompt: "在家里找出一样圆圆的东西",
    emoji: "🧺",
  },
  english: {
    title: "英语亲子时光",
    prompt: "和大人一起说 apple、cat 或 red",
    emoji: "🎈",
  },
};

export const childLabels = {
  gender: {
    unspecified: "不特别设置",
    girl: "女孩",
    boy: "男孩",
  },
  englishLevel: {
    "not-started": "刚开始接触",
    songs: "听过英文儿歌",
    words: "认识一些英文单词",
    conversation: "能听懂简单表达",
  },
};

export function safeAssetUrl(value) {
  const url = String(value || "").trim();
  if (!url || url.length > 400 || /[<>\s]/.test(url)) return "";
  if (/^(https:\/\/|\/|\.\/|assets\/)/i.test(url)) return url;
  return "";
}

export const defaultMediaShelf = [
  {
    id: "fox-hello",
    type: "image",
    title: "Fox says hello",
    prompt: "Look, listen, and say hello together.",
    src: "assets/fox-hero.png",
    duration: "1 分钟",
    speech: "Hello! I am Fox. Let's say hello together.",
  },
];

export let mediaShelf = [...defaultMediaShelf];

export function normalizeMediaItem(item) {
  if (!item || typeof item !== "object") return null;
  const id = String(item.id || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 80);
  const src = safeAssetUrl(item.src);
  const title = String(item.title || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 80);
  if (!id || !src || !title) return null;
  return {
    id,
    type: item.type === "video" || item.type === "audio" ? item.type : "image",
    title,
    prompt: String(item.prompt || "")
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, 160),
    src,
    duration: String(item.duration || "1 分钟")
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, 20),
    speech: String(item.speech || "")
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, 200),
  };
}

export function resolveAssetUrl(assetBase, src) {
  if (!src) return "";
  if (/^https:\/\//i.test(src)) return src;
  return `${assetBase}${src.replace(/^\.\//, "")}`;
}

export function localQuestionImage(assetBase, question) {
  if (question?.image) return resolveAssetUrl(assetBase, question.image);
  if (question?.id)
    return resolveAssetUrl(assetBase, `assets/questions/${question.id}.png`);
  return "";
}

export function localQuestionAudio(assetBase, question) {
  if (question?.audio) return resolveAssetUrl(assetBase, question.audio);
  if (question?.id)
    return resolveAssetUrl(assetBase, `assets/audio/${question.id}.mp3`);
  return "";
}

export function normalizeContentQuestion(question) {
  if (!question || typeof question !== "object") return null;
  const containsCjk = (value) => /[\u3400-\u9fff]/u.test(String(value || ""));
  const clean = (value, max = 160) =>
    String(value || "")
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, max);
  const choices = Array.isArray(question.choices)
    ? question.choices
        .map((choice) => ({
          label: clean(choice?.label, 40),
          emoji: clean(choice?.emoji, 8),
          value: clean(choice?.value, 40),
          image: safeAssetUrl(choice?.image),
          color: /^#[0-9a-f]{6}$/i.test(choice?.color)
            ? choice.color
            : "#9ed9c4",
        }))
        .filter(
          (choice) =>
            choice.label && choice.value && (choice.emoji || choice.image),
        )
        .slice(0, 4)
    : [];
  const ageMin = Math.min(6, Math.max(2, Number(question.ageMin) || 2));
  const ageMax = Math.min(6, Math.max(2, Number(question.ageMax) || 6));
  if (ageMin > ageMax) return null;
  const normalized = {
    id: clean(question.id, 80),
    difficulty: Math.min(3, Math.max(1, Number(question.difficulty) || 1)),
    stage: Math.min(
      4,
      Math.max(1, Number(question.stage) || Number(question.difficulty) || 1),
    ),
    ageMin,
    ageMax,
    concept: clean(question.concept, 60),
    baseline: Boolean(question.baseline),
    visual: clean(question.visual, 8),
    image: safeAssetUrl(question.image),
    audio: safeAssetUrl(question.audio),
    prompt: clean(question.prompt),
    speech: clean(question.speech),
    answer: clean(question.answer, 40),
    choices,
  };
  const visibleText = [
    normalized.visual,
    normalized.prompt,
    normalized.speech,
    ...choices.flatMap((choice) => [choice.label, choice.value]),
  ];
  if (
    !normalized.id ||
    !(normalized.visual || normalized.image) ||
    !normalized.prompt ||
    !normalized.speech ||
    !normalized.answer ||
    choices.length < 2 ||
    !choices.some((choice) => choice.value === normalized.answer) ||
    new Set(choices.map((choice) => choice.value)).size !== choices.length ||
    visibleText.some(containsCjk)
  )
    return null;
  return normalized;
}

export async function loadQuestionPack(assetBase) {
  try {
    const response = await fetch(`${assetBase}content/questions.en.json`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = await response.json();
    if (payload?.schemaVersion !== 1 || !Array.isArray(payload.questions))
      return;
    const additions = payload.questions
      .map(normalizeContentQuestion)
      .filter(Boolean);
    const existing = new Set(
      questionBank.english.map((question) => question.id),
    );
    questionBank.english = [
      ...questionBank.english,
      ...additions.filter((question) => !existing.has(question.id)),
    ];
  } catch {
    // The built-in question bank keeps the app fully usable offline.
  }
}

export async function loadMediaPack(assetBase) {
  try {
    const response = await fetch(`${assetBase}content/media.json`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = await response.json();
    if (payload?.schemaVersion !== 1 || !Array.isArray(payload.items)) return;
    const additions = payload.items.map(normalizeMediaItem).filter(Boolean);
    const existing = new Set(mediaShelf.map((item) => item.id));
    mediaShelf = [
      ...mediaShelf,
      ...additions.filter((item) => !existing.has(item.id)),
    ];
  } catch {
    // The built-in picture story remains available offline.
  }
}
