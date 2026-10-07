import { ScrollText, CheckCircle2, XCircle, Trophy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flag } from "@/components/Flag"
import { localizeTeamName } from "@/lib/teams"
import { formatPts } from "@/lib/format"
import { BettorConference } from "./BettorConference"
import type { MatchTransparencyData } from "@/lib/data/types"

type Pick = "home" | "draw" | "away"

type Props = {
  matchId: string
  data: MatchTransparencyData
  home: { name: string; iso?: string; short: string }
  away: { name: string; iso?: string; short: string }
  isKnockout: boolean
  attached?: boolean
}

const fmt = (n: number) => formatPts(n)
const odd = (n: number) => n.toFixed(2).replace(".", ",")

/**
 * Bloco de transparência do jogo encerrado: distribuição 1X2 com o resultado
 * destacado, odd congelada no apito, multiplicador aplicado e conferência por
 * apostador (top 10 acertou/errou + busca). Read-only.
 */
export function MatchTransparency({ matchId, data, home, away, isKnockout, attached }: Props) {
  const homePT = localizeTeamName(home.name)
  const awayPT = localizeTeamName(away.name)
  const total = data.totals.pool
  const mult = data.multiplier

  const labelOf = (k: Pick) =>
    k === "draw" ? "Empate" : isKnockout
      ? `${k === "home" ? homePT : awayPT} se classifica`
      : `${k === "home" ? homePT : awayPT} vence`
  const isoOf = (k: Pick) => (k === "home" ? home.iso : k === "away" ? away.iso : undefined)

  // ordena home/draw/away (mata-mata não tem empate)
  const ordered = (["home", "draw", "away"] as Pick[])
    .map((k) => data.outcomes.find((o) => o.key === k))
    .filter((o): o is NonNullable<typeof o> => !!o)

  const winnerOdd = data.outcomes.find((o) => o.key === data.winnerOutcome)?.odd ?? 0
  const paidOdd = winnerOdd * mult

  const picks: Record<Pick, { short: string; iso: string | null }> = {
    home: { short: homePT, iso: home.iso ?? null },
    draw: { short: "Empate", iso: null },
    away: { short: awayPT, iso: away.iso ?? null },
  }

  return (
    <div className="space-y-3">
      {/* DISTRIBUIÇÃO 1X2 + RESULTADO */}
      <Card className={attached ? "rounded-t-none border-2 border-t" : undefined}>
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <ScrollText className="size-4 text-primary" />
              Como o bolão palpitou · 1X2
            </h3>
            {mult > 1 && (
              <Badge variant="outline" className="gap-1 h-5 px-1.5 text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400/40">
                <Trophy className="size-3" /> pagou x{mult}
              </Badge>
            )}
          </div>

          {ordered.map((o) => {
            const won = o.key === data.winnerOutcome
            const share = total > 0 ? Math.round((o.pool / total) * 100) : 0
            return (
              <div key={o.key} className={`space-y-1 rounded-lg p-2 -mx-1 ${won ? "bg-emerald-500/10 ring-1 ring-emerald-500/30" : "opacity-70"}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    {isoOf(o.key) && <Flag iso={isoOf(o.key)} size={18} />}
                    {labelOf(o.key)}
                    {won
                      ? <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-3" /> RESULTADO</span>
                      : <XCircle className="size-3 text-muted-foreground/60" />}
                  </span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-xs text-muted-foreground">{share}%</span>
                    <span className={`font-bold tabular-nums w-14 text-right ${won ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                      {odd(o.odd)}x
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${won ? "bg-emerald-500" : "bg-muted-foreground/40"}`} style={{ width: `${share}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{fmt(o.pool)} pts · {o.bettors} apostadores</span>
                  {won && (
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      quem acertou levou {mult > 1 ? `${odd(paidOdd)}x` : `${odd(o.odd)}x`}
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-1 border-t text-[11px] text-muted-foreground">
            <span><strong className="text-foreground font-mono">{fmt(total)}</strong> pts no pool</span>
            <span className="text-muted-foreground/40">·</span>
            <span><strong className="text-foreground font-mono">{data.totals.bettors}</strong> apostadores</span>
            <span className="text-muted-foreground/40">·</span>
            <span><strong className="text-foreground font-mono">{data.totals.winners}</strong> ganhadores</span>
            <span className="text-muted-foreground/40">·</span>
            <span><strong className="text-foreground font-mono">{fmt(data.totals.paid)}</strong> pts pagos</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Odds congeladas no apito final. Apostas individuais ficam privadas — aqui é só o agregado.
          </p>
        </CardContent>
      </Card>

      {/* CONFERÊNCIA POR APOSTADOR */}
      <BettorConference
        matchId={matchId}
        topWon={data.topWon}
        topLost={data.topLost}
        winnersCount={data.totals.winners}
        losersCount={data.totals.losers}
        picks={picks}
      />
    </div>
  )
}
