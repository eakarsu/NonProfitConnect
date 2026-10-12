
import FullAIExamples, { useFullAIExamples } from "../components/FullAIExamples";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import NativeAIReport from "@/components/NativeAIReport";
import { apiRequest, recordRows } from "@/lib/queryClient";
import useNativeAIRequest from "@/lib/useNativeAIRequest";

type Tool = "proposal-draft" | "segment-donors" | "match-donation";
type Field = { name: string; label: string; multiline?: boolean; json?: boolean; required?: boolean };
type SavedProposal = { id: number; output: unknown; model: string; createdAt: string };
const tools: { id: Tool; label: string; fields: Field[] }[] = [
  { id: "proposal-draft", label: "Proposal Draft", fields: [
    { name: "title", label: "Project title", required: true }, { name: "category", label: "Program category", required: true },
    { name: "targetFunders", label: "Target funders (optional)" }, { name: "budget", label: "Budget (optional)" },
    { name: "timeline", label: "Timeline (optional)" }, { name: "goals", label: "Program and expected outcomes (optional)", multiline: true },
  ] },
  { id: "segment-donors", label: "Segment Donors", fields: [
    { name: "donors", label: "Deidentified donor observations (JSON)", multiline: true, json: true, required: true },
    { name: "criteria", label: "Segmentation criteria (optional)" },
  ] },
  { id: "match-donation", label: "Match Donation", fields: [
    { name: "donor", label: "Donor preferences (JSON)", multiline: true, json: true, required: true },
    { name: "projects", label: "Saved candidate projects (JSON array)", multiline: true, json: true, required: true },
  ] },
];
const exampleLabels = ["Community education", "Food access", "Youth development"];
const proposalExamples = [
  { title: "Fictional community learning program", category: "Education", targetFunders: "Example local education fund; verify eligibility before submission", budget: "Proposed USD 40,000; validate costs before submission", timeline: "Proposed six-month pilot, subject to confirmed staffing and approval", goals: "Fictional planning scenario: offer community learning sessions and measure attendance, participant feedback and completion. Confirm baseline needs, staffing, costs and achievable targets before making claims." },
  { title: "Fictional neighborhood food access program", category: "Food security", targetFunders: "Example community grant fund; confirm current guidelines", budget: "Proposed USD 60,000; develop an evidence-based itemized budget", timeline: "Proposed nine-month pilot with independent milestone review", goals: "Fictional planning scenario: coordinate access to food resources, document referrals and assess service reach. Identify unknown capacity, partner commitments and costs; do not invent existing results." },
  { title: "Fictional youth mentoring pilot", category: "Youth development", targetFunders: "Example youth development foundation; verify eligibility and deadlines", budget: "Proposed USD 50,000; subject to validated delivery costs", timeline: "Proposed one-year pilot with quarterly review", goals: "Fictional planning scenario: provide supervised mentoring activities with safeguarding review, attendance measures and feedback. State assumptions and evidence needed before promising outcomes." },
];
const donorExamples = [
  [{ totalGiven: 1200, frequency: "monthly", lastGift: "2026-09-01", sample: "fictional, deidentified observation" }, { totalGiven: 200, frequency: "annual", lastGift: "2025-09-01", sample: "fictional, deidentified observation" }],
  [{ totalGiven: 500, frequency: "quarterly", lastGift: "2026-07-01", sample: "fictional, deidentified observation" }, { totalGiven: 100, frequency: "one-time", lastGift: "2024-06-01", sample: "fictional, deidentified observation" }],
  [{ totalGiven: 2400, frequency: "monthly", lastGift: "2026-09-01", sample: "fictional, deidentified observation" }, { totalGiven: 600, frequency: "annual", lastGift: "2025-12-01", sample: "fictional, deidentified observation" }],
];

