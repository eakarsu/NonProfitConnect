import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, CheckCircle, XCircle, Clock } from "lucide-react";
import ReviewModal from "./ReviewModal";

export default function ReviewerDashboard() {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const { data: stats = {} } = useQuery({
    queryKey: ["/api/stats/reviewer"],
  });

  const { data: pendingProjects = [] } = useQuery({
    queryKey: ["/api/projects/pending"],
  });

  const handleReviewClick = (project: any) => {
    setSelectedProject(project);
    setIsReviewModalOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-error bg-red-50";
      case "medium":
        return "border-warning bg-yellow-50";
      case "low":
        return "border-neutral-200 bg-white";
      default:
        return "border-neutral-200 bg-white";
    }
  };

  const getDaysAgo = (date: string) => {
    const now = new Date();
    const submitted = new Date(date);
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div>
      {/* Reviewer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardList className="h-8 w-8 text-warning" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-warning">{stats.pendingReviews || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Approved This Month</p>
                <p className="text-2xl font-bold text-success">{stats.approvedThisMonth || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-error" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Rejected This Month</p>
                <p className="text-2xl font-bold text-error">{stats.rejectedThisMonth || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-neutral-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Avg Review Time</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.avgReviewTime || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Review Queue</CardTitle>
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
              <Select defaultValue="date">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="amount">Sort by Amount</SelectItem>
                  <SelectItem value="priority">Sort by Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {pendingProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">No pending reviews at this time.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingProjects.map((project: any) => (
                <div 
                  key={project.id} 
                  className={`border rounded-lg p-4 ${getPriorityColor(project.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {project.priority === "high" && (
                          <Badge className="bg-error text-white mr-3">
                            High Priority
                          </Badge>
                        )}
                        <span className="text-xs text-neutral-600">
                          Submitted {getDaysAgo(project.submittedAt)} days ago
                        </span>
                      </div>
                      <h3 className="font-semibold text-neutral-900 mb-2">{project.title}</h3>
                      <p className="text-sm text-neutral-600 mb-3">{project.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-neutral-600">Requested:</span>
                          <p className="font-medium">${Number(project.requestedAmount).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-neutral-600">Category:</span>
                          <p className="font-medium capitalize">{project.category}</p>
                        </div>
                        <div>
                          <span className="text-neutral-600">Timeline:</span>
                          <p className="font-medium">{project.timeline}</p>
                        </div>
                        <div>
                          <span className="text-neutral-600">Submitted:</span>
                          <p className="font-medium">{new Date(project.submittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <Button onClick={() => handleReviewClick(project)}>
                      Review Application
                    </Button>
                    <Button variant="outline">
                      Request Info
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewModal 
        isOpen={isReviewModalOpen}
        project={selectedProject}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedProject(null);
        }}
      />
    </div>
  );
}
