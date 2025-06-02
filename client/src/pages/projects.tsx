import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useState } from "react";
import AppHeader from "@/components/AppHeader";

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: allProjects = [] } = useQuery({
    queryKey: ["/api/projects/all"],
    enabled: false, // We'll implement this endpoint later
  });

  // For now, let's get approved projects as a sample
  const { data: approvedProjects = [] } = useQuery({
    queryKey: ["/api/projects/approved"],
  });

  const { data: pendingProjects = [] } = useQuery({
    queryKey: ["/api/projects/pending"],
  });

  // Combine different project lists for display
  const projects = [...approvedProjects, ...pendingProjects];

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

  const filteredProjects = projects.filter((project: any) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || project.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader currentRole="projects" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">All Projects</h1>
          <p className="text-neutral-600">Browse and discover community funding projects</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="funded">Funded</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="arts">Arts & Culture</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-neutral-600">No projects found matching your criteria.</p>
            </div>
          ) : (
            filteredProjects.map((project: any) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                      <Badge className={`capitalize ${getStatusColor(project.status)}`}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Category:</span>
                      <span className="font-medium capitalize">{project.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Requested:</span>
                      <span className="font-medium">${Number(project.requestedAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Timeline:</span>
                      <span className="font-medium">{project.timeline}</span>
                    </div>
                    {project.fundingStatus && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Funded:</span>
                        <span className="font-medium text-success">
                          ${project.fundingStatus.total?.toLocaleString() || 0}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}