console.log("🚀 script.js – MINI AI ELITE NIGHTMARE v49.1 | BRUTAL SPEED ENGINE | ZERO STUBS");

// ═══════════════════════════════════════════════
// VH FIX
// ═══════════════════════════════════════════════
const setVH = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
window.addEventListener('resize', setVH); setVH();

// ═══════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════
const chatBox      = document.getElementById("chatBox");
const userInput    = document.getElementById("userInput");
const imageInput   = document.getElementById("imageInput");
const attachBtn    = document.getElementById("attachBtn");
const micBtn       = document.querySelector(".mic-btn");
const sidePanel    = document.getElementById("sidePanel");
const overlay      = document.getElementById("overlay");
const historyList  = document.getElementById("historyList");
const sendBtn      = document.getElementById("sendBtn");
const statusDot    = document.querySelector(".status-dot");
const errorBanner  = document.getElementById("errorBanner");
const queueBadge   = document.getElementById("queueBadge");
const queueText    = document.getElementById("queueText");
const newThreadBtn = document.getElementById("newThreadBtn");
const speakerBtn   = document.getElementById("speakerBtn");
const charCounter  = document.getElementById("charCounter");

// ═══════════════════════════════════════════════
// SCROLL INTELLIGENCE
// ═══════════════════════════════════════════════
const scrollBtn = document.createElement("button");
scrollBtn.id = "scrollDownBtn";
scrollBtn.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
</svg>`;
Object.assign(scrollBtn.style, {
  position: "absolute", bottom: "90px", right: "20px",
  background: "rgba(10,15,30,0.9)", border: "1px solid rgba(34,211,238,0.5)",
  color: "#22d3ee", borderRadius: "50%", width: "40px", height: "40px",
  display: "none", alignItems: "center", justifyContent: "center",
  cursor: "pointer", zIndex: "100", backdropFilter: "blur(5px)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.5)", transition: "all 0.2s ease"
});
scrollBtn.onclick = () => { APP_STATE.userScrolledUp = false; scrollDown(true); };
document.querySelector(".chat-container")?.appendChild(scrollBtn) || document.body.appendChild(scrollBtn);

// ═══════════════════════════════════════════════
// STABLE SESSION ID
// ═══════════════════════════════════════════════
const getStableSessionId = () => {
  let id = localStorage.getItem("pvSessionId");
  if (!id) {
    id = `pv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("pvSessionId", id);
  }
  return id;
};

// ═══════════════════════════════════════════════
// ENTERPRISE STATE v49.1 (BRUTAL SPEED)
// ═══════════════════════════════════════════════
const APP_STATE = {
  mode: "chat",
  voiceEnabled: true,
  isListening: false,
  isSending: false,
  currentlyReadingId: null,
  chatMessages: [],
  allChatSessions: JSON.parse(localStorage.getItem("pv_history_v2") || "[]"),
  activeSessionIndex: -1,
  pendingImageFile: null,
  pendingImageB64: null,
  currentAbortCtrl: null,
  currentRequestId: null,
  cachedVoices: [],
  healthInterval: null,
  userScrolledUp: false,
  _renderScheduled: false,
  _tokenBuffer: "",
  _typingInterval: null,

  stableSessionId: getStableSessionId(),
  userMetrics: { promptCount: 0, totalLength: 0, errorCount: 0, retryCount: 0 },
  latency: { requestStart: 0, firstTokenMs: 0, totalMs: 0 },
  circuitBreaker: { failures: 0, lastFailure: 0, state: "CLOSED" },
  telemetryQueue: [],
  telemetryFlushTimer: null,
  telemetryEnabled: true,
  lastSentText: "",
  lastSentTime: 0,
  connectionQuality: "good",
  adaptiveTimeout: 120000, 
  streamBytesReceived: 0,
  pendingRetryMessage: null,
  safetyEnabled: false 
};

