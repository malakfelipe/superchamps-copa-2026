import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ width = "w-full" }: { width?: string }) {
  return <Skeleton className={`h-3.5 ${width}`} />
}

export function SkeletonCardRow() {
  return (
    <Card>
      <CardContent className="p-3.5 flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="size-8 rounded" />
      </CardContent>
    </Card>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-3 space-y-1.5 text-center">
            <Skeleton className="h-2.5 w-16 mx-auto" />
            <Skeleton className="h-7 w-14 mx-auto" />
            <Skeleton className="h-2 w-12 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function SkeletonHeader() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-3 w-64" />
    </div>
  )
}
