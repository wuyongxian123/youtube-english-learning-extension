const allow = document.getElementById("allow");
const status = document.getElementById("status");
document.getElementById("close").addEventListener("click", () => window.close());
allow.addEventListener("click", async () => {
  allow.disabled = true; status.textContent = "Choose Allow in Chrome's microphone prompt…";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    stream.getTracks().forEach(track => track.stop());
    status.textContent = "Microphone enabled. Close this window, then click Voice input again in your note or question.";
    const session = new URLSearchParams(location.search).get("session");
    await chrome.runtime.sendMessage({ action: "learningMicrophonePermission", session, success: true }).catch(() => {});
    allow.textContent = "Enabled";
  } catch (error) {
    const reasons = { NotAllowedError: "Chrome or Windows blocked microphone access for this extension.", NotFoundError: "No microphone was found. Connect a microphone and try again.", NotReadableError: "The microphone could not be opened. Check whether another app is using it." };
    status.textContent = `${reasons[error.name] || "Could not enable the microphone."} (${error.name})`;
    document.getElementById("help").hidden = false; allow.disabled = false;
  }
});
