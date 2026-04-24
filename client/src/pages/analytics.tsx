import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Users, Target, BarChart3 } from "lucide-react";
import AppHeader from "@/components/AppHeader";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface OverviewData {
  totalUsers: number;
  totalProjects: number;
  totalFundedAmount: number;
  activeProjects: number;
}

interface FundingOverTime {
  month: string;
  amount: number;
}

interface FundingByCategory {
  category: string;
  amount: number;
  projectCount: number;
}

interface StatusDistribution {
  status: string;
  count: number;
}

interface TopInvestor {
  name: string;
  totalInvested: number;
  projectCount: number;
}

interface TopProject {
  name: string;
  category: string;
  fundedAmount: number;
  goalAmount: number;
}

function formatCurrency(value: any): string {
  const num = Number(value);
  if (!num && num !== 0) return "$0";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toLocaleString()}`;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            <p className="text-3xl font-bold text-neutral-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-neutral-400">{subtitle}</p>
            )}
          </div>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 h-1 w-full"
          style={{ backgroundColor: color }}
        />
      </CardContent>
    </Card>
  );
}

function CustomTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-neutral-700">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" && entry.name?.toLowerCase().includes("amount")
            ? formatCurrency(entry.value)
            : entry.value?.toLocaleString?.() ?? entry.value}
        </p>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 rounded bg-neutral-200" />
          <div className="h-8 w-32 rounded bg-neutral-200" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-neutral-200" />
          <div className="h-64 w-full rounded bg-neutral-100" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("funding");

  const { data: overview, isLoading: overviewLoading } = useQuery<OverviewData>({
    queryKey: ["/api/analytics/overview"],
  });

  const { data: fundingOverTime, isLoading: fundingLoading } = useQuery<FundingOverTime[]>({
    queryKey: ["/api/analytics/funding-over-time"],
  });

  const { data: fundingByCategory, isLoading: categoryLoading } = useQuery<FundingByCategory[]>({
    queryKey: ["/api/analytics/funding-by-category"],
  });

  const { data: statusDistribution, isLoading: statusLoading } = useQuery<StatusDistribution[]>({
    queryKey: ["/api/analytics/status-distribution"],
  });

  const { data: topInvestors, isLoading: investorsLoading } = useQuery<TopInvestor[]>({
    queryKey: ["/api/analytics/top-investors"],
  });

  const { data: topProjects, isLoading: projectsLoading } = useQuery<TopProject[]>({
    queryKey: ["/api/analytics/top-projects"],
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader currentRole="investor" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page heading */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Analytics Dashboard</h1>
              <p className="text-sm text-neutral-500">
                Platform performance and funding insights
              </p>
            </div>
          </div>
        </div>

        {/* Overview stat cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                title="Total Users"
                value={(overview?.totalUsers ?? 0).toLocaleString()}
                icon={Users}
                color={CHART_COLORS[0]}
                subtitle="Registered accounts"
              />
              <StatCard
                title="Total Projects"
                value={(overview?.totalProjects ?? 0).toLocaleString()}
                icon={Target}
                color={CHART_COLORS[1]}
                subtitle="Submitted proposals"
              />
              <StatCard
                title="Total Funded"
                value={formatCurrency(overview?.totalFundedAmount ?? 0)}
                icon={DollarSign}
                color={CHART_COLORS[2]}
                subtitle="Capital deployed"
              />
              <StatCard
                title="Active Projects"
                value={(overview?.activeProjects ?? 0).toLocaleString()}
                icon={TrendingUp}
                color={CHART_COLORS[4]}
                subtitle="Currently in progress"
              />
            </>
          )}
        </div>

        {/* Chart tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="funding">Funding Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* ---- Funding Trends ---- */}
          <TabsContent value="funding" className="space-y-6">
            {fundingLoading ? (
              <ChartSkeleton />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Monthly Funding Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={fundingOverTime ?? []}
                        margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          tickLine={false}
                          axisLine={{ stroke: "#e5e7eb" }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          tickFormatter={(v) => formatCurrency(v)}
                          tickLine={false}
                          axisLine={{ stroke: "#e5e7eb" }}
                        />
                        <Tooltip content={<CustomTooltipContent />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          name="Funding Amount"
                          stroke={CHART_COLORS[0]}
                          strokeWidth={3}
                          dot={{ r: 4, fill: CHART_COLORS[0], strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 6, fill: CHART_COLORS[0], strokeWidth: 2, stroke: "#fff" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ---- Categories ---- */}
          <TabsContent value="categories" className="space-y-6">
            {categoryLoading ? (
              <>
                <ChartSkeleton />
                <ChartSkeleton />
              </>
            ) : (
              <>
                {/* Pie chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5 text-emerald-500" />
                      Funding by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={fundingByCategory ?? []}
                            dataKey="amount"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            innerRadius={60}
                            paddingAngle={3}
                            label={({ category, percent }) =>
                              `${category} (${(percent * 100).toFixed(0)}%)`
                            }
                            labelLine={{ stroke: "#9ca3af" }}
                          >
                            {(fundingByCategory ?? []).map((_entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Bar chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-violet-500" />
                      Projects &amp; Funding by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={fundingByCategory ?? []}
                          margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="category"
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                            tickLine={false}
                            axisLine={{ stroke: "#e5e7eb" }}
                          />
                          <YAxis
                            yAxisId="amount"
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                            tickFormatter={(v) => formatCurrency(v)}
                            tickLine={false}
                            axisLine={{ stroke: "#e5e7eb" }}
                          />
                          <YAxis
                            yAxisId="count"
                            orientation="right"
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                            tickLine={false}
                            axisLine={{ stroke: "#e5e7eb" }}
                          />
                          <Tooltip content={<CustomTooltipContent />} />
                          <Legend />
                          <Bar
                            yAxisId="amount"
                            dataKey="amount"
                            name="Funding Amount"
                            fill={CHART_COLORS[0]}
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            yAxisId="count"
                            dataKey="projectCount"
                            name="Project Count"
                            fill={CHART_COLORS[1]}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ---- Status ---- */}
          <TabsContent value="status" className="space-y-6">
            {statusLoading ? (
              <ChartSkeleton />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-amber-500" />
                    Project Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution ?? []}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={140}
                          innerRadius={70}
                          paddingAngle={3}
                          label={({ status, count }) => `${status}: ${count}`}
                          labelLine={{ stroke: "#9ca3af" }}
                        >
                          {(statusDistribution ?? []).map((_entry, index) => (
                            <Cell
                              key={`status-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Status summary badges */}
                  <div className="mt-4 flex flex-wrap gap-3 justify-center">
                    {(statusDistribution ?? []).map((item, index) => (
                      <Badge
                        key={item.status}
                        variant="outline"
                        className="px-3 py-1.5 text-sm font-medium"
                        style={{
                          borderColor: CHART_COLORS[index % CHART_COLORS.length],
                          color: CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      >
                        {item.status}: {item.count}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ---- Leaderboard ---- */}
          <TabsContent value="leaderboard" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Top Investors */}
              {investorsLoading ? (
                <ChartSkeleton />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5 text-blue-500" />
                      Top Investors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-neutral-200 bg-neutral-50">
                            <th className="px-6 py-3 text-left font-semibold text-neutral-600">
                              Rank
                            </th>
                            <th className="px-6 py-3 text-left font-semibold text-neutral-600">
                              Investor
                            </th>
                            <th className="px-6 py-3 text-right font-semibold text-neutral-600">
                              Total Invested
                            </th>
                            <th className="px-6 py-3 text-right font-semibold text-neutral-600">
                              Projects
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {(topInvestors ?? []).map((investor, index) => (
                            <tr
                              key={investor.name}
                              className="hover:bg-neutral-50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div
                                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                                  style={{
                                    backgroundColor:
                                      index < 3
                                        ? CHART_COLORS[index]
                                        : "#9ca3af",
                                  }}
                                >
                                  {index + 1}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-medium text-neutral-900">
                                {investor.name}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold text-neutral-900">
                                {formatCurrency(investor.totalInvested)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Badge variant="secondary">
                                  {investor.projectCount}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {(!topInvestors || topInvestors.length === 0) && (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-6 py-8 text-center text-neutral-500"
                              >
                                No investor data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Projects */}
              {projectsLoading ? (
                <ChartSkeleton />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-emerald-500" />
                      Top Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-neutral-200 bg-neutral-50">
                            <th className="px-6 py-3 text-left font-semibold text-neutral-600">
                              Rank
                            </th>
                            <th className="px-6 py-3 text-left font-semibold text-neutral-600">
                              Project
                            </th>
                            <th className="px-6 py-3 text-left font-semibold text-neutral-600">
                              Category
                            </th>
                            <th className="px-6 py-3 text-right font-semibold text-neutral-600">
                              Funded
                            </th>
                            <th className="px-6 py-3 text-right font-semibold text-neutral-600">
                              Progress
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {(topProjects ?? []).map((project, index) => {
                            const progress =
                              project.goalAmount > 0
                                ? Math.min(
                                    100,
                                    Math.round(
                                      (project.fundedAmount / project.goalAmount) * 100
                                    )
                                  )
                                : 0;
                            return (
                              <tr
                                key={project.name}
                                className="hover:bg-neutral-50 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <div
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                                    style={{
                                      backgroundColor:
                                        index < 3
                                          ? CHART_COLORS[index]
                                          : "#9ca3af",
                                    }}
                                  >
                                    {index + 1}
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-neutral-900">
                                  {project.name}
                                </td>
                                <td className="px-6 py-4">
                                  <Badge variant="outline">{project.category}</Badge>
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-neutral-900">
                                  {formatCurrency(project.fundedAmount)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="h-2 w-20 overflow-hidden rounded-full bg-neutral-200">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${progress}%`,
                                          backgroundColor:
                                            progress >= 100
                                              ? CHART_COLORS[1]
                                              : progress >= 50
                                              ? CHART_COLORS[2]
                                              : CHART_COLORS[0],
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs font-medium text-neutral-600 w-10 text-right">
                                      {progress}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {(!topProjects || topProjects.length === 0) && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-6 py-8 text-center text-neutral-500"
                              >
                                No project data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
