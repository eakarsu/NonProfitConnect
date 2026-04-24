import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AIInsightPanelProps {
  projectId: number;
  type: "analysis" | "review" | "investment" | "summary";
  className?: string;
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return "text-green-600";
    if (s >= 60) return "text-yellow-600";
    if (s >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getBgColor = (s: number) => {
    if (s >= 80) return "bg-green-100";
    if (s >= 60) return "bg-yellow-100";
    if (s >= 40) return "bg-orange-100";
    return "bg-red-100";
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${getBgColor(score)}`}>
      <div className={`text-3xl font-bold ${getColor(score)}`}>{score}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-700">{label}</p>
        <Progress value={score} className="h-2 mt-1" />
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, { color: string; icon: any }> = {
    Low: { color: "bg-green-100 text-green-800 border-green-200", icon: Shield },
    Medium: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertTriangle },
    High: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle },
  };
  const { color, icon: Icon } = config[level] || config.Medium;

  return (
    <Badge className={`${color} border gap-1 font-medium`} variant="outline">
      <Icon className="h-3 w-3" />
      {level} Risk
    </Badge>
  );
}

function ListSection({ title, items, icon: Icon, variant = "default" }: {
  title: string;
  items: string[];
  icon: any;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantStyles = {
    default: "border-l-blue-400 bg-blue-50/50",
    success: "border-l-green-400 bg-green-50/50",
    warning: "border-l-yellow-400 bg-yellow-50/50",
    danger: "border-l-red-400 bg-red-50/50",
  };

  return (
    <div className={`border-l-4 rounded-r-lg p-4 ${variantStyles[variant]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-neutral-600" />
        <h4 className="font-semibold text-neutral-800">{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-neutral-400 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalysisView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ScoreGauge score={data.overallScore} label="Overall Score" />
        <div className="flex flex-col gap-2 p-3 bg-neutral-50 rounded-lg">
          <RiskBadge level={data.riskLevel} />
          <p className="text-sm text-neutral-600 mt-1">{data.fundingViability}</p>
        </div>
      </div>
      <p className="text-sm text-neutral-700 leading-relaxed bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
        {data.impactAssessment}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ListSection title="Strengths" items={data.strengths} icon={CheckCircle} variant="success" />
        <ListSection title="Weaknesses" items={data.weaknesses} icon={XCircle} variant="warning" />
      </div>
      <ListSection title="Recommendations" items={data.recommendations} icon={Target} variant="default" />
    </div>
  );
}

function ReviewView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-neutral-50 to-neutral-100">
        <div className={`p-3 rounded-full ${data.recommendation === "approve" ? "bg-green-100" : "bg-red-100"}`}>
          {data.recommendation === "approve" ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-lg capitalize">
            {data.recommendation === "approve" ? "Recommend Approval" : "Recommend Rejection"}
          </p>
          <p className="text-sm text-neutral-600">Confidence: {data.confidence}%</p>
          <Progress value={data.confidence} className="h-2 mt-1" />
        </div>
      </div>
      <p className="text-sm text-neutral-700 leading-relaxed bg-blue-50/50 p-4 rounded-lg">
        {data.summary}
      </p>
      <ListSection title="Detailed Feedback" items={data.detailedFeedback} icon={FileText} variant="default" />
      <ListSection title="Suggested Conditions" items={data.suggestedConditions} icon={Shield} variant="warning" />
      <ListSection title="Questions for Applicant" items={data.questionsForApplicant} icon={Target} variant="default" />
    </div>
  );
}

function InvestmentView({ data }: { data: any }) {
  const ratingColors: Record<string, string> = {
    "Strong Buy": "bg-green-600",
    "Buy": "bg-green-500",
    "Hold": "bg-yellow-500",
    "Pass": "bg-red-500",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 text-center">
          <Badge className={`${ratingColors[data.investmentRating] || "bg-neutral-500"} text-white text-sm px-3 py-1`}>
            {data.investmentRating}
          </Badge>
          <p className="text-xs text-neutral-500 mt-2">Investment Rating</p>
        </div>
        <ScoreGauge score={data.socialImpactScore} label="Social Impact" />
        <div className="p-3 bg-neutral-50 rounded-lg flex flex-col justify-center">
          <RiskBadge level={data.riskAssessment} />
          <p className="text-xs text-neutral-500 mt-2">
            Suggested: ${data.suggestedInvestmentRange?.min?.toLocaleString()} - ${data.suggestedInvestmentRange?.max?.toLocaleString()}
          </p>
        </div>
      </div>
      <p className="text-sm text-neutral-700 leading-relaxed bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
        {data.verdict}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ListSection title="Key Highlights" items={data.keyHighlights} icon={TrendingUp} variant="success" />
        <ListSection title="Concerns" items={data.concerns} icon={AlertTriangle} variant="warning" />
      </div>
      <ListSection title="Expected Impact" items={data.impactMetrics} icon={Target} variant="default" />
    </div>
  );
}

function SummaryView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.keyMetrics && data.keyMetrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.keyMetrics.map((metric: any, i: number) => (
            <div key={i} className="p-3 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg text-center">
              <p className="text-lg font-bold text-neutral-800">{metric.value}</p>
              <p className="text-xs text-neutral-500">{metric.label}</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">{data.executiveSummary}</p>
      </div>
      <div className="p-3 bg-neutral-50 rounded-lg">
        <h4 className="text-sm font-semibold text-neutral-700 mb-1">Status Overview</h4>
        <p className="text-sm text-neutral-600">{data.statusOverview}</p>
      </div>
      <p className="text-sm text-neutral-600 italic bg-green-50/50 p-3 rounded-lg">{data.stakeholderImpact}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ListSection title="Next Steps" items={data.nextSteps} icon={Target} variant="success" />
        <ListSection title="Risk Factors" items={data.riskFactors} icon={AlertTriangle} variant="warning" />
      </div>
    </div>
  );
}

const typeConfig = {
  analysis: {
    title: "AI Project Analysis",
    icon: Brain,
    endpoint: (id: number) => `/api/ai/analyze-project/${id}`,
    buttonLabel: "Analyze with AI",
    View: AnalysisView,
    gradient: "from-purple-500 to-indigo-600",
  },
  review: {
    title: "AI Review Suggestion",
    icon: Sparkles,
    endpoint: (id: number) => `/api/ai/review-suggestion/${id}`,
    buttonLabel: "Get AI Review",
    View: ReviewView,
    gradient: "from-blue-500 to-cyan-600",
  },
  investment: {
    title: "AI Investment Analysis",
    icon: TrendingUp,
    endpoint: (id: number) => `/api/ai/investment-analysis/${id}`,
    buttonLabel: "AI Investment Insight",
    View: InvestmentView,
    gradient: "from-green-500 to-emerald-600",
  },
  summary: {
    title: "AI Executive Summary",
    icon: FileText,
    endpoint: (id: number) => `/api/ai/project-summary/${id}`,
    buttonLabel: "Generate Summary",
    View: SummaryView,
    gradient: "from-orange-500 to-red-600",
  },
};

export default function AIInsightPanel({ projectId, type, className = "" }: AIInsightPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[type];
  const Icon = config.icon;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", config.endpoint(projectId));
      return await res.json();
    },
  });

  const handleClick = () => {
    if (!mutation.data && !mutation.isPending) {
      mutation.mutate();
    }
    setExpanded(!expanded);
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div
        className={`bg-gradient-to-r ${config.gradient} p-0.5`}
      >
        <CardHeader
          className="bg-white cursor-pointer hover:bg-neutral-50 transition-colors py-3"
          onClick={handleClick}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-neutral-700" />
              <CardTitle className="text-base">{config.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!mutation.data && !mutation.isPending && (
                <Button size="sm" variant="ghost" className="text-xs">
                  {config.buttonLabel}
                </Button>
              )}
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />}
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </CardHeader>
      </div>

      {expanded && (
        <CardContent className="pt-4">
          {mutation.isPending && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="relative">
                <Brain className="h-8 w-8 text-neutral-300" />
                <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <p className="text-sm text-neutral-500 animate-pulse">AI is analyzing...</p>
            </div>
          )}

          {mutation.isError && (
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
              <Button size="sm" variant="outline" onClick={() => mutation.mutate()} className="mt-2">
                Retry
              </Button>
            </div>
          )}

          {mutation.data && <config.View data={mutation.data} />}
        </CardContent>
      )}
    </Card>
  );
}
