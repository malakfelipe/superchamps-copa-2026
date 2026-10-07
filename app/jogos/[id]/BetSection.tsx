"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Minus, Plus, Flame, Users, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Flag } from "@/components/Flag"
import { QuickBetDrawer, type BetTarget } from "@/components/games/QuickBetDrawer"
import { localizeTeamName } from "@/lib/teams"
import { formatPts } from "@/lib/format"
import type { MatchDetails, Pool1X2 } from "@/lib/data/types"

const MAX_GOALS = 10

const KNOCKOUT_STAGES = [
  "round_of_32", "round_of_16", "quarter", "semi", "third", "final",
] as const

type Props = {
  match: MatchDetails
  balance: number
  canPlaceBet: boolean       // false se status != scheduled
  authed?: boolean           // false → anônimo: apostar manda pro login
  attached?: boolean         // cola o card de tendência no header do jogo (bloco único)
}

function calcOdd(pool: Record<string, number>, key: string): number {
  const total = Object.values(pool).reduce((a, b) => a + b, 0)
  const p = pool[key] || 0
  return p > 0 ? +(total / p).toFixed(2) : 0
}

function heatColor(value: number, max: number): string {
  if (value === 0) return "bg-muted/30"
  const intensity = value / max
  if (intensity < 0.1) return "bg-primary/10"
  if (intensity < 0.25) return "bg-primary/25"
  if (intensity < 0.5) return "bg-primary/50"
  if (intensity < 0.75) return "bg-primary/75"
  return "bg-primary"
}

function heatTextColor(value: number, max: number): string {
  if (value === 0) return "text-muted-foreground"
  return value / max > 0.5 ? "text-primary-foreground" : "text-foreground"
}

