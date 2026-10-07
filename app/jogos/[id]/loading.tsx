import { Card, CardContent } from "@/components/ui/card"
import { Skeleton, SkeletonStats } from "@/components/skeletons/SkeletonCard"

export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5 pb-24">
        <Skeleton className="h-7 w-32" />

        {/* Match header */}
        <Card className="border-2 overflow-hidden">
          <Skeleton className="h-8 w-full rounded-none" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 flex items-center gap-2.5">
                <Skeleton className="size-10 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <div className="space-y-1 text-center">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
              <div className="flex-1 flex items-center gap-2.5 justify-end">
                <div className="space-y-1 items-end flex flex-col">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="size-10 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>

        <SkeletonStats />

        {/* Distribuição 1X2 */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-48" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
