// ---------------- State ----------------
const state = {
  provider: localStorage.getItem("aics_provider") || "openai",
  apiKey: localStorage.getItem(`aics_key_${localStorage.getItem("aics_provider") || "openai"}`) || "",
  model: localStorage.getItem("aics_model") || "gpt-4o-mini",
  voiceOut: localStorage.getItem("aics_voice_out") === "true",
  mode: "chat", // chat | image
  conversations: JSON.parse(localStorage.getItem("aics_conversations") || "[]"),
  activeConvoId: null,
  pendingFiles: [], // [{filename, text}]
};

const MODELS = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o3-mini"],
  anthropic: ["claude-sonnet-4-5", "claude-opus-4-1", "claude-3-5-haiku-latest"],
};

// ---------------- DOM refs ----------------
const el = (id) => document.getElementById(id);
const messagesEl = el("messages");
const welcomeEl = el("welcome");
const composerForm = el("composerForm");
const promptInput = el("promptInput");
const sendBtn = el("sendBtn");
const fileBtn = el("fileBtn");
const fileInput = el("fileInput");
const attachRow = el("attachRow");
const micBtn = el("micBtn");
const settingsModal = el("settingsModal");
const providerSelect = el("providerSelect");
const modelSelect = el("modelSelect");
const apiKeyInput = el("apiKeyInput");
const voiceOutToggle = el("voiceOutToggle");
const providerBadge = el("providerBadge");
const sidebar = el("sidebar");
const conversationList = el("conversationList");

// ---------------- Init ----------------
function init() {
  providerSelect.value = state.provider;
  populateModels();
  modelSelect.value = state.model;
  apiKeyInput.value = state.apiKey;
  voiceOutToggle.checked = state.voiceOut;
  updateProviderBadge();
  renderConversationList();

  if (!state.activeConvoId && state.conversations.length) {
    loadConversation(state.conversations[0].id);
  }
}

function populateModels() {
  modelSelect.innerHTML = "";
  MODELS[providerSelect.value].forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    modelSelect.appendChild(opt);
  });
}

function updateProviderBadge() {
  providerBadge.textContent = state.apiKey
    ? `${state.provider === "openai" ? "OpenAI" : "Claude"} · ${state.model}`
    : "কোনো API key সেট নেই";
}

// ---------------- Settings modal ----------------
el("settingsBtn").onclick = () => settingsModal.classList.add("open");
el("closeSettingsBtn").onclick = () => settingsModal.classList.remove("open");
providerSelect.onchange = () => {
  populateModels();
  apiKeyInput.value = localStorage.getItem(`aics_key_${providerSelect.value}`) || "";
};

el("saveSettingsBtn").onclick = () => {
  state.provider = providerSelect.value;
  state.model = modelSelect.value;
  state.apiKey = apiKeyInput.value.trim();
  state.voiceOut = voiceOutToggle.checked;

  localStorage.setItem("aics_provider", state.provider);
  localStorage.setItem("aics_model", state.model);
  localStorage.setItem(`aics_key_${state.provider}`, state.apiKey);
  localStorage.setItem("aics_voice_out", String(state.voiceOut));

  updateProviderBadge();
  settingsModal.classList.remove("open");
};

// ---------------- Mode switch ----------------
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.mode = btn.dataset.mode;
    promptInput.placeholder =
      state.mode === "image"
        ? "কী ধরনের ছবি বানাতে চান তা লিখুন..."
        : "এখানে লিখুন... (Shift+Enter নতুন লাইনের জন্য)";
  };
});

// ---------------- Sidebar ----------------
el("menuToggle").onclick = () => sidebar.classList.toggle("collapsed");
el("newChatBtn").onclick = () => {
  state.activeConvoId = null;
  state.pendingFiles = [];
  attachRow.innerHTML = "";
  messagesEl.innerHTML = "";
  messagesEl.appendChild(welcomeEl);
  renderConversationList();
};

function renderConversationList() {
  conversationList.innerHTML = "";
  state.conversations.forEach((c) => {
    const item = document.createElement("div");
    item.className = "conversation-item" + (c.id === state.activeConvoId ? " active" : "");
    item.textContent = c.title || "নতুন চ্যাট";
    item.onclick = () => loadConversation(c.id);
    conversationList.appendChild(item);
  });
}

function loadConversation(id) {
  const convo = state.conversations.find((c) => c.id === id);
  if (!convo) return;
  state.activeConvoId = id;
  messagesEl.innerHTML = "";
  convo.messages.forEach((m) => renderMessage(m.role, m.content, false));
  renderConversationList();
}

function saveConversation(userMsg, assistantMsg) {
  let convo = state.conversations.find((c) => c.id === state.activeConvoId);
  if (!convo) {
    convo = { id: "c" + Date.now(), title: userMsg.slice(0, 40), messages: [] };
    state.conversations.unshift(convo);
    state.activeConvoId = convo.id;
  }
  convo.messages.push({ role: "user", content: userMsg });
  if (assistantMsg !== null) convo.messages.push({ role: "assistant", content: assistantMsg });
  localStorage.setItem("aics_conversations", JSON.stringify(state.conversations));
  renderConversationList();
}

