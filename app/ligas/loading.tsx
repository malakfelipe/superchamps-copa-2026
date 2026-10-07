import { SkeletonCardRow, SkeletonHeader, Skeleton } from "@/components/skeletons/SkeletonCard"

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
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          {[1, 2, 3].map((i) => <SkeletonCardRow key={i} />)}
        </div>
      </main>
    </div>
  )
}
