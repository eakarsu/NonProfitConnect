import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";

interface LeaderboardInvestor {
  rank: number;
  name: string;
  totalInvested: number;
  projectsFunded: number;
}

interface LeaderboardProject {
  rank: number;
  title: string;
  totalFunding: number;
  investorCount: number;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 ring-2 ring-yellow-300">
        <Trophy className="w-5 h-5" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500 ring-2 ring-gray-300">
        <Medal className="w-5 h-5" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-600 ring-2 ring-orange-300">
        <Award className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground text-sm font-semibold">
      {rank}
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function InvestorList({ investors }: { investors: LeaderboardInvestor[] }) {
  if (!investors || investors.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No investor data available yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {investors.map((investor, index) => {
        const rank = investor.rank ?? index + 1;
        return (
          <div
            key={index}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors hover:shadow-sm ${
              rank === 1
                ? "bg-yellow-50/60 border-yellow-200"
                : rank === 2
                  ? "bg-gray-50/60 border-gray-200"
                  : rank === 3
                    ? "bg-orange-50/60 border-orange-200"
                    : "bg-card"
            }`}
          >
            <RankBadge rank={rank} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{investor.name}</p>
              <p className="text-sm text-muted-foreground">
                {investor.projectsFunded} project
                {investor.projectsFunded !== 1 ? "s" : ""} funded
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-green-600">
                {formatCurrency(investor.totalInvested)}
              </p>
              <p className="text-xs text-muted-foreground">total invested</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectList({ projects }: { projects: LeaderboardProject[] }) {
  if (!projects || projects.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No project data available yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project, index) => {
        const rank = project.rank ?? index + 1;
        return (
          <div
            key={index}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors hover:shadow-sm ${
              rank === 1
                ? "bg-yellow-50/60 border-yellow-200"
                : rank === 2
                  ? "bg-gray-50/60 border-gray-200"
                  : rank === 3
                    ? "bg-orange-50/60 border-orange-200"
                    : "bg-card"
            }`}
          >
            <RankBadge rank={rank} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{project.title}</p>
              <p className="text-sm text-muted-foreground">
                {project.investorCount} investor
                {project.investorCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-green-600">
                {formatCurrency(project.totalFunding)}
              </p>
              <p className="text-xs text-muted-foreground">total funding</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const currentRole = (user as any)?.roles?.[0] || "applicant";

  const { data: investors = [], isLoading: investorsLoading } = useQuery<
    LeaderboardInvestor[]
  >({
    queryKey: ["/api/leaderboard/investors"],
    enabled: !!user,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<
    LeaderboardProject[]
  >({
    queryKey: ["/api/leaderboard/projects"],
    enabled: !!user,
  });

  const isLoading = investorsLoading || projectsLoading;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader currentRole={currentRole} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-muted-foreground mt-1">
              Top investors and most funded projects on the platform.
            </p>
          </div>
        </div>

        {/* Desktop: side by side */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top Investors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <InvestorList investors={investors} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Top Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <ProjectList projects={projects} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile: tabbed interface */}
        <div className="md:hidden">
          <Tabs defaultValue="investors">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="investors" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Top Investors
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Top Projects
              </TabsTrigger>
            </TabsList>

            <TabsContent value="investors">
              <Card>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : (
                    <InvestorList investors={investors} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects">
              <Card>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <LoadingSkeleton />
                  ) : (
                    <ProjectList projects={projects} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