function NativeToolForm({ tool }: { tool: typeof tools[number] }) {
  const fullAIExamples = useFullAIExamples();

  const [values, setValues] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [history, setHistory] = useState<SavedProposal[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [selectedHistory, setSelectedHistory] = useState<number | null>(null);
  const request = useNativeAIRequest<any>();
  async function loadHistory() {
    try {
      const response = await apiRequest("GET", "/api/ai/proposal-history");
      setHistory(recordRows<SavedProposal>(await response.json()));
      setHistoryError("");
    } catch { setHistoryError("Saved proposals could not be loaded."); }
  }
  useEffect(() => { if (tool.id === "proposal-draft") void loadHistory(); }, [tool.id]);
  useEffect(() => {
    if (tool.id !== "match-donation") return;
    const controller = new AbortController(); setReferenceLoading(true);
    apiRequest("GET", "/api/projects?limit=30&status=approved", undefined, controller.signal)
      .then(response => response.json()).then(data => { if (!controller.signal.aborted) setProjects(recordRows(data)); })
      .catch(() => { if (!controller.signal.aborted) request.setStatus("Saved projects could not be loaded. Enter authorized existing project data before matching."); })
      .finally(() => { if (!controller.signal.aborted) setReferenceLoading(false); });
    return () => controller.abort();
  }, [tool.id]);

  function fill(index: number) {
    let next: Record<string, string>;
    if (tool.id === "proposal-draft") next = proposalExamples[index];
    else if (tool.id === "segment-donors") next = { donors: JSON.stringify(donorExamples[index], null, 2), criteria: ["Compare recurring support and lapse patterns; identify uncertainty", "Describe engagement needs without inferring sensitive traits", "Compare gift frequency and recency; suggest reviewable outreach ideas"][index] };
    else {
      const preferences = { interests: ["education", "food security", "youth development"][index], region: "No confirmed regional restriction", example: "Fictional donor preferences for editable planning" };
      let supplied = [];
      try { const parsed = JSON.parse(values.projects || "[]"); if (Array.isArray(parsed) && parsed.every(project => project.id)) supplied = parsed; } catch { /* Use the authorized list instead. */ }
      const candidates = supplied.length ? supplied : projects.map(project => ({ id: project.id, title: project.title, category: project.category, description: project.description }));
      next = { donor: JSON.stringify(preferences, null, 2), projects: JSON.stringify(candidates, null, 2) };
    }
    setValues(next); request.clear();
    request.setStatus(tool.id === "match-donation" && next.projects === "[]" ? "The preference input is filled. Select or supply an existing saved project before matching; no example project IDs were created." : "Every input is filled, including optional fields. Review the example before generating with OpenRouter.");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await request.run(async signal => {
      const payload: Record<string, any> = {};
      for (const field of tool.fields) {
        const value = values[field.name] || "";
        if (field.required && !value.trim()) throw new Error(`${field.label} is required.`);
        if (field.json) {
          try { payload[field.name] = JSON.parse(value); } catch { throw new Error(`${field.label} must contain valid JSON.`); }
        } else payload[field.name] = value;
      }
      if (tool.id === "segment-donors" && (!Array.isArray(payload.donors) || !payload.donors.length)) throw new Error("Provide at least one deidentified donor observation.");
      if (tool.id === "match-donation" && (!Array.isArray(payload.projects) || !payload.projects.length || payload.projects.some((project: any) => !project.id))) throw new Error("Provide existing saved candidate projects with their actual IDs.");
      const response = await apiRequest("POST", `/api/ai/${tool.id}`, payload, signal);
      return response.json();
    });
    if (tool.id === "proposal-draft") await loadHistory();
  }
  return <form onSubmit={submit} className="space-y-4" data-full-ai-workspace="NativeToolForm"><FullAIExamples controller={fullAIExamples} />
    <p className="text-sm text-neutral-600">Examples fill editable planning inputs. Saved project references use authorized records. Review every draft before taking action.</p>
    <div className="flex flex-wrap gap-2" aria-label="Complete examples">
      {exampleLabels.map((label, index) => <Button key={label} type="button" variant="outline" disabled={request.loading || referenceLoading} onClick={() => fill(index)}>Fill: {label}</Button>)}
    </div>
    {referenceLoading && <p role="status" className="text-sm">Loading saved project references…</p>}
    {tool.fields.map(field => <div key={field.name}>
      <Label htmlFor={`${tool.id}-${field.name}`}>{field.label}</Label>
      {field.multiline ? <Textarea id={`${tool.id}-${field.name}`} value={values[field.name] || ""} onChange={event => setValues({ ...values, [field.name]: event.target.value })} rows={field.json ? 8 : 5} disabled={request.loading} className="mt-1" data-full-ai-field={fullAIExamples.bind({ current: values[field.name] || "", change: event => setValues({ ...values, [field.name]: event.target.value }), label: "values[field.name]", manual: false, json: false }, "p1-8690", [(typeof field === 'object' ? (field as any)?.key ?? (field as any)?.name ?? (field as any)?.id ?? '' : field),field.name].join(":"))} />
        : <input id={`${tool.id}-${field.name}`} value={values[field.name] || ""} onChange={event => setValues({ ...values, [field.name]: event.target.value })} disabled={request.loading} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" data-full-ai-field={fullAIExamples.bind({ current: values[field.name] || "", change: event => setValues({ ...values, [field.name]: event.target.value }), label: "values[field.name]", manual: false, json: false }, "p1-8927", [(typeof field === 'object' ? (field as any)?.key ?? (field as any)?.name ?? (field as any)?.id ?? '' : field),field.name].join(":"))} />}
    </div>)}
    <div className="flex gap-3"><Button type="submit" disabled={request.loading}>{request.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{request.loading ? "Generating…" : "Generate with OpenRouter"}</Button>
      <Button type="button" variant="outline" onClick={() => { if (!request.loading) setValues({}); request.cancel(); }}>{request.loading ? "Cancel request" : "Cancel"}</Button></div>
    {request.status && <p role="status" className="text-sm text-neutral-600">{request.status}</p>}
    {request.error && <p role="alert" className="text-sm text-red-700">{request.error}</p>}
    {request.result && <Card className="mt-4"><CardContent className="pt-6"><NativeAIReport value={request.result} /></CardContent></Card>}
    {tool.id === "proposal-draft" && <section aria-label="Saved proposal history" className="space-y-3 border-t pt-5">
      <h3 className="font-semibold">Saved proposals</h3>
      {historyError && <p role="alert" className="text-sm text-red-700">{historyError}</p>}
      {!historyError && history.length === 0 && <p className="text-sm text-neutral-600">No saved proposals yet.</p>}
      {history.map(item => <div key={item.id} className="rounded-md border p-3">
        <Button type="button" variant="ghost" className="h-auto whitespace-normal text-left" onClick={() => setSelectedHistory(selectedHistory === item.id ? null : item.id)} aria-expanded={selectedHistory === item.id}>
          Proposal saved {new Date(item.createdAt).toLocaleString()}
        </Button>
        {selectedHistory === item.id && <NativeAIReport value={item.output} title="Saved proposal" />}
      </div>)}
    </section>}
  </form>;
}

export default function AITools() {
  return <div><AppHeader currentRole="ai-tools" /><div className="mx-auto max-w-5xl px-4 py-6">
    <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold"><Sparkles className="h-6 w-6" />AI Tools</h1>
    <p className="mb-6 text-sm text-neutral-600">Prepare grant proposals, donor analyses and project matching reports with OpenRouter.</p>
    <Tabs defaultValue="proposal-draft"><TabsList>{tools.map(tool => <TabsTrigger key={tool.id} value={tool.id}>{tool.label}</TabsTrigger>)}</TabsList>
      {tools.map(tool => <TabsContent key={tool.id} value={tool.id} className="mt-6"><Card><CardHeader><CardTitle>{tool.label}</CardTitle></CardHeader><CardContent><NativeToolForm tool={tool} /></CardContent></Card></TabsContent>)}
    </Tabs>
  </div></div>;
}
