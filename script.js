let chatHistory = [];

function loadHistory() {
  const saved = localStorage.getItem("pv_history");
  chatHistory = saved ? JSON.parse(saved) : [];
}
window.onload = () => {
  loadHistory();
};
let recognition = null;
let isListening = false;

// ================= CHAT =================
async function sendMessage() {
  const input = document.getElementById("userInput");
  const chat = document.getElementById("chatBox");
   const text = userInput.value;
    const imageFile = imageInput.files[0];
  if (!input.value.trim()) return;

  addUserMessage(input.value);
  showTyping();

  
  input.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  });

  const data = await res.json();
  removeTyping();
  typeBotMessage(data.reply);
  speak(data.reply);
}

function addUserMessage(text) {
  const div = document.createElement("div");
  div.className = "user";
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}


function saveHistory(user, bot) {
  chatHistory.push({ user, bot });
  localStorage.setItem(
    "pv_history",
    JSON.stringify(chatHistory)
    
  );
}

function showTyping() {
  const typing = document.createElement("div");
  typing.className = "bot";
  typing.id = "typing";
  typing.textContent = "PV AI is typing…";
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
}

function typeBotMessage(text) {
  const div = document.createElement("div");
  div.className = "bot";
  chatBox.appendChild(div);

  let i = 0;
  const interval = setInterval(() => {
    div.textContent += text[i];
    i++;
    chatBox.scrollTop = chatBox.scrollHeight;
    if (i >= text.length) clearInterval(interval);
  }, 18);
}

// ================= VOICE INPUT =================
function startVoice() {
  if (isListening) {
    stopVoice();
    return;
  }

  // Browser support check
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice input not supported in this browser. Use Chrome.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.start();
  isListening = true;
  micUI(true);

  recognition.onresult = (event) => {
    const speechText = event.results[0][0].transcript;
    document.getElementById("userInput").value = speechText;
    stopVoice();
    sendMessage();
  };

  recognition.onerror = () => {
    stopVoice();
  };

  recognition.onend = () => {
    stopVoice();
  };
}

function stopVoice() {
  if (recognition && isListening) {
    recognition.stop();
  }
  isListening = false;
  micUI(false);
}

// ================= MIC UI =================
function micUI(active) {
  const micBtn = document.querySelector(".mic-btn");
  if (!micBtn) return;

  if (active) {
    micBtn.classList.add("listening");
  } else {
    micBtn.classList.remove("listening");
  }
}

// ================= VOICE OUTPUT =================
function speak(text) {
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(text);
  speech.rate = 1;
  speech.pitch = 1;
  window.speechSynthesis.speak(speech);
}

// ================= ABOUT =================
function toggleAbout() {
  document.getElementById("about").classList.toggle("hidden");
}
function toggleHistory() {
  const panel = document.getElementById("historyPanel");
  panel.classList.toggle("hidden");
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  chatHistory.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.textContent =
      `Q: ${item.user}\n\nA: ${item.bot}`;
    list.appendChild(div);
  });
}

function clearHistory() {
  if (!confirm("Clear all chat history?")) return;
  chatHistory = [];
  localStorage.removeItem("pv_history");
  document.getElementById("historyList").innerHTML = "";
}
