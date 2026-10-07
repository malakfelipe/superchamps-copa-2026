import { Clock, Flame } from "lucide-react"
import { Flag } from "@/components/Flag"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/format"

type Team = { name: string; countryCode?: string | null; shortName?: string }

type Props = {
  home: Team
  away: Team
  date: Date
  status: "scheduled" | "live" | "finished"
  liveMinute?: number | null
  homeScore?: number | null
  awayScore?: number | null
  stageLabel?: string
  venue?: string | null
  betsCount?: number
  popularPick?: "home" | "draw" | "away"
  className?: string
  onClick?: () => void
}

/**
 * Card de partida — estilo Sofascore.
 * 3 colunas: time casa | placar/horário | time visitante.
 * Status fica em cima (HOJE / 78' / FINAL).
 * Stats sociais (bets count + popular) embaixo se aplicável.
 */
export function MatchCard({
  home, away, date, status, liveMinute, homeScore, awayScore,
  stageLabel, venue, betsCount, popularPick,
  className, onClick,
}: Props) {
  // BRT explícito (não confia em timezone do servidor)
  const timeStr = formatTime(date)
  const isLive = status === "live"
  const isFinished = status === "finished"
  const hasScore = isLive || isFinished

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border bg-card hover:border-primary/40 transition-colors",
        isLive && "ring-1 ring-red-500/30",
        className,
      )}
    >
      {/* HEADER: stage + status */}
      {(stageLabel || isLive) && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          {stageLabel && <span className="uppercase tracking-wider font-semibold">{stageLabel}</span>}
          {isLive && (
            <span className="flex items-center gap-1 text-red-500 font-bold uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
              AO VIVO {liveMinute ? `${liveMinute}'` : ""}
            </span>
          )}
        </div>
      )}

      {/* MAIN: teams + score/time */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSide team={home} align="left" isWinner={isFinished && (homeScore ?? 0) > (awayScore ?? 0)} />
        <div className="text-center min-w-[60px]">
          {hasScore ? (
            <div className="font-bold text-xl font-mono leading-none">
              {homeScore ?? "—"}<span className="mx-1.5 text-muted-foreground/50">×</span>{awayScore ?? "—"}
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                <Clock className="size-2.5" />
                {timeStr}
              </div>
            </div>
          )}
        </div>
        <TeamSide team={away} align="right" isWinner={isFinished && (awayScore ?? 0) > (homeScore ?? 0)} />
      </div>

      {/* FOOTER: stats sociais */}
      {(betsCount && betsCount > 0) || venue ? (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t border-dashed">
          {venue && <span className="truncate">{venue}</span>}
          {betsCount !== undefined && betsCount > 0 && (
            <span className="flex items-center gap-1 shrink-0">
              <Flame className="size-3" />
              {betsCount.toLocaleString("pt-BR")} palpites
              {popularPick && (
                <span className="ml-1 px-1 rounded bg-muted text-[9px] uppercase tracking-wider font-bold">
                  → {popularPick === "home" ? home.shortName || home.name : popularPick === "away" ? away.shortName || away.name : "Empate"}
                </span>
              )}
            </span>
          )}
        </div>
      ) : null}
    </button>
  )
}

function TeamSide({
  team, align, isWinner,
}: { team: Team; align: "left" | "right"; isWinner: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 min-w-0", align === "right" && "flex-row-reverse text-right")}>
      {team.countryCode ? (
        <Flag iso={team.countryCode} size={22} className="shrink-0" />
      ) : (
        <div className="size-5 rounded bg-muted shrink-0" />
      )}
      <div className={cn("min-w-0 font-semibold text-sm leading-tight truncate", !isWinner && "text-muted-foreground/70 font-medium")}>
        {team.name}
      </div>
    </div>
  )
}