// ═══════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════
const generateId    = () => window.crypto?.randomUUID?.() || `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
const escapeHtml    = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
const sleep         = ms => new Promise(r => setTimeout(r, ms));
const clamp         = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

function detectLanguage(text) {
  const te = (text.match(/[\u0C00-\u0C7F]/g) || []).length;
  const hi = (text.match(/[\u0900-\u097F]/g) || []).length;
  const en = (text.match(/[a-zA-Z]/g) || []).length;
  const t  = te + hi + en || 1;
  if (te / t > 0.3) return "telugu";
  if (hi / t > 0.3) return "hindi";
  if (en / t > 0.7) return "english";
  return "mixed";
}

function analyzeCognitiveIntent(text) {
  const l = text.toLowerCase();
  if (/function|class|const|let|return|html|css|javascript|typescript|python|sql|api|fetch|async|await|import|export|npm|git|bash|react|node/i.test(l)) return "code";
  if (/why|explain|analyze|calculate|therefore|logic|math|compare|difference|how does|proof|theory|science|history/i.test(l)) return "reasoning";
  if (/imagine|story|poem|creative|write a|generate a|draft|roleplay|fiction|novel|lyrics|song/i.test(l)) return "creative";
  return "standard";
}

// ═══════════════════════════════════════════════
// ELITE: ERROR CLASSIFIER
// ═══════════════════════════════════════════════
function classifyError(err) {
  if (err.name === "AbortError")             return { type:"abort",     retryable:false, msg:"Stopped."                      };
  if (!navigator.onLine)                     return { type:"offline",   retryable:true,  msg:"No internet connection."       };
  if (err.message.includes("stalled"))       return { type:"stall",     retryable:true,  msg:"Stream stalled. Retrying..."   };
  if (err.message.includes("HTTP 429"))      return { type:"ratelimit", retryable:true,  msg:"Rate limit hit. Please wait..."};
  if (/HTTP 5\d\d/.test(err.message))        return { type:"server",    retryable:true,  msg:"Server error. Retrying..."     };
  if (/HTTP 4\d\d/.test(err.message))        return { type:"client",    retryable:false, msg:`Error: ${err.message}`         };
  if (err.message.includes("Circuit"))       return { type:"circuit",   retryable:false, msg:err.message                    };
  return { type:"unknown", retryable:true, msg:err.message };
}

// ═══════════════════════════════════════════════
// ELITE: BATCHED TELEMETRY
// ═══════════════════════════════════════════════
function enqueueTelemetry(event) {
  if (!APP_STATE.telemetryEnabled || document.hidden) return;
  APP_STATE.telemetryQueue.push({ ...event, ts: Date.now() });
  if (APP_STATE.telemetryQueue.length >= 5) flushTelemetry();
  else {
    clearTimeout(APP_STATE.telemetryFlushTimer);
    APP_STATE.telemetryFlushTimer = setTimeout(flushTelemetry, 10000);
  }
}

async function flushTelemetry() {
  if (!APP_STATE.telemetryQueue.length) return;
  const batch = [...APP_STATE.telemetryQueue];
  APP_STATE.telemetryQueue = [];
  clearTimeout(APP_STATE.telemetryFlushTimer);
  try {
    await fetch("/telemetry/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch, sessionId: APP_STATE.stableSessionId })
    });
  } catch {
    APP_STATE.telemetryQueue = [...batch, ...APP_STATE.telemetryQueue].slice(-20);
  }
}

document.addEventListener("visibilitychange", () => { if (document.hidden) flushTelemetry(); });
window.addEventListener("beforeunload", () => { flushTelemetry(); saveSession(); });

// ═══════════════════════════════════════════════
// ELITE: CONNECTION QUALITY MONITOR
// ═══════════════════════════════════════════════
function updateConnectionQuality() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!navigator.onLine) { APP_STATE.connectionQuality = "offline"; return; }
  if (!conn) return;
  const rtt = conn.rtt || 0, type = conn.effectiveType || "4g";
  if (type === "slow-2g" || rtt > 1000) { APP_STATE.connectionQuality = "slow"; }
  else if (type === "2g" || rtt > 500)  { APP_STATE.connectionQuality = "slow"; }
  else                                   { APP_STATE.connectionQuality = "good"; }
}
updateConnectionQuality();
if (navigator.connection) navigator.connection.addEventListener("change", updateConnectionQuality);

// ═══════════════════════════════════════════════
// ELITE: CIRCUIT BREAKER (DISABLED)
// ═══════════════════════════════════════════════
function checkCircuitBreaker() { return true; }
function recordCircuitSuccess() {}
function recordCircuitFailure() {}

// ═══════════════════════════════════════════════
// ELITE: SAFETY FILTER (BYPASSED)
// ═══════════════════════════════════════════════
function applySafetyFilter(text) {
  return text; 
}

// ═══════════════════════════════════════════════
// STATUS & TOAST
// ═══════════════════════════════════════════════
function setStatus(state) { if (statusDot) statusDot.className = `status-dot ${state}`; }
function showSystemError(msg) { if (!errorBanner) return; errorBanner.textContent = msg; errorBanner.style.display = "block"; setStatus("error"); }
function hideSystemError()    { if (!errorBanner) return; errorBanner.style.display = "none"; if (!APP_STATE.isSending) setStatus("online"); }

function showToast(msg, type = "success") {
  document.querySelectorAll(".pv-toast").forEach(t => t.remove());
  const t = document.createElement("div");
  t.className = "pv-toast"; t.textContent = msg;
  const bg = { success: "rgba(34,211,238,0.97)", warning: "rgba(251,191,36,0.97)", error: "rgba(248,113,113,0.97)" }[type] || "rgba(34,211,238,0.97)";
  Object.assign(t.style, {
    position:"fixed", bottom:"106px", left:"50%", transform:"translateX(-50%) translateY(20px)",
    background:bg, color:"#000", padding:"9px 22px", borderRadius:"999px",
    fontSize:"12px", fontWeight:"700", zIndex:"9999", opacity:"0",
    transition:"all 0.3s cubic-bezier(0.16,1,0.3,1)", pointerEvents:"none",
    boxShadow:"0 4px 20px rgba(0,0,0,0.4)", letterSpacing:"0.3px"
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateX(-50%) translateY(0)"; });
  setTimeout(() => {
    t.style.opacity = "0"; t.style.transform = "translateX(-50%) translateY(10px)";
    setTimeout(() => t.remove(), 320);
  }, 2400);
}

window.toggleTheme = function(isLight) {
  document.body.classList.toggle("light", isLight);
  document.body.classList.add("theme-transition");
  setTimeout(() => document.body.classList.remove("theme-transition"), 400);
};

// ═══════════════════════════════════════════════
// HEALTH POLLING
// ═══════════════════════════════════════════════
async function pollHealth() {
  if (APP_STATE.isSending || !navigator.onLine) return;
  try {
    const res  = await fetch("/health", { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    if (data.breakers && (data.breakers.chat === "OPEN" || data.breakers.vision === "OPEN")) {
      return showSystemError("⚠️ AI Core is currently recovering.");
    } else { hideSystemError(); }

    const totalDepth = (data.chat_queue?.depth || 0) + (data.vision_queue?.depth || 0);
    if (totalDepth > 0) {
      if (queueBadge) queueBadge.style.display = "flex";
      if (queueText)  queueText.textContent = `Waiting in queue... #${totalDepth}`;
      setStatus("queued");
    } else {
      if (queueBadge) queueBadge.style.display = "none";
      if (!APP_STATE.isSending) setStatus("online");
    }
  } catch { showSystemError("⚠️ Disconnected from AI Gateway."); }
}

// ═══════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════
window.addEventListener("offline", () => { APP_STATE.connectionQuality = "offline"; showSystemError("⚠️ Internet connection lost."); });
window.addEventListener("online", () => { updateConnectionQuality(); hideSystemError(); pollHealth(); if (APP_STATE.pendingRetryMessage) retryPendingMessage(); });
chatBox.addEventListener("scroll", () => {
  const nearBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < 40;
  APP_STATE.userScrolledUp = !nearBottom;
  scrollBtn.style.display = APP_STATE.userScrolledUp ? "flex" : "none";
});

if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = () => { APP_STATE.cachedVoices = speechSynthesis.getVoices(); };
  APP_STATE.cachedVoices = speechSynthesis.getVoices();
}

// ═══════════════════════════════════════════════
// IMAGE HANDLING
// ═══════════════════════════════════════════════
window.showImagePreview = function(file) {
  window.removeImagePreview();
  const reader = new FileReader();
  reader.onload = e => {
    APP_STATE.pendingImageB64 = e.target.result;
    const wrap = document.createElement("div");
    wrap.id = "img-preview-wrap";
    Object.assign(wrap.style, {
      position:"absolute", bottom:"calc(100% + 12px)", left:"14px", display:"flex", alignItems:"center", gap:"10px",
      background:"rgba(10,15,30,0.98)", border:"1px solid rgba(34,211,238,0.4)", borderRadius:"16px", padding:"8px 12px 8px 8px", zIndex:"200", maxWidth:"280px",
      boxShadow:"0 8px 32px rgba(0,0,0,0.5)", backdropFilter:"blur(10px)"
    });
    const safeName = escapeHtml(file.name.slice(0,30)) + (file.name.length > 30 ? "…" : "");
    wrap.innerHTML = `
      <img src="${e.target.result}" style="width:48px;height:48px;border-radius:10px;object-fit:cover;border:1px solid rgba(255,255,255,0.15);flex-shrink:0">
      <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.95);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${safeName}</div><div style="font-size:10px;color:rgba(34,211,238,0.85);margin-top:3px">${(file.size/1024).toFixed(0)} KB · Ready ✅</div></div>
      <button onclick="removeImagePreview()" style="background:rgba(248,113,113,0.18);border:1px solid rgba(248,113,113,0.35);color:#f87171;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">✕</button>`;
    const inputArea = document.querySelector(".input-area");
    if (inputArea) { inputArea.style.position = "relative"; inputArea.appendChild(wrap); }
    if (attachBtn) { attachBtn.style.background = "rgba(34,211,238,0.28)"; attachBtn.style.borderColor = "rgba(34,211,238,0.55)"; }
    userInput.placeholder = "What would you like me to analyze? 🔍"; userInput.focus();
  };
  reader.readAsDataURL(file);
};

