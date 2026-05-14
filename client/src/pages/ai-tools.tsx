import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, FileText, Users, Heart } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { apiRequest } from "@/lib/queryClient";

type AIResult =
  | { ok: true; data: any }
  | { ok: false; error: string }
  | null;

function ResultBlock({ result }: { result: AIResult }) {
  if (!result) return null;
  if (!result.ok) {
    return (
      <Card className="mt-4 border-error/40">
        <CardContent className="pt-6 text-error text-sm">{result.error}</CardContent>
      </Card>
    );
  }
  const data = result.data;
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Result
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap text-xs bg-neutral-50 p-3 rounded-md overflow-auto max-h-[480px]">
          {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

function ProposalDraftTab() {
  const [grantTitle, setGrantTitle] = useState("");
  const [funder, setFunder] = useState("");
  const [programDescription, setProgramDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await apiRequest("POST", "/api/ai/proposal-draft", {
        grantTitle,
        funder,
        programDescription,
        budget,
        outcomes,
      });
      const data = await res.json();
      setResult({ ok: true, data });
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="grantTitle">Grant Title</Label>
        <input
          id="grantTitle"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={grantTitle}
          onChange={(e) => setGrantTitle(e.target.value)}
          placeholder="e.g., Community Health Outreach 2026"
        />
      </div>
      <div>
        <Label htmlFor="funder">Funder</Label>
        <input
          id="funder"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={funder}
          onChange={(e) => setFunder(e.target.value)}
          placeholder="e.g., Robert Wood Johnson Foundation"
        />
      </div>
      <div>
        <Label htmlFor="programDescription">Program Description</Label>
        <Textarea
          id="programDescription"
          className="mt-1"
          value={programDescription}
          onChange={(e) => setProgramDescription(e.target.value)}
          rows={5}
          placeholder="Describe the program, target population, and approach..."
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="budget">Budget</Label>
          <input
            id="budget"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g., $250,000 over 18 months"
          />
        </div>
        <div>
          <Label htmlFor="outcomes">Expected Outcomes</Label>
          <input
            id="outcomes"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={outcomes}
            onChange={(e) => setOutcomes(e.target.value)}
            placeholder="e.g., Reach 500 families, 80% improvement..."
          />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
        {loading ? "Drafting..." : "Draft Proposal"}
      </Button>
      <ResultBlock result={result} />
    </form>
  );
}

function SegmentDonorsTab() {
  const [donors, setDonors] = useState(
    JSON.stringify(
      [
        { id: "d1", name: "Jane Doe", totalGiven: 5400, frequency: "monthly", lastGift: "2026-04-15" },
        { id: "d2", name: "John Smith", totalGiven: 250, frequency: "annual", lastGift: "2024-11-02" },
      ],
      null,
      2
    )
  );
  const [criteria, setCriteria] = useState("Identify high-LTV monthly donors and lapsed major givers");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(donors);
      } catch {
        setResult({ ok: false, error: "Donors must be valid JSON" });
        setLoading(false);
        return;
      }
      const res = await apiRequest("POST", "/api/ai/segment-donors", {
        donors: parsed,
        criteria,
      });
      const data = await res.json();
      setResult({ ok: true, data });
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="criteria">Segmentation Criteria</Label>
        <input
          id="criteria"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="donors">Donors (JSON)</Label>
        <Textarea
          id="donors"
          className="mt-1 font-mono text-xs"
          value={donors}
          onChange={(e) => setDonors(e.target.value)}
          rows={10}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
        {loading ? "Segmenting..." : "Segment Donors"}
      </Button>
      <ResultBlock result={result} />
    </form>
  );
}

function MatchDonationTab() {
  const [donor, setDonor] = useState(
    JSON.stringify({ id: "d1", interests: ["education", "youth"], region: "Midwest" }, null, 2)
  );
  const [projects, setProjects] = useState(
    JSON.stringify(
      [
        { id: "p1", title: "After-school STEM", topics: ["education", "youth"], region: "Midwest" },
        { id: "p2", title: "Senior Meal Delivery", topics: ["food security", "elderly"], region: "South" },
      ],
      null,
      2
    )
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      let donorParsed: any, projectsParsed: any;
      try {
        donorParsed = JSON.parse(donor);
      } catch {
        setResult({ ok: false, error: "Donor must be valid JSON" });
        setLoading(false);
        return;
      }
      try {
        projectsParsed = JSON.parse(projects);
      } catch {
        setResult({ ok: false, error: "Projects must be valid JSON" });
        setLoading(false);
        return;
      }
      const res = await apiRequest("POST", "/api/ai/match-donation", {
        donor: donorParsed,
        projects: projectsParsed,
      });
      const data = await res.json();
      setResult({ ok: true, data });
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="donor">Donor (JSON)</Label>
        <Textarea
          id="donor"
          className="mt-1 font-mono text-xs"
          value={donor}
          onChange={(e) => setDonor(e.target.value)}
          rows={6}
        />
      </div>
      <div>
        <Label htmlFor="projects">Candidate Projects (JSON array)</Label>
        <Textarea
          id="projects"
          className="mt-1 font-mono text-xs"
          value={projects}
          onChange={(e) => setProjects(e.target.value)}
          rows={10}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Heart className="h-4 w-4 mr-2" />}
        {loading ? "Matching..." : "Match Donation"}
      </Button>
      <ResultBlock result={result} />
    </form>
  );
}

export default function AITools() {
  return (
    <div>
      <AppHeader currentRole="ai-tools" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> AI Tools
          </h1>
          <p className="text-sm text-neutral-600">
            Draft proposals, segment donors, and match donations to projects with AI assistance.
          </p>
        </div>

        <Tabs defaultValue="proposal" className="w-full">
          <TabsList>
            <TabsTrigger value="proposal">Proposal Draft</TabsTrigger>
            <TabsTrigger value="segment">Segment Donors</TabsTrigger>
            <TabsTrigger value="match">Match Donation</TabsTrigger>
          </TabsList>
          <TabsContent value="proposal" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Grant Proposal Drafting</CardTitle>
              </CardHeader>
              <CardContent>
                <ProposalDraftTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="segment" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Donor Segmentation</CardTitle>
              </CardHeader>
              <CardContent>
                <SegmentDonorsTab />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="match" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Donation Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <MatchDonationTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
