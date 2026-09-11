# 小栗子乐园 / Little Sprout Playground

[![CI](https://github.com/lgxgizh/little-sprout-playground/actions/workflows/ci.yml/badge.svg)](https://github.com/lgxgizh/little-sprout-playground/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/lgxgizh/little-sprout-playground/actions/workflows/pages.yml/badge.svg)](https://github.com/lgxgizh/little-sprout-playground/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**中文** · [English](#english)

一个面向学龄前儿童的图片优先学习网页，主打两大孩子玩法：**听力测试**与**动画提问**。孩子听英文提问、看 GIF 小故事，再点选 A/B/C/D 大图卡片；语音只用于题目朗读，演示流程不含跟读麦克风。

**[在线体验](https://lgxgizh.github.io/little-sprout-playground/)** · [报告问题](https://github.com/lgxgizh/little-sprout-playground/issues)

![小栗子乐园示例插画](public/assets/fox-hero.png)

> [!IMPORTANT]
> 这是一个独立的开源学习项目。仓库不提供第三方动画、题目、商标或其他受版权保护的资源。

## 功能 / Features

- 图片优先的大尺寸儿童交互界面 / Picture-first, touch-friendly UI
- 英文题目朗读、答题反馈和语音开关 / English prompts, feedback, and voice toggle
- 适配桌面端与移动端 / Responsive desktop and mobile layouts
- 图片、语音、题目规划和视频理解分别配置，远程默认走 Grok 适配器 / Independent model settings for image, voice, planning, and video understanding
- IndexedDB 本地成长档案 / Local IndexedDB learning profile
- 记录到具体题目的练习轨迹，并避开同一学习单元内的重复题目 / Per-question practice history with in-session repetition avoidance
- 支持多个孩子的昵称、年龄、英语基础和独立学习档案 / Multiple child profiles with nickname, age, English background, and separate progress
- 面向约 3 岁的英语听力图片测评（约 8–12 题，可自适应提前结束）与温和家长总结 / Age~3 English listening/picture check (~8–12 items, adaptive stop) with a gentle parent summary
- 英语四阶段学习路径、错题间隔复习和家长周成长卡 / Four-stage English path, spaced review, and a weekly parent growth card
- 孩子流程不含跟读/麦克风识别；仅保留 Listen 朗读按钮 / Kid flows have no speak-back mic—Listen prompts only
- 学习档案 JSON 导出与导入，方便本地备份和换设备迁移 / Local JSON export and import for backup and device migration
- 根据最近表现给出下一步推荐，不给孩子贴标签、不展示排名 / Gentle, transparent recommendations with no rankings or labels
- 3 题自适应微任务、完成/休息出口和屏幕外亲子小游戏 / Three-question adaptive micro-lessons with finish/rest exits and offline parent-child play
- 独立的亲子任务区，鼓励把学习带到真实生活中 / A dedicated parent-child activity area that extends learning into daily life
- 家长入口长按保护 / Long-press protection for parent settings
- 可替换的本地图片、音频和题库资源 / Replaceable local media and question banks
- 主页两大入口：听力测试（TTS + 图片选项）与动画提问（fox-apple.gif + 图片选项） / Home hub with Listening test and Animation Q&A (fox-apple.gif + picture cards)
- Story shelf：本地 GIF/图片登记、观看后图片答题 / Story shelf for local GIF/image registration and watch-then-picture answers
- GitHub Actions 自动构建和 Pages 部署 / Automated CI and GitHub Pages deployment

## 快速开始 / Quick start

需要 Node.js 20 或更高版本。 / Requires Node.js 20 or newer.

```bash
git clone https://github.com/lgxgizh/little-sprout-playground.git
cd little-sprout-playground
npm install
npm run dev
```

### 本地接上 Grok 适配器 / Local Grok adapter

密钥只放在本机 `.env`，不要写进前端。需要两个终端：

1. 复制环境文件并填入 [xAI 控制台](https://console.x.ai) 的密钥：

```bash
copy .env.example .env
# macOS / Linux: cp .env.example .env
```

`.env` 里至少要有：

```
XAI_API_KEY=xai-你的密钥
VITE_API_BASE_URL=http://127.0.0.1:8787
```

2. 启动适配器（读取 `XAI_API_KEY`）：

```bash
npm run adapter
```

看到 `XAI_API_KEY ready` 即可。如果要选 OpenAI 模型，再在 `.env` 里加上 `OPENAI_API_KEY`。

3. 再启动前端（读取 `VITE_API_BASE_URL`）：

```bash
npm run dev
```

改完 `.env` 后要重启 `npm run adapter` 和 `npm run dev`。家长设置里所有远程模型都是可选项；默认仍是本地图和浏览器语音。

### SuperGrok 能不能替代 API？

不能。SuperGrok 是 grok.com / X 上给人用的会员，额度不能接到这个网页。这里是程序调用接口，必须用 [console.x.ai](https://console.x.ai) 的 `XAI_API_KEY` 按量充值。两套账本：会员管聊天，API 管软件。OpenAI 同理，ChatGPT Plus 也不能代替 `OPENAI_API_KEY`。

构建与检查 / Build and verify:

```bash
npm run check
npm run preview
```

运行学习规则测试 / Run the learning-rule tests:

```bash
npm test
```

## 模型配置 / Model configuration

在家长设置的「设置」页可以分别选择四项能力。默认全部走本机，GitHub Pages 演示不需要密钥。远程选项通过 `VITE_API_BASE_URL` 指向的服务端适配器调用 xAI（Grok）；没配置接口、超时或返回不合规时，自动退回本机能力。

Open **Parent settings → 设置** to configure four capabilities. Defaults are on-device. Remote options call your server adapter at `VITE_API_BASE_URL`; the recommended upstream is xAI Grok. Missing adapters time out or fail closed to local behaviour.

| 能力 / Capability  | 本机默认   | 可选远程（xAI）              | 可选远程（OpenAI）    |
| ------------------ | ---------- | ---------------------------- | --------------------- |
| 图片 / Image       | 本地贴纸   | Imagine 2.0、Imagine Fast    | GPT Image 1、DALL·E 3 |
| 语音 / Voice       | 浏览器     | Grok TTS Eve / Ara / Luna    | TTS、TTS HD           |
| 题目规划 / Planner | 本地自适应 | Grok 4.6、4.5、4.3、4.1 Fast | GPT-4o mini、GPT-4o   |
| 视频理解 / Video   | 本地播放   | Grok 4.6 / 4.5 / 4.3 看一看  | GPT-4o 看一看         |

模型目录在 `src/model-config.js`，全部可在家长设置里切换。xAI 选项用 `XAI_API_KEY`，OpenAI 选项用 `OPENAI_API_KEY`。没配对应密钥时自动退回本机。密钥只放服务端；前端不发送姓名、照片、录音或原始答案。

The catalog lives in `src/model-config.js`. Legacy OpenAI placeholders are aliased. Keep provider keys on the server. Image requests send only the approved English prompt; video analysis sends only shelf media URLs.

### 服务端适配器 / Server adapters

设置 `VITE_API_BASE_URL` 后，浏览器会按需调用：

| 路径                           | 用途   | 请求要点                                              | 期望返回                                                         |
| ------------------------------ | ------ | ----------------------------------------------------- | ---------------------------------------------------------------- |
| `POST /learning/next-question` | 选题   | `model`, 隐私最小化的 `learningContext`, `candidates` | `{ "questionId": "<候选 ID>" }`                                  |
| `POST /learning/speak`         | TTS    | `model`, `voiceId`, `language: "en"`, `text`          | `{ "audioUrl" }` 或 `{ "audioBase64", "mimeType" }` 或音频二进制 |
| `POST /learning/image`         | 插画   | `model`, `questionId`, 英文 `prompt`                  | `{ "imageUrl" }`                                                 |
| `POST /learning/video-analyze` | 看短片 | `model`, `media: { id, type, url }`                   | `{ "title", "summary", "prompt?" }` 英文、最多 3 句              |

题目规划的 `learningContext` 形状与此前相同（年龄、英语基础、阶段、主题统计、最近 8 条事件）。服务端应校验候选 ID，用结构化输出约束模型，不要让模型现场生成未经审核的儿童题目。

The planner `learningContext` shape is unchanged. Validate candidate IDs server-side and do not let a model invent unreviewed child-facing questions.

## 本地学习记录与个性化推荐 / Local learning records

学习档案以 IndexedDB 的 `little-sprout-playground` 数据库为主，包含 `profile`、`children`、`events`、`sessions`、`attempts` 和 `rewards` 对象仓库；浏览器不支持 IndexedDB 时会降级到 `localStorage`。默认只记录完成次数、具体题目结果、主题和时间；演示孩子流程不含跟读麦克风；语音仅用于题目朗读。

The primary store is an IndexedDB database named `little-sprout-playground` with `profile`, `children`, `events`, `sessions`, `attempts`, and `rewards` object stores. Browsers without IndexedDB fall back to `localStorage`. Study counts, per-question results, topics, and timestamps are recorded locally by default. Demo kid flows do not use speak-back recognition; voice is for prompts only.

系统会优先推荐孩子较少练习或正确率较低的主题，并在一次学习单元中尽量避免重复已经完成的题目；家长可以在「家长设置」中查看统计、主题进度、最近足迹或清除本机记录。

The recommendation rule prioritizes topics that are new or need gentle practice and avoids repeating completed questions within one micro-lesson. Parents can view statistics, topic progress, recent activity, or clear local records from **Parent settings**.

一次学习会区分“开始、答题、完成、退出”和“屏幕外亲子任务”，避免把误触或反复点击当成学习成果。英语学习还会为每个孩子维护阶段目标和错题复习队列。/ A learning session distinguishes **started**, **answer submitted**, **completed**, **quit**, and **offline parent-child activity** events, so accidental taps are not counted as completed learning. Each child also has an English stage goal and a spaced-review queue.

家长设置中的「导出学习档案」会生成一个本地 JSON 文件；「导入学习档案」会在确认后替换本机的全部孩子档案。导入前会校验版本、孩子数量、昵称、年龄和学习数据结构。/ **Export learning data** creates a local JSON file. **Import learning data** replaces all child profiles on this device after confirmation and validates the schema before changing anything.

导出文件使用版本化结构，便于未来迁移：/ Exports use a versioned shape for future migrations:

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-09-03T08:00:00.000Z",
  "children": [],
  "modelSettings": {
    "image": "gpt-image-1",
    "voice": "browser-speech",
    "vocab": "adaptive-picture"
  }
}
```

## 项目结构 / Project structure

```text
.
├── .github/                 # CI、Pages、Issue 和 PR 模板 / workflows and templates
├── public/assets/           # 可替换媒体 / replaceable media
├── src/
│   ├── app.js               # 主页两大玩法、共享答题 UI、家长设置 / hub UI + parent settings
│   ├── listening.js         # 听力测试题与 choice PNG 映射 / listening seeds + choice assets
│   ├── animation-quiz.js    # GIF/图片动画理解书架 / GIF animation comprehension shelf
│   ├── quiz-ui.js           # A–D 大图选项共享渲染 / shared picture-choice cards
│   ├── model-config.js      # 语音、图片、选题、视频模型目录 / model catalog
│   ├── ai.js                # 服务端适配器：选题、TTS、插画、视频理解 / adapters
│   ├── learning-plan.js     # 英语阶段、复习规则和周统计 / English stages, review rules, weekly stats
│   ├── assessment.js        # 约 3 岁英语测评与家长总结 / age-3 English check helpers
│   ├── video-comprehension.js # 兼容旧导入的薄封装 / thin compatibility shim
│   ├── storage.js           # IndexedDB 存储、迁移和降级 / persistence and migration
├── server/adapter.mjs       # 本地 xAI 适配器 / local xAI adapter
│   ├── styles.css           # 基础响应式样式 / base responsive styles
│   └── overrides.css        # 配置、成长档案与两大玩法样式 / settings + hub styles
├── index.html
├── vite.config.js
└── package.json
```

## 接入自己的内容 / Bring your own content

- 图片或封面放入 `public/assets/`。 / Put images in `public/assets/`.
- 选项大图放在 `public/assets/choices/`（apple/banana/cat/dog/ball/cup/star/fish）。 / Choice PNGs live in `public/assets/choices/`.
- 演示动画为 `public/assets/stories/fox-apple.gif`；家长可在设置中登记其它本地 GIF/图片。 / Demo animation is `public/assets/stories/fox-apple.gif`; parents can register other local GIFs/images.
- 本地音频放入 `public/assets/audio/{questionId}.mp3`。 / Put English MP3 files at `public/assets/audio/{questionId}.mp3`.
- 旧版 `public/assets/media/shapes-hello.mp4` 已降级，不再作为主演示。 / Legacy `shapes-hello.mp4` is demoted and no longer the primary demo.
- 自定义题目可以抽取为 JSON，由本地题库适配器加载。 / Store custom questions as JSON and load them through a local question-bank adapter.
- 直接编辑 `public/content/questions.en.json` 即可追加英语题目；字段和教材建议见 [`public/content/README.md`](public/content/README.md)。 / Add English questions by editing `public/content/questions.en.json`; see [`public/content/README.md`](public/content/README.md) for the schema and curriculum guidance.
- 每道题可用 `stage`、`ageMin`、`ageMax` 和 `concept` 控制阶段、适龄范围与复习归类；应用会在本地自动过滤不适合当前孩子的题目。 / Use `stage`, `ageMin`, `ageMax`, and `concept` to control level, age fit, and review grouping; the app filters unsuitable questions locally.
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

Little Sprout Playground is an independent, picture-first learning web app for preschool children. The kid-facing home centers on two features: **Listening test** (browser speech prompts + A/B/C/D picture cards) and **Animation Q&A** (watch `fox-apple.gif`, then tap picture answers). Speak-back/microphone recognition is removed from demo kid flows. Parent helpers, storage, and model settings stay behind the long-press parent gate.

It ships with generated choice PNGs under `public/assets/choices/` and the fox-apple GIF story—no third-party copyrighted cartoons. Learning data stays on the device by default. See [SECURITY.md](SECURITY.md) for privacy guidance.
