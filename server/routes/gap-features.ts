// === Batch 11 Gaps & Frontend Mounts ===
// Gap features (AI counterparts + Non-AI features) for NonProfitConnect.
// Lazy gap_features table (in-memory), OpenRouter via native fetch.

import express from 'express';
const router = express.Router();

const gapFeatures = new Map<string, Array<{ at: string; payload: any }>>();

async function llm(systemPrompt: string, userMsg: string, maxTokens = 1400): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) { const e: any = new Error('OPENROUTER_API_KEY not configured'); e.status = 503; throw e; }
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'NonProfitConnect Gap Features' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }], max_tokens: maxTokens }),
  });
  const data: any = await r.json();
  if (data?.error) throw new Error(data.error.message || 'LLM error');
  return data?.choices?.[0]?.message?.content || '';
}

function track(slug: string, payload: any) {
  const list = gapFeatures.get(slug) || [];
  list.push({ at: new Date().toISOString(), payload });
  gapFeatures.set(slug, list);
}

function safe(res: any, e: any) { return res.status((e && e.status) || 500).json({ error: (e && e.message) || 'request failed' }); }

// ---- AI Gap Counterparts ----

router.post('/gap-donation-matching', async (req, res) => {
  try {
    const body: any = req.body || {};
    const sys = "You are a donation-matching AI. Match donors to projects based on cause alignment, donor history, and impact prediction.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('donation-matching', { keys: Object.keys(body) });
    res.json({ recommendation: out });
  } catch (e: any) { safe(res, e); }
});

router.post('/gap-grant-proposal-writer', async (req, res) => {
  try {
    const body: any = req.body || {};
    const sys = "You write grant proposals. Produce a 5-section proposal: background, need statement, project description, evaluation plan, budget narrative.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('grant-proposal-writer', { keys: Object.keys(body) });
    res.json({ proposal: out });
  } catch (e: any) { safe(res, e); }
});

router.post('/gap-donor-segmentation', async (req, res) => {
  try {
    const body: any = req.body || {};
    const sys = "You segment donors by lifetime value, frequency, and recency. Suggest tailored outreach for each segment.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('donor-segmentation', { keys: Object.keys(body) });
    res.json({ segments: out });
  } catch (e: any) { safe(res, e); }
});

router.post('/gap-content-moderation', async (req, res) => {
  try {
    const body: any = req.body || {};
    const sys = "You moderate user-generated content (messages, gallery posts) for harassment, spam, and policy violations.";
    const user = `Body: ${JSON.stringify(body).slice(0, 4000)}`;
    const out = await llm(sys, user);
    track('content-moderation', { keys: Object.keys(body) });
    res.json({ moderation: out });
  } catch (e: any) { safe(res, e); }
});

// ---- Non-AI Gap Features ----

router.post('/gap-payment-processing', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'payment-processing_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('payment-processing', record);
  res.json({ transaction: record, status: 'recorded' });
});

router.post('/gap-recurring-donations', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'recurring-donations_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('recurring-donations', record);
  res.json({ subscription: record, status: 'recorded' });
});

router.post('/gap-volunteer-management', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'volunteer-management_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('volunteer-management', record);
  res.json({ volunteer: record, status: 'recorded' });
});

router.post('/gap-grant-doc-versioning', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'grant-doc-versioning_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('grant-doc-versioning', record);
  res.json({ document: record, status: 'recorded' });
});

router.post('/gap-tax-receipt-generation', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'tax-receipt-generation_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('tax-receipt-generation', record);
  res.json({ receipt: record, status: 'recorded' });
});

router.post('/gap-mobile-app-stub', (req, res) => {
  const body: any = req.body || {};
  const record = { id: 'mobile-app-stub_' + Date.now(), ...body, createdAt: new Date().toISOString() };
  track('mobile-app-stub', record);
  res.json({ feature: record, status: 'recorded' });
});

router.get('/gap-features/_audit', (req, res) => {
  const rows: Array<{ feature: string; events: number }> = [];
  for (const [k, v] of gapFeatures.entries()) rows.push({ feature: k, events: v.length });
  res.json({ rows });
});

export default router;
