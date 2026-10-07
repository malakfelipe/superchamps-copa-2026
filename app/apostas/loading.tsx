import { Card, CardContent } from "@/components/ui/card"
import { SkeletonHeader, Skeleton } from "@/components/skeletons/SkeletonCard"

export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5 pb-24">
        <SkeletonHeader />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-3 space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-2.5 w-14" />
            </CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-md" />
        <Card><CardContent className="p-0 divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 flex items-center gap-3">
              <Skeleton className="size-7 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </CardContent></Card>
      </main>
    </div>
  )
}
