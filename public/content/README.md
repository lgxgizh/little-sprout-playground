# English content packs / 英语内容包

`questions.en.json` is an optional local content pack. The app loads it at startup and merges valid new questions into the built-in bank. If the file is missing or invalid, the built-in questions remain available.

`questions.en.json` 是可选的本地内容包。网页启动时会自动加载，并把格式正确的新题合并到内置题库；文件缺失或格式错误时，仍然使用内置题库。

## Minimal format / 最小格式

```json
{
  "schemaVersion": 1,
  "locale": "en-US",
  "questions": [
    {
      "id": "english-hello",
      "difficulty": 1,
      "baseline": false,
      "visual": "👋",
      "prompt": "Which one says hello?",
      "speech": "Which one says hello?",
      "answer": "hello",
      "choices": [
        {
          "label": "Hello",
          "emoji": "👋",
          "value": "hello",
          "color": "#9ed9c4"
        },
        { "label": "Bye", "emoji": "👋", "value": "bye", "color": "#6db6e8" },
        {
          "label": "Sleep",
          "emoji": "😴",
          "value": "sleep",
          "color": "#c9b9d9"
        }
      ]
    }
  ]
}
```

### Field rules / 字段规则

- `schemaVersion`: currently `1` / 当前必须为 `1`。
- `id`: stable unique ID, preferably `english-<concept>` / 稳定且唯一，建议使用 `english-<概念>`。
- `difficulty`: `1` for picture words, `2` for short phrases / `1` 表示图片词汇，`2` 表示简单短句。
- `stage`: `1`–`4`; the question becomes eligible when the child reaches that English stage. Use stage 1–2 for picture/word matching and stage 3–4 for short phrases and play scenes / `1`–`4`，孩子达到对应阶段后才会出现。阶段 1–2 适合图片和词汇匹配，阶段 3–4 适合短句与生活互动。
- `ageMin` and `ageMax`: optional inclusive age range from `2` to `6`. Questions outside the child’s range are skipped / 可选的适龄范围（含边界，`2`–`6` 岁）；超出孩子年龄的题目会自动跳过。
- `concept`: optional stable English concept key such as `apple` or `greeting`; keep it short and reuse it for related questions / 可选的稳定概念标识，如 `apple` 或 `greeting`；请保持简短，相关题目复用同一个标识。
- `baseline`: set `true` for English-check pool items (about 8–12 age-safe listening/picture questions; the app may stop early) / 英语测评题库条目设为 `true`（约 8–12 道适龄听力图片题，应用可自适应提前结束）。日常练习题一般填 `false`。
- `visual`: optional emoji hero; picture cards are the main kid UI / 可选 emoji 主视觉；孩子主界面以图片卡片为主。
- `prompt` and `speech`: child-facing English only. Keep them short and concrete / 面向孩子的英文短句，尽量短、具体。
- `answer`: must exactly match one choice `value` / 必须与某个选项的 `value` 完全一致。
- `choices`: 2–4 choices with `label`, `value`, hex `color`, plus `emoji` and/or `imageKey`/`imageSrc` (prefer keys under `public/assets/choices/`: apple banana cat dog ball cup star fish) / 2–4 个选项；优先使用 choices 目录下的 PNG `imageKey`。

## Curriculum guidance / 教材建议

The app does not download a hidden textbook or call a training-data service. The learning material is the reviewed question pack in this repository (plus any local pack you add). For a public fork, keep each pack’s source and license in your project notes, and only commit material that you created or can redistribute.

应用不会偷偷下载教材，也不会调用“训练数据”服务。真正的学习内容就是仓库中经过审核的题库，以及你自己添加的本地题库。公开仓库建议在项目说明中记录每份教材的来源和授权，只提交自己创作或明确允许再分发的内容。

The repository includes original starter examples only; it does not bundle third-party cartoons, textbooks, trademarks, or copyrighted audio. For a public project, add content that you created, licensed, or have explicit permission to redistribute.

仓库只提供原创的基础示例，不包含第三方动画、教材、商标或受版权保护的音频。公开发布时，请只添加你自己创作、已购买授权或明确允许再分发的内容。

For a 3-year-old, add one concept at a time: everyday nouns (`apple`, `cup`, `door`), colors, animals, body parts, and short action phrases (`touch the ball`, `wash hands`). Prefer one idea per question, picture-first choices, and natural English that a caregiver can repeat.

针对 3 岁孩子，建议一次只引入一个概念：日常名词（`apple`、`cup`、`door`）、颜色、动物、身体部位，以及简单动作短句（`touch the ball`、`wash hands`）。每道题只考一个点，优先图片和听力，并让家长可以自然复述。

The included `english-open` example is stage 3, so it will stay hidden for a stage-1 or stage-2 learner until the local plan advances. This is a safe way to mix one shared pack across children with different ages and levels.

示例中的 `english-open` 属于阶段 3，因此阶段 1 或阶段 2 的孩子暂时看不到它，直到本地学习路径进入阶段 3。这样一份词库就能安全地服务不同年龄和基础的孩子。

### A practical content checklist / 添加前检查

1. Pick one familiar concept and 2–4 clear picture choices.
2. Write a short English prompt and matching `speech` line; read it aloud yourself before adding it.
3. Set `stage` and the inclusive age range; use the same `concept` key for review variants.
4. Use original or licensed emoji/images/audio only. Keep clips short, calm, and easy to replay.
5. Run `npm run check`, then open the app and try the question as a child and as a parent.

6. 选择一个孩子熟悉的概念，准备 2–4 个清晰的图片选项。
7. 编写简短英文题目和对应的 `speech`，加入前先由家长朗读确认自然顺口。
8. 设置 `stage` 和含边界的年龄范围；同一概念的复习题使用相同 `concept` 标识。
9. 图片、音频只使用原创或已获授权的素材；片段要短、平静、方便重复播放。
10. 运行 `npm run check`，再分别以孩子视角和家长视角实际试用。

## Media paths / 媒体路径

- Put local MP4 videos in `public/assets/media/` and/or register them under Parent settings → 本地动画理解. See `public/assets/media/README.md` / 本地 MP4 放入 `public/assets/media/`，也可在家长设置「本地动画理解」登记；详见 `public/assets/media/README.md`。
- Put local English MP3 files in `public/assets/audio/` / 英文 MP3 放入 `public/assets/audio/`。
- Use short clips, clear speech, and assets with redistribution rights / 建议使用短片段、清晰语音，并确认素材拥有公开再分发权。
