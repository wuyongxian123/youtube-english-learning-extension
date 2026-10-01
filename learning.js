/* Personal English learning panel. All provider text is rendered as text. */
(() => {
  const $ = id => document.getElementById(id);
  const state = { lastLookup: null, cards: [null, null], trail: [], card: null, drawer: null, recognition: null, audio: null,
    history: [], chatVideo: null, ignoreClickUntil: 0, cache: new Map(), request: 0, refinedAttempts: new Set() };
  const make = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const button = (text, action) => {
    const node = make("button", text); node.type = "button";
    node.addEventListener("click", action); return node;
  };
  function closeButton(action) {
    const node = button("×", action); node.className = "learning-close";
    node.setAttribute("aria-label", "Close"); node.title = "Close"; return node;
  }
  function microphoneIcon(node) {
    node.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>';
  }
  function enterSubmit(input, submit) {
    input.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
        event.preventDefault(); if (!submit.disabled) submit.click();
      }
    });
  }
  const message = async request => {
    const result = await sendTranslationMessage(request);
    if (!result?.success) throw new Error(result?.message || result?.error || "Request failed. Please try again.");
    return result;
  };
  function captureContext(element) {
    const row = element?.closest(".transcript-entry");
    const parentCard = element?.closest(".learning-card");
    const source = parentCard && state.cards[Number(parentCard.dataset.slot)];
    if (source) return { ...source.origin,
      context: `${source.text}: ${source.data?.meaning || ""} ${source.data?.example || ""}` };
    return { videoId: currentVideoId, videoTitle: currentVideoTitle, channelName: currentChannelName,
      timestamp: row ? Number(row.dataset.seconds) || 0 : null,
      context: (row?.querySelector(".transcript-text")?.textContent || element?.textContent || "").slice(0, 3000) };
  }
  function stopAudio() {
    YTD_LEARNING_SUPPORT.stop();
  }
  function stopRecognition() {
    state.recognition?.abort(); state.recognition = null;
  }
  function closeCard(item) {
    if (item && state.cards[item.slot] !== item) return;
    const slots = item ? [item.slot] : [0, 1];
    for (const slot of slots) { $(slot ? "learningNestedCard" : "learningCard")?.remove(); state.cards[slot] = null; }
    state.card = state.cards[1] || state.cards[0]; stopAudio();
  }
  async function speak(item, accent, status) {
    await YTD_LEARNING_SUPPORT.speak(item.text, accent, item.data?.accents?.[accent]?.audio, status);
  }
  function renderCard(item) {
    if (state.cards[item.slot] !== item) return;
    const id = item.slot ? "learningNestedCard" : "learningCard";
    const previous = $(id);
    const dimensions = previous ? { width: previous.style.width, height: previous.style.height, left: previous.style.left, top: previous.style.top, scroll: previous.scrollTop } : item.dimensions;
    previous?.remove();
    const card = make("section", undefined, `learning-card${item.slot ? " learning-card-nested" : ""}`); card.id = id; card.dataset.slot = item.slot;
    card.setAttribute("role", "region"); card.setAttribute("aria-label", "Word and phrase explanation");
    const head = make("div", undefined, "learning-row learning-window-head");
    for (const [label, mode] of [["English", false], ["双语", true]]) {
      const toggle = button(label, async () => {
        item.bilingual = mode;
        if (!mode || item.zh || !item.data || item.translating) { renderCard(item); return; }
        item.translating = true; item.translationError = ""; renderCard(item);
        try {
          const result = await message({ action: "learningTranslateCard", selected: item.text, meaning: item.data.meaning, example: item.data.example, usage: item.data.usage });
          item.zh = result.translation;
        } catch (error) { item.translationError = error.message; }
        finally { item.translating = false; renderCard(item); }
      });
      toggle.disabled = !item.data;
      toggle.setAttribute("aria-pressed", String(!!item.bilingual === mode));
      toggle.className = "learning-language"; head.append(toggle);
    }
    const close = closeButton(() => closeCard(item));
    head.append(close);
    card.append(head, make("h2", item.text + (item.bilingual && item.zh?.basic ? ` — ${item.zh.basic}` : ""), "learning-readable"));
    const content = make("div"); content.id = item.slot ? "learningNestedCardBody" : "learningCardBody";
    if (!item.data) content.append(make("p", item.error || "Finding a simple explanation…", "learning-status"));
    if (item.error) content.append(button("Try again", () => openCard(item.text, item.origin, !!item.slot, true)));
    if (item.data) {
      const status = make("p", "", "learning-status"); status.setAttribute("role", "status");
      for (const accent of ["us", "uk"]) {
        const row = make("div", undefined, "learning-pronunciation");
        const known = item.data.accents?.[accent];
        const ipa = known?.ipa || item.data[accent];
        const play = button(`🔊 ${accent.toUpperCase()}`, () => speak(item, accent, status));
        play.setAttribute("aria-label", `Play ${accent === "us" ? "American" : "British"} pronunciation`);
        row.append(play, make("span", ipa || "IPA unavailable", "learning-ipa"),
          make("small", known?.ipa ? "Dictionary IPA" : ipa ? "AI IPA · approximate" : ""));
        content.append(row);
      }
      content.append(status);
      for (const [label, key] of [["How to understand", "meaning"], ["Example", "example"], ["How to use it", "usage"]]) {
        const value = item.data[key];
        if (!value) continue;
        content.append(make("h3", label, "learning-eyebrow"), make("p", YTD_LEARNING_SUPPORT.plain(value), "learning-readable"));
        if (item.bilingual && item.zh?.[key]) content.append(make("p", item.zh[key], "learning-readable learning-chinese"));
      }
      if (item.bilingual && !item.zh) content.append(make("p", item.translationError || "正在生成中文释义…", "learning-status"));
      if (Object.keys(item.data.accents || {}).length) {
        const credit = make("a", "Pronunciation: Free Dictionary API");
        credit.href = "https://dictionaryapi.dev/"; credit.target = "_blank"; credit.rel = "noopener noreferrer";
        content.append(credit);
      }
    }
    const actions = make("div", undefined, "learning-row");
    const noteInput = make("textarea"); noteInput.className = "learning-inline-note"; noteInput.rows = 3;
    noteInput.maxLength = 10000; noteInput.placeholder = "Optional note · Enter to save · Shift+Enter for a new line";
    noteInput.setAttribute("aria-label", "Note for selected text"); noteInput.value = item.noteDraft || "";
    noteInput.addEventListener("input", () => { item.noteDraft = noteInput.value; });
    const noteStatus = make("p", item.noteError || "", "learning-status"); noteStatus.setAttribute("role", "status");
    const save = button("Save note", async () => {
      if (item.saving) return;
      item.saving = true; save.disabled = true; noteInput.readOnly = true;
      try {
        await message({ action: "learningSaveNote", ...item.origin, selected: item.text, text: noteInput.value.trim(), us: item.data?.accents?.us?.ipa || item.data?.us, uk: item.data?.accents?.uk?.ipa || item.data?.uk });
        closeCard(item); await loadNotes($("notesFilterAll")?.classList.contains("active") ? null : currentVideoId);
      } catch (error) { item.noteError = error.message; noteStatus.textContent = error.message; }
      finally { item.saving = false; save.disabled = false; noteInput.readOnly = false; }
    });
    save.disabled = !!item.saving; noteInput.readOnly = !!item.saving;
    enterSubmit(noteInput, save);
    actions.append(button("✎ Note", () => noteInput.focus()), button("Ask AI", () => openDrawer("chat", item)));
    card.append(content, actions, noteInput, save, noteStatus);
    document.body.append(card);
    window.ytdLearningLayout?.resizable(card);
    if (dimensions) { for (const key of ["width", "height", "left", "top"]) card.style[key] = dimensions[key] || ""; card.scrollTop = dimensions.scroll || 0; }
    window.ytdLearningLayout?.draggable(card, head, () => { item.dimensions = { width: card.style.width, height: card.style.height, left: card.style.left, top: card.style.top, scroll: card.scrollTop }; });
  }
  async function openCard(text, origin, nested = false, retry = false) {
    text = text.trim(); if (!text || text.length > 1500) return;
    stopAudio();
    const slot = nested ? 1 : 0;
    if (!nested) closeCard();
    const item = { text, origin, slot };
    state.cards[slot] = item;
    state.card = item;
    state.lastLookup = item;
    const cacheKey = JSON.stringify([text, origin.context]);
    item.data = state.cache.get(cacheKey);
    renderCard(item);
    const pronunciation = message({ action: "learningPronunciation", text }).then(result => {
      item.accents = result.accents;
      if (item.data) { item.data.accents = result.accents; renderCard(item); }
    }).catch(() => {});
    if (item.data) { void pronunciation; return; }
    try {
      const result = await message({ action: "learningLookup", text, context: origin.context });
      item.data = result.card;
      if (item.accents) item.data.accents = item.accents;
      state.cache.set(cacheKey, item.data);
      if (state.cache.size > 150) state.cache.delete(state.cache.keys().next().value);
      chrome.storage.local.set({ learning_lookup_cache_v1: Array.from(state.cache) }).catch(() => {});
    } catch (error) { item.error = error.message; }
    renderCard(item);
  }
  function eligible(element) {
    return element instanceof Element && !element.closest("button,a,input,textarea,select,.learning-ipa,.transcript-time,.learning-eyebrow,.learning-hint,.learning-status") &&
      element.closest(".transcript-text,.transcript-original,.transcript-translation,.note-text,.learning-readable,.quote-text,.chapter-summary");
  }
  function wordAt(event) {
    const range = document.caretRangeFromPoint?.(event.clientX, event.clientY);
    if (!range || range.startContainer.nodeType !== Node.TEXT_NODE || !eligible(range.startContainer.parentElement)) return "";
    const source = range.startContainer.textContent;
    for (const match of source.matchAll(/[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*/gu)) {
      if (range.startOffset < match.index || range.startOffset > match.index + match[0].length) continue;
      const wordRange = document.createRange();
      wordRange.setStart(range.startContainer, match.index); wordRange.setEnd(range.startContainer, match.index + match[0].length);
      const inside = Array.from(wordRange.getClientRects()).some(rect => event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom);
      return inside ? match[0] : "";
    }
    return "";
  }
  function lookupSelection() {
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed) return false;
    const range = selection.getRangeAt(0);
    const start = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
    const end = range.endContainer.nodeType === 1 ? range.endContainer : range.endContainer.parentElement;
    if (!eligible(start) || !eligible(end)) return false;
    const text = selection.toString().trim();
    if (!text || text.length > 1500) return false;
    const origin = captureContext(start); const nested = !!start.closest(".learning-card");
    state.ignoreClickUntil = Date.now() + 400;
    queueMicrotask(() => { selection.removeAllRanges(); openCard(text, origin, nested); });
    return true;
  }
  async function microphone(input, mic, status, language) {
    if (state.recognition) { state.recognition.stop(); return; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { status.textContent = "Voice input is unavailable here. Please type your text."; return; }
    mic.disabled = true;
    try {
      if (!await YTD_LEARNING_SUPPORT.prepareMicrophone(status, mic.dataset.permissionRetry === "true")) return;
      delete mic.dataset.permissionRetry;
    } catch (error) { status.textContent = `Microphone setup failed: ${error.message}`; return; }
    finally { mic.disabled = false; }
    if (!input.isConnected) return;
    stopAudio();
    const recognition = new Recognition(); state.recognition = recognition;
    recognition.lang = language.value; language.disabled = true;
    recognition.continuous = true; recognition.interimResults = true;
    let failed = false;
    recognition.onstart = () => { mic.textContent = "■"; mic.setAttribute("aria-label", "Stop recording"); mic.title = "Stop recording"; mic.setAttribute("aria-pressed", "true"); status.textContent = "Listening… Click Stop when you finish."; input.readOnly = true; };
    recognition.onresult = event => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const combined = `${input.value.trim()} ${transcript.trim()}`.trim();
          input.value = combined.slice(0, input.maxLength > 0 ? input.maxLength : 4000);
          input.dispatchEvent(new Event("input", { bubbles: true }));
        } else interim += transcript;
      }
      status.textContent = interim || "Listening…";
    };
    recognition.onerror = event => {
      failed = true;
      if (event.error === "not-allowed") mic.dataset.permissionRetry = "true";
      const errors = { "not-allowed": "Chrome or Windows blocked this extension's microphone. Click Microphone setup below; YouTube's permission is separate.", "service-not-allowed": "The browser's speech recognition service is blocked. Microphone permission alone cannot enable that service.", "network": "The microphone is allowed, but Chrome's speech-to-text service could not connect. Check your network/proxy connection and retry.", "no-speech": "No speech detected. Try again.", "audio-capture": "No microphone is available. Check Windows microphone access and your microphone connection." };
      status.textContent = event.error === "not-allowed" ? "Microphone access was blocked. Click the microphone again to open its permission window." : errors[event.error] || `Voice input stopped (${event.error}). You can type or try again.`;
    };
    recognition.onend = () => {
      language.disabled = false;
      if (state.recognition === recognition) state.recognition = null;
      microphoneIcon(mic); mic.setAttribute("aria-label", "Voice input"); mic.title = "Voice input"; mic.setAttribute("aria-pressed", "false"); input.readOnly = false;
      if (!failed) status.textContent = "Recording stopped. Review your words before saving or sending.";
    };
    try { recognition.start(); } catch { state.recognition = null; language.disabled = false; status.textContent = "Could not start voice input. Please try again or type."; }
  }
  function closeDrawer() {
    stopRecognition(); $("learningDrawer")?.remove(); state.drawer = null;
  }
  async function openDrawer(mode, item) {
    if (mode === "chat" && !item && state.lastLookup?.origin.videoId === currentVideoId) item = state.lastLookup;
    const returnCards = state.cards.slice();
    // Drafts are saved on each input, so opening a new tool does not lose them.
    closeDrawer();
    const origin = { ...(item?.origin || captureContext(transcriptTabIsActive() ? document.querySelector('.transcript-entry.active-playback .transcript-text') : null)) };
    if (origin.timestamp === null) {
      origin.timestamp = 0;
      chrome.runtime.sendMessage({ action: "relayToContent", payload: { action: "getCurrentTime" } }).then(time => {
        if (currentVideoId === origin.videoId) origin.timestamp = Number(time?.response?.currentTime) || 0;
      }).catch(() => {});
    }
    const drawer = make("section", undefined, "learning-drawer"); drawer.id = "learningDrawer";
    if (mode === "chat") drawer.classList.add("learning-ask-drawer");
    drawer.setAttribute("role", "region"); drawer.setAttribute("aria-label", mode === "note" ? "Write a note" : "Ask AI");
    state.drawer = drawer;
    const head = make("div", undefined, "learning-row learning-window-head");
    if (mode === "chat") {
      const back = button("← 返回", () => {
        closeDrawer();
        const cards = returnCards.some(Boolean) ? returnCards : item ? [item.slot === 0 ? item : null, item.slot === 1 ? item : null] : [];
        for (const card of cards) if (card) { state.cards[card.slot] = card; renderCard(card); }
        state.card = state.cards[1] || state.cards[0];
      });
      back.disabled = !item && !returnCards.some(Boolean); head.append(back);
    }
    head.append(make("h2", mode === "note" ? "Write a note" : "Ask AI"), closeButton(closeDrawer));
    drawer.append(head);
    const context = `${item?.text ? `Selected: ${item.text}\n` : ""}${origin.context || ""}`.slice(0, 1000);
    if (context) drawer.append(make("p", context, "learning-context learning-readable"));
    const chat = make("div", undefined, "learning-chat");
    if (mode === "chat") {
      state.history = []; state.chatVideo = origin.videoId;
      for (const turn of state.history) chat.append(make("p", `${turn.role === "user" ? "You" : "AI"}: ${turn.role === "assistant" ? YTD_LEARNING_SUPPORT.plain(turn.content) : turn.content}`, "learning-readable"));
      drawer.append(chat);
    }
    const label = make("label", mode === "note" ? "Your note (optional — save the sentence directly)" : "Your question");
    label.htmlFor = "learningInput";
    const input = make("textarea"); input.id = "learningInput"; input.rows = mode === "chat" ? 1 : 5; input.maxLength = mode === "note" ? 10000 : 4000;
    const fitInput = () => {
      if (mode !== "chat") return;
      if (!input.value) { input.style.height = "36px"; return; }
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    };
    input.addEventListener("input", fitInput);
    input.placeholder = mode === "note" ? "Type your own thoughts, questions, or sentences here…" : "输入问题 / Ask a question…";
    const draftKey = `learning_draft_${mode}_${origin.videoId || "general"}_${(item?.text || "free").slice(0, 120)}`;
    let dirty = false;
    input.addEventListener("input", () => { dirty = true; chrome.storage.local.set({ [draftKey]: input.value }).catch(() => {}); });
    if (mode === "note") chrome.storage.local.get(draftKey).then(data => { if (!dirty && drawer.isConnected) input.value = data[draftKey] || ""; }).catch(() => {});
    drawer.append(label, input);
    if (mode === "chat") {
      const template = "把笔记中【最近10个】单词串成一个【爱情】故事";
      const hint = make("div", undefined, "learning-prompt-template");
      hint.append(make("span", `可参考提示词：${template}`));
      hint.append(button("填入提示词", () => {
        input.value = template; input.dispatchEvent(new Event("input", {bubbles:true})); input.focus();
      }));
      drawer.append(hint);
    }
    const notesScope = make("select"); notesScope.setAttribute("aria-label", "AI notes access");
    const notesArea = make("div", undefined, "learning-notes-access");
    if (mode === "chat") {
      const noteLabel = make("label", "参考笔记 ");
      for (const [value, title] of [["auto","自动（提到笔记时）"],["none","不使用笔记"]]) {
        const option = make("option",title); option.value=value; notesScope.append(option);
      }
      noteLabel.append(notesScope); notesArea.append(noteLabel,make("p","所选笔记会随提问发送给 AI。按保存时间去重；所有笔记最多100个，过长时截取。","learning-status"));
    }
    const status = make("p", "", "learning-status"); status.setAttribute("role", "status");
    const controls = make("div", undefined, "learning-row");
    const language = make("select"); language.className = "learning-voice-language"; language.setAttribute("aria-label", "Voice recognition language");
    for (const [name, code] of [["English", "en-US"], ["中文", "zh-CN"]]) {
      const option = make("option", name); option.value = code; language.append(option);
    }
    language.value = navigator.language?.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
    let languageChanged = false;
    chrome.storage.local.get("learning_voice_language").then(saved => {
      if (!languageChanged && ["en-US", "zh-CN"].includes(saved.learning_voice_language)) language.value = saved.learning_voice_language;
    }).catch(() => {});
    language.addEventListener("change", () => { languageChanged = true; chrome.storage.local.set({learning_voice_language: language.value}).catch(() => {}); });
    const mic = button("", () => { languageChanged = true; microphone(input, mic, status, language); });
    microphoneIcon(mic);
    mic.className = "learning-voice"; mic.title = "Voice input"; mic.setAttribute("aria-label", "Voice input");
    mic.setAttribute("aria-pressed", "false");
    const submit = button(mode === "note" ? "Save note" : "Send", async () => {
      if (state.recognition) { state.recognition.stop(); status.textContent = "Recording is stopping. Review the text, then click again."; return; }
      const text = input.value.trim(); if (!text && (mode !== "note" || !(item?.text || origin.context))) { status.textContent = mode === "note" ? "Select a sentence or type a note first." : "Type or say something first."; input.focus(); return; }
      submit.disabled = true; mic.disabled = true; input.readOnly = true;
      status.textContent = mode === "note" ? "Saving…" : "Thinking…";
      try {
        if (mode === "note") {
          if (!origin.videoId) throw new Error("Open a YouTube video before saving a note.");
          let timestamp = origin.timestamp;
          if (timestamp === null) {
            const time = await chrome.runtime.sendMessage({ action: "relayToContent", payload: { action: "getCurrentTime" } });
            timestamp = Number(time?.response?.currentTime) || 0;
          }
          await message({ action: "learningSaveNote", ...origin, timestamp,
            text, selected: item?.text || "", context: origin.context || "" });
          status.textContent = "Saved to Notes with the video timestamp.";
          const showAll = $("notesFilterAll")?.classList.contains("active");
          await loadNotes(showAll ? null : currentVideoId);
        } else {
          const history = state.history;
          const response = await message({ action: "learningAsk", selected: item?.text || "", question: text, context, history, notesScope:notesScope.value, videoId:origin.videoId });
          history.push({ role: "user", content: text }, { role: "assistant", content: response.answer });
          const answer = make("p", `AI: ${YTD_LEARNING_SUPPORT.plain(response.answer)}`, "learning-readable");
          const words = [...new Set((response.noteWords || []).filter(word => typeof word === "string" && word.trim()).map(word => word.trim()))].sort((a,b) => b.length-a.length);
          if (words.length) {
            const pattern = new RegExp('(?<![\\p{L}\\p{N}_])(?:' + words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\p{L}\\p{N}_])', 'giu');
            const text = answer.textContent; let cursor = 0; answer.replaceChildren();
            for (const match of text.matchAll(pattern)) {
              answer.append(document.createTextNode(text.slice(cursor, match.index)), make("mark", match[0], "learning-story-word"));
              cursor = match.index + match[0].length;
            }
            answer.append(document.createTextNode(text.slice(cursor)));
          }
          chat.append(make("p", `You: ${text}`, "learning-readable"), answer);
          const translation = make("p", "", "learning-readable learning-chinese"); translation.hidden = true;
          const translateStatus = make("span", "", "learning-status");
          const bilingual = button("双语", async () => {
            if (translation.textContent) {
              translation.hidden = !translation.hidden; bilingual.textContent = translation.hidden ? "双语" : "English"; return;
            }
            bilingual.disabled = true; translateStatus.textContent = "翻译中…";
            try {
              const result = await message({action:"learningTranslateAnswer", text:response.answer});
              translation.textContent = YTD_LEARNING_SUPPORT.plain(result.translation); translation.hidden = false;
              bilingual.textContent = "English"; translateStatus.textContent = "";
            } catch(error) { translateStatus.textContent = error.message; }
            finally { bilingual.disabled = false; }
          });
          const answerTools = make("div", undefined, "learning-row"); answerTools.append(bilingual, translateStatus);
          chat.append(answerTools, translation);
          chat.scrollTop = answer.offsetTop;
          drawer.scrollTop = 0; status.textContent = "";
        }
        input.value = "";
        fitInput();
        const latestDraft = await chrome.storage.local.get(draftKey);
        if ((latestDraft[draftKey] || "").trim() === text) await chrome.storage.local.remove(draftKey);
        if (mode === "note" && state.drawer === drawer) closeDrawer();
      } catch (error) { status.textContent = error.message; }
      finally { submit.disabled = false; mic.disabled = false; input.readOnly = false; }
    });
    enterSubmit(input, submit);
    controls.append(mic, language, submit); drawer.append(controls);
    if (mode === "chat") drawer.append(notesArea);
    drawer.append(status);
    // The card can be reopened by selecting words in this drawer.
    closeCard(); document.body.append(drawer); input.focus(); fitInput();
  }

  async function refineSentences(control, status) {
    if (!currentTranscript?.length) return;
    const videoId = currentVideoId;
    const original = currentTranscript;
    control.disabled = true;
    const tokens = timedCaptionWords(original);
    const rows = [];
    let cursor = 0;
    try {
      while (cursor < tokens.length) {
        if (currentVideoId !== videoId) throw new Error("Video changed. Original captions kept.");
        status.textContent = `Finding sentence breaks… ${Math.round(cursor / tokens.length * 100)}%`;
        const batch = tokens.slice(cursor, cursor + 220);
        const finalBatch = cursor + batch.length === tokens.length;
        const result = await message({ action: "learningSentences", words: batch.map(t => t.text), finalBatch });
        if (!result.ends.length) throw new Error("Could not find a complete sentence in this section. Original captions kept.");
        let start = 0;
        for (const end of result.ends) {
          const segmentTokens = batch.slice(start, end);
          rows.push({ id: `sentence-${rows.length}-${Math.round(segmentTokens[0].start * 1000)}`, start: segmentTokens[0].start,
            text: segmentTokens.map(t => t.text).join(" "), texts: [segmentTokens.map(t => t.text).join(" ")] });
          start = end;
        }
        cursor += start;
      }
      if (currentVideoId !== videoId || currentTranscript !== original) throw new Error("Video changed. Original captions kept.");
      window.ytdLearning.refined = { videoId, original, rows };
      transcriptParagraphCache.clear(); translationGeneration++;
      await chrome.storage.local.set({ [`learning_sentences_${videoId}`]: { source: JSON.stringify(original), rows } });
      if (currentTranscriptMode === "original") renderTranscript();
      else await translateTranscript();
      status.textContent = "One sentence per paragraph. Original words preserved; timestamps are approximate.";
    } catch (error) { status.textContent = error.message; }
    finally { control.disabled = false; }
  }

  async function restoreSentences() {
    const videoId = currentVideoId, original = currentTranscript;
    try {
      const stored = await chrome.storage.local.get(`learning_sentences_${videoId}`);
      const saved = stored[`learning_sentences_${videoId}`];
      if (currentVideoId === videoId && currentTranscript === original && saved?.source === JSON.stringify(original) && Array.isArray(saved.rows)) {
        const rows = retimeSentenceRows(saved.rows, original);
        if (rows) { window.ytdLearning.refined = { videoId, original, rows }; return; }
      }
    } catch { /* Original captions remain usable if cache is unavailable. */ }
    const text = (original || []).map(entry => entry.text || "").join(" ");
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = (text.match(/[.!?](?:\s|$)/g) || []).length;
    if (wordCount > 20 && sentenceCount < wordCount / 60 && /[a-z]{3}/i.test(text) && !state.refinedAttempts.has(videoId)) {
      state.refinedAttempts.add(videoId);
      setTimeout(() => {
        const control = $("learningRefineButton"), status = $("learningRefineStatus");
        if (control && status && currentVideoId === videoId && currentTranscript === original && !control.disabled) refineSentences(control, status);
      }, 100);
    }
  }
  function addNotePronunciation(noteEl, note) {
    const edit = button("Edit", () => {
      if (noteEl.querySelector(".learning-note-editor")) return;
      const editor = make("div", undefined, "learning-note-editor");
      const input = make("textarea"); input.rows = 5; input.maxLength = 10000;
      input.value = note.kind === "personal" ? note.rawText || "" : note.text || "";
      input.setAttribute("aria-label", "Edit note");
      const status = make("p", "", "learning-status");
      const save = button("Save changes", async () => {
        save.disabled = true;
        try { await message({action:"learningUpdateNote", id:note.id, text:input.value}); await loadNotes($("notesFilterAll")?.classList.contains("active") ? null : currentVideoId); }
        catch (error) { status.textContent = error.message; }
        finally { save.disabled = false; }
      });
      enterSubmit(input, save); editor.append(input, save, button("Cancel", () => editor.remove()), status);
      noteEl.append(editor); input.focus();
    });
    edit.className = "note-action-btn"; noteEl.querySelector(".note-actions").prepend(edit);
    const selected = note.selectedText || /^Word \/ phrase:\s*([^\n]+)/.exec(note.text || "")?.[1];
    if (!selected) return;
    const row = make("div", undefined, "learning-note-word");
    row.append(make("span", selected, "learning-readable"));
    const ipa = make("span", "Loading IPA…", "learning-ipa"); row.append(ipa);
    const cached = Array.from(state.cache).find(([key]) => { try { return JSON.parse(key)[0] === selected; } catch { return false; } })?.[1];
    const initial = note.ipa || { us: cached?.us, uk: cached?.uk };
    const show = (us, uk) => {
      ipa.replaceChildren();
      if (!(us || uk)) { ipa.textContent = "IPA unavailable"; return; }
      ipa.append(make("span", us || uk), make("sup", us ? "US" : "UK", "learning-accent-badge"));
    };
    if (initial.us || initial.uk) show(initial.us, initial.uk);
    else {
      const loadIpa = async () => {
        try {
          const result = await message({action:"learningPronunciation",text:selected});
          if (result.accents?.us?.ipa || result.accents?.uk?.ipa) show(result.accents?.us?.ipa,result.accents?.uk?.ipa);
          else {
            const result = await message({action:"learningLookup",text:selected,context:note.sourceContext || ""});
            show(result.card?.us,result.card?.uk);
            if (result.card?.us || result.card?.uk) ipa.title = "AI IPA · approximate";
          }
        } catch { ipa.textContent = "IPA unavailable"; }
      };
      const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); void loadIpa(); } });
      observer.observe(row);
    }
    noteEl.querySelector(".note-header").after(row);
    // Avoid repeating the selected word when the original note contains its header.
    if (note.selectedText && note.text.startsWith(`Word / phrase: ${note.selectedText}\n\n`) && currentTranscriptMode === "original")
      noteEl.querySelector(".note-text").textContent = note.text.slice(`Word / phrase: ${note.selectedText}\n\n`.length);
  }
  window.ytdLearning = { openCard, captureContext, restoreSentences, addNotePronunciation, refined: null };
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "learningDismissCards" && sender.tab?.id === youtubeTabId) closeCard();
  });
  document.addEventListener("DOMContentLoaded", async () => {
    chrome.storage.local.get("learning_lookup_cache_v1").then(saved => {
      for (const entry of (saved.learning_lookup_cache_v1 || []).slice(-150)) if (Array.isArray(entry) && entry[1]?.meaning) state.cache.set(entry[0], entry[1]);
    }).catch(() => {});
    const toolbar = make("div", undefined, "learning-toolbar");
    toolbar.append(button("✎ Note", () => openDrawer("note", state.card)), button("Ask AI", () => openDrawer("chat", state.card)));
    const label = make("label", undefined, "learning-size-label");
    const sizeTitle = make("span", "Text size"); sizeTitle.append(make("small", "字号")); label.append(sizeTitle);
    const size = make("select"); size.setAttribute("aria-label", "Transcript text size");
    for (const [n, name] of [[12,"小"],[15,"中"],[20,"大"]]) { const option = make("option", name); option.value = n; size.append(option); }
    size.value = "15"; label.append(size); toolbar.append(label);
    document.querySelector(".header").append(toolbar);
    $("newNoteBtn")?.addEventListener("click", () => openDrawer("note", null));
    size.addEventListener("change", () => {
      document.documentElement.style.setProperty("--learning-font-size", `${size.value}px`);
      chrome.storage.local.set({ learning_font_size: Number(size.value) });
    });
    const saved = await chrome.storage.local.get("learning_font_size");
    const savedSize = Number(saved.learning_font_size);
    size.value = String(savedSize === 10 ? 12 : [12,15,20].includes(savedSize) ? savedSize : 15);
    document.documentElement.style.setProperty("--learning-font-size", `${size.value}px`);
    await chrome.storage.local.set({ learning_font_size: Number(size.value) });
    window.speechSynthesis?.getVoices();
  });
  document.addEventListener("mouseup", () => lookupSelection());
  document.addEventListener("keyup", event => { if (event.key === "Shift") lookupSelection(); });
  document.addEventListener("click", event => {
    if (state.card && Date.now() >= state.ignoreClickUntil && !event.target.closest(".learning-card")) { closeCard(); return; }
    if (!eligible(event.target)) return;
    if (Date.now() < state.ignoreClickUntil || !window.getSelection()?.isCollapsed) { event.stopPropagation(); return; }
  }, true);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") { if (state.card) closeCard(); else closeDrawer(); }
  });
  window.addEventListener("pagehide", () => { stopRecognition(); stopAudio(); });
})();
