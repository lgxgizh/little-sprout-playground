# 小小优趣 · 亲子学习乐园

一个面向 3 岁儿童的图片优先、语音辅助网页原型。项目不依赖后端即可运行，适合替换成本地动画、题目和音频资源，也可以继续接入自己的语音/图片生成服务。

## 本地运行

```bash
npm install
npm run dev
```

## 目录约定

- `public/assets/`：放置动画封面、题目插画、音频等静态资源
- `src/app.js`：内容数据、交互和题目逻辑
- `src/styles.css`：响应式视觉样式

当前语音使用浏览器 `SpeechSynthesis`，点击“听一听题目”即可播放。后续可在 `speak()` 中替换为云端 TTS 或本地音频播放。

## 模型配置

点击页面右上角「家长设置」即可打开模型与能力配置。三项能力都可以独立切换，并会保存到浏览器 `localStorage`：

- 图片生成：`GPT Image 1`、`FLUX Schnell`、本地图片库
- 语音提问：浏览器语音、OpenAI TTS、本地音频
- 词汇量测试：图片自适应测试、GPT-4o mini、本地题库

目前这是一个前端可运行原型，模型选择会记录下来并显示当前生效项。接入真实服务时，可在 `src/app.js` 中将 `speak()`、图片生成入口和题目生成入口替换为对应 API；API Key 建议放在后端环境变量中，不要写入前端代码。

## 上传到 GitHub

先在本机完成一次登录：

```bash
gh auth login
```

然后在项目目录执行（把 `your-name` 换成你的 GitHub 用户名）：

```bash
gh repo create little-fun-learning --public --source=. --remote=origin --push
```

如果你已经创建了空仓库，也可以直接设置远程地址后推送：

```bash
git remote add origin https://github.com/your-name/little-fun-learning.git
git push -u origin master
```
