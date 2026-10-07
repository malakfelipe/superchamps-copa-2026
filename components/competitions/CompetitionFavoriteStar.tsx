"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCompetitions } from "@/lib/competitions-context"

type Props = {
  slug: string
  size?: number
  className?: string
}

export function CompetitionFavoriteStar({ slug, size = 18, className }: Props) {
  const { isFavorite, toggleFavorite } = useCompetitions()
  const fav = isFavorite(slug)

  return (
    <button
      type="button"
      aria-label={fav ? "Desfavoritar" : "Favoritar"}
      aria-pressed={fav}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(slug)
      }}
      className={cn(
        "inline-grid place-items-center rounded-md hover:bg-muted/60 transition-colors p-1.5",
        className,
      )}
    >
      <Star
        className={cn(
          "transition-colors",
          fav ? "fill-amber-400 text-amber-500" : "text-muted-foreground hover:text-foreground",
        )}
        style={{ width: size, height: size }}
      />
    </button>
  )
}