export function BetSection({ match, balance, canPlaceBet, authed = true, attached }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [target, setTarget] = useState<BetTarget | null>(null)
  const [homeGoals, setHomeGoals] = useState(2)
  const [awayGoals, setAwayGoals] = useState(1)
  const router = useRouter()
  const pathname = usePathname()

  const requireAuth = () => {
    router.push(`/login?next=${encodeURIComponent(pathname || "/jogos")}`)
  }

  const total1x2 = match.pool1x2.home + match.pool1x2.draw + match.pool1x2.away
  const totalScore = Object.values(match.poolScore).reduce((a, b) => a + b, 0)
  const maxScorePool = Math.max(0, ...Object.values(match.poolScore))

  const odds1x2 = {
    home: calcOdd(match.pool1x2 as unknown as Record<string, number>, "home"),
    draw: calcOdd(match.pool1x2 as unknown as Record<string, number>, "draw"),
    away: calcOdd(match.pool1x2 as unknown as Record<string, number>, "away"),
  }
  const isKnockout = (KNOCKOUT_STAGES as readonly string[]).includes(match.stage)
  const homeNamePT = localizeTeamName(match.home.name)
  const awayNamePT = localizeTeamName(match.away.name)

  // Knockout sempre tem vencedor (após prorrogação/penaltis) — sem opção de empate
  const outcomes: { key: keyof Pool1X2; label: string; name: string | null; color: string }[] = isKnockout
    ? [
        { key: "home", label: `${homeNamePT} se classifica`, name: match.home.name, color: "bg-primary" },
        { key: "away", label: `${awayNamePT} se classifica`, name: match.away.name, color: "bg-rose-500" },
      ]
    : [
        { key: "home", label: `${homeNamePT} vence`, name: match.home.name, color: "bg-primary" },
        { key: "draw", label: "Empate", name: null, color: "bg-amber-500" },
        { key: "away", label: `${awayNamePT} vence`, name: match.away.name, color: "bg-rose-500" },
      ]

  const openBet1x2 = (key: keyof Pool1X2, label: string) => {
    if (!authed) { requireAuth(); return }
    if (!canPlaceBet) {
      toast("Apostas encerradas pra este jogo.")
      return
    }
    setTarget({
      marketId: match.market1x2Id,
      marketType: "1x2",
      outcome: key,
      outcomeLabel: label,
      currentOdd: odds1x2[key],
      poolForOutcome: match.pool1x2[key],
      poolTotal: total1x2,
    })
    setDrawerOpen(true)
  }

  const openBetScore = () => {
    if (!authed) { requireAuth(); return }
    if (!canPlaceBet) {
      toast("Apostas encerradas pra este jogo.")
      return
    }
    const k = `${homeGoals}-${awayGoals}`
    const pool = match.poolScore[k] || 0
    setTarget({
      marketId: match.marketScoreId,
      marketType: "exact_score",
      outcome: k,
      outcomeLabel: `Placar ${homeGoals} × ${awayGoals}`,
      currentOdd: calcOdd(match.poolScore, k),
      poolForOutcome: pool,
      poolTotal: totalScore,
    })
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-3">
      {/* DISTRIBUIÇÃO 1X2 */}
      <Card className={attached ? "rounded-t-none border-2 border-t" : undefined}>
        <CardContent className="p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Users className="size-4 text-primary" />
              Aposte no SuperChamps · 1X2
            </h3>
          </div>
          {outcomes.map((row) => {
            const pool = match.pool1x2[row.key]
            const odd = odds1x2[row.key]
            const share = total1x2 > 0 ? Math.round((pool / total1x2) * 100) : 0
            return (
              <button
                key={row.key}
                onClick={() => openBet1x2(row.key, row.label)}
                className="w-full text-left space-y-1 group disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canPlaceBet}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    {row.name && <Flag name={row.name} size={18} />}
                    {row.label}
                  </span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-xs text-muted-foreground">{share}%</span>
                    <span className="font-bold text-primary tabular-nums w-12 text-right">{odd.toFixed(2)}x</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${row.color} transition-all`} style={{ width: `${share}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{formatPts(pool)} pts no pool</span>
                  {canPlaceBet && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium">
                      Apostar →
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* HEATMAP DE PLACARES */}
      {totalScore > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Flame className="size-4 text-rose-500" />
                Mapa de calor · placares apostados
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Linhas = {homeNamePT} ({match.home.short}) · Colunas = {awayNamePT} ({match.away.short})
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="grid grid-cols-[24px_repeat(6,1fr)] gap-1 text-[10px] font-mono text-muted-foreground font-semibold">
                <div />
                {[0, 1, 2, 3, 4, 5].map((a) => (
                  <div key={a} className="text-center">{a}</div>
                ))}
              </div>
              {[0, 1, 2, 3, 4, 5].map((h) => (
                <div key={h} className="grid grid-cols-[24px_repeat(6,1fr)] gap-1 items-center">
                  <div className="text-[10px] font-mono text-muted-foreground font-semibold text-center">{h}</div>
                  {[0, 1, 2, 3, 4, 5].map((a) => {
                    const k = `${h}-${a}`
                    const pool = match.poolScore[k] || 0
                    return (
                      <button
                        key={a}
                        onClick={() => { setHomeGoals(h); setAwayGoals(a) }}
                        className={`aspect-square rounded ${heatColor(pool, maxScorePool)} grid place-items-center hover:ring-2 hover:ring-primary/40 transition-all`}
                        title={`${h}-${a}: ${pool} pts`}
                      >
                        <span className={`font-mono text-[10px] font-bold ${heatTextColor(pool, maxScorePool)}`}>
                          {pool > 0 ? pool : "·"}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* SCORE PICKER + APOSTAR */}
            <div className="bg-muted/40 rounded-lg p-3 space-y-2.5 border">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  Placar selecionado
                </div>
                <div className="flex items-center gap-2">
                  <ScoreStepper value={homeGoals} onChange={setHomeGoals} name={match.home.name} />
                  <span className="text-sm text-muted-foreground">×</span>
                  <ScoreStepper value={awayGoals} onChange={setAwayGoals} name={match.away.name} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Odd</div>
                  <div className="font-mono font-bold text-primary text-lg">
                    {calcOdd(match.poolScore, `${homeGoals}-${awayGoals}`).toFixed(2) || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Pool</div>
                  <div className="font-mono font-semibold text-lg">
                    {match.poolScore[`${homeGoals}-${awayGoals}`] || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Share</div>
                  <div className="font-mono font-semibold text-lg">
                    {totalScore > 0 ? Math.round(((match.poolScore[`${homeGoals}-${awayGoals}`] || 0) / totalScore) * 100) : 0}%
                  </div>
                </div>
              </div>
              <Button size="sm" className="w-full" onClick={openBetScore} disabled={!canPlaceBet}>
                Apostar em {homeGoals} × {awayGoals}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DRAWER DE APOSTA */}
      <QuickBetDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        target={target}
        balance={balance}
        matchExposure={match.myOpenStake ?? 0}
      />

      {/* PARIMUTUEL EXPLAIN */}
      <Card className="bg-muted/40 border-dashed">
        <CardContent className="p-3 text-xs text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground">
            <Sparkles className="size-3.5 inline -mt-0.5 mr-1" />
            Como funciona a odd
          </p>
          <p>
            <strong>Pool total ÷ pool do seu resultado.</strong> Quanto menos gente apostar no mesmo
            resultado que você, maior o retorno se acertar. Odd congelada no kickoff.
            Apostas individuais ficam privadas até o kickoff — você vê só o agregado.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── SCORE STEPPER ─────────────────────────────────────────────────────────

function ScoreStepper({
  value, onChange, name,
}: {
  value: number
  onChange: (v: number) => void
  name: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Flag name={name} size={20} />
      <Button variant="outline" size="icon" className="size-7" disabled={value <= 0} onClick={() => onChange(value - 1)}>
        <Minus className="size-3" />
      </Button>
      <div className="min-w-[36px] h-9 rounded-md border-2 border-primary/30 bg-primary/5 grid place-items-center font-mono font-bold text-lg">
        {value}
      </div>
      <Button variant="outline" size="icon" className="size-7" disabled={value >= MAX_GOALS} onClick={() => onChange(value + 1)}>
        <Plus className="size-3" />
      </Button>
    </div>
  )
}
