import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Target, Calendar, ArrowUpRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";

export default function Investments() {
  const { data: myInvestments = [] } = useQuery({
    queryKey: ["/api/investments/user"],
  });

  const { data: approvedProjects = [] } = useQuery({
    queryKey: ["/api/projects/approved"],
  });

  const { data: investorStats = {} } = useQuery({
    queryKey: ["/api/stats/investor"],
  });

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "funded":
      case "completed":
        return "bg-success text-white";
      case "approved":
        return "bg-primary text-white";
      default:
        return "bg-warning text-white";
    }
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const InvestmentCard = ({ investment }: { investment: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{investment.projectTitle}</CardTitle>
            <Badge className={`capitalize ${getProjectStatusColor(investment.projectStatus)}`}>
              {investment.projectStatus}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              ${Number(investment.amount).toLocaleString()}
            </p>
            <p className="text-sm text-neutral-600">Your Investment</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-neutral-600">Investment Date:</span>
            <p className="font-medium">{new Date(investment.investedAt).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-neutral-600">Project ID:</span>
            <p className="font-medium">#{investment.projectId}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
          <div className="text-xs text-neutral-500">
            Investment #{investment.id}
          </div>
          <Button variant="outline" size="sm">
            View Project Details
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const OpportunityCard = ({ project }: { project: any }) => {
    const raised = project.fundingStatus?.total || 0;
    const goal = project.fundingStatus?.goal || Number(project.requestedAmount);
    const progressPercentage = getProgressPercentage(raised, goal);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
              <Badge className="bg-success text-white">Approved</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600 text-sm mb-4">{project.description}</p>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Funding Goal:</span>
              <span className="font-medium">${goal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Raised So Far:</span>
              <span className="font-medium text-success">${raised.toLocaleString()}</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Progress:</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-neutral-600">Category:</span>
              <p className="font-medium capitalize">{project.category}</p>
            </div>
            <div>
              <span className="text-neutral-600">Timeline:</span>
              <p className="font-medium">{project.timeline}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            <Button size="sm">
              Invest Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader currentRole="investments" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Investments</h1>
          <p className="text-neutral-600">Track your investments and discover new opportunities</p>
        </div>

        {/* Investment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Total Invested</p>
                  <p className="text-2xl font-bold text-primary">
                    ${Number(investorStats.totalInvested || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-success" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Active Projects</p>
                  <p className="text-2xl font-bold text-success">{investorStats.activeProjects || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-warning" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Available Opportunities</p>
                  <p className="text-2xl font-bold text-warning">{investorStats.availableProjects || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-neutral-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600">Communities Impacted</p>
                  <p className="text-2xl font-bold text-neutral-900">{investorStats.communitiesImpacted || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="my-investments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-investments">My Investments</TabsTrigger>
            <TabsTrigger value="opportunities">Investment Opportunities</TabsTrigger>
          </TabsList>

          <TabsContent value="my-investments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Investment Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                {myInvestments.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600 mb-4">You haven't made any investments yet.</p>
                    <Button>Explore Opportunities</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {myInvestments.map((investment: any) => (
                      <InvestmentCard key={investment.id} investment={investment} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Available Investment Opportunities</CardTitle>
                  <Badge variant="outline" className="bg-success text-white">
                    {approvedProjects.length} Available
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {approvedProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600">No investment opportunities available at this time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {approvedProjects.map((project: any) => (
                      <OpportunityCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}