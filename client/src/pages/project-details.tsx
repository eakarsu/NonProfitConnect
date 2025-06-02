import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, DollarSign, Target, User } from "lucide-react";
import { Link } from "wouter";
import AppHeader from "@/components/AppHeader";

export default function ProjectDetails() {
  const { id } = useParams();
  
  const { data: project, isLoading } = useQuery({
    queryKey: ["/api/projects", id],
    enabled: !!id,
  });

  const { data: investments = [] } = useQuery({
    queryKey: ["/api/investments/project", id],
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/reviews/project", id],
    enabled: !!id,
  });

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

  const totalInvestment = investments.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
  const goalAmount = Number(project.requestedAmount);
  const progressPercentage = Math.min((totalInvestment / goalAmount) * 100, 100);

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

            {/* Action Buttons */}
            {project.status === "approved" && (
              <Card>
                <CardHeader>
                  <CardTitle>Take Action</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Invest in Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}