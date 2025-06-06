import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, DollarSign, Target, User, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${id}`],
    enabled: !!id,
  });

  const { data: investments = [] } = useQuery({
    queryKey: [`/api/investments/project/${id}`],
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: [`/api/reviews/project/${id}`],
    enabled: !!id,
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ decision, comments }: { decision: 'approved' | 'rejected'; comments?: string }) => {
      return await apiRequest('POST', '/api/reviews', {
        projectId: parseInt(id!),
        decision,
        comments: comments || ''
      });
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Your review has been submitted successfully.",
      });
      // Refresh project data and reviews
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/project/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/approved'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Investment mutation
  const investmentMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      return await apiRequest('POST', '/api/investments', {
        projectId: parseInt(id!),
        amount
      });
    },
    onSuccess: () => {
      toast({
        title: "Investment Successful",
        description: "Your investment has been submitted successfully.",
      });
      setIsInvestmentModalOpen(false);
      setInvestmentAmount('');
      // Refresh investment data
      queryClient.invalidateQueries({ queryKey: [`/api/investments/project/${id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Investment Failed",
        description: error.message || "Failed to submit investment",
        variant: "destructive",
      });
    },
  });

  const handleInvestment = () => {
    const amount = parseFloat(investmentAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid investment amount.",
        variant: "destructive",
      });
      return;
    }
    investmentMutation.mutate({ amount });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <AppHeader currentRole="project-details" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
            <div className="h-64 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <AppHeader currentRole="project-details" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900">Project Not Found</h1>
            <p className="text-neutral-600 mt-2">The project you're looking for doesn't exist.</p>
            <Link href="/projects">
              <Button className="mt-4">Back to Projects</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning text-white";
      case "approved":
        return "bg-success text-white";
      case "rejected":
        return "bg-error text-white";
      case "funded":
        return "bg-primary text-white";
      case "completed":
        return "bg-success text-white";
      default:
        return "bg-neutral-200 text-neutral-900";
    }
  };

  // Use funding status from project data if available, otherwise calculate from investments
  const totalInvestment = project.fundingStatus?.total || investments.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
  const goalAmount = project.fundingStatus?.goal || Number(project.requestedAmount);
  const progressPercentage = Math.min((totalInvestment / goalAmount) * 100, 100);

  // Check if current user has already invested in this project
  const userInvestment = investments.find((inv: any) => inv.investorId === user?.id);
  const hasInvested = !!userInvestment;
  
  // Check if project is fully funded
  const isFullyFunded = totalInvestment >= goalAmount;

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader currentRole="project-details" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/projects">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">{project.title}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <Badge className={`capitalize ${getStatusColor(project.status)}`}>
                  {project.status}
                </Badge>
                {project.priority === "high" && (
                  <Badge className="bg-error text-white">High Priority</Badge>
                )}
                <span className="text-neutral-600 text-sm">
                  Project #{project.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Description */}
            <Card>
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700 leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>

            {/* Funding Progress */}
            {project.status === "approved" || project.status === "funded" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Funding Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Goal:</span>
                      <span className="font-medium">${goalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Raised:</span>
                      <span className="font-medium text-success">${totalInvestment.toLocaleString()}</span>
                    </div>
                    <Progress value={progressPercentage} className="w-full" />
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Progress:</span>
                      <span className="font-medium">{Math.round(progressPercentage)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Recent Investments */}
            {investments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Investments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investments.slice(0, 5).map((investment: any) => (
                      <div key={investment.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm text-neutral-600">
                            Investment on {new Date(investment.investedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-medium text-success">
                          ${Number(investment.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border-l-4 border-primary pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={review.decision === "approved" ? "bg-success text-white" : "bg-error text-white"}>
                            {review.decision}
                          </Badge>
                          <span className="text-sm text-neutral-600">
                            {new Date(review.reviewedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-neutral-700 text-sm">{review.comments}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-neutral-600" />
                  <div>
                    <p className="text-sm text-neutral-600">Category</p>
                    <p className="font-medium capitalize">{project.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-neutral-600" />
                  <div>
                    <p className="text-sm text-neutral-600">Requested Amount</p>
                    <p className="font-medium">${Number(project.requestedAmount).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-neutral-600" />
                  <div>
                    <p className="text-sm text-neutral-600">Timeline</p>
                    <p className="font-medium">{project.timeline}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-neutral-600" />
                  <div>
                    <p className="text-sm text-neutral-600">Submitted</p>
                    <p className="font-medium">{new Date(project.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviewer Actions */}
            {project.status === "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-600 mb-4">
                      As a reviewer, you can approve or reject this project application.
                    </p>
                    <div className="flex space-x-3">
                      <Button 
                        className="flex-1 bg-success hover:bg-success/90"
                        disabled={reviewMutation.isPending}
                        onClick={() => {
                          reviewMutation.mutate({ decision: 'approved', comments: 'Project approved by reviewer' });
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {reviewMutation.isPending ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        disabled={reviewMutation.isPending}
                        onClick={() => {
                          reviewMutation.mutate({ decision: 'rejected', comments: 'Project rejected by reviewer' });
                        }}
                      >
                        {reviewMutation.isPending ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Investment Actions */}
            {project.status === "approved" && (
              <Card>
                <CardHeader>
                  <CardTitle>Take Action</CardTitle>
                </CardHeader>
                <CardContent>
                  {isFullyFunded ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-primary mr-2" />
                        <span className="text-primary font-medium">Project Fully Funded</span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-neutral-600">This project has reached its funding goal</p>
                        <p className="text-lg font-bold text-primary">
                          ${totalInvestment.toLocaleString()} / ${goalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : hasInvested ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center p-4 bg-success/10 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-success mr-2" />
                        <span className="text-success font-medium">You've invested in this project</span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-neutral-600">Your investment:</p>
                        <p className="text-lg font-bold text-success">
                          ${Number(userInvestment.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Invested on {new Date(userInvestment.investedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Dialog open={isInvestmentModalOpen} onOpenChange={setIsInvestmentModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Invest in Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invest in Project</DialogTitle>
                          <DialogDescription>
                            Enter the amount you would like to invest in this project.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="amount">Investment Amount ($)</Label>
                            <Input
                              id="amount"
                              type="number"
                              placeholder="Enter amount..."
                              value={investmentAmount}
                              onChange={(e) => setInvestmentAmount(e.target.value)}
                              min="1"
                              step="1"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setIsInvestmentModalOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              className="flex-1"
                              onClick={handleInvestment}
                              disabled={investmentMutation.isPending}
                            >
                              {investmentMutation.isPending ? 'Processing...' : 'Invest'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}