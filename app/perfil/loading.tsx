import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/skeletons/SkeletonCard"

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
        <Skeleton className="h-7 w-24" />
        <Card className="border-2 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/15 via-amber-100/20 to-rose-100/20 dark:from-primary/25 dark:via-amber-950/30 dark:to-rose-950/20 p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Skeleton className="h-3 w-12" /><Skeleton className="h-5 w-20" /></div>
            <div className="space-y-1.5"><Skeleton className="h-3 w-16" /><Skeleton className="h-5 w-24" /></div>
          </CardContent>
        </Card>
        <Card><CardContent className="p-0 divide-y">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="p-3.5 flex items-center gap-3">
              <Skeleton className="size-9 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="size-4" />
            </div>
          ))}
        </CardContent></Card>
      </main>
    </div>
  )
}
