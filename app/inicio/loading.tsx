import {
  SkeletonCardRow, SkeletonHeader, Skeleton,
} from "@/components/skeletons/SkeletonCard"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header placeholder */}
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

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-6 pb-24">
        <SkeletonHeader />

        {/* Hoje na Copa — carrossel */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-2.5 overflow-x-hidden">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex-shrink-0 w-[240px]">
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <Skeleton className="size-7 rounded" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                    <Skeleton className="h-4 w-4" />
                    <div className="flex-1 flex flex-col items-end space-y-1">
                      <Skeleton className="size-7 rounded" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Apostas em aberto */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Card><CardContent className="p-0 divide-y">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3.5 flex items-center gap-3">
                <Skeleton className="size-9 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </CardContent></Card>
        </div>

        {/* Ligas */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          {[1, 2, 3].map((i) => <SkeletonCardRow key={i} />)}
        </div>
      </main>
    </div>
  )
}