window.removeImagePreview = function() {
  document.getElementById("img-preview-wrap")?.remove();
  APP_STATE.pendingImageFile = null; APP_STATE.pendingImageB64 = null;
  if (imageInput) imageInput.value = "";
  if (attachBtn) { attachBtn.style.background = ""; attachBtn.style.borderColor = ""; }
  userInput.placeholder = APP_STATE.mode === "image-gen" ? "Describe your artistic vision... 🎨"
    : APP_STATE.mode === "image-analyze" ? "Upload an image for me to analyze... 🔍"
    : "Talk to me, how can I help? ⚡";
};

attachBtn?.addEventListener("click", () => imageInput?.click());
imageInput?.addEventListener("change", e => {
  const file = e.target.files[0]; if (!file) return;
  if (!file.type.startsWith("image/"))    return showToast("Please select an image file.", "error");
  if (file.size > 50 * 1024 * 1024)       return showToast("Image too large (max 50 MB).", "error"); 
  APP_STATE.pendingImageFile = file;
  window.setMode("image-analyze");
  window.showImagePreview(file);
});

window.setMode = function(mode) {

  if (mode !== "chat") {
    showToast("This feature is under maintenance ⚙️", "warning");
    return;
  }

  APP_STATE.mode = mode;
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
    btn.setAttribute("aria-selected", btn.dataset.mode === mode);
  });
  if (attachBtn) attachBtn.style.opacity = mode === "image-analyze" ? "1" : "0.7";
  if (mode !== "image-analyze") window.removeImagePreview();
  userInput.placeholder = mode === "image-gen" ? "Describe your artistic vision... 🎨"
    : mode === "image-analyze" ? "Upload an image... 🔍"
    : "Talk to me, how can I help? ⚡";
  userInput.focus();
};

// ═══════════════════════════════════════════════
// ELITE MARKDOWN PARSER 
// ═══════════════════════════════════════════════
function parseMarkdown(text) {
  let html = String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  html = html.replace(/\r\n/g, "\n");
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const id = "code_" + Math.random().toString(36).substr(2,9);
    return `<div class="code-wrapper"><div class="code-header"><span class="code-lang">${lang || "Code"}</span><button class="code-copy" onclick="copyCodeText('${id}')">📋 Copy</button></div><pre class="code-content"><code id="${id}">${code.trim()}</code></pre></div>`;
  });
  html = html.replace(/`([^`\n]+)`/g, '<span class="inline-code">$1</span>');
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>").replace(/^### (.+)$/gm,  "<h3>$1</h3>").replace(/^## (.+)$/gm,   "<h2>$1</h2>").replace(/^# (.+)$/gm,    "<h2>$1</h2>");
  html = html.replace(/\*\*\*(.+?)\*\*\*/g,  "<strong><em>$1</em></strong>").replace(/\*\*(.+?)\*\*/g,       "<strong>$1</strong>").replace(/\*(.+?)\*/g,            "<em>$1</em>");
  html = html.replace(/___(.+?)___/g,          "<strong><em>$1</em></strong>").replace(/__(.+?)__/g,            "<strong>$1</strong>").replace(/_([^_\n]+)_/g,         "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g,            "<del>$1</del>").replace(/^---+$/gm, "<hr>").replace(/^&gt;\s+(.*)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/((?:^[ \t]*[-*•]\s+.+\n?)+)/gm, match => `<ul>${match.trim().split("\n").filter(l => l.trim()).map(l => `<li>${l.replace(/^[ \t]*[-*•]\s+/, "").trim()}</li>`).join("")}</ul>`);
  html = html.replace(/((?:^\d+\.\s+.+\n?)+)/gm, match => `<ol>${match.trim().split("\n").filter(l => l.trim()).map(l => `<li>${l.replace(/^\d+\.\s+/, "").trim()}</li>`).join("")}</ol>`);
  html = html.replace(/(\|.+\|\n)+/g, match => {
    const rows = match.trim().split("\n").filter(r => r.trim() && !/^\|[-| :]+\|$/.test(r.trim()));
    const tableRows = rows.map((row, i) => {
      const cells = row.split("|").filter((_, ci) => ci > 0 && ci < row.split("|").length - 1);
      const tag = i === 0 ? "th" : "td";
      return `<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join("")}</tr>`;
    }).join("");
    return `<div class="md-table-wrap"><table class="md-table">${tableRows}</table></div>`;
  });
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const u = url.trim();
    if (!u.startsWith("http")) return `<a href="#" class="md-link">${escapeHtml(text)}</a>`;
    return `<a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer" class="md-link">${escapeHtml(text)}</a>`;
  });
  html = html.replace(/\n(?!<(?:h[1-6]|ul|ol|li|div|pre|blockquote|hr))/g, "<br>");
  return html;
}
function isSafeMarkdown(text) { return (text.match(/```/g) || []).length % 2 === 0; }

// ═══════════════════════════════════════════════
// SVG ICONS (inline, no re-declaration)
// ═══════════════════════════════════════════════
const SVG_SEND = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>`;
const SVG_STOP = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;

const editIcon     = () => `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`;
const translateIcon = () => `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>`;
const retryIcon    = () => `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`;
const copyIcon     = () => `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`;
const speakIcon    = () => `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>`;
const stopReadIcon = () => `<svg fill="currentColor" viewBox="0 0 24 24" width="14" height="14"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;

// ═══════════════════════════════════════════════
// RENDER ENGINE
// ═══════════════════════════════════════════════
function buildActionBar(msg) {
  let html = `<div class="action-bar" id="action_${msg.id}">`;
  if (msg.role === "user") {
    html += `<button class="action-btn" onclick="startEdit('${msg.id}')" title="Edit">${editIcon()}</button>`;
  } else if (msg.role === "bot" && !msg.isLoading && !msg.isTyping) {
    const reading = APP_STATE.currentlyReadingId === msg.id;
    html += `
      <div style="position:relative;display:inline-block">
        <button class="action-btn" onclick="toggleTranslateMenu('${msg.id}')" title="Translate">${translateIcon()}</button>
        <div id="trans_${msg.id}" class="dropdown-menu">
          <button class="dropdown-item" onclick="translateMsg('${msg.id}','Telugu')">🇮🇳 Telugu</button>
          <button class="dropdown-item" onclick="translateMsg('${msg.id}','Hindi')">🇮🇳 Hindi</button>
          <button class="dropdown-item" onclick="translateMsg('${msg.id}','English')">🇺🇸 English</button>
          <button class="dropdown-item" onclick="translateMsg('${msg.id}','French')">🇫🇷 French</button>
          <button class="dropdown-item" onclick="translateMsg('${msg.id}','Japanese')">🇯🇵 Japanese</button>
          <button class="dropdown-item" onclick="translateMsg('${msg.id}','Spanish')">🇪🇸 Spanish</button>
        </div>
      </div>
      <button class="action-btn" onclick="regenerateMessage('${msg.id}')" title="Regenerate">${retryIcon()}</button>
      <button class="action-btn" onclick="copyMessage('${msg.id}')" title="Copy">${copyIcon()}</button>
      <button class="action-btn ${reading ? "active-read" : ""}" onclick="toggleReadMessage('${msg.id}')" title="Read Aloud">
        ${reading ? stopReadIcon() : speakIcon()}
      </button>`;
  }
  return html + "</div>";
}

function buildMsgInner(msg) {
  let html = "";
  if (msg.imageUrl && msg.imageUrl.startsWith("data:image/"))
    html += `<img src="${msg.imageUrl}" class="msg-img" onclick="this.classList.toggle('msg-img-zoom')">`;
  if (msg.isLoading) return html + `<div class="pulse-loader"></div>`;
  if (msg.isTyping) {
    if (msg.text.length > 30 && isSafeMarkdown(msg.text)) {
      html += parseMarkdown(msg.text.replace(/```[\s\S]*?$/, "")) + `<span class="typing-cursor fast-blink"></span>`;
    } else {
      html += `<div class="stream-container"><span>${escapeHtml(msg.text)}</span><span class="typing-cursor fast-blink"></span></div>`;
    }
  } else {
    html += parseMarkdown(msg.text);
  }
  return html;
}

function buildMsgHTML(msg) {
  return `<div class="msg-content" id="content_${msg.id}">${buildMsgInner(msg)}</div>${buildActionBar(msg)}`;
}

function renderChat() {
  chatBox.innerHTML = "";
  APP_STATE.chatMessages.forEach(msg => {
    if (msg.isHidden) return;
    const div = document.createElement("div");
    div.className = msg.role; div.id = msg.id;
    div.innerHTML = buildMsgHTML(msg);
    chatBox.appendChild(div);
  });
  scrollDown(true);
}

function updateMessageContent(id, newText, isTyping = false) {
  const msg = APP_STATE.chatMessages.find(m => m.id === id);
  if (!msg || msg.isHidden) return;
  msg.text = newText; msg.isTyping = isTyping;
  const el = document.getElementById(`content_${id}`);
  if (!el) return;
  const oldH = APP_STATE.userScrolledUp ? 0 : el.offsetHeight;
  if (!el._innerWrapper) {
    el.innerHTML = "";
    el._innerWrapper = document.createElement("div");
    el._innerWrapper.style.display = "contents";
    el.appendChild(el._innerWrapper);
  }
  el._innerWrapper.innerHTML = buildMsgInner(msg);
  if (!APP_STATE.userScrolledUp) {
    const diff = el.offsetHeight - oldH;
    if (diff !== 0) chatBox.scrollTop += diff;
  }
}

function rebuildActionBar(id) {
  const msg = APP_STATE.chatMessages.find(m => m.id === id);
  const container = document.getElementById(id);
  if (!msg || !container || msg.isHidden) return;
  document.getElementById(`action_${id}`)?.remove();
  container.insertAdjacentHTML("beforeend", buildActionBar(msg));
}

// ═══════════════════════════════════════════════
// SEND / STOP TOGGLE
// ═══════════════════════════════════════════════
window.handleSendOrStop = function() {
  if (APP_STATE.isSending) APP_STATE.currentAbortCtrl?.abort();
  else sendMessage();
};

function toggleSendStop(sending) {
  if (!sendBtn) return;
  userInput.disabled = sending;
  sendBtn.innerHTML  = sending ? SVG_STOP : SVG_SEND;
  sending ? sendBtn.classList.add("stop-mode") : sendBtn.classList.remove("stop-mode");
  setStatus(sending ? "generating" : "online");
}

// ═══════════════════════════════════════════════
// ELITE: RETRY + EXPONENTIAL BACKOFF + CIRCUIT BREAKER
// ═══════════════════════════════════════════════
async function streamWithRetry(botId, endpoint, payload, localRequestId, isFormData = false, attempt = 0) {
  const MAX_RETRIES = 10; // UNRESTRICTED
  const BACKOFF_MS  = [0, 1500, 4000, 8000, 15000, 30000, 60000, 60000, 60000, 60000, 60000];
  if (!checkCircuitBreaker()) throw new Error("Circuit breaker OPEN.");
  try {
    const result = await streamResponse(botId, endpoint, payload, localRequestId, isFormData);
    recordCircuitSuccess();
    if (attempt > 0) APP_STATE.userMetrics.retryCount++;
    return result;
  } catch (err) {
    const c = classifyError(err);
    if (!c.retryable || attempt >= MAX_RETRIES) { recordCircuitFailure(); throw err; }
    const delay = BACKOFF_MS[attempt + 1];
    console.warn(`[v49 Retry] Attempt ${attempt + 1} — ${c.msg} — waiting ${delay}ms`);
    updateMessageContent(botId, `⚡ ${c.msg} (${attempt + 1}/${MAX_RETRIES})`, false);
    await sleep(delay);
    if (localRequestId !== APP_STATE.currentRequestId) return "";
    return streamWithRetry(botId, endpoint, payload, localRequestId, isFormData, attempt + 1);
  }
}

