import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, DollarSign, Plus, Book } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import ApplicationModal from "./ApplicationModal";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function ApplicantDashboard() {
  const { toast } = useToast();
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  const { data: stats = {} } = useQuery({
    queryKey: ["/api/stats/user"],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects/user"],
  });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 mr-1" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case "funded":
        return <DollarSign className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Applications</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalApplications || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-warning" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Pending</p>
                <p className="text-2xl font-bold text-warning">{stats.pendingApplications || 0}</p>
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
                <p className="text-sm font-medium text-neutral-600">Approved</p>
                <p className="text-2xl font-bold text-success">{stats.approvedApplications || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Funded</p>
                <p className="text-2xl font-bold text-primary">{stats.fundedApplications || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => setIsApplicationModalOpen(true)}
              className="flex items-center justify-center bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit New Application
            </Button>
            <Button variant="outline" className="flex items-center justify-center">
              <Book className="h-4 w-4 mr-2" />
              Application Guidelines
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Your Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">No applications yet. Create your first application to get started!</p>
              <Button 
                onClick={() => setIsApplicationModalOpen(true)}
                className="mt-4"
              >
                Submit Your First Application
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project: any) => (
                <div key={project.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 mb-2">{project.title}</h3>
                      <p className="text-sm text-neutral-600 mb-3">{project.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-neutral-600">
                        <span>Requested: ${Number(project.requestedAmount).toLocaleString()}</span>
                        <span>Submitted: {new Date(project.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Badge className={`inline-flex items-center capitalize ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        {project.status === "pending" ? "Pending Review" : project.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                    {project.status === "pending" && (
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ApplicationModal 
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
      />
    </div>
  );
}
