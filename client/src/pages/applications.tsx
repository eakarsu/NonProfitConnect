import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, CheckCircle, XCircle, DollarSign, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import SearchBar from "@/components/SearchBar";
import { useDebounce } from "@/hooks/useDebounce";
import DetailSheet from "@/components/DetailSheet";

export default function Applications() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const debouncedSearch = useDebounce(searchTerm);

  const { data: userProjects = [] } = useQuery<any>({
    queryKey: ["/api/projects/user"],
  });

  const { data: pendingProjects = [] } = useQuery<any>({
    queryKey: ["/api/projects/pending"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-warning text-white";
      case "approved": return "bg-success text-white";
      case "rejected": return "bg-error text-white";
      case "funded": return "bg-primary text-white";
      case "completed": return "bg-success text-white";
      default: return "bg-neutral-200 text-neutral-900";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      case "funded": return <DollarSign className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filterProjects = (projects: any[]) => {
    if (!debouncedSearch) return projects;
    return projects.filter((p: any) =>
      p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  };

  const ApplicationCard = ({ project, showApplicant = false }: { project: any; showApplicant?: boolean }) => (
    <Card
      key={project.id}
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={`inline-flex items-center gap-1 capitalize ${getStatusColor(project.status)}`}>
                {getStatusIcon(project.status)}
                {project.status}
              </Badge>
              {project.priority === "high" && (
                <Badge className="bg-error text-white">High Priority</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-neutral-600 text-sm mb-4">{project.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-neutral-600">Category:</span>
            <p className="font-medium capitalize">{project.category}</p>
          </div>
          <div>
            <span className="text-neutral-600">Requested:</span>
            <p className="font-medium">${Number(project.requestedAmount).toLocaleString()}</p>
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

        <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
          <div className="text-xs text-neutral-500">
            Application #{project.id}
          </div>
          <div className="space-x-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" onClick={() => setSelectedProject(project)}>
              <Eye className="h-3 w-3 mr-1" />
              Quick View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader currentRole="applications" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Applications</h1>
          <p className="text-neutral-600">Manage and track project applications</p>
        </div>

        <div className="mb-6">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search applications..." />
        </div>

        <Tabs defaultValue="my-applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-applications">My Applications</TabsTrigger>
            <TabsTrigger value="all-applications">All Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="my-applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Submitted Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {filterProjects(userProjects).length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600 mb-4">
                      {searchTerm ? "No applications match your search." : "You haven't submitted any applications yet."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filterProjects(userProjects).map((project: any) => (
                      <ApplicationCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-applications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Applications Requiring Review</CardTitle>
                  <Badge variant="outline" className="bg-warning text-white">
                    {pendingProjects.length} Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {filterProjects(pendingProjects).length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                    <p className="text-neutral-600">
                      {searchTerm ? "No applications match your search." : "All applications have been reviewed."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filterProjects(pendingProjects).map((project: any) => (
                      <ApplicationCard key={project.id} project={project} showApplicant={true} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DetailSheet
          project={selectedProject}
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          canEdit={selectedProject?.userId === user?.id}
          canDelete={selectedProject?.userId === user?.id}
        />
      </div>
    </div>
  );
}