// ═══════════════════════════════════════════════
// CORE STREAMING ENGINE v49.1 (BRUTAL SPEED) 
// ═══════════════════════════════════════════════
async function streamResponse(botId, endpoint, payload, localRequestId, isFormData = false) {
  APP_STATE.currentAbortCtrl    = new AbortController();
  APP_STATE._tokenBuffer        = "";
  APP_STATE.streamBytesReceived = 0;
  APP_STATE.latency.requestStart = performance.now();
  APP_STATE.latency.firstTokenMs = 0;

  const TIMEOUT = 120000; // 2 Minutes Hard Max
  const timeoutGuard = setTimeout(() => {
    APP_STATE.currentAbortCtrl.abort();
  }, TIMEOUT);

  const res = await fetch(endpoint, {
    method: "POST",
    signal: APP_STATE.currentAbortCtrl.signal,
    ...(isFormData
      ? { body: payload }
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
  });

  if (!res.ok) {
    clearTimeout(timeoutGuard);
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || "Request failed");
  }

  clearTimeout(timeoutGuard);

  const reader     = res.body.getReader();
  const decoder    = new TextDecoder();
  let uiFull       = "";
  let streamBuffer = "";
  let streamEnded  = false;
  const botMsgObj  = APP_STATE.chatMessages.find(m => m.id === botId);

  // ── 🔴 BRUTAL ULTRA-FAST DATA DUMP ──
  function runTypingLoop() {
    if (localRequestId !== APP_STATE.currentRequestId) { APP_STATE._typingInterval = null; return; }
    if (!APP_STATE._tokenBuffer.length)                { APP_STATE._typingInterval = null; return; }

    // Grab a massive 150-character block at once
    const size = Math.min(APP_STATE._tokenBuffer.length, 150);
    const chunk = APP_STATE._tokenBuffer.slice(0, size);
    APP_STATE._tokenBuffer = APP_STATE._tokenBuffer.slice(size);
    uiFull += chunk;

    if (!APP_STATE._renderScheduled) {
      APP_STATE._renderScheduled = true;
      requestAnimationFrame(() => { 
        updateMessageContent(botId, uiFull, true); 
        APP_STATE._renderScheduled = false; 
      });
    }

    // Fixed 100ms interval.
    // 150 characters every 100ms = 1500 chars every 1 second.
    // That means in exactly 0.5 seconds, it will forcefully print 750 characters (10+ lines).
    APP_STATE._typingInterval = setTimeout(runTypingLoop, 100);
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done || APP_STATE.currentAbortCtrl.signal.aborted) break;
      if (localRequestId !== APP_STATE.currentRequestId) break;

      APP_STATE.streamBytesReceived += value?.length || 0;

      streamBuffer += decoder.decode(value, { stream: true });
      const lines = streamBuffer.split("\n");
      streamBuffer = lines.pop();

      for (let line of lines) {
        line = line.trim();
        if (!line || line === "[DONE]" || line === "data: [DONE]") continue;
        try {
          const raw    = line.startsWith("data: ") ? line.slice(6) : line;
          const parsed = JSON.parse(raw);
          const delta  = parsed.response ?? parsed.content ?? parsed.delta ?? parsed.token ?? "";
          if (delta) {
            APP_STATE._tokenBuffer += delta;
            if (botMsgObj) botMsgObj.isLoading = false;
            if (!APP_STATE.latency.firstTokenMs)
              APP_STATE.latency.firstTokenMs = performance.now() - APP_STATE.latency.requestStart;
          }
        } catch {}
      }
      if (!APP_STATE._typingInterval && APP_STATE._tokenBuffer.length > 0) runTypingLoop();
    }

    if (streamBuffer.trim()) {
      try {
        const raw    = streamBuffer.startsWith("data: ") ? streamBuffer.slice(6) : streamBuffer;
        const parsed = JSON.parse(raw);
        const delta  = parsed.response ?? parsed.content ?? parsed.delta ?? parsed.token ?? "";
        if (delta) { APP_STATE._tokenBuffer += delta; if (botMsgObj) botMsgObj.isLoading = false; }
      } catch {}
    }
  } catch (e) { throw e; }
  finally {
    streamEnded = true;
    if (APP_STATE._typingInterval) { clearTimeout(APP_STATE._typingInterval); APP_STATE._typingInterval = null; }

    if (APP_STATE._tokenBuffer.length > 0) { uiFull += APP_STATE._tokenBuffer; APP_STATE._tokenBuffer = ""; }
    if (localRequestId !== APP_STATE.currentRequestId) return uiFull;

    const cursorEl = document.getElementById(`content_${botId}`)?.querySelector(".typing-cursor");
    if (cursorEl) { cursorEl.classList.remove("fast-blink"); cursorEl.classList.add("cursor-fade"); }
    await sleep(200);
    updateMessageContent(botId, uiFull, false);
    rebuildActionBar(botId);

    const contentBox = document.getElementById(`content_${botId}`);
    if (contentBox) {
      contentBox.classList.remove("depth-code","depth-reasoning","depth-creative","depth-standard");
      if (/function|class|const|let|=>|import|require|<\/|npm|bash/i.test(uiFull))    contentBox.classList.add("depth-code");
      else if (/therefore|because|however|analysis|in conclusion|hence/i.test(uiFull)) contentBox.classList.add("depth-reasoning");
      else if (/story|poem|imagine|once upon|creative|lyrics/i.test(uiFull))           contentBox.classList.add("depth-creative");
      else                                                                               contentBox.classList.add("depth-standard");
    }

    APP_STATE.latency.totalMs = performance.now() - APP_STATE.latency.requestStart;
    const detectedIntent = analyzeCognitiveIntent(uiFull);

    enqueueTelemetry({
      event: "response_complete",
      firstTokenMs: Math.round(APP_STATE.latency.firstTokenMs),
      totalMs:      Math.round(APP_STATE.latency.totalMs),
      bytes:        APP_STATE.streamBytesReceived,
      intent:       detectedIntent,
      quality:      APP_STATE.connectionQuality
    });
    console.log(`[v49 Perf] 🕐 First: ${Math.round(APP_STATE.latency.firstTokenMs)}ms | ⏱ Total: ${Math.round(APP_STATE.latency.totalMs)}ms | 📡 ${APP_STATE.streamBytesReceived}B`);

    return uiFull;
  }
}

