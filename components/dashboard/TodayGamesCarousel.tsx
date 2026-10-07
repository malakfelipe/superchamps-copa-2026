import { MatchCardProd } from "@/components/games/MatchCardProd"
import type { Match } from "@/lib/data/types"

export function TodayGamesCarousel({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-3 text-center">
        Hoje não tem jogo. Vai descansar a voz pra amanhã.
      </div>
    )
  }
  return (
    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 snap-x snap-mandatory">
      {matches.map((g) => (
        <div key={g.id} className="snap-start shrink-0 w-[280px]">
          <MatchCardProd match={g} />
        </div>
      ))}
    </div>
  )
}
