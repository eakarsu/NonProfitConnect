import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  Search,
  FolderOpen,
  Clock,
  Tag,
  Globe,
  LogIn,
} from "lucide-react";
import { useLocation } from "wouter";
import type { Project } from "@shared/schema";

const CATEGORIES = [
  "all",
  "education",
  "healthcare",
  "environment",
  "community",
  "technology",
  "arts",
  "social",
  "housing",
  "food",
  "infrastructure",
  "other",
];

function getStatusVariant(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "approved":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "funded":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "completed":
      return "bg-violet-100 text-violet-800 border-violet-200";
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-200";
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "education":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "healthcare":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "environment":
      return "bg-green-100 text-green-800 border-green-200";
    case "community":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "technology":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "arts":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "social":
      return "bg-pink-100 text-pink-800 border-pink-200";
    case "housing":
      return "bg-teal-100 text-teal-800 border-teal-200";
    case "food":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "infrastructure":
      return "bg-slate-100 text-slate-800 border-slate-200";
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-200";
  }
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export default function PublicGallery() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: rawData, isLoading, isError } = useQuery<Project[] | { data: Project[] }>({
    queryKey: ["/api/public/projects"],
    queryFn: async () => {
      const res = await fetch("/api/public/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const projects: Project[] = useMemo(() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray((rawData as any).data)) return (rawData as any).data;
    return [];
  }, [rawData]);

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (categoryFilter !== "all") {
      result = result.filter(
        (p) => p.category.toLowerCase() === categoryFilter.toLowerCase(),
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term),
      );
    }

    return result;
  }, [projects, categoryFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Public header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-neutral-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Globe className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                NonProfit Connect
              </span>
            </div>
            <Button onClick={() => navigate("/login")} variant="default">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Project Gallery
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Discover impactful nonprofit projects seeking funding. Browse
            community initiatives making a difference across education,
            healthcare, environment, and more.
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <Card className="shadow-lg border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search projects by title, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all"
                        ? "All Categories"
                        : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Results count */}
        {!isLoading && !isError && (
          <p className="text-sm text-neutral-500 mb-6">
            Showing {filteredProjects.length}{" "}
            {filteredProjects.length === 1 ? "project" : "projects"}
            {categoryFilter !== "all" && (
              <span>
                {" "}
                in{" "}
                <span className="font-medium capitalize">{categoryFilter}</span>
              </span>
            )}
            {searchTerm.trim() && (
              <span>
                {" "}
                matching{" "}
                <span className="font-medium">"{searchTerm}"</span>
              </span>
            )}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex gap-2 mb-3">
                    <div className="h-5 bg-neutral-200 rounded-full w-20" />
                    <div className="h-5 bg-neutral-200 rounded-full w-16" />
                  </div>
                  <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-neutral-200 rounded w-full" />
                  <div className="h-4 bg-neutral-200 rounded w-5/6" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 pt-2">
                    <div className="h-4 bg-neutral-200 rounded w-full" />
                    <div className="h-4 bg-neutral-200 rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <FolderOpen className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 text-lg font-medium">
              Unable to load projects
            </p>
            <p className="text-neutral-400 text-sm mt-1">
              Please try again later.
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 text-lg font-medium">
              No projects found
            </p>
            <p className="text-neutral-400 text-sm mt-1">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="group cursor-pointer border border-neutral-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => setSelectedProject(project)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium capitalize ${getCategoryColor(project.category)}`}
                    >
                      {project.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium capitalize ${getStatusVariant(project.status)}`}
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-snug group-hover:text-indigo-700 transition-colors">
                    {project.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-neutral-500 line-clamp-3 mt-1">
                    {truncate(project.description, 150)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="border-t border-neutral-100 pt-4 space-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <DollarSign className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Requested:</span>
                      <span className="ml-auto font-semibold text-neutral-900">
                        ${Number(project.requestedAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span>Timeline:</span>
                      <span className="ml-auto font-medium text-neutral-700">
                        {project.timeline}
                      </span>
                    </div>
                    {project.submittedAt && (
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Calendar className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                        <span>Submitted:</span>
                        <span className="ml-auto font-medium text-neutral-700">
                          {new Date(project.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Project Detail Dialog */}
      <Dialog
        open={!!selectedProject}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null);
        }}
      >
        {selectedProject && (
          <DialogContent className="max-w-lg sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={`text-xs font-medium capitalize ${getCategoryColor(selectedProject.category)}`}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {selectedProject.category}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs font-medium capitalize ${getStatusVariant(selectedProject.status)}`}
                >
                  {selectedProject.status}
                </Badge>
              </div>
              <DialogTitle className="text-2xl">
                {selectedProject.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Details for project: {selectedProject.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-2">
                  Description
                </h3>
                <p className="text-neutral-600 leading-relaxed whitespace-pre-line">
                  {selectedProject.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                      Requested Amount
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">
                    ${Number(selectedProject.requestedAmount).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                      Timeline
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {selectedProject.timeline}
                  </p>
                </div>
              </div>

              {selectedProject.submittedAt && (
                <div className="text-sm text-neutral-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Submitted on{" "}
                  {new Date(selectedProject.submittedAt).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-neutral-200">
                <Button
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in to invest in this project
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-neutral-500 text-sm">
            NonProfit Connect - Empowering communities through transparent
            funding.
          </p>
        </div>
      </footer>
    </div>
  );
}