// ---------------- Rendering ----------------
function renderMessage(role, content, animate = true) {
  if (welcomeEl.parentNode) welcomeEl.remove();
  const row = document.createElement("div");
  row.className = `msg-row ${role}`;
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "🙂" : "🤖";
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = window.marked ? marked.parse(content) : content;
  if (role === "user") {
    row.appendChild(bubble);
    row.appendChild(avatar);
  } else {
    row.appendChild(avatar);
    row.appendChild(bubble);
  }
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

function renderImageMessage(url) {
  if (welcomeEl.parentNode) welcomeEl.remove();
  const row = document.createElement("div");
  row.className = "msg-row assistant";
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "🤖";
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  const img = document.createElement("img");
  img.src = url;
  bubble.appendChild(img);
  row.appendChild(avatar);
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ---------------- File upload ----------------
fileBtn.onclick = () => fileInput.click();
fileInput.onchange = async () => {
  const file = fileInput.files[0];
  if (!file) return;
  const chip = document.createElement("div");
  chip.className = "file-chip";
  chip.textContent = `📄 ${file.name} (পড়া হচ্ছে...)`;
  attachRow.appendChild(chip);

  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch("/api/extract-file", { method: "POST", body: formData });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    state.pendingFiles.push({ filename: file.name, text: data.text });
    chip.textContent = `📄 ${file.name} ✓`;
  } catch (err) {
    chip.textContent = `📄 ${file.name} — ব্যর্থ: ${err.message}`;
  }
  fileInput.value = "";
};

// ---------------- Voice input (Web Speech API) ----------------
let recognition = null;
let isRecording = false;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "bn-BD";
  recognition.interimResults = false;
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    promptInput.value += (promptInput.value ? " " : "") + transcript;
  };
  recognition.onend = () => {
    isRecording = false;
    micBtn.classList.remove("recording");
  };
}

micBtn.onclick = () => {
  if (!recognition) {
    alert("এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়। Chrome ব্যবহার করুন।");
    return;
  }
  if (isRecording) {
    recognition.stop();
  } else {
    isRecording = true;
    micBtn.classList.add("recording");
    recognition.start();
  }
};

function speak(text) {
  if (!state.voiceOut || !window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "bn-BD";
  window.speechSynthesis.speak(utter);
}

// ---------------- Auto-resize textarea ----------------
promptInput.addEventListener("input", () => {
  promptInput.style.height = "auto";
  promptInput.style.height = Math.min(promptInput.scrollHeight, 160) + "px";
});
promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    composerForm.requestSubmit();
  }
});

// ---------------- Submit ----------------
composerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = promptInput.value.trim();
  if (!text) return;
  if (!state.apiKey) {
    alert("প্রথমে ⚙ সেটিংস থেকে আপনার API key দিন।");
    settingsModal.classList.add("open");
    return;
  }

  if (state.mode === "image") {
    await handleImageGeneration(text);
  } else {
    await handleChat(text);
  }
});

async function handleImageGeneration(prompt) {
  renderMessage("user", prompt);
  promptInput.value = "";
  promptInput.style.height = "auto";
  sendBtn.disabled = true;

  const loadingBubble = renderMessage("assistant", '<div class="typing-dots"><span></span><span></span><span></span></div>');

  try {
    const res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: state.apiKey, prompt }),
    });
    const data = await res.json();
    loadingBubble.closest(".msg-row").remove();
    if (data.error) {
      renderMessage("assistant", `⚠️ ত্রুটি: ${data.error}`);
    } else {
      renderImageMessage(data.url);
      saveConversation(prompt, `[ছবি তৈরি হয়েছে: ${prompt}]`);
    }
  } catch (err) {
    loadingBubble.closest(".msg-row").remove();
    renderMessage("assistant", `⚠️ ত্রুটি: ${err.message}`);
  }
  sendBtn.disabled = false;
}

async function handleChat(userText) {
  // Build message with any attached file text prepended as context
  let fullUserText = userText;
  if (state.pendingFiles.length) {
    const fileContext = state.pendingFiles
      .map((f) => `--- ফাইল: ${f.filename} ---\n${f.text}`)
      .join("\n\n");
    fullUserText = `${fileContext}\n\n--- ব্যবহারকারীর প্রশ্ন ---\n${userText}`;
  }

  renderMessage("user", userText);
  promptInput.value = "";
  promptInput.style.height = "auto";
  attachRow.innerHTML = "";
  sendBtn.disabled = true;

  // Build conversation history for API call
  const convo = state.conversations.find((c) => c.id === state.activeConvoId);
  const history = convo ? convo.messages.map((m) => ({ role: m.role, content: m.content })) : [];
  const apiMessages = [...history, { role: "user", content: fullUserText }];

  const bubble = renderMessage("assistant", '<span class="typing-dots"><span></span><span></span><span></span></span>');
  let fullText = "";
  let firstChunk = true;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: state.provider,
        apiKey: state.apiKey,
        model: state.model,
        messages: apiMessages,
        system: "You are a helpful, friendly AI assistant. Respond in the same language the user writes in.",
      }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop();
      for (const part of parts) {
        if (!part.startsWith("data:")) continue;
        const json = JSON.parse(part.replace(/^data:\s*/, ""));
        if (json.error) {
          fullText += `\n⚠️ ত্রুটি: ${json.error}`;
          bubble.innerHTML = window.marked ? marked.parse(fullText) : fullText;
          continue;
        }
        if (json.text) {
          if (firstChunk) {
            fullText = "";
            firstChunk = false;
          }
          fullText += json.text;
          bubble.innerHTML = window.marked ? marked.parse(fullText) : fullText;
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      }
    }
  } catch (err) {
    fullText += `\n⚠️ সংযোগ ত্রুটি: ${err.message}`;
    bubble.innerHTML = fullText;
  }

  saveConversation(fullUserText, fullText);
  speak(fullText.replace(/[#*`_]/g, "").slice(0, 500));
  state.pendingFiles = [];
  sendBtn.disabled = false;
}

init();
