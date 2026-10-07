"use client"

import { ChevronDown, Plus } from "lucide-react"
import { Flag } from "@/components/Flag"
import { CompetitionSelectorSheet } from "./CompetitionSelectorSheet"
import { useCompetitions, type CompetitionMeta } from "@/lib/competitions-context"
import { getCompetitionDesign } from "@/lib/competitions-design"
import { cn } from "@/lib/utils"

type Props = {
  competitions: CompetitionMeta[]
  /**
   * Callback custom quando user seleciona uma competição (pill ou via sheet).
   * Default: só atualiza context.
   * Override: ex. router.push pra navegar entre rotas.
   */
  onSelect?: (slug: string) => void
  className?: string
}

/**
 * Strip horizontal sticky com competições favoritadas + botão "Todas".
 * Espelha o padrão Sofascore: pills com bandeira+nome, scroll horizontal
 * no mobile, ring colorido na competição selecionada.
 *
 * - Se user tem 0 favoritas: mostra só "Todas as competições" como CTA.
 * - Se user tem 1+ favoritas: mostra elas em ordem + "Todas" no fim.
 */
export function CompetitionPinnedStrip({ competitions, onSelect, className }: Props) {
  const { favorites, selectedCompetitionSlug, setCompetition } = useCompetitions()
  const handleSelect = (slug: string) => {
    setCompetition(slug)
    onSelect?.(slug)
  }

  // Filtra as competições que estão favoritadas, mantendo ordem de `favorites`
  const pinnedComps = favorites
    .map((slug) => competitions.find((c) => c.slug === slug))
    .filter((c): c is CompetitionMeta => Boolean(c))

  const allTrigger = (
    <button
      type="button"
      className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold bg-muted hover:bg-muted/70 transition-colors"
    >
      {pinnedComps.length === 0 ? (
        <>
          <Plus className="size-3.5" />
          Escolher competições
        </>
      ) : (
        <>
          Todas
          <ChevronDown className="size-3.5" />
        </>
      )}
    </button>
  )

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-2 px-2 py-1.5",
        className,
      )}
      role="tablist"
      aria-label="Competição"
    >
      {pinnedComps.map((c) => {
        const isSelected = c.slug === selectedCompetitionSlug
        const design = getCompetitionDesign(c.slug)
        return (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => handleSelect(c.slug)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold border transition-all",
              isSelected
                ? cn("bg-background ring-2", design.accentRing, design.accentBorder, design.accent)
                : cn("border-transparent hover:bg-muted text-foreground", c.active ? "" : "opacity-60"),
            )}
          >
            {c.countryCode ? (
              <Flag iso={c.countryCode} size={14} />
            ) : (
              <span className="text-sm leading-none">{c.icon || "⚽"}</span>
            )}
            <span className="truncate max-w-[140px]">{c.name}</span>
            {c.requiresPro && (
              <span className="text-[9px] uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1 rounded leading-none ml-0.5">
                PRO
              </span>
            )}
            {!c.active && !c.requiresPro && (
              <span className="text-[9px] uppercase tracking-wider opacity-60 ml-0.5">
                soon
              </span>
            )}
          </button>
        )
      })}

      <CompetitionSelectorSheet competitions={competitions} trigger={allTrigger} onSelect={onSelect} />
    </div>
  )
}
