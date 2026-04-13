const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `You are a proofreader checking for mechanical errors only. You are NOT a writing coach and must NOT suggest rewrites, style improvements, or prose changes.

Flag ONLY these specific error types:
- Spelling mistakes (wrong word, typo)
- Punctuation errors (missing comma, wrong apostrophe, misused semicolon, etc.)
- Grammar errors (subject-verb disagreement, wrong tense, misplaced modifier, etc.)
- Capitalisation errors

Do NOT flag:
- Sentence fragments or short sentences (these may be intentional author voice)
- Word choice or phrasing (do not suggest different words)
- Sentence structure or flow
- Redundancy or wordiness
- Style of any kind
- Anything that is a matter of opinion

Return ONLY a valid JSON array. Each element must have:
- "text": the EXACT verbatim text from the document that contains the error. Copy it character-for-character. Keep it as short as possible — ideally just the word or punctuation mark in question.
- "issue": a brief factual description of the specific error (e.g. "Missing comma after introductory clause" or "Apostrophe missing in possessive")
- "type": one of "spelling", "punctuation", "grammar", "capitalisation"

Return ONLY the JSON array. No markdown fences, no explanation, no commentary.`;

app.post('/api/analyze', async (req, res) => {
  const { text, apiKey } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing text' });
  }
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'Missing API key' });
  }

  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }]
      })
    });
  } catch (err) {
    return res.status(500).json({ error: `Network error: ${err.message}` });
  }

  if (!response.ok) {
    let errBody;
    try { errBody = await response.json(); } catch { errBody = {}; }
    return res.status(response.status).json({
      error: errBody.error?.message || `API error (${response.status})`
    });
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';

  let issues;
  try {
    issues = JSON.parse(content);
  } catch {
    const match = content.match(/\[[\s\S]*\]/);
    try {
      issues = match ? JSON.parse(match[0]) : [];
    } catch {
      issues = [];
    }
  }

  if (!Array.isArray(issues)) issues = [];

  // Validate shape
  issues = issues.filter(i => i && typeof i.text === 'string' && typeof i.issue === 'string');

  res.json({ issues });
});

const PORT = process.env.PORT || 3000;

// When run directly via `node server.js`, start listening immediately.
// When required by Electron's main process, export so it can control startup.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  Text Editor  →  http://localhost:${PORT}\n`);
  });
} else {
  module.exports = { app, PORT };
}