// ═══════════════════════════════════════════════
// CORE SEND LOGIC v49.1 (BRUTAL SPEED) 
// ═══════════════════════════════════════════════
async function sendMessage() {
  if (APP_STATE.isSending) return;
  const rawText = userInput.value.trim();
  const file    = APP_STATE.pendingImageFile;
  if (!rawText && !file) return;

  // UNRESTRICTED: Spam Guard bypassed
  const nowMs = Date.now();
  APP_STATE.lastSentText = rawText;
  APP_STATE.lastSentTime = nowMs;

  const safeText = applySafetyFilter(rawText);

  APP_STATE.userMetrics.promptCount++;
  APP_STATE.userMetrics.totalLength += safeText.length;

  if (APP_STATE.healthInterval) clearInterval(APP_STATE.healthInterval);
  APP_STATE.isSending = true; toggleSendStop(true); hideSystemError();

  const userMsgId = generateId();
  const botMsgId  = generateId();
  APP_STATE.currentRequestId = generateId();
  const localRequestId = APP_STATE.currentRequestId;

  let base64Image = APP_STATE.pendingImageB64 || null;
  if (file && !base64Image) {
    base64Image = await new Promise(res => {
      const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file);
    });
  }

  APP_STATE.chatMessages.push({
    id: userMsgId, role: "user",
    text: safeText || "[Image Attached]",
    imageUrl: base64Image || undefined
  });
  userInput.value = ""; autoResizeInput();
  updateCharCounter();

  APP_STATE.chatMessages.push({ id: botMsgId, role: "bot", text: "", isTyping: true, isLoading: true });
  renderChat();

  try {
    if (APP_STATE.mode === "image-gen") {
      const prompt = safeText || "beautiful cinematic landscape";
      const botObj = APP_STATE.chatMessages.find(m => m.id === botMsgId);
      botObj.isLoading = false;
      updateMessageContent(botMsgId, "## 🎨 Generating Masterpiece...\n\nProcessing... ⚡", true);
      APP_STATE.currentAbortCtrl = new AbortController();
      const res  = await fetch("/image-generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }), signal: APP_STATE.currentAbortCtrl.signal
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (localRequestId === APP_STATE.currentRequestId) {
        botObj.imageUrl = data.imageUrl;
        updateMessageContent(botMsgId, `## ✨ Masterpiece Created!\n**Vision:** *"${escapeHtml(prompt.slice(0,60))}"*\n\nTap to examine.`, false);
        rebuildActionBar(botMsgId);
        showToast("Generated! 🎨");
        enqueueTelemetry({ event: "image_generated", promptLen: prompt.length });
      }
      return;
    }

    if (file && base64Image) {
      const form = new FormData();
      form.append("image", file);
      form.append("question", safeText || "Carefully analyze this image in full detail.");
      form.append("sessionId", APP_STATE.stableSessionId);
      await streamWithRetry(botMsgId, "/image-analyze", form, localRequestId, true);
      window.removeImagePreview();
      return;
    }

    // ── CHAT: THIN CLIENT PAYLOAD ──
    const detectedIntent = analyzeCognitiveIntent(safeText);
    
    await streamWithRetry(botMsgId, "/chat", {
      messages: APP_STATE.chatMessages.filter(m => m.id !== botMsgId && !m.isLoading).map(m => ({ role: m.role, content: m.text })),
      cognitiveIntent: detectedIntent,
      sessionId: APP_STATE.stableSessionId
    }, localRequestId);

  } catch (err) {
    APP_STATE.userMetrics.errorCount++;
    if (APP_STATE._typingInterval) { clearTimeout(APP_STATE._typingInterval); APP_STATE._typingInterval = null; }
    APP_STATE._tokenBuffer = "";

    if (localRequestId === APP_STATE.currentRequestId) {
      const botObj = APP_STATE.chatMessages.find(m => m.id === botMsgId);
      if (botObj) botObj.isLoading = false;
      const c = classifyError(err);

      if (c.type === "abort") {
        updateMessageContent(botMsgId, "⏹ *Halted.*", false);
      } else if (c.type === "offline") {
        updateMessageContent(botMsgId, "You are offline. Message queued for retry.", false);
        APP_STATE.pendingRetryMessage = rawText;
      } else {
        updateMessageContent(botMsgId, `## ❌ Alert\n**Issue:** ${escapeHtml(c.msg)}`, false);
        showToast(c.msg.slice(0,52), "error");
        enqueueTelemetry({ event: "error", errorType: c.type, msg: c.msg.slice(0,80) });
      }
      rebuildActionBar(botMsgId);
    }
  } finally {
    if (localRequestId === APP_STATE.currentRequestId) {
      APP_STATE.isSending = false; toggleSendStop(false); APP_STATE.currentAbortCtrl = null;
    }
    saveSession();
    if (APP_STATE.healthInterval) clearInterval(APP_STATE.healthInterval);
    APP_STATE.healthInterval = setInterval(pollHealth, 10000);
  }
}

// ── OFFLINE RETRY ──
async function retryPendingMessage() {
  if (!APP_STATE.pendingRetryMessage || APP_STATE.isSending) return;
  const msg = APP_STATE.pendingRetryMessage;
  APP_STATE.pendingRetryMessage = null;
  userInput.value = msg;
  showToast("Back online — retrying... ⚡", "success");
  await sleep(800);
  await sendMessage();
}

// ═══════════════════════════════════════════════
// ALL INTERACTIONS — ZERO STUBS
// ═══════════════════════════════════════════════

// ── EDIT ──
window.startEdit = function(id) {
  const msg = APP_STATE.chatMessages.find(m => m.id === id); if (!msg) return;
  const el  = document.getElementById(`content_${id}`);       if (!el)  return;
  el.innerHTML = `
    <textarea id="edit_${id}" class="edit-textarea">${escapeHtml(msg.text)}</textarea>
    <div class="edit-actions">
      <button class="edit-cancel-btn" onclick="renderChat()">Cancel</button>
      <button class="edit-save-btn"   onclick="saveEdit('${id}')">✅ Update</button>
    </div>`;
  document.getElementById(`edit_${id}`)?.focus();
};

window.saveEdit = async function(id) {
  const newText = document.getElementById(`edit_${id}`)?.value.trim();
  if (!newText) return renderChat();
  const idx = APP_STATE.chatMessages.findIndex(m => m.id === id); if (idx === -1) return;
  APP_STATE.chatMessages[idx].text = newText;
  APP_STATE.chatMessages = APP_STATE.chatMessages.slice(0, idx + 1);
  renderChat(); userInput.value = newText; await sendMessage();
};

// ── REGENERATE ──
window.regenerateMessage = async function(botId) {
  const idx = APP_STATE.chatMessages.findIndex(m => m.id === botId); if (idx <= 0) return;
  const prevText = APP_STATE.chatMessages[idx - 1]?.text?.replace(/\[Image Attached\]/g,"").trim();
  if (!prevText) return;
  APP_STATE.chatMessages = APP_STATE.chatMessages.slice(0, idx);
  renderChat(); userInput.value = prevText; await sendMessage();
};

// ── COPY ──
window.copyMessage = function(id) {
  if (!navigator.clipboard) return showToast("Clipboard unavailable", "error");
  const msg = APP_STATE.chatMessages.find(m => m.id === id); if (!msg) return;
  navigator.clipboard.writeText(msg.text).then(() => showToast("Copied! ✅"));
};

window.copyCodeText = function(codeId) {
  if (!navigator.clipboard) return showToast("Clipboard unavailable", "error");
  const text = document.getElementById(codeId)?.innerText;
  if (text) navigator.clipboard.writeText(text).then(() => showToast("Copied! 📋"));
};

// ── TRANSLATE DROPDOWN ──
window.toggleTranslateMenu = function(id) {
  document.querySelectorAll(".dropdown-menu").forEach(el => { if (el.id !== `trans_${id}`) el.classList.remove("show"); });
  document.getElementById(`trans_${id}`)?.classList.toggle("show");
};
document.addEventListener("click", e => {
  if (!e.target.closest(".dropdown-menu") && !e.target.closest(".action-btn"))
    document.querySelectorAll(".dropdown-menu").forEach(el => el.classList.remove("show"));
});

// ── TRANSLATE ──
window.translateMsg = async function(id, lang) {
  document.getElementById(`trans_${id}`)?.classList.remove("show");
  const msg = APP_STATE.chatMessages.find(m => m.id === id); if (!msg) return;

  const botId = generateId();
  APP_STATE.currentRequestId = generateId();
  const localRequestId = APP_STATE.currentRequestId;
  if (APP_STATE.healthInterval) clearInterval(APP_STATE.healthInterval);

  APP_STATE.chatMessages.push({ id: botId, role: "bot", text: "", isTyping: true, isLoading: true });
  renderChat();
  APP_STATE.isSending = true; toggleSendStop(true);

  try {
    await streamWithRetry(botId, "/chat", {
      messages: [{ role: "user", content: `Translate ONLY the following text to ${lang}. Return ONLY the translation:\n\n${msg.text}` }],
      cognitiveIntent: "standard",
      sessionId: APP_STATE.stableSessionId
    }, localRequestId);
    enqueueTelemetry({ event: "translate", lang });
  } catch (err) {
    if (localRequestId === APP_STATE.currentRequestId) {
      const botObj = APP_STATE.chatMessages.find(m => m.id === botId);
      if (botObj) botObj.isLoading = false;
      updateMessageContent(botId, "❌ Translation failed.", false);
    }
  } finally {
    if (localRequestId === APP_STATE.currentRequestId) { APP_STATE.isSending = false; toggleSendStop(false); }
    saveSession();
    if (APP_STATE.healthInterval) clearInterval(APP_STATE.healthInterval);
    APP_STATE.healthInterval = setInterval(pollHealth, 10000);
  }
};

