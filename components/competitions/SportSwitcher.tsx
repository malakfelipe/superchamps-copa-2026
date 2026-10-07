"use client"

import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCompetitions, type SportMeta } from "@/lib/competitions-context"

type Props = {
  sports: SportMeta[]
  className?: string
}

export function SportSwitcher({ sports, className }: Props) {
  const { selectedSport, setSport } = useCompetitions()

  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto no-scrollbar -mx-2 px-2",
        className,
      )}
      role="tablist"
      aria-label="Esporte"
    >
      {sports.map((sport) => {
        const isSelected = sport.slug === selectedSport && sport.active
        const isDisabled = !sport.active

        return (
          <button
            key={sport.slug}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={isDisabled}
            onClick={() => sport.active && setSport(sport.slug)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-colors",
              isSelected && "bg-primary text-primary-foreground",
              !isSelected && sport.active && "bg-muted hover:bg-muted/70 text-foreground",
              isDisabled && "bg-muted/40 text-muted-foreground cursor-not-allowed",
            )}
          >
            <span className="text-sm">{sport.icon}</span>
            {sport.name}
            {isDisabled && (
              <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider opacity-60">
                <Lock className="size-2.5" />
                Em breve
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
