import { Card, CardContent } from "@/components/ui/card"
import { Skeleton, SkeletonHeader } from "@/components/skeletons/SkeletonCard"

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

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4 pb-24">
        <SkeletonHeader />

        {/* Search + filtros */}
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="flex gap-1.5">
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>

        {/* Tabs */}
        <Skeleton className="h-10 w-full rounded-md" />

        {/* Lista de jogos */}
        <Card><CardContent className="p-0 divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3.5 flex items-center gap-3">
              <div className="w-14 space-y-1">
                <Skeleton className="h-3 w-10 mx-auto" />
                <Skeleton className="h-3 w-8 mx-auto" />
              </div>
              <Skeleton className="h-10 w-px" />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-5 rounded" />
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-5 rounded" />
                  <Skeleton className="h-3.5 w-12" />
                </div>
              </div>
              <Skeleton className="h-5 w-8 rounded" />
            </div>
          ))}
        </CardContent></Card>
      </main>
    </div>
  )
}