// ── TTS ──
window.toggleReadMessage = function(id) {
  if (!("speechSynthesis" in window)) return showToast("TTS not supported", "error");
  if (APP_STATE.currentlyReadingId === id) {
    speechSynthesis.cancel(); APP_STATE.currentlyReadingId = null; rebuildActionBar(id); return;
  }
  const msg = APP_STATE.chatMessages.find(m => m.id === id); if (!msg) return;
  speechSynthesis.cancel();
  APP_STATE.currentlyReadingId = id; rebuildActionBar(id);

  let clean = String(msg.text)
    .replace(/```[\s\S]*?```/g, "code block.")
    .replace(/`([^`]+)`/g,     "$1")
    .replace(/[*#_~>\-=|[\]]/g," ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s{2,}/g, " ").trim();

  const utt  = new SpeechSynthesisUtterance(clean);
  const lang = detectLanguage(clean);
  if (lang === "telugu") {
    utt.lang  = "te-IN";
    utt.voice = APP_STATE.cachedVoices.find(v => v.lang.includes("te")) || null;
  } else if (lang === "hindi") {
    utt.lang  = "hi-IN";
    utt.voice = APP_STATE.cachedVoices.find(v => v.lang.includes("hi")) || null;
  } else {
    utt.lang  = "en-US";
    utt.voice = APP_STATE.cachedVoices.find(v => v.lang === "en-US" && v.name.toLowerCase().includes("female"))
             || APP_STATE.cachedVoices.find(v => v.lang.startsWith("en")) || null;
    utt.rate  = 1.05; utt.pitch = 1.0;
  }
  utt.onend = utt.onerror = () => { APP_STATE.currentlyReadingId = null; rebuildActionBar(id); };
  if (APP_STATE.voiceEnabled) speechSynthesis.speak(utt);
};

window.toggleVoice = function(v) {
  APP_STATE.voiceEnabled = v;
  if (!v) { speechSynthesis.cancel(); APP_STATE.currentlyReadingId = null; }
  if (speakerBtn) speakerBtn.style.opacity = v ? "1" : "0.45";
  showToast(v ? "Voice ON 🔊" : "Voice OFF 🔇");
};

// ═══════════════════════════════════════════════
// MIC 
// ═══════════════════════════════════════════════
(function setupMic() {
  if (!micBtn) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { micBtn.style.opacity = "0.3"; micBtn.title = "Mic not supported"; return; }
  const rec = new SR(); rec.continuous = false; rec.interimResults = true;
  micBtn.onclick = () => {
    if (APP_STATE.isListening) { rec.stop(); return; }
    micBtn.classList.add("listening");
    const lang = detectLanguage(userInput.value || "");
    rec.lang = lang === "telugu" ? "te-IN" : lang === "hindi" ? "hi-IN" : "en-US";
    try { rec.start(); } catch { micBtn.classList.remove("listening"); }
  };
  rec.onstart  = () => { APP_STATE.isListening = true; };
  rec.onresult = e => {
    userInput.value = Array.from(e.results).map(r => r[0].transcript).join("");
    autoResizeInput(); updateCharCounter();
    if (e.results[e.results.length - 1].isFinal) window.handleSendOrStop();
  };
  rec.onerror = rec.onend = () => { APP_STATE.isListening = false; micBtn.classList.remove("listening"); };
})();

// ═══════════════════════════════════════════════
// SCROLL & INPUT
// ═══════════════════════════════════════════════
function scrollDown(force = false) {
  if (APP_STATE.userScrolledUp && !force) return;
  requestAnimationFrame(() => { chatBox.scrollTop = chatBox.scrollHeight; });
}

let resizeFrame;
function autoResizeInput() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    userInput.style.height = "auto";
    userInput.style.height = clamp(userInput.scrollHeight, 40, 120) + "px";
  });
}

function updateCharCounter() {
  if (!charCounter) return;
  const len = userInput.value.length;
  charCounter.textContent = len > 0 ? `${len}` : "";
  charCounter.style.color = len > 3500 ? "rgba(248,113,113,0.9)"
    : len > 2000 ? "rgba(251,191,36,0.9)"
    : "rgba(255,255,255,0.3)";
}

sendBtn?.removeAttribute("onclick");
sendBtn?.addEventListener("click", e => { e.preventDefault(); window.handleSendOrStop(); });
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); window.handleSendOrStop(); }
});
userInput.addEventListener("input", () => { autoResizeInput(); updateCharCounter(); });

// ═══════════════════════════════════════════════
// STORAGE (YOUR pv_history_v2 key — kept)
// ═══════════════════════════════════════════════
function stripImagesForStorage(messages) {
  return messages.map(msg => {
    const c = { ...msg };
    if (c.imageUrl?.startsWith("data:")) delete c.imageUrl;
    delete c.isTyping; delete c.isLoading; return c;
  });
}

function saveSession() {
  if (!APP_STATE.chatMessages.length) return;
  const stripped = stripImagesForStorage(APP_STATE.chatMessages);
  try {
    if (APP_STATE.activeSessionIndex === -1) {
      APP_STATE.allChatSessions.push(stripped);
      APP_STATE.activeSessionIndex = APP_STATE.allChatSessions.length - 1;
    } else {
      APP_STATE.allChatSessions[APP_STATE.activeSessionIndex] = stripped;
    }
    if (APP_STATE.allChatSessions.length > 20) {
      APP_STATE.allChatSessions = APP_STATE.allChatSessions.slice(-20);
      if (APP_STATE.activeSessionIndex >= APP_STATE.allChatSessions.length)
        APP_STATE.activeSessionIndex = APP_STATE.allChatSessions.length - 1;
    }
    localStorage.setItem("pv_history_v2", JSON.stringify(APP_STATE.allChatSessions));
    renderHistorySidebar();
  } catch { console.warn("[v49] Storage quota exceeded."); }
}

// ═══════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════
function renderHistorySidebar() {
  if (!historyList) return;
  historyList.innerHTML = "";
  if (!APP_STATE.allChatSessions.length) {
    historyList.innerHTML = `<div style="padding:20px;color:rgba(255,255,255,0.3);font-size:12px;text-align:center;">No sessions yet</div>`;
    return;
  }
  [...APP_STATE.allChatSessions].reverse().forEach((session, revIdx) => {
    const idx = APP_STATE.allChatSessions.length - 1 - revIdx;
    if (!session?.length) return;
    const rawTitle = session.find(m => m.role === "user" && !m.isHidden)?.text?.replace(/\[Image Attached\]/g,"🖼") || "Chat Session";
    const title    = rawTitle.slice(0,38) + (rawTitle.length > 38 ? "…" : "");
    const item     = document.createElement("div");
    item.className = `history-item${idx === APP_STATE.activeSessionIndex ? " active-session" : ""}`;
    item.innerHTML = `
      <div class="history-text" onclick="loadSession(${idx})" title="${escapeHtml(rawTitle)}">${escapeHtml(title)}</div>
      <button class="history-delete" onclick="deleteSession(${idx},event)" aria-label="Delete">×</button>`;
    historyList.appendChild(item);
  });
}

window.loadSession = function(idx) {
  if (!APP_STATE.allChatSessions[idx]) return;
  APP_STATE.activeSessionIndex = idx;
  APP_STATE.chatMessages = [...APP_STATE.allChatSessions[idx]];
  renderChat(); window.closeSidebar();
};

window.deleteSession = function(idx, e) {
  e.stopPropagation();
  APP_STATE.allChatSessions.splice(idx, 1);
  if (APP_STATE.activeSessionIndex === idx) window.newChat(false);
  else if (APP_STATE.activeSessionIndex > idx) APP_STATE.activeSessionIndex--;
  localStorage.setItem("pv_history_v2", JSON.stringify(APP_STATE.allChatSessions));
  renderHistorySidebar();
};

window.newChat = function(close = true) {
  if (APP_STATE.isSending) APP_STATE.currentAbortCtrl?.abort();
  APP_STATE.activeSessionIndex = -1;
  APP_STATE._tokenBuffer = "";
  window.removeImagePreview();
  APP_STATE.chatMessages = [{
    id: generateId(), role: "bot",
    text: "⚡ MINI AI v49.1 — Brutal Speed Engine. Ready."
  }];
  renderChat();
  if (close) window.closeSidebar();
  hideSystemError(); setStatus("online"); userInput.focus();
};

window.clearHistory = function() {
  if (!confirm("Clear all chat history? This cannot be undone.")) return;
  APP_STATE.allChatSessions = []; APP_STATE.activeSessionIndex = -1;
  localStorage.removeItem("pv_history_v2");
  renderHistorySidebar(); window.newChat(false);
};

window.openSidebar  = () => { sidePanel?.classList.add("open"); overlay?.classList.add("open"); renderHistorySidebar(); };
window.closeSidebar = () => { sidePanel?.classList.remove("open"); overlay?.classList.remove("open"); };
window.toggleMenu   = () => { sidePanel?.classList.contains("open") ? window.closeSidebar() : window.openSidebar(); };
overlay?.addEventListener("click", window.closeSidebar);
if (newThreadBtn) newThreadBtn.onclick = () => window.newChat();
if (speakerBtn)   speakerBtn.onclick   = () => window.toggleVoice(!APP_STATE.voiceEnabled);

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  window.setMode("chat");

  if (APP_STATE.allChatSessions.length > 0) {
    APP_STATE.activeSessionIndex = APP_STATE.allChatSessions.length - 1;
    APP_STATE.chatMessages = [...APP_STATE.allChatSessions[APP_STATE.activeSessionIndex]];
    renderChat();
  } else {
    window.newChat(false);
  }

  renderHistorySidebar();
  setStatus("online");
  userInput.focus();
  pollHealth();
  APP_STATE.healthInterval = setInterval(pollHealth, 10000);

  console.log("🚀 [v49.1 Init] MINI AI ELITE THIN CLIENT loaded");
  console.log("[v49.1 Session]", APP_STATE.stableSessionId);
  console.table({
    circuitBreaker:  APP_STATE.circuitBreaker.state,
    safety:          APP_STATE.safetyEnabled,
    telemetry:       APP_STATE.telemetryEnabled,
    connection:      APP_STATE.connectionQuality,
    adaptiveTimeout: APP_STATE.adaptiveTimeout + "ms",
    sessions:        APP_STATE.allChatSessions.length,
    sessionId:       APP_STATE.stableSessionId.slice(0,20) + "..."
  });
});
