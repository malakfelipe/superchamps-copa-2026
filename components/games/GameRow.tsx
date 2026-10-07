/**
 * @deprecated Use `<MatchCardProd>` em vez deste. Substituído em 2026-05-31
 * em /jogos e /inicio. Mantido temporariamente como rollback escape hatch —
 * remover quando confiante na nova UI (sugestão: ~2 semanas após).
 */
import Link from "next/link"
import { Target, CheckCircle2, XCircle, MapPin, ChevronRight, Users } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Flag } from "@/components/Flag"
import { formatTime, formatCountdown } from "@/lib/format"
import { localizeTeamName } from "@/lib/teams"
import type { Match } from "@/lib/data/types"

const STAGE_LABEL: Record<Match["stage"], string> = {
  group_a: "Grupo A", group_b: "Grupo B", group_c: "Grupo C", group_d: "Grupo D",
  group_e: "Grupo E", group_f: "Grupo F", group_g: "Grupo G", group_h: "Grupo H",
  group_i: "Grupo I", group_j: "Grupo J", group_k: "Grupo K", group_l: "Grupo L",
  round_of_32: "16-avos", round_of_16: "Oitavas", quarter: "Quartas",
  semi: "Semifinal", third: "3° lugar", final: "Final",
}

const KNOCKOUT_STAGES: Match["stage"][] = [
  "round_of_32", "round_of_16", "quarter", "semi", "third", "final",
]

function isKnockout(stage: Match["stage"]): boolean {
  return KNOCKOUT_STAGES.includes(stage)
}

function formatPool(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function GameRow({ g, now = new Date() }: { g: Match; now?: Date }) {
  const isLive = g.status === "live"
  const isFinished = g.status === "finished"
  const isScheduled = g.status === "scheduled"
  const homeName = localizeTeamName(g.home.name)
  const awayName = localizeTeamName(g.away.name)
  const stageShort = STAGE_LABEL[g.stage] || g.stage
  const betsCount = g.betsCount ?? 0
  const knockoutPaysDouble = isKnockout(g.stage)

  return (
    <Link
      href={`/jogos/${g.id}`}
      className={`block w-full px-3.5 py-3 hover:bg-accent transition-colors ${g.myBetStatus && g.myBetStatus !== "none" ? "bg-primary/[0.03]" : ""}`}
    >
      <div className="flex items-center gap-3">
        {/* Coluna 1: Stage + horário/status + countdown */}
        <div className="w-16 shrink-0 text-center space-y-0.5">
          <div className="text-[9px] font-bold uppercase tracking-wider text-primary truncate">
            {stageShort}
          </div>
          {knockoutPaysDouble && (
            <div className="text-[8px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 rounded px-1 py-0.5 inline-block leading-none">
              PAGA 2×
            </div>
          )}
          {isLive ? (
            <>
              <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center justify-center gap-1">
                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                ao vivo
              </div>
              <div className="font-mono font-bold text-sm tabular-nums">{g.liveMinute}′</div>
            </>
          ) : isFinished ? (
            <>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Encerrado</div>
              <div className="font-mono text-xs text-muted-foreground tabular-nums">{formatTime(g.startsAt)}</div>
            </>
          ) : (
            <>
              <div className="font-mono font-bold text-sm tabular-nums">{formatTime(g.startsAt)}</div>
              <div className="text-[10px] text-muted-foreground">
                {formatCountdown(g.startsAt, now).replace("em ", "")}
              </div>
            </>
          )}
        </div>

        <Separator orientation="vertical" className="h-12 shrink-0" />

        {/* Coluna 2: Times com nome completo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Flag name={g.home.name} iso={g.home.iso} size={22} />
            <span className={`font-semibold text-sm truncate ${(isLive || isFinished) && (g.homeScore ?? 0) <= (g.awayScore ?? 0) ? "text-muted-foreground" : ""}`}>
              {homeName}
            </span>
            {(isLive || isFinished) && g.homeScore !== null && g.awayScore !== null && (
              <span className={`font-mono font-extrabold text-lg tabular-nums ml-auto ${(g.homeScore ?? 0) > (g.awayScore ?? 0) ? "" : "text-muted-foreground"}`}>
                {g.homeScore}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0 mt-0.5">
            <Flag name={g.away.name} iso={g.away.iso} size={22} />
            <span className={`font-semibold text-sm truncate ${(isLive || isFinished) && (g.awayScore ?? 0) <= (g.homeScore ?? 0) ? "text-muted-foreground" : ""}`}>
              {awayName}
            </span>
            {(isLive || isFinished) && g.homeScore !== null && g.awayScore !== null && (
              <span className={`font-mono font-extrabold text-lg tabular-nums ml-auto ${(g.awayScore ?? 0) > (g.homeScore ?? 0) ? "" : "text-muted-foreground"}`}>
                {g.awayScore}
              </span>
            )}
          </div>
        </div>

        {/* Coluna 3: Pool + bet count + meu status */}
        <div className="text-right shrink-0 min-w-[64px]">
          {g.poolTotal > 0 || betsCount > 0 ? (
            <div className="text-[11px] leading-tight">
              <div className="font-mono font-bold text-foreground">{formatPool(g.poolTotal)} pts</div>
              <div className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5 justify-end font-mono">
                <Users className="size-2.5" />
                {betsCount} {betsCount === 1 ? "aposta" : "apostas"}
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground">sem apostas</div>
          )}
          {g.myBetStatus && g.myBetStatus !== "none" && (
            <div className="mt-1">
              {g.myBetStatus === "won" ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                  <CheckCircle2 className="size-3" /> acertou
                </span>
              ) : g.myBetStatus === "lost" ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-destructive">
                  <XCircle className="size-3" /> errou
                </span>
              ) : g.myBetStatus === "open" ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary">
                  <Target className="size-3" /> apostado
                </span>
              ) : null}
            </div>
          )}
        </div>
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      </div>

      {/* Linha de baixo: venue (se houver) */}
      {g.venue && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5 ml-[68px]">
          <MapPin className="size-2.5 shrink-0" />
          <span className="truncate">{g.venue}</span>
        </div>
      )}
    </Link>
  )
}
