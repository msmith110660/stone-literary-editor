const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Dynamic prompt builder ─────────────────────────────────────────────────
function buildSystemPrompt(genre, severity, ignoreList) {

  const genreContext = {
    fiction: `This is creative or literary fiction. The author may intentionally use sentence fragments, unconventional punctuation, dialect, repetition, and stylistic choices that serve narrative voice or character. Do NOT flag these as errors.`,
    nonfiction: `This is non-fiction prose — essay, memoir, journalism, or narrative non-fiction. Respect the author's established voice while flagging genuine mechanical errors.`,
    academic: `This is academic or scholarly writing. Apply strict standards. Flag grammar errors, spelling mistakes, punctuation errors, incorrect capitalisation, and subject-verb agreement issues.`,
    business: `This is professional business writing. Apply standard business writing conventions and flag mechanical errors clearly.`
  };

  const severityInstructions = {
    errors: `Flag ONLY mechanical errors:
- Spelling mistakes and typos
- Punctuation errors (missing comma, wrong apostrophe, misused semicolon, etc.)
- Grammar errors (subject-verb disagreement, wrong tense, misplaced modifier, etc.)
- Capitalisation errors

Do NOT flag style, clarity, word choice, redundancy, or any matter of opinion.`,

    full: `Flag the following:
- Spelling mistakes and typos
- Punctuation errors
- Grammar errors
- Capitalisation errors
- Unclear or ambiguous phrasing that could confuse a reader
- Awkward sentence construction
- Redundant or unnecessary words
- Inconsistent tense or point of view shifts
- Word choice issues (wrong register, imprecise word)

Still do NOT flag intentional stylistic choices, fragments used for effect, or matters of pure opinion.`
  };

  const ignoreClause = ignoreList && ignoreList.length > 0
    ? `\n\nDo NOT flag any of the following as errors under any circumstances — they are intentional: ${ignoreList.join(', ')}`
    : '';

  const typeList = severity === 'full'
    ? '"spelling", "punctuation", "grammar", "capitalisation", "clarity", "word-choice", "style"'
    : '"spelling", "punctuation", "grammar", "capitalisation"';

  return `You are a professional proofreader. ${genreContext[genre] || genreContext.fiction}

${severityInstructions[severity] || severityInstructions.errors}

Do NOT flag sentence fragments or short sentences unless they are clearly unintentional.${ignoreClause}

Return ONLY a valid JSON array. Each element must have:
- "text": the EXACT verbatim text from the document containing the error. Copy character-for-character. Keep it as short as possible — ideally just the word or punctuation in question.
- "issue": a brief factual description of the specific error
- "type": one of ${typeList}

Return ONLY the JSON array. No markdown fences, no explanation, no commentary.`;
}

// ── Models ─────────────────────────────────────────────────────────────────
const DEFAULT_MODEL = 'claude-sonnet-4-6';
// Models that support the server-side refusal fallback ("fallbacks": "default")
const FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-sonnet-5-5']);

// ── Analyze endpoint ───────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { text, apiKey, genre, severity, ignoreList } = req.body;
  const model = typeof req.body.model === 'string' && req.body.model.trim()
    ? req.body.model.trim()
    : DEFAULT_MODEL;

  if (!/^claude-[a-z0-9.-]+$/i.test(model)) {
    return res.status(400).json({ error: `"${model}" doesn't look like a Claude model ID (they start with "claude-").` });
  }

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing text' });
  }
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'Missing API key' });
  }

  const systemPrompt = buildSystemPrompt(
    genre    || 'fiction',
    severity || 'errors',
    Array.isArray(ignoreList) ? ignoreList : []
  );

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  };
  const body = {
    model,
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: 'user', content: text }]
  };
  if (FALLBACK_MODELS.has(model)) {
    // If the model declines the request, let the API retry it on a fallback model
    headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
    body.fallbacks = 'default';
  }

  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  } catch (err) {
    return res.status(500).json({ error: `Network error: ${err.message}` });
  }

  if (!response.ok) {
    let errBody;
    try { errBody = await response.json(); } catch { errBody = {}; }
    if (response.status === 401) {
      return res.status(401).json({
        error: "Anthropic didn't accept this API key. Check that you copied the whole key (it starts with sk-ant-) and that it hasn't been deleted in the Console."
      });
    }
    return res.status(response.status).json({
      error: errBody.error?.message || `API error (${response.status})`
    });
  }

  const data = await response.json();

  if (data.stop_reason === 'refusal') {
    return res.status(422).json({ error: 'The model declined to analyze this text. Try a different model.' });
  }

  // Newer models can return thinking blocks before the answer, so find the text block(s)
  const content = (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

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
  issues = issues.filter(i => i && typeof i.text === 'string' && typeof i.issue === 'string');

  res.json({ issues });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  Stone Literary LLC Editor  →  http://localhost:${PORT}\n`);
  });
} else {
  module.exports = { app, PORT };
}
