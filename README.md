# 小栗子乐园 / Little Fun Learning

[![CI](https://github.com/lgxgizh/little-fun-learning/actions/workflows/ci.yml/badge.svg)](https://github.com/lgxgizh/little-fun-learning/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/lgxgizh/little-fun-learning/actions/workflows/pages.yml/badge.svg)](https://github.com/lgxgizh/little-fun-learning/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

一个面向学龄前儿童的图片优先、语音辅助学习网页。孩子无需识字，可以通过图片选择和语音提示完成简短的启蒙活动；家长可以分别选择图片、语音和词汇测试所使用的模型。

**[在线体验](https://lgxgizh.github.io/little-fun-learning/)** · [报告问题](https://github.com/lgxgizh/little-fun-learning/issues)

![小栗子乐园示例插画](public/assets/fox-hero.png)

> [!IMPORTANT]
> 这是一个独立的开源学习项目，不是“小小优趣”或任何商业产品的官方版本，也不存在隶属、授权或合作关系。仓库不提供第三方动画、题目、商标或其他受版权保护的资源。

## 功能

- 图片优先的大尺寸儿童交互界面
- 中文题目朗读、答题反馈和语音开关
- 适配桌面端与移动端
- 图片生成、语音提问和词汇量测试分别配置
- 模型选择保存在浏览器本地，不要求注册账号
- IndexedDB 本地成长档案：学习次数、连续天数、答题正确率和薄弱主题
- 本地成长档案：学习次数、连续天数、答题正确率和薄弱主题
- 根据最近表现给出下一步推荐，不给孩子贴标签、不展示排名
- 可替换的本地图片、音频和题库资源
- GitHub Actions 自动构建和 Pages 部署

## 快速开始

需要 Node.js 20 或更高版本。

```bash
git clone https://github.com/lgxgizh/little-fun-learning.git
cd little-fun-learning
npm install
npm run dev
```

构建与检查：

```bash
npm run check
npm run preview
```

## 模型配置

点击页面右上角「家长设置」，可以独立切换三项能力：

| 能力       | 示例选项                              | 当前示例行为           |
| ---------- | ------------------------------------- | ---------------------- |
| 图片生成   | GPT Image 1、FLUX Schnell、本地图片库 | 保存选择并展示当前模型 |
| 语音提问   | 浏览器语音、OpenAI TTS、本地音频      | 浏览器语音可直接使用   |
| 词汇量测试 | 图片自适应测试、GPT-4o mini、本地题库 | 使用内置图片选择题演示 |

模型设置保存在 `localStorage` 的 `little-fun-models` 项中。学习档案以 IndexedDB 的 `little-fun-learning` 数据库为主，并保留 `localStorage` 兼容副本。远程模型目前是适配器占位选项；接入真实服务时，请通过服务端代理调用，不要把 API Key 写进前端或提交到 GitHub。

## 本地学习记录与个性化推荐

学习记录保存在 IndexedDB 的 `profile` 和 `events` 对象仓库中，默认只记录完成次数、题目结果、主题和时间，不上传到服务器。系统会优先推荐孩子较少练习或正确率较低的主题，并用鼓励式语言提示下一步内容；家长可以在「家长设置」中查看概况或清除本机记录。浏览器不支持 IndexedDB 时会降级到 `localStorage`。

这套规则是一个透明、可替换的前端基线，后续可以将 `recommendation()` 替换为自己的题目策略或后端学习服务。涉及儿童数据时，请先取得监护人同意，并遵守 [SECURITY.md](SECURITY.md)。

## 项目结构

```text
.
├── .github/                 # CI、Pages、Issue 和 PR 模板
├── public/assets/           # 可替换的图片、音频和动画资源
├── src/
│   ├── app.js               # 页面、内容、交互和模型配置
│   ├── storage.js           # IndexedDB 存储、迁移和降级策略
│   ├── styles.css           # 基础响应式样式
│   └── overrides.css        # 模型配置组件样式
├── index.html
├── vite.config.js
└── package.json
```

## 接入自己的内容

- 图片或封面：放入 `public/assets/`，在 `src/app.js` 中引用。
- 本地音频：建议放入 `public/assets/audio/`，在 `speak()` 的适配分支中播放。
- 自定义题目：将题目数据抽取为 JSON 后，由本地题库适配器加载。
- 远程模型：由你自己的后端保存密钥并向前端提供受控 API。

处理儿童内容时，请阅读 [SECURITY.md](SECURITY.md) 中的隐私建议。新增资源前请确认它允许公开再分发。

## GitHub Pages

仓库包含自动部署工作流。首次使用时，在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中将 Source 设为 **GitHub Actions**。之后推送到 `master` 会自动构建并部署。

## 贡献

欢迎提交功能建议和 Pull Request。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 许可证

代码使用 [MIT License](LICENSE)。仓库内或使用者自行添加的媒体资源可能采用不同许可证，使用前请分别确认。
