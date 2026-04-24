import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkX, FolderOpen } from "lucide-react";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function Bookmarks() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ["/api/bookmarks"],
    enabled: !!user,
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return await apiRequest("DELETE", `/api/bookmarks/${projectId}`);
    },
    onSuccess: () => {
      toast({ title: "Removed", description: "Bookmark removed successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove bookmark.",
        variant: "destructive",
      });
    },
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

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader currentRole="bookmarks" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-1">
              My Bookmarks
            </h1>
            <p className="text-neutral-600">
              Projects you're watching and interested in
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-5 w-20 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-700 mb-2">
              No bookmarks yet
            </h2>
            <p className="text-neutral-500 mb-6">
              Browse projects and bookmark the ones you're interested in to keep
              track of them here.
            </p>
            <Button onClick={() => navigate("/projects")}>
              Browse Projects
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(bookmarks as any[]).map((b: any) => {
              const title = b.projectTitle || b.project?.title || "Untitled";
              const status = b.projectStatus || b.project?.status || "pending";
              const category = b.projectCategory || b.project?.category;
              const amount = b.projectRequestedAmount || b.project?.requestedAmount;
              const description = b.projectDescription || b.project?.description;
              return (
                <Card
                  key={b.id}
                  className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group border border-neutral-200"
                  onClick={() => navigate(`/projects/${b.projectId}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-2 truncate group-hover:text-primary transition-colors">
                          {title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={`capitalize ${getStatusColor(status)}`}>
                            {status}
                          </Badge>
                          {category && (
                            <Badge variant="outline" className="capitalize">
                              {category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-neutral-400 hover:text-error flex-shrink-0 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBookmarkMutation.mutate(b.projectId);
                        }}
                        disabled={removeBookmarkMutation.isPending}
                      >
                        <BookmarkX className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {description && (
                      <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                        {description}
                      </p>
                    )}
                    <div className="space-y-2 text-sm">
                      {amount && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Requested:</span>
                          <span className="font-semibold text-primary">
                            ${Number(amount).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {b.createdAt && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Bookmarked:</span>
                          <span className="font-medium text-neutral-500">
                            {new Date(b.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
