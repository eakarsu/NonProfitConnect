import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProjectDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-9 bg-neutral-200 rounded w-32 mb-4" />
      <div className="h-8 bg-neutral-200 rounded w-2/3 mb-4" />
      <div className="flex gap-2 mb-8">
        <div className="h-6 bg-neutral-200 rounded w-20" />
        <div className="h-6 bg-neutral-200 rounded w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 bg-neutral-200 rounded w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-neutral-200 rounded w-full" />
                <div className="h-3 bg-neutral-200 rounded w-full" />
                <div className="h-3 bg-neutral-200 rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-5 bg-neutral-200 rounded w-36" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-neutral-200 rounded w-full mb-3" />
              <div className="h-3 bg-neutral-200 rounded w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 bg-neutral-200 rounded w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-5 w-5 bg-neutral-200 rounded" />
                  <div className="flex-1">
                    <div className="h-3 bg-neutral-200 rounded w-16 mb-1" />
                    <div className="h-4 bg-neutral-200 rounded w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
