// Render AI JSON as readable labelled sections, preserving false/0/empty values.
export function readableSections(value: unknown): string {
  const label = (k: string) => String(k).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
  const scalar = (v: unknown): string => { if (v === null || v === undefined) return "(not supplied)"; if (v === "") return "(empty)"; return String(v); };
  if (Array.isArray(value)) return value.length ? value.map((v) => readableSections(v)).join("\n") : "(empty list)";
  if (value && typeof value === "object") { const e = Object.entries(value as Record<string, unknown>); return e.length ? e.map(([k, v]) => (v && typeof v === "object" ? `${label(k)}:\n${readableSections(v)}` : `${label(k)}: ${scalar(v)}`)).join("\n") : "(no fields)"; }
  return scalar(value);
}
export default readableSections;
