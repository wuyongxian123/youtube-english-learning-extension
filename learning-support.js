/* Audio and plain-text helpers shared by the learning panel. */
(() => {
  let generation = 0, cancelPending = null, audio = null, utterance = null;
  const plain = value => String(value || "")
    .replace(/```[^\n]*\n?/g, "").replace(/`([^`]+)`/g, "$1")
    .replace(/!?(\[([^\]]+)\])\([^)]*\)/g, "$2")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "").replace(/\*+/g, "")
    .replace(/__([^_]+)__/g, "$1").replace(/~~([^~]+)~~/g, "$1").trim();
  const languageOf = accent => accent === "uk" ? "en-gb" : "en-us";
  const matching = (voices, accent) => voices.filter(v => (v.lang || "").replaceAll("_", "-").toLowerCase() === languageOf(accent))
    .sort((a, b) => Number(a.remote ?? !a.localService) - Number(b.remote ?? !b.localService));
  function stop() {
    generation++; cancelPending?.(); cancelPending = null;
    if (audio) { audio.pause(); audio = null; }
    utterance = null;
    try { globalThis.chrome?.tts?.stop(); } catch { /* Extension is reloading. */ }
    globalThis.speechSynthesis?.cancel();
  }
  function attempt(start, timeout = 10000) {
    return new Promise((resolve, reject) => {
      let settled = false, timer;
      const finish = error => {
        if (settled) return; settled = true; clearTimeout(timer);
        cancelPending = null; error ? reject(new Error(error)) : resolve();
      };
      const started = () => { clearTimeout(timer); timer = setTimeout(() => finish("playback-timeout"), 180000); };
      timer = setTimeout(() => finish("audio-start-timeout"), timeout);
      cancelPending = () => finish("cancelled");
      try { start(finish, started); } catch (error) { finish(error.message); }
    });
  }
  async function chromeVoices() {
    if (!globalThis.chrome?.tts) return [];
    return new Promise(resolve => {
      const timeout = setTimeout(() => resolve([]), 2000);
      chrome.tts.getVoices(voices => { clearTimeout(timeout); const error = chrome.runtime.lastError; resolve(error ? [] : voices || []); });
    });
  }
  async function speak(text, accent, recording, status) {
    stop(); const request = generation;
    const errors = [];
    status.textContent = "Loading pronunciation…";
    if (recording && /^https:\/\/(?:api\.dictionaryapi\.dev|ssl\.gstatic\.com)\//.test(recording)) {
      try {
        await attempt((finish, started) => {
          audio = new Audio(recording);
          audio.onplaying = () => { started(); status.textContent = `${accent.toUpperCase()} dictionary recording`; };
          audio.onended = () => finish();
          audio.onerror = () => finish(`recording-error-${audio?.error?.code || "network"}`);
          audio.play().catch(error => finish(error.name));
        });
        if (request === generation) status.textContent = "Pronunciation finished.";
        return;
      } catch (error) { errors.push(error.message); if (audio) { audio.pause(); audio = null; } }
    }
    if (request !== generation) return;
    const nativeVoices = matching(await chromeVoices(), accent);
    if (request !== generation) return;
    for (const voice of nativeVoices) {
      try {
        await attempt((finish, started) => chrome.tts.speak(text, {
          lang: accent === "uk" ? "en-GB" : "en-US", voiceName: voice.voiceName,
          ...(voice.extensionId ? { extensionId: voice.extensionId } : {}), rate: 0.85, enqueue: false,
          onEvent: event => {
            if (request !== generation) return;
            if (event.type === "start") { started(); status.textContent = `${accent.toUpperCase()} · ${voice.voiceName}`; }
            if (event.type === "end") finish();
            if (["error", "interrupted", "cancelled"].includes(event.type)) finish(event.errorMessage || event.type);
          },
        }, () => { const error = chrome.runtime.lastError; if (error) finish(error.message); }));
        if (request === generation) status.textContent = `Pronunciation finished · ${voice.voiceName}`;
        return;
      } catch (error) { errors.push(error.message); }
      if (request !== generation) return;
      chrome.tts.stop();
    }
    let browserVoices = matching(globalThis.speechSynthesis?.getVoices() || [], accent);
    if (!browserVoices.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
      browserVoices = matching(globalThis.speechSynthesis?.getVoices() || [], accent);
    }
    if (request !== generation) return;
    for (const voice of browserVoices) {
      try {
        await attempt((finish, started) => {
          // Keep a strong reference until completion; Chrome can collect a local utterance.
          utterance = new SpeechSynthesisUtterance(text);
          utterance.voice = voice; utterance.lang = accent === "uk" ? "en-GB" : "en-US"; utterance.rate = 0.85;
          utterance.onstart = () => { started(); status.textContent = `${accent.toUpperCase()} · ${voice.name}`; };
          utterance.onend = () => finish(); utterance.onerror = event => finish(event.error || "synthesis-failed");
          speechSynthesis.resume(); speechSynthesis.speak(utterance);
        });
        if (request === generation) status.textContent = `Pronunciation finished · ${voice.name}`;
        return;
      } catch (error) { errors.push(error.message); }
      if (request !== generation) return;
      speechSynthesis.cancel();
    }
    if (request !== generation) return;
    const label = accent === "uk" ? "English (United Kingdom)" : "English (United States)";
    status.textContent = `No working ${accent.toUpperCase()} voice. In Windows Settings → Time & language → Speech, add ${label}, then restart Chrome. ${errors.length ? `Details: ${[...new Set(errors)].join(", ")}.` : ""}`;
  }
  let permissionRequest = null;
  async function prepareMicrophone(status, force = false) {
    try {
      const permission = await navigator.permissions.query({ name: "microphone" });
      if (permission.state === "granted" && !force) return true;
    } catch { /* Use the extension's permission page if query is unsupported. */ }
    if (permissionRequest) { status.textContent = "Complete microphone setup in the open permission window."; return false; }
    const session = crypto.randomUUID();
    const pageUrl = chrome.runtime.getURL("microphone.html");
    status.textContent = "Allow this extension to use the microphone in the setup window. YouTube's permission is separate.";
    permissionRequest = new Promise(resolve => {
      let windowId, done = false;
      const finish = (success, detail) => {
        if (done) return; done = true;
        chrome.runtime.onMessage.removeListener(receive);
        chrome.windows.onRemoved.removeListener(removed);
        status.textContent = success ? "Microphone enabled for YouTube Learn. Click Voice input again to start." : detail || "Setup closed. Click Voice input to try again.";
        resolve(false);
      };
      const receive = (message, sender, reply) => {
        if (message.action !== "learningMicrophonePermission" || message.session !== session || sender.id !== chrome.runtime.id || sender.url?.split("?")[0] !== pageUrl) return;
        reply({ success: true }); finish(!!message.success, message.error);
      };
      const removed = id => { if (id === windowId) finish(false); };
      chrome.runtime.onMessage.addListener(receive); chrome.windows.onRemoved.addListener(removed);
      chrome.windows.create({ url: `${pageUrl}?session=${encodeURIComponent(session)}`, type: "popup", width: 520, height: 570 }).then(created => {
        windowId = created.id;
      }).catch(error => finish(false, `Could not open microphone setup: ${error.message}`));
    });
    try { return await permissionRequest; } finally { permissionRequest = null; }
  }
  globalThis.YTD_LEARNING_SUPPORT = { plain, matching, stop, speak, prepareMicrophone };
})();
