import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProjectCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-5 bg-neutral-200 rounded w-3/4 mb-3" />
            <div className="h-5 bg-neutral-200 rounded w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-3 bg-neutral-200 rounded w-full mb-2" />
        <div className="h-3 bg-neutral-200 rounded w-5/6 mb-4" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 bg-neutral-200 rounded w-20" />
            <div className="h-3 bg-neutral-200 rounded w-24" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 bg-neutral-200 rounded w-20" />
            <div className="h-3 bg-neutral-200 rounded w-16" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <div className="h-9 bg-neutral-200 rounded w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
