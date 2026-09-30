# 英语学习定制版 1.3.6

当前操作以本节为准，下面保留的旧版记录仅供追溯。

- YouTube 上点击 Learn 打开插件。更新后在 chrome://extensions 重新加载并刷新视频页。
- 只有拖选单词、短语或句子才查词。单击字幕只跳转视频。卡片内也支持拖选查词，最多两层同时显示。
- 拖动词卡顶部空白区域移动窗口；红色圆形 × 固定在窗口右上角，滚动内容时仍可见。
- 字号小、中、大分别为 12px、15px、20px，Arial 普通字重。
- 词卡底部直接写笔记，也可以空白保存选中的词句。Enter 保存，Shift+Enter 换行；中文输入法选字不会误保存。保存成功关闭该词卡，失败保留输入。
- Notes 中 Edit 可编辑个人笔记内容，保留来源、单词和时间。笔记词条只显示音标，不再显示 US/UK 读音按钮。旧笔记缺少音标时，在滚动到该条时查询词典，必要时用已配置的 AI 获取参考音标（消耗 AI 额度）。词卡里的英美音播放保留。
- Ask AI：Enter 发送，Shift+Enter 换行；每次新打开是独立对话，同一个窗口支持追问。提问自动带上当前查的词句，“这个单词”指代它。左上角返回恢复原词卡。
- 语音按钮为麦克风，提供 English / 中文两种识别语言，并记住用户选择。首次按浏览器语言选择，不能保证中英混合智能识别；可靠混合识别需要另接支持混合语言的语音转文字服务。已移除常驻的麦克风设置按钮，必要的权限窗口仍会在点击麦克风时打开。

## 以下为旧版记录（操作以 1.3.6 为准）

继续使用原来的插件文件夹，不需要卸载、重新安装或重新填写已有密钥。

1. 打开 Chrome 扩展管理页面（地址栏输入 chrome://extensions）。
2. 找到 YouTube Learn，点击重新加载按钮，再刷新 YouTube 视频页面。
3. 字体为 Arial，默认字号 18px、字幕字重 600，可通过 Text size 在 14–20px 间调整。以前超过 20px 的设置会自动改为 20px。
4. 单击英文单词，或用鼠标选中短语、句子，即可查词。卡片内也可以继续查词，Back 返回。
5. 点击 US / UK 小喇叭试听。优先词典录音；缺失或播放失败时，使用 Chrome 扩展语音接口，优先本机同口音声音，并尝试其他同口音声音。声音全部失败时显示具体错误。Windows 中缺少英语语音包时，在“设置 → 时间和语言 → 语音 → 管理语音/添加语音”安装 English (United States) 和 English (United Kingdom)，然后完全退出并重启 Chrome。网络声音取决于浏览器语音服务是否可连接。AI 生成的音标会标为 approximate。
6. 在 Notes 页面点击 + New note，直接打字写想法、问题、造句，不需要先选择字幕。也可以点击卡片中的 Note 携带单词与语境，或用 Voice input 口述。Stop recording 后可修改文字，再点击 Save note。支持中文和英文输入，保留换行，单条最多一万字。笔记仍在 Notes 内，草稿保存在本机。
7. 点击 Ask AI 输入或口述问题，Send 后获取简单英文回答，支持连续追问。回答里的单词也可以查。
8. 有标点的字幕自动按完整句子拆分，较长句子不强行截成五秒。检测到英文字幕严重缺少标点时，会自动使用现有 AI 服务找句子边界，等待期间暂时显示短段。也可以点击 AI sentence breaks 手动处理或重试。此操作消耗 AI 额度，只改变分段，不改字幕原词。结果在本机缓存。

时间点根据原字幕时间估算，不是精确逐词对齐。首次点 Voice input，会出现 YouTube Learn 自己的授权窗口；点 Allow microphone 并在 Chrome 提示中允许，关闭窗口后再点一次 Voice input。YouTube 网站的麦克风权限不等于插件权限。授权检查会立即释放麦克风，不保存录音。需要重新授权时再次点击麦克风。若识别仍报 network，是浏览器语音识别服务连接失败，需检查网络/代理；这与麦克风许可不同。语音输入失败时可继续打字。

Ask AI 回答中的 Markdown 星号、标题标记等会转成普通文本显示。你的笔记和提问原文不会被清理规则改动。

发音字典为 Free Dictionary API（https://dictionaryapi.dev/），无需新增密钥。没有查到的音标会使用 AI 参考音标，不能保证所有单词、短语的双口音词典录音都齐全。

原有笔记和密钥保存在 Chrome 中，代码备份不包含它们。不要卸载原插件。新增笔记不再自动删除超过 100 条的旧笔记；存储空间不足会报错。

问答历史在当前面板打开期间保留，关闭后清空。笔记和输入草稿保留在本机。
# Version 1.3.2

- Compact toolbar and paragraph spacing. Drag the separator below the header to change reading space; double-click it to reset. Drag the lower-right corner of cards, the note/AI window, or content sections to resize them. Reading text adapts to pane width within 14–20px. Chrome controls the outer side-panel width.
- Save note accepts the current sentence or selected text with optional personal comments. A completely empty note without a source is still rejected.
- Playback uses fractional video time and the associated YouTube tab. Overlapping cue durations are bounded by the next caption, including previously cached AI sentence breaks. Timing inside a single source caption remains estimated because the provider does not supply individual word timings.
- Subtitle tools is collapsed by default. AI sentence breaks remains useful for captions without punctuation; it uses the configured AI provider and credits.
# Version 1.3.4

- Save note closes the editor after a successful save. Failed saves keep the text open.
- Clicking a transcript sentence seeks the video; clicking a word also opens its explanation. Selecting a phrase does not seek.
- The first dictionary card remains open during nested lookup. A blue second card shows all deeper lookups, replacing only that second card. Either Close button closes only its own card. Clicking outside the cards, including on the linked YouTube page, closes both.
- English explanations no longer wait for dictionary audio. Up to 150 contextual explanations are cached locally for repeat lookups. The first AI response still depends on the configured provider and network.
- Bilingual mode shows a short Chinese gloss beside the headword as well as translated explanations and examples. English remains the default.
- Saved words and phrases have separate US and UK pronunciation buttons; the original Play button still returns to the video.
- Ask AI starts a fresh conversation each time it opens. Follow-up questions in the open window retain that conversation. New answers are shown from their beginning.
- Caption fragments ending in a preposition can join the following object, including cached AI sentence breaks. Original wording is preserved; caption timestamps within a cue remain approximate. Reading text is Arial, normal weight.
