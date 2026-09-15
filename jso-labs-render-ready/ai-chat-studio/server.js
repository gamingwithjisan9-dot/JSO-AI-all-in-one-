// server.js
// AI Chat Studio backend — proxies chat/image requests to OpenAI or Anthropic
// using the API key the USER supplies from the browser (never stored server-side).
// This lets you publish the app for free and each visitor uses their own key.

const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ---------- Helper: send SSE-friendly chunk to client ----------
function sseSend(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ---------- Chat (streaming) — supports OpenAI and Anthropic ----------
app.post("/api/chat", async (req, res) => {
  const { provider, apiKey, model, messages, system } = req.body;

  if (!apiKey) return res.status(400).json({ error: "Missing API key." });
  if (!provider || !["openai", "anthropic"].includes(provider)) {
    return res.status(400).json({ error: "Invalid provider." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    if (provider === "openai") {
      const openaiMessages = system ? [{ role: "system", content: system }, ...messages] : messages;
      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages: openaiMessages,
          stream: true,
        }),
      });

      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text();
        sseSend(res, { error: errText || `Upstream error ${upstream.status}` });
        return res.end();
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.replace(/^data:\s*/, "");
          if (payload === "[DONE]") {
            sseSend(res, { done: true });
            continue;
          }
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) sseSend(res, { text: delta });
          } catch (_) {}
        }
      }
      return res.end();
    }

    if (provider === "anthropic") {
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model || "claude-sonnet-4-5",
          max_tokens: 4096,
          system: system || undefined,
          messages,
          stream: true,
        }),
      });

      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text();
        sseSend(res, { error: errText || `Upstream error ${upstream.status}` });
        return res.end();
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.replace(/^data:\s*/, "");
          try {
            const json = JSON.parse(payload);
            if (json.type === "content_block_delta" && json.delta?.text) {
              sseSend(res, { text: json.delta.text });
            }
            if (json.type === "message_stop") {
              sseSend(res, { done: true });
            }
          } catch (_) {}
        }
      }
      return res.end();
    }
  } catch (err) {
    sseSend(res, { error: err.message || "Server error." });
    res.end();
  }
});

// ---------- Image generation (OpenAI DALL-E) ----------
app.post("/api/image", async (req, res) => {
  const { apiKey, prompt, size } = req.body;
  if (!apiKey) return res.status(400).json({ error: "Missing API key." });
  if (!prompt) return res.status(400).json({ error: "Missing prompt." });

  try {
    const upstream = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: size || "1024x1024",
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data.error?.message || "Image generation failed." });
    }
    res.json({ url: data.data[0].url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- File / PDF text extraction ----------
app.post("/api/extract-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    const { originalname, mimetype, buffer } = req.file;

    if (mimetype === "application/pdf" || originalname.toLowerCase().endsWith(".pdf")) {
      const parsed = await pdfParse(buffer);
      return res.json({ filename: originalname, text: parsed.text.slice(0, 50000) });
    }

    // Treat everything else as plain text (txt, md, csv, json, code files, etc.)
    const text = buffer.toString("utf-8");
    res.json({ filename: originalname, text: text.slice(0, 50000) });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to read file." });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`AI Chat Studio running on port ${PORT}`);
});
