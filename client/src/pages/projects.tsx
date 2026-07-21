import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import SearchBar from "@/components/SearchBar";
import FilterControls from "@/components/FilterControls";
import PaginationControls from "@/components/PaginationControls";
import BulkActionBar from "@/components/BulkActionBar";
import DetailSheet from "@/components/DetailSheet";
import ProjectCardSkeleton from "@/components/skeletons/ProjectCardSkeleton";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import { downloadCSV } from "@/lib/exportUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Projects() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { page, limit, goToPage, resetPage } = usePagination(12);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const debouncedSearch = useDebounce(searchTerm);
  const bulk = useBulkSelect<number>();

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(categoryFilter !== "all" && { category: categoryFilter }),
    ...(priorityFilter !== "all" && { priority: priorityFilter }),
    sortBy,
    sortOrder,
  }).toString();

  const { data: result, isLoading } = useQuery<any>({
    queryKey: [`/api/projects?${queryParams}`],
  });

  const projects = result?.data || [];
  const totalPages = result?.totalPages || 1;

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return await apiRequest("DELETE", "/api/projects/bulk", { ids });
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Selected projects deleted." });
      bulk.deselectAll();
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete projects.", variant: "destructive" });
    },
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

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    resetPage();
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader currentRole="projects" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">All Projects</h1>
            <p className="text-neutral-600">Browse and discover community funding projects</p>
          </div>
          <Button
            variant="outline"
            onClick={() => downloadCSV("/api/export/projects/csv", "projects.csv").catch(() =>
              toast({ title: "Error", description: "Export failed.", variant: "destructive" })
            )}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <SearchBar value={searchTerm} onChange={handleSearchChange} placeholder="Search projects..." />
              <FilterControls
                statusFilter={statusFilter}
                onStatusChange={handleFilterChange(setStatusFilter)}
                categoryFilter={categoryFilter}
                onCategoryChange={handleFilterChange(setCategoryFilter)}
                priorityFilter={priorityFilter}
                onPriorityChange={handleFilterChange(setPriorityFilter)}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
              />
            </div>
          </CardContent>
        </Card>

        <BulkActionBar
          selectedCount={bulk.selectedCount}
          onDeselectAll={bulk.deselectAll}
          onDelete={() => bulkDeleteMutation.mutate(bulk.selectedIds)}
          isDeleting={bulkDeleteMutation.isPending}
        />

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">No projects found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={bulk.isSelected(project.id)}
                        onCheckedChange={() => bulk.toggle(project.id)}
                        className="mt-1"
                      />
                      <div>
                        <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                        <Badge className={`capitalize ${getStatusColor(project.status)}`}>
                          {project.status}
                        </Badge>
                      </div>
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
                    {project.fundingStatus && project.fundingStatus.total > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Funded:</span>
                        <span className="font-medium text-success">
                          ${project.fundingStatus.total?.toLocaleString() || 0}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <PaginationControls page={page} totalPages={totalPages} onPageChange={goToPage} />

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
