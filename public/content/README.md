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
- `baseline`: set `true` only for the three starter-check questions / 只有基础测评的 3 道题设置为 `true`。新增题目一般填 `false`。
- `visual`: one emoji or a short local image token / 一个 emoji 或短图片标记。
- `prompt` and `speech`: child-facing English only. Keep them short and concrete / 面向孩子的英文短句，尽量短、具体。
- `answer`: must exactly match one choice `value` / 必须与某个选项的 `value` 完全一致。
- `choices`: 2–4 choices; every choice needs `label`, `emoji`, `value`, and a six-digit hex `color` / 2–4 个选项，每个选项都需要这些字段。

## Curriculum guidance / 教材建议

The repository includes original starter examples only; it does not bundle third-party cartoons, textbooks, trademarks, or copyrighted audio. For a public project, add content that you created, licensed, or have explicit permission to redistribute.

仓库只提供原创的基础示例，不包含第三方动画、教材、商标或受版权保护的音频。公开发布时，请只添加你自己创作、已购买授权或明确允许再分发的内容。

For a 3-year-old, add one concept at a time: everyday nouns (`apple`, `cup`, `door`), colors, animals, body parts, and short action phrases (`touch the ball`, `wash hands`). Prefer one idea per question, picture-first choices, and natural English that a caregiver can repeat.

针对 3 岁孩子，建议一次只引入一个概念：日常名词（`apple`、`cup`、`door`）、颜色、动物、身体部位，以及简单动作短句（`touch the ball`、`wash hands`）。每道题只考一个点，优先图片和听力，并让家长可以自然复述。

## Media paths / 媒体路径

- Put local MP4 videos in `public/assets/media/` / 本地 MP4 放入 `public/assets/media/`。
- Put local English MP3 files in `public/assets/audio/` / 英文 MP3 放入 `public/assets/audio/`。
- Use short clips, clear speech, and assets with redistribution rights / 建议使用短片段、清晰语音，并确认素材拥有公开再分发权。
