import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Clock, BarChart3, ArrowRight, Trophy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Flag } from "@/components/Flag"
import { AppShell } from "@/components/layout/AppShell"
import { BetSection } from "./BetSection"
import { MyBetsHere } from "./MyBetsHere"
import { MatchTransparency } from "./MatchTransparency"
import {
  getCurrentProfile, getMatchById, getMyOpenBetsForMatch, getMatchTransparency,
} from "@/lib/data"
import { formatCountdown, formatKickoff, formatPts } from "@/lib/format"
import { multiplierLabel } from "@/lib/multipliers"
import { localizeTeamName } from "@/lib/teams"

const KNOCKOUT_STAGES = [
  "round_of_32", "round_of_16", "quarter", "semi", "third", "final",
] as const

function calcOdd(pool: Record<string, number>, key: string): number {
  const total = Object.values(pool).reduce((a, b) => a + b, 0)
  const p = pool[key] || 0
  return p > 0 ? +(total / p).toFixed(2) : 0
}

const STAGE_LABEL: Record<string, string> = {
  group_a: "Grupo A", group_b: "Grupo B", group_c: "Grupo C", group_d: "Grupo D",
  group_e: "Grupo E", group_f: "Grupo F", group_g: "Grupo G", group_h: "Grupo H",
  group_i: "Grupo I", group_j: "Grupo J", group_k: "Grupo K", group_l: "Grupo L",
  round_of_32: "16-avos", round_of_16: "Oitavas", quarter: "Quartas",
  semi: "Semifinal", third: "3° lugar", final: "Final",
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile()  // null = visitante anônimo (app público)

  const { id } = await params
  const match = await getMatchById(id)
  if (!match) notFound()

  const myBets = await getMyOpenBetsForMatch(id)

  const total1x2 = match.pool1x2.home + match.pool1x2.draw + match.pool1x2.away
  const isScheduled = match.status === "scheduled"
  const isLive = match.status === "live"
  const isFinished = match.status === "finished"

  // Jogo encerrado: bloco de transparência (pool/odds congelados vêm dos bets
  // liquidados; get_match_pools só conta apostas 'open', então zera após settle).
  const transparency = isFinished ? await getMatchTransparency(id) : null
  const showTransparency = !!transparency && transparency.totals.bettors > 0
  const headerPool = showTransparency ? transparency!.totals.pool : total1x2
  const headerBettors = showTransparency ? transparency!.totals.bettors : match.bettorsCount
  const headerAvg = showTransparency
    ? (transparency!.totals.bettors > 0 ? Math.round(transparency!.totals.pool / transparency!.totals.bettors) : 0)
    : match.avgStake
  const canPlaceBet = isScheduled && match.teamsConfirmed !== false  // só antes do kickoff E com times confirmados
  const isKnockout = (KNOCKOUT_STAGES as readonly string[]).includes(match.stage)
  const multLabel = multiplierLabel(match.stage, match.payoutMultiplier)
  const homeNamePT = localizeTeamName(match.home.name)
  const awayNamePT = localizeTeamName(match.away.name)

  // Pra calcular payout potencial atualizado nas minhas apostas
  const oddNowByOutcome: Record<string, number> = {
    home: calcOdd(match.pool1x2 as unknown as Record<string, number>, "home"),
    draw: calcOdd(match.pool1x2 as unknown as Record<string, number>, "draw"),
    away: calcOdd(match.pool1x2 as unknown as Record<string, number>, "away"),
  }
  // Adiciona placares populares ao mapa de odds
  for (const k of Object.keys(match.poolScore)) {
    oddNowByOutcome[k] = calcOdd(match.poolScore, k)
  }

  return (
    <AppShell authed={!!profile} balance={profile?.balance} nickname={profile?.nickname} avatarUrl={profile?.avatarUrl}>
      <div className="space-y-3 pb-20 animate-in fade-in duration-300">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link href="/jogos">
            <ChevronLeft className="size-4 mr-1" />
            Voltar pra jogos
          </Link>
        </Button>

        {/* BLOCO ÚNICO: header + stats do bolão + tendência (BetSection cola embaixo) */}
        <div>
          <Card className="overflow-hidden border-2 rounded-b-none border-b-0">
            <div className="bg-gradient-to-r from-primary/10 via-amber-100/30 to-rose-100/20 dark:from-primary/25 dark:via-amber-950/30 dark:to-rose-950/20 px-3 py-1.5 flex items-center justify-between gap-2 text-[11px]">
              <span className="font-bold tracking-tight shrink-0">⚡ SuperChamps</span>
              <span className="text-muted-foreground truncate text-right">
                {STAGE_LABEL[match.stage]}
                {match.venue && ` · ${match.venue}`}
              </span>
              {multLabel && (
                <Badge className="shrink-0 gap-1 h-5 px-1.5 text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400/40" variant="outline">
                  <Trophy className="size-3" />
                  PAGA {multLabel}{isKnockout && " · sem empate"}
                </Badge>
              )}
            </div>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <Flag name={match.home.name} iso={match.home.iso} size={32} />
                  <div className="min-w-0">
                    <div className="font-bold text-sm leading-tight truncate">{homeNamePT}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{match.home.short}</div>
                  </div>
                </div>
                <div className="text-center shrink-0">
                  {isLive && match.homeScore !== null && match.awayScore !== null ? (
                    <>
                      <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center justify-center gap-1">
                        <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                        ao vivo · {match.liveMinute}′
                      </div>
                      <div className="font-mono font-extrabold text-xl">
                        {match.homeScore}–{match.awayScore}
                      </div>
                    </>
                  ) : isFinished && match.homeScore !== null && match.awayScore !== null ? (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Encerrado</div>
                      <div className="font-mono font-extrabold text-xl">
                        {match.homeScore}–{match.awayScore}
                      </div>
                      {match.homePen != null && match.awayPen != null && (
                        <div className="text-[10px] font-mono text-muted-foreground">pênaltis {match.homePen}-{match.awayPen}</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-[11px] text-muted-foreground">{formatKickoff(match.startsAt)}</div>
                      <div className="font-mono font-bold text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        <Clock className="size-3 inline -mt-0.5 mr-0.5" />
                        {formatCountdown(match.startsAt)}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
                  <div className="min-w-0 text-right">
                    <div className="font-bold text-sm leading-tight truncate">{awayNamePT}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{match.away.short}</div>
                  </div>
                  <Flag name={match.away.name} iso={match.away.iso} size={32} />
                </div>
              </div>

              {/* STATS DO BOLÃO — linha única */}
              <div className="flex items-center justify-center gap-3 mt-2.5 pt-2 border-t text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BarChart3 className="size-3" />
                  <strong className="text-foreground font-mono">{headerBettors}</strong> apostadores
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span>
                  <strong className="text-foreground font-mono">{formatPts(headerPool)}</strong> pts no pool
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span>
                  stake médio <strong className="text-foreground font-mono">{formatPts(headerAvg)}</strong>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Encerrado → transparência (read-only). Senão → apostas (client). */}
          {showTransparency ? (
            <MatchTransparency
              matchId={match.id}
              data={transparency!}
              home={match.home}
              away={match.away}
              isKnockout={isKnockout}
              attached
            />
          ) : (
            <BetSection match={match} balance={profile?.balance ?? 0} canPlaceBet={canPlaceBet} authed={!!profile} attached />
          )}
        </div>

        {/* SUAS APOSTAS NESSE JOGO (cancelável) */}
        {myBets.length > 0 && (
          <MyBetsHere bets={myBets} kickoff={match.startsAt} oddNowByOutcome={oddNowByOutcome} />
        )}
      </div>

      {/* STICKY CTA — só se ainda pode apostar */}
      {isScheduled && (
        <div className="fixed bottom-16 inset-x-0 z-20 bg-background/95 backdrop-blur border-t shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" />
                {formatCountdown(match.startsAt)} pro kickoff
                {multLabel && (
                  <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 rounded px-1.5 py-0.5 ml-1">
                    PAGA {multLabel}
                  </span>
                )}
              </div>
              <div className="mt-0.5">
                Pool {formatPts(total1x2)} · {match.bettorsCount} apostadores
              </div>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Toque num resultado acima ↑
            </span>
            <ArrowRight className="size-4 text-muted-foreground sm:hidden" />
          </div>
        </div>
      )}
    </AppShell>
  )
}
