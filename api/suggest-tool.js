const ALLOWED_TOOLS = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Notion AI', 'GrammarlyGO', 'Elicit', 'Consensus', 'Otter.ai'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const task = ((req.body && req.body.task) || '').toString().trim().slice(0, 300);
  if (!task) {
    res.status(400).json({ error: 'Missing task' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(501).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    return;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const prompt = `Task: "${task}"\nPick the single best AI tool for this task (prefer one of: ${ALLOWED_TOOLS.join(', ')}; otherwise name another real AI tool). Reply with ONLY this JSON, nothing else: {"tool":"<name>","reason":"<max 8 words, why>"}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 900 }
        }),
        signal: controller.signal
      }
    );
    clearTimeout(timeout);

    if (!r.ok) {
      const detail = await r.text();
      res.status(502).json({ error: 'Gemini request failed', detail: detail.slice(0, 300) });
      return;
    }

    const data = await r.json();
    const text = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
      data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text;

    const match = typeof text === 'string' && text.match(/\{[\s\S]*\}/);
    if (!match) {
      res.status(502).json({ error: 'Could not parse a suggestion from the model response' });
      return;
    }

    const parsed = JSON.parse(match[0]);
    if (!parsed.tool) {
      res.status(502).json({ error: 'Model response had no tool field' });
      return;
    }

    res.status(200).json({
      tool: String(parsed.tool).slice(0, 40),
      reason: String(parsed.reason || '').slice(0, 150)
    });
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: String(e && e.message || e).slice(0, 200) });
  }
}
