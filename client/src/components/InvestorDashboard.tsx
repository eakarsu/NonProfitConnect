import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Target, TrendingUp, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function InvestorDashboard() {
  const { toast } = useToast();
  const [investmentAmounts, setInvestmentAmounts] = useState<{ [key: number]: string }>({});

  const { data: stats = {} } = useQuery({
    queryKey: ["/api/stats/investor"],
  });

  const { data: approvedProjects = [] } = useQuery({
    queryKey: ["/api/projects/approved"],
  });

  const { data: myInvestments = [] } = useQuery({
    queryKey: ["/api/investments/user"],
  });

  const investMutation = useMutation({
    mutationFn: async ({ projectId, amount }: { projectId: number; amount: number }) => {
      await apiRequest("POST", "/api/investments", { projectId, amount });
    },
    onSuccess: () => {
      toast({
        title: "Investment Successful",
        description: "Your investment has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/approved"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investments/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/investor"] });
      setInvestmentAmounts({});
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Investment Failed",
        description: "Failed to process your investment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInvestment = (projectId: number) => {
    const amount = parseFloat(investmentAmounts[projectId] || "0");
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid investment amount.",
        variant: "destructive",
      });
      return;
    }
    investMutation.mutate({ projectId, amount });
  };

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const getRemainingDays = () => {
    // Placeholder - in real app, this would be calculated from project end date
    return Math.floor(Math.random() * 30) + 1;
  };

  const getInvestmentStatusColor = (status: string) => {
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

  return (
    <div>
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
                  ${Number(stats.totalInvested || 0).toLocaleString()}
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
                <p className="text-2xl font-bold text-success">{stats.activeProjects || 0}</p>
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
                <p className="text-sm font-medium text-neutral-600">Projects Available</p>
                <p className="text-2xl font-bold text-warning">{stats.availableProjects || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-neutral-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Communities Impacted</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.communitiesImpacted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Opportunities */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Investment Opportunities</CardTitle>
            <div className="flex items-center space-x-3">
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                Bulk Invest
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {approvedProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">No investment opportunities available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {approvedProjects.map((project: any) => {
                const raised = project.fundingStatus?.total || 0;
                const goal = project.fundingStatus?.goal || Number(project.requestedAmount);
                const progressPercentage = getProgressPercentage(raised, goal);
                
                return (
                  <div key={project.id} className="border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900 mb-2">{project.title}</h3>
                        <p className="text-sm text-neutral-600 mb-3">{project.description}</p>
                      </div>
                      <Badge className="bg-success text-white">
                        Approved
                      </Badge>
                    </div>
                    
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
                        <span className="text-neutral-600">Time Remaining:</span>
                        <span className="font-medium">{getRemainingDays()} days</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        placeholder="$500"
                        value={investmentAmounts[project.id] || ""}
                        onChange={(e) => setInvestmentAmounts(prev => ({
                          ...prev,
                          [project.id]: e.target.value
                        }))}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => handleInvestment(project.id)}
                        disabled={investMutation.isPending}
                      >
                        {investMutation.isPending ? "Investing..." : "Invest"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Investments */}
      <Card>
        <CardHeader>
          <CardTitle>My Investments</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {myInvestments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">You haven't made any investments yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myInvestments.map((investment: any) => (
                <div key={investment.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900">{investment.projectTitle}</h4>
                    <p className="text-sm text-neutral-600">
                      Invested: ${Number(investment.amount).toLocaleString()} on {new Date(investment.investedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={`capitalize ${getInvestmentStatusColor(investment.projectStatus)}`}>
                      {investment.projectStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
