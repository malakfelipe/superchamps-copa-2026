import Link from "next/link"
import { ChevronRight, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Flag } from "@/components/Flag"
import { formatCountdown } from "@/lib/format"
import { localizeTeamName, localizeOutcomeLabel } from "@/lib/teams"
import type { OpenBet } from "@/lib/data/types"

export function OpenBetsList({ bets }: { bets: OpenBet[] }) {
  if (bets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Sem palpite ainda. Bora dar uma olhada nos{" "}
          <Link href="/jogos" className="text-primary hover:underline">próximos jogos</Link>?
        </CardContent>
      </Card>
    )
  }

  const totalStakes = bets.reduce((acc, b) => acc + b.stake, 0)
  const totalPotential = bets.reduce((acc, b) => acc + Math.floor(b.stake * b.oddNow), 0)
  const roiPct = totalStakes > 0 ? Math.round(((totalPotential / totalStakes) - 1) * 100) : 0

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {bets.map((b) => {
            const potential = Math.floor(b.stake * b.oddNow)
            const oddChange = b.oddNow - b.oddAtPlacement
            const homePT = localizeTeamName(b.homeName)
            const awayPT = localizeTeamName(b.awayName)
            const localizedOutcome = localizeOutcomeLabel(b.outcomeLabel, b.homeName, b.awayName)
            return (
              <Link
                key={b.id}
                href={`/jogos/${b.matchId}`}
                className="w-full flex items-start gap-3 px-3.5 py-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                  <Flag name={b.homeName} size={18} />
                  <Flag name={b.awayName} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-sm">{localizedOutcome}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="size-3 inline -mt-0.5 mr-0.5" />
                      {formatCountdown(b.kickoff)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{homePT} × {awayPT}</div>
                  <div className="flex items-center justify-between mt-1.5 text-sm gap-3">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-muted-foreground text-xs">
                        <span className="font-mono font-medium text-foreground">{b.stake}</span> pts ·
                        odd <span className="font-mono font-medium text-foreground">{b.oddAtPlacement.toFixed(2)}</span>
                      </span>
                      {Math.abs(oddChange) > 0.05 && (
                        <span className={`text-[10px] font-mono ${oddChange > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                          {oddChange > 0 ? "↑" : "↓"} {b.oddNow.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-primary text-sm whitespace-nowrap">
                      +{potential} pts
                    </span>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              </Link>
            )
          })}
        </div>
        <div className="border-t bg-muted/30 px-3.5 py-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Total apostado: <span className="font-mono font-semibold text-foreground">{totalStakes} pts</span>
          </span>
          <span className="text-muted-foreground">
            Potencial: <span className="font-mono font-bold text-primary">+{roiPct}%</span>
            {" · "}
            <span className="font-mono font-bold text-primary">{totalPotential} pts</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
