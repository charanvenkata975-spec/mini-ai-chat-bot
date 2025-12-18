const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 Short-term memory (last few messages)
let conversation = [];

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.json({ reply: "Please type something 🙂" });
    }

    const msg = userMessage.trim().toLowerCase();

    // 👤 EXTRA INFO ONLY: creator identity
    if (
      msg.includes("who made you") ||
      msg.includes("who created you") ||
      msg.includes("who developed you") ||
      msg.includes("your creator")
    ) {
      return res.json({
        reply: "I was created by Venkata Charan ,Kartheek👨‍💻"
      });
    }

    // 🧍 Human-style small inputs
    if (msg.length <= 2) {
      return res.json({
        reply: "Hmm 🙂 can you explain a little more?"
      });
    }

    if (["ok", "hmm", "ntg", "nothing"].includes(msg)) {
      return res.json({
        reply: "Alright 👍 let me know if you need anything."
      });
    }

    if (msg === "hi" || msg === "hello") {
      return res.json({
        reply: "Hello 👋 How can I help you today?"
      });
    }

    // Save user message to memory
    conversation.push({ role: "user", content: userMessage });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 180,
      messages: [
     {
  role: "system",
  content: `
You are PV AI, a human-like assistant.

VERY IMPORTANT RULES:
- If the user asks for "points", "point wise", or "in points",
  ALWAYS answer in numbered points.
- Each point must be on a new line.
- After giving points, add a empty line.
- Do NOT use markdown symbols like **, ##, or bullets.
- Keep answers clean, neat, and student-friendly.
- Do NOT write long paragraphs.
`
},
        ...conversation.slice(-6)
      ]
    });

    const reply = completion.choices[0].message.content;

    // Save assistant reply to memory
    conversation.push({ role: "assistant", content: reply });

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.json({
      reply: "I’m having a small issue right now 😔 please try again."
    });
  }
});

app.listen(3001, () => {
  console.log("✅ PV AI running at http://localhost:3001");
});