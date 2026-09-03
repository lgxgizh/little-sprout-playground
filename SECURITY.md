# 安全政策

## 报告安全问题

请不要通过公开 Issue 披露漏洞。请使用 GitHub 仓库的 Security Advisories 私下报告，并描述影响范围与复现步骤。

## 儿童隐私

本项目默认不上传儿童的姓名、声音、照片或答题记录。跟读功能使用浏览器本地语音识别（如果浏览器支持），只在当前页面临时比较关键词，不保存录音或识别文本。启用远程题目规划时，前端只发送年龄段、主题统计和最近的有限事件摘要；接入任何远程语音、图像或题目模型时，部署者必须：

- 在服务端保存 API Key，不得将密钥打包到前端。
- 在发送数据前取得监护人同意，并尽量减少上传内容。
- 明确数据保留、删除和第三方处理政策。
- 不把儿童内容用于广告画像或未经同意的模型训练。

当前前端示例将模型选择保存在浏览器 `localStorage`，不包含身份信息。

导出的学习档案 JSON 可能包含昵称、年龄、学习结果和模型设置。请把导出文件当作私人文件保存，不要上传到公开 Issue、公开仓库或不受信任的第三方服务。

## Children’s privacy

By default, this project keeps learning data on the device. Speak-back practice uses browser-local speech recognition when available; audio and transcripts are not stored. When the optional question-planning adapter is enabled, only a minimised summary is sent: age, optional gender, English background, baseline result, topic aggregates, streak/accuracy, and a small set of recent event types. Names, photos, audio, free text, and raw answers are excluded. Obtain guardian consent, document retention and deletion, keep provider keys on the server, and do not use children’s data for advertising profiles or unauthorised training.

Exported JSON files may contain nicknames, ages, learning results, and model settings. Treat them as private files and do not upload them to public issues, repositories, or untrusted services.
