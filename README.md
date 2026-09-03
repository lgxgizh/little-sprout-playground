# 小栗子乐园 / Little Sprout Playground

[![CI](https://github.com/lgxgizh/little-sprout-playground/actions/workflows/ci.yml/badge.svg)](https://github.com/lgxgizh/little-sprout-playground/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/lgxgizh/little-sprout-playground/actions/workflows/pages.yml/badge.svg)](https://github.com/lgxgizh/little-sprout-playground/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**中文** · [English](#english)

一个面向学龄前儿童的图片优先、语音辅助学习网页。孩子无需识字，可以通过图片选择和语音提示完成简短的启蒙活动；家长可以分别选择图片、语音和词汇测试所使用的模型。

**[在线体验](https://lgxgizh.github.io/little-sprout-playground/)** · [报告问题](https://github.com/lgxgizh/little-sprout-playground/issues)

![小栗子乐园示例插画](public/assets/fox-hero.png)

> [!IMPORTANT]
> 这是一个独立的开源学习项目。仓库不提供第三方动画、题目、商标或其他受版权保护的资源。

## 功能 / Features

- 图片优先的大尺寸儿童交互界面 / Picture-first, touch-friendly UI
- 中文题目朗读、答题反馈和语音开关 / Chinese prompts, feedback, and voice toggle
- 适配桌面端与移动端 / Responsive desktop and mobile layouts
- 图片生成、语音提问和词汇量测试分别配置 / Independent model settings for image, voice, and vocabulary features
- IndexedDB 本地成长档案 / Local IndexedDB learning profile
- 根据最近表现给出下一步推荐，不给孩子贴标签、不展示排名 / Gentle, transparent recommendations with no rankings or labels
- 3 题自适应微任务、完成/休息出口和屏幕外亲子小游戏 / Three-question adaptive micro-lessons with finish/rest exits and offline parent-child play
- 家长入口长按保护 / Long-press protection for parent settings
- 可替换的本地图片、音频和题库资源 / Replaceable local media and question banks
- GitHub Actions 自动构建和 Pages 部署 / Automated CI and GitHub Pages deployment

## 快速开始 / Quick start

需要 Node.js 20 或更高版本。 / Requires Node.js 20 or newer.

```bash
git clone https://github.com/lgxgizh/little-sprout-playground.git
cd little-sprout-playground
npm install
npm run dev
```

构建与检查 / Build and verify:

```bash
npm run check
npm run preview
```

## 模型配置 / Model configuration

点击页面右上角「家长设置」即可独立切换三项能力。/ Open **Parent settings** in the top-right corner to configure each capability independently.

| 能力 / Capability            | 示例选项 / Example options                                                         | 当前示例行为 / Current demo behavior                              |
| ---------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 图片生成 / Image generation  | GPT Image 1、FLUX Schnell、本地图片库 / local image library                        | 保存选择并展示当前模型 / Persists and displays the selected model |
| 语音提问 / Voice prompts     | 浏览器语音、OpenAI TTS、本地音频 / browser speech, OpenAI TTS, local audio         | 浏览器语音可直接使用 / Browser speech works without a key         |
| 词汇量测试 / Vocabulary test | 图片自适应测试、GPT-4o mini、本地题库 / adaptive pictures, GPT-4o mini, local bank | 使用内置图片选择题演示 / Uses the built-in picture quiz           |

模型设置保存在 `localStorage` 的 `little-sprout-models` 项中。远程模型通过可选的服务端适配器调用；没有配置适配器、请求超时或返回内容不合规时，页面会自动回退到本地题库，不影响 GitHub Pages 演示。

选择 **GPT-4o mini** 作为题目模型时，前端会把隐私最小化的学习摘要（年龄段、主题统计、正确率、连续学习天数和最近 8 条事件）发送到 `VITE_API_BASE_URL`，请模型只从当前主题的审核候选题中选择一个 `questionId`。前端不会发送姓名、照片、音频、自由文本或原始答案；API Key 必须只保存在服务端。

When **GPT-4o mini** is selected for vocabulary testing, the browser sends a privacy-minimised learning summary (age range, topic aggregates, accuracy, streak, and the latest eight events) to `VITE_API_BASE_URL`. The model must choose one `questionId` from the approved candidates for the current topic. Names, photos, audio, free text, and raw answers are not sent; provider API keys must stay on the server.

### 题目规划适配器 / Question-planning adapter

实现一个服务端接口 `POST /learning/next-question` 即可接入任意大模型供应商。浏览器请求形状如下：

```json
{
  "model": "gpt-4o-mini",
  "learningContext": {
    "ageRange": "3",
    "canReadText": false,
    "currentCourse": "colors",
    "totals": {
      "sessions": 2,
      "answers": 5,
      "accuracy": 80,
      "streakDays": 2,
      "stars": 4
    },
    "skills": {
      "colors": {
        "attempts": 5,
        "accuracy": 80,
        "lastPracticed": "2026-09-03T08:00:00.000Z"
      }
    },
    "recentActivity": [],
    "constraints": {
      "sessionMinutes": 5,
      "maxQuestions": 3,
      "usePicturesFirst": true,
      "useEncouragingLanguage": true,
      "noRankings": true
    }
  },
  "candidates": [
    { "id": "color-blue-fruit", "difficulty": 1, "prompt": "帮我找到蓝色水果" }
  ]
}
```

返回 `{ "questionId": "color-blue-fruit" }`。服务端应校验年龄和候选 ID，并使用结构化输出约束模型；不要让模型直接生成未经审核的儿童题目。若接口不可用或返回未知 ID，前端会使用本地自适应规则。

Return `{ "questionId": "color-blue-fruit" }`. The server should validate the age and candidate ID and use structured output; do not let a model generate unreviewed child-facing content. If the adapter is unavailable or returns an unknown ID, the browser falls back to the local adaptive rule.

Model choices are stored in `localStorage` under `little-sprout-models`. Remote model entries are adapter placeholders in this frontend demo. Call real providers through your own server and never commit API keys.

## 本地学习记录与个性化推荐 / Local learning records

学习档案以 IndexedDB 的 `little-sprout-playground` 数据库为主，包含 `profile` 和 `events` 对象仓库；浏览器不支持 IndexedDB 时会降级到 `localStorage`。默认只记录完成次数、题目结果、主题和时间，不上传到服务器。

The primary store is an IndexedDB database named `little-sprout-playground` with `profile` and `events` object stores. Browsers without IndexedDB fall back to `localStorage`. Only study counts, answers, topics, and timestamps are recorded locally by default.

系统会优先推荐孩子较少练习或正确率较低的主题，并用鼓励式语言提示下一步内容；家长可以在「家长设置」中查看统计、主题进度、最近足迹或清除本机记录。

The recommendation rule prioritizes topics that are new or need gentle practice. Parents can view statistics, topic progress, recent activity, or clear local records from **Parent settings**.

一次学习会区分“开始、答题、完成、退出”和“屏幕外亲子任务”，避免把误触或反复点击当成学习成果。/ A learning session distinguishes **started**, **answer submitted**, **completed**, **quit**, and **offline parent-child activity** events, so accidental taps are not counted as completed learning.

## 项目结构 / Project structure

```text
.
├── .github/                 # CI、Pages、Issue 和 PR 模板 / workflows and templates
├── public/assets/           # 可替换媒体 / replaceable media
├── src/
│   ├── app.js               # 页面、内容、交互和模型配置 / UI and model settings
│   ├── ai.js                # 隐私最小化学习摘要与 AI 选题适配器 / AI planner adapter
│   ├── storage.js           # IndexedDB 存储、迁移和降级 / persistence and migration
│   ├── styles.css           # 基础响应式样式 / base responsive styles
│   └── overrides.css        # 配置和成长档案样式 / settings and profile styles
├── index.html
├── vite.config.js
└── package.json
```

## 接入自己的内容 / Bring your own content

- 图片或封面放入 `public/assets/`，在 `src/app.js` 中引用。 / Put images in `public/assets/` and reference them from `src/app.js`.
- 本地音频建议放入 `public/assets/audio/`，在 `speak()` 的适配分支中播放。 / Put local audio in `public/assets/audio/` and handle it in the `speak()` adapter.
- 自定义题目可以抽取为 JSON，由本地题库适配器加载。 / Store custom questions as JSON and load them through a local question-bank adapter.
- 远程模型应由后端保存密钥并提供受控 API。 / Keep provider secrets on a backend and expose a controlled API.

涉及儿童数据时，请阅读 [SECURITY.md](SECURITY.md)。新增素材前请确认它允许公开再分发。/ Read [SECURITY.md](SECURITY.md) before handling children’s data, and verify redistribution rights for every new asset.

## GitHub Pages

仓库包含自动部署工作流。首次使用时，在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中将 Source 设为 **GitHub Actions**；之后推送到 `master` 会自动部署。

The repository includes an automated deployment workflow. On first use, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. Future pushes to `master` deploy automatically.

## 贡献 / Contributing

欢迎提交功能建议和 Pull Request。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

Feature suggestions and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) first.

## 许可证 / License

代码使用 [MIT License](LICENSE)。仓库内或使用者自行添加的媒体资源可能采用不同许可证，使用前请分别确认。

The code is released under the [MIT License](LICENSE). Media added by contributors or deployers may have separate licenses; verify each asset before use.

<a id="english"></a>

## English summary

Little Sprout Playground is an independent, picture-first learning web app for preschool children. It includes voice-assisted picture quizzes, local progress tracking, gentle recommendations, and configurable adapters for image generation, voice prompts, and vocabulary testing.

It ships only with an original demo illustration and does not include third-party copyrighted media. Learning data stays on the device by default. See [SECURITY.md](SECURITY.md) for privacy guidance.
