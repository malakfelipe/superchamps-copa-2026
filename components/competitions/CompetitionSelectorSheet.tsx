"use client"

import { useMemo, useState } from "react"
import { Search, X, Lock, Star } from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Flag } from "@/components/Flag"
import { CompetitionFavoriteStar } from "./CompetitionFavoriteStar"
import { useCompetitions, type CompetitionMeta } from "@/lib/competitions-context"
import { getCompetitionDesign } from "@/lib/competitions-design"
import { cn } from "@/lib/utils"

type Props = {
  competitions: CompetitionMeta[]
  trigger: React.ReactNode
  /** Callback custom — se omitido, só atualiza context. */
  onSelect?: (slug: string) => void
}

/**
 * Bottom sheet (mobile) / side sheet (desktop) com todas as competições
 * organizadas em 3 seções:
 *   ⭐ Suas favoritas
 *   🟢 Ativas pra apostas
 *   🟡 Em breve
 *
 * Sofascore-style com search no topo.
 */
export function CompetitionSelectorSheet({ competitions, trigger, onSelect }: Props) {
  const { selectedCompetitionSlug, setCompetition, favorites } = useCompetitions()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return competitions
    return competitions.filter((c) => c.name.toLowerCase().includes(q))
  }, [competitions, query])

  const favoritesList = filtered.filter((c) => favorites.includes(c.slug))
  const freeList = filtered.filter(
    (c) => c.active && !c.requiresPro && !favorites.includes(c.slug),
  )
  const proList = filtered.filter(
    (c) => c.active && c.requiresPro && !favorites.includes(c.slug),
  )
  const inactiveList = filtered.filter(
    (c) => !c.active && !favorites.includes(c.slug),
  )

  const handlePick = (slug: string) => {
    setCompetition(slug)
    onSelect?.(slug)
    setOpen(false)
    setQuery("")
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-5 pb-3 border-b">
          <SheetTitle>Competições</SheetTitle>
          <div className="relative mt-3">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="search"
              placeholder="Buscar competição..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-9 h-10"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-muted"
                aria-label="Limpar busca"
              >
                <X className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
          {favoritesList.length > 0 && (
            <Section
              icon={<Star className="size-3.5 fill-amber-400 text-amber-500" />}
              title="Suas favoritas"
              competitions={favoritesList}
              selectedSlug={selectedCompetitionSlug}
              onPick={handlePick}
            />
          )}

          {freeList.length > 0 && (
            <Section
              icon={<span className="size-2 rounded-full bg-emerald-500" />}
              title="Grátis pra apostar"
              competitions={freeList}
              selectedSlug={selectedCompetitionSlug}
              onPick={handlePick}
            />
          )}

          {proList.length > 0 && (
            <Section
              icon={<Star className="size-3 fill-amber-400 text-amber-500" />}
              title="PRO em breve"
              competitions={proList}
              selectedSlug={selectedCompetitionSlug}
              onPick={handlePick}
              dimmed
            />
          )}

          {inactiveList.length > 0 && (
            <Section
              icon={<Lock className="size-3 text-muted-foreground" />}
              title="Em breve"
              competitions={inactiveList}
              selectedSlug={selectedCompetitionSlug}
              onPick={handlePick}
              dimmed
            />
          )}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Search className="size-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nada encontrado pra "{query}"</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Section({
  icon,
  title,
  competitions,
  selectedSlug,
  onPick,
  dimmed = false,
}: {
  icon: React.ReactNode
  title: string
  competitions: CompetitionMeta[]
  selectedSlug: string | null
  onPick: (slug: string) => void
  dimmed?: boolean
}) {
  return (
    <section className="space-y-1">
      <h3 className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
        {icon}
        {title}
        <span className="ml-1 text-[10px] font-normal opacity-60">({competitions.length})</span>
      </h3>
      <div className="space-y-0.5">
        {competitions.map((c) => {
          const isSelected = c.slug === selectedSlug
          const design = getCompetitionDesign(c.slug)
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => onPick(c.slug)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                isSelected && "bg-primary/10 ring-1 ring-primary/30",
                !isSelected && "hover:bg-muted/60",
                dimmed && "opacity-60",
              )}
            >
              <div className={cn("size-8 rounded-md grid place-items-center shrink-0", design.accentBg)}>
                {c.countryCode ? (
                  <Flag iso={c.countryCode} size={20} />
                ) : (
                  <span className="text-base">{c.icon || "⚽"}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className={cn("font-semibold text-sm leading-tight", isSelected && "text-primary")}>
                  {c.name}
                </div>
                {c.season && (
                  <div className="text-[11px] text-muted-foreground">
                    {c.season}
                    {(c.memberCount ?? 0) > 0 && (
                      <span className="ml-1.5">· {c.memberCount!.toLocaleString("pt-BR")} jogando</span>
                    )}
                  </div>
                )}
              </div>

              <CompetitionFavoriteStar slug={c.slug} size={16} />
            </button>
          )
        })}
      </div>
    </section>
  )
}
