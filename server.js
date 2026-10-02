/**
 * server.js — TaskPilot AI (Free API Edition)
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app      = express();
const PORT     = process.env.PORT || 3000;
const PROVIDER = (process.env.AI_PROVIDER || 'groq').toLowerCase();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ── Groq adapter ── */
async function callGroq(systemPrompt, userMessage) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Groq error: ' + (err?.error?.message || res.status));
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/* ── Gemini adapter (FIXED) ── */
async function callGemini(systemPrompt, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

 const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\n${userMessage}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096
      }
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Gemini error: ' + (err?.error?.message || res.status));
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/* ── AI selector ── */
async function callAI(systemPrompt, userMessage) {
  return PROVIDER === 'gemini'
    ? callGemini(systemPrompt, userMessage)
    : callGroq(systemPrompt, userMessage);
}

/* ── POST /api/analyze ── */
app.post('/api/analyze', async (req, res) => {
  const { text, source, today, systemPrompt } = req.body;

  if (!text || text.trim().length < 10) {
    return res.status(400).json({ message: 'Input text is too short.' });
  }

  try {
    const raw = await callAI(
      systemPrompt,
      `Analyze this ${source} content and extract all tasks:\n\n${text}`
    );

    // Clean markdown if model returns ```json
    const clean = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error("Raw AI Response:", raw);
      return res.status(500).json({
        message: 'AI returned invalid JSON. Try again.',
        rawOutput: raw
      });
    }

    return res.json(parsed);

  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: err.message });
  }
});

/* ── Health check ── */
app.get('/api/health', (_, res) => res.json({
  status: 'ok',
  provider: PROVIDER,
  keySet: !!(PROVIDER === 'gemini'
    ? process.env.GEMINI_API_KEY
    : process.env.GROQ_API_KEY),
}));

/* ── Frontend ── */
app.get('*', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

/* ── Start server ── */
app.listen(PORT, () => {
  const key = PROVIDER === 'gemini' ? 'GEMINI_API_KEY' : 'GROQ_API_KEY';
  console.log(`\n⚡ TaskPilot AI → http://localhost:${PORT}`);
  console.log(`   Provider : ${PROVIDER.toUpperCase()}`);
  console.log(`   API key  : ${process.env[key] ? '✓ set' : '✗ missing'}\n`);
});