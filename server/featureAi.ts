// Feature-pack AI helpers for NonProfitConnect: deterministic, domain-grounded
// fallbacks over the app's own project records. A provider is called only when
// OPENROUTER_API_KEY or OPENAI_API_KEY is configured; otherwise callers return
// the fallback with aiGenerated:false (never fake success).
export function readableLabel(k: string): string { return String(k).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase()); }
export function scalar(v: unknown): string { if (v === null || v === undefined) return "(not supplied)"; if (v === "") return "(empty)"; return String(v); }
export function readableSections(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.map((v) => readableSections(v)).join("\n") : "(empty list)";
  if (value && typeof value === "object") { const e = Object.entries(value as Record<string, unknown>); return e.length ? e.map(([k, v]) => (v && typeof v === "object" ? `${readableLabel(k)}:\n${readableSections(v)}` : `${readableLabel(k)}: ${scalar(v)}`)).join("\n") : "(no fields)"; }
  return scalar(value);
}
export function hasProvider(env: NodeJS.ProcessEnv = process.env): boolean { return Boolean((env.OPENROUTER_API_KEY || env.OPENAI_API_KEY || "").trim()); }
function countBy(rows: Record<string, any>[], key: string): Record<string, number> { const o: Record<string, number> = {}; for (const r of rows || []) { const k = String(r[key] ?? "(empty)"); o[k] = (o[k] || 0) + 1; } return o; }
const base = (feature: string, summary: string, sections: Record<string, unknown>) => ({ aiGenerated: false, source: "deterministic-fallback", providerConfigured: false, feature, summary, sections, readable: readableSections(sections) });
export function fallbackProjectHealth(projects: Record<string, any>[] = []) {
  const byStatus = countBy(projects, "status"); const byCategory = countBy(projects, "category");
  return base("project-health", `${projects.length} project record(s) reviewed.`, { totalProjects: projects.length, byStatus, byCategory, pendingReview: projects.filter((p) => /pending|review/i.test(String(p.status || ""))).length, unfundedCount: projects.filter((p) => !(Number(p.requestedAmount) > 0)).length });
}
export function fallbackFundingFocus(projects: Record<string, any>[] = []) {
  const totalRequested = projects.reduce((s, p) => s + (Number(p.requestedAmount) || 0), 0);
  const byPriority = countBy(projects, "priority");
  return base("funding-focus", `${projects.length} project(s) requesting ${totalRequested} in total.`, { totalProjects: projects.length, totalRequested, byPriority, highPriorityCount: projects.filter((p) => String(p.priority).toLowerCase() === "high").length, zeroAmountCount: projects.filter((p) => !(Number(p.requestedAmount) > 0)).length });
}
export function fallbackReviewQueue(projects: Record<string, any>[] = []) {
  const queued = projects.filter((p) => /pending|review|submitted/i.test(String(p.status || "")));
  return base("review-queue", `${queued.length} project(s) awaiting review.`, { awaitingReview: queued.length, byStatus: countBy(projects, "status"), oldestTitles: queued.slice(0, 5).map((p) => String(p.title ?? "(empty)")) });
}
export async function callProvider(feature: string, prompt: string, env: NodeJS.ProcessEnv = process.env, fetchImpl: typeof fetch = fetch): Promise<any> {
  const key = (env.OPENROUTER_API_KEY || env.OPENAI_API_KEY || "").trim(); if (!key) return null;
  const isOR = Boolean((env.OPENROUTER_API_KEY || "").trim());
  const url = isOR ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
  const model = env.OPENROUTER_MODEL || env.OPENAI_MODEL || (isOR ? "openrouter/free" : "gpt-4o-mini");
  const res = await fetchImpl(url, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: [{ role: "system", content: "Return JSON {summary, sections} grounded only in supplied records. Preserve false/0 values." }, { role: "user", content: prompt }], temperature: 0.2 }) });
  if (!res.ok) { const e: any = new Error(`AI provider failed with HTTP ${res.status}`); e.status = 502; throw e; }
  const data: any = await res.json(); const content = data?.choices?.[0]?.message?.content || "";
  if (!content || !data?.id) { const e: any = new Error("AI provider returned incomplete response"); e.status = 502; throw e; }
  let parsed: any; try { parsed = JSON.parse(content); } catch { parsed = { summary: content, sections: {} }; }
  return { aiGenerated: true, source: isOR ? "openrouter" : "openai", providerConfigured: true, feature, model: data.model || model, providerReceiptId: data.id, ...parsed, readable: readableSections(parsed.sections || parsed) };
}
