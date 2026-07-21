import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  FolderPlus,
  FileCheck,
  DollarSign,
  MessageSquare,
  UserPlus,
  Edit,
  Trash2,
  Star,
  Bell,
  Clock,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffWeeks < 5)
    return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function getActionIcon(actionType: string) {
  switch (actionType) {
    case "project_created":
      return <FolderPlus className="h-5 w-5 text-primary" />;
    case "project_reviewed":
      return <FileCheck className="h-5 w-5 text-success" />;
    case "investment_made":
      return <DollarSign className="h-5 w-5 text-green-600" />;
    case "comment_added":
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case "user_registered":
      return <UserPlus className="h-5 w-5 text-purple-500" />;
    case "project_updated":
      return <Edit className="h-5 w-5 text-warning" />;
    case "project_deleted":
      return <Trash2 className="h-5 w-5 text-error" />;
    case "bookmark_added":
      return <Star className="h-5 w-5 text-yellow-500" />;
    case "notification_sent":
      return <Bell className="h-5 w-5 text-neutral-500" />;
    default:
      return <Activity className="h-5 w-5 text-neutral-400" />;
  }
}

function getActionLabel(actionType: string): string {
  switch (actionType) {
    case "project_created":
      return "created a new project";
    case "project_reviewed":
      return "reviewed a project";
    case "investment_made":
      return "made an investment";
    case "comment_added":
      return "added a comment";
    case "user_registered":
      return "joined the platform";
    case "project_updated":
      return "updated a project";
    case "project_deleted":
      return "deleted a project";
    case "bookmark_added":
      return "bookmarked a project";
    case "notification_sent":
      return "received a notification";
    default:
      return actionType.replace(/_/g, " ");
  }
}

export default function ActivityPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: result, isLoading } = useQuery<any>({
    queryKey: [`/api/activity?page=${page}&limit=${limit}`],
    enabled: !!user,
  });

  const activities = result?.data || result || [];
  const hasMore = result?.hasMore ?? (Array.isArray(activities) && activities.length === limit);
  const totalPages = result?.totalPages;

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader currentRole="activity" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-1">
              Activity Log
            </h1>
            <p className="text-neutral-600">
              Recent activity across the platform
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-700 mb-2">
              No activity yet
            </h2>
            <p className="text-neutral-500">
              Activity will appear here as you and others use the platform.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {activities.map((activity: any, index: number) => (
                <Card
                  key={activity.id || index}
                  className="hover:shadow-sm transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                        {getActionIcon(activity.actionType || activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-900">
                          <span className="font-semibold">
                            {activity.userName ||
                              activity.user?.name ||
                              activity.userFirstName ||
                              "Someone"}
                          </span>{" "}
                          {activity.description ||
                            getActionLabel(
                              activity.actionType || activity.type || ""
                            )}
                          {activity.targetTitle && (
                            <>
                              {" "}
                              <span className="font-medium text-primary">
                                {activity.targetTitle}
                              </span>
                            </>
                          )}
                        </p>
                        {activity.details && (
                          <p className="text-sm text-neutral-500 mt-1">
                            {activity.details}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 mt-1">
                          {getRelativeTime(
                            activity.createdAt ||
                              activity.timestamp ||
                              new Date().toISOString()
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load more pagination */}
            <div className="flex justify-center mt-8 gap-3">
              {page > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
              )}
              {(hasMore || (totalPages && page < totalPages)) && (
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Load More
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
