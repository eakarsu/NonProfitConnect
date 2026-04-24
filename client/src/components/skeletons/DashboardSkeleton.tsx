import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-neutral-200 rounded" />
                <div className="ml-4 flex-1">
                  <div className="h-3 bg-neutral-200 rounded w-24 mb-2" />
                  <div className="h-6 bg-neutral-200 rounded w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 bg-neutral-200 rounded w-48" />
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-neutral-200 rounded-lg p-4 mb-4">
              <div className="h-4 bg-neutral-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-neutral-200 rounded w-full mb-2" />
              <div className="h-3 bg-neutral-200 rounded w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
