# YouTube Learn

[简体中文](README.zh-CN.md)

Learn English with YouTube captions, dictionary cards, editable notes and AI questions.

Based on [YouTube Digest by Zara Zhang](https://github.com/zarazhangrui/youtube-digest). The original MIT license and copyright notice are preserved in [LICENSE](LICENSE). Independently maintained; not an official YouTube product.

## Install

1. Open https://github.com/wuyongxian123/youtube-english-learning-extension and choose Code > Download ZIP.
2. Extract into a permanent folder.
3. Open chrome://extensions, enable Developer mode, select Load unpacked, and choose the folder containing manifest.json.
4. Enter your own Supadata and DeepSeek API keys in Settings. Open a YouTube video and select Learn.

No build step is required. Keep the folder in place. Reload the extension after replacing its files for an update. Back up important notes before uninstalling or clearing extension data.

## Features and limitations

Sentence-based captions, playback highlighting, selection-based lookup, US/UK pronunciation, bilingual cards, editable notes, AI questions and vocabulary highlighting. Browser speech input supports English or Chinese; text sizes are 12, 15 and 20px.

Source code is free under MIT. Users supply their own keys and pay their own third-party API charges. Check provider pricing before use. No developer key is bundled.

Ask AI does not search the web. AI output may be inaccurate; caption timing is approximate. Speech recognition depends on browser support, permissions and network connectivity. Mixed-language recognition is not guaranteed.

Saved-note context is sent to DeepSeek when enabled. Auto mode includes notes when questions mention them; users can select a scope or disable access. Recent words are deduplicated by saved time. All-notes context is limited to 100 vocabulary entries and an overall text limit, not unlimited retrieval. This is not a limit on locally saved notes.

See [Privacy](PRIVACY.md) and [Security](SECURITY.md).
