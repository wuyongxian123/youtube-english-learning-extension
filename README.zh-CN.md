# YouTube Learn

[English](README.md)

使用 YouTube 字幕、查词卡片、笔记和 AI 问答学习英语的 Chrome 扩展。

本项目基于 [Zara Zhang 的 YouTube Digest](https://github.com/zarazhangrui/youtube-digest) 修改，保留原始 [MIT 许可证和版权声明](LICENSE)。本修改版独立维护，不是 YouTube 官方产品。

## 安装

1. 打开 https://github.com/wuyongxian123/youtube-english-learning-extension ，点击 Code → Download ZIP。
2. 解压到长期保留的文件夹。
3. 打开 chrome://extensions，启用“开发者模式”，点击“加载已解压的扩展程序”。
4. 选择包含 manifest.json 的文件夹。
5. 在 Settings 中填写自己的 Supadata 和 DeepSeek API 密钥。打开 YouTube 视频，点击 Learn。

无需编译。安装后请保留文件夹；更新文件后点击扩展的“重新加载”。卸载扩展或清空数据前，请另行保存重要笔记。

## 功能与限制

按句字幕、播放跟随、选中查词、英美发音、双语释义、可编辑笔记、AI 问答及故事生词高亮。语音输入提供 English／中文；字体支持12／15／20px。

代码按 MIT 许可免费提供。每位用户自行填写密钥并承担第三方服务费用，项目不内置开发者密钥。收费以服务商当前说明为准。

Ask AI 没有联网搜索。AI 释义、音标和翻译可能有误；字幕时间为近似值。语音输入依赖浏览器、麦克风权限和服务网络，不能保证中英混合识别。

“参考笔记”会将所选笔记发送给 DeepSeek。自动模式在问题提到笔记或生词时附带笔记，也可手动选择范围或关闭。最近单词按保存时间去重；所有笔记最多提供100个词，另有总长度限制。这是 AI 上下文限制，不是笔记保存数量限制。

详情见 [隐私说明](PRIVACY.md) 和 [安全说明](SECURITY.md)。
