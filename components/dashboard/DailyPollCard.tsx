"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Zap, CheckCircle2, ChevronDown, X, Trophy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { TeamCrest } from "@/components/TeamCrest"
import { localizeTeamName } from "@/lib/teams"
import { formatKickoff } from "@/lib/format"
import { toast } from "sonner"
import { castPollVoteAction } from "@/app/inicio/actions"
import type { Match } from "@/lib/data/types"

export type PollCandidateView = { match: Match; votes: number }

type Props = {
  pollId: string
  multiplier: number
  closesAt: string          // ISO
  gameDate: string          // YYYY-MM-DD (BRT)
  myVoteMatchId: string | null
  candidates: PollCandidateView[]
}

const DISMISS_KEY = "superchamps:poll-dismissed"

const brt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", ...opts }).format(new Date(iso))

/**
 * Enquete "Jogo do Dia x2" na home — faixa fina, colável e dispensável.
 *   - colapsada (default): 1 linha; expande pra votar / ver resultado.
 *   - votou: vira "✓ você votou · ver resultado" (também colável).
 *   - X: oculta em localStorage até a próxima enquete (key = pollId).
 */
export function DailyPollCard({ pollId, multiplier, closesAt, gameDate, myVoteMatchId, candidates }: Props) {
  const [pending, startTransition] = useTransition()
  const [voted, setVoted] = useState<string | null>(myVoteMatchId)
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  // votos locais (otimista) por matchId
  const [votes, setVotes] = useState<Record<string, number>>(
    () => Object.fromEntries(candidates.map((c) => [c.match.id, c.votes])),
  )

  // SSR-safe: lê o estado de "ocultada" só no cliente (padrão do competitions-context)
  useEffect(() => {
    setHydrated(true)
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(DISMISS_KEY) === pollId) {
        setDismissed(true)
      }
    } catch { /* localStorage indisponível (modo privado/quota) — ignora */ }
  }, [pollId])

  const total = useMemo(() => Object.values(votes).reduce((a, b) => a + b, 0), [votes])
  const leaderId = useMemo(
    () => Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0],
    [votes],
  )

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, pollId) } catch { /* ignora */ }
    setDismissed(true)
  }

  const vote = (matchId: string) => {
    if (pending || voted === matchId) return
    const prev = voted
    setVotes((v) => {
      const next = { ...v, [matchId]: (v[matchId] ?? 0) + 1 }
      if (prev && prev !== matchId) next[prev] = Math.max(0, (next[prev] ?? 0) - 1)
      return next
    })
    setVoted(matchId)
    setExpanded(false) // colapsa em 1 linha após votar
    startTransition(async () => {
      const r = await castPollVoteAction(pollId, matchId)
      if (!r.ok) {
        setVotes((v) => {
          const next = { ...v, [matchId]: Math.max(0, (v[matchId] ?? 0) - 1) }
          if (prev && prev !== matchId) next[prev] = (next[prev] ?? 0) + 1
          return next
        })
        setVoted(prev)
        toast.error(r.error || "Erro ao votar")
      }
    })
  }

  if (hydrated && dismissed) return null

  const closesLabel = `${brt(closesAt, { day: "2-digit", month: "2-digit" })} ${brt(closesAt, { hour: "2-digit", minute: "2-digit" })}`
  const votedMatch = candidates.find((c) => c.match.id === voted)?.match
  const votedLabel = votedMatch
    ? `${localizeTeamName(votedMatch.home.name)} × ${localizeTeamName(votedMatch.away.name)}`
    : ""

  return (
    <Card className="overflow-hidden border-2 border-primary/30">
      {/* FAIXA (sempre visível) */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {voted
            ? <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            : <Zap className="size-4 text-primary shrink-0" />}
          <span className="text-xs min-w-0 truncate">
            {voted ? (
              <>
                <span className="font-semibold">Você votou</span>
                <span className="text-muted-foreground"> em {votedLabel} · ver resultado</span>
              </>
            ) : (
              <>
                <span className="font-semibold">Jogo do dia x{multiplier}</span>
                <span className="text-muted-foreground"> · toque pra votar · fecha {closesLabel}</span>
              </>
            )}
          </span>
          <ChevronDown className={`size-4 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Ocultar enquete"
          className="shrink-0 text-muted-foreground hover:text-foreground p-1 -mr-1"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* CONTEÚDO (expandido) */}
      {expanded && (
        <CardContent className="p-3 pt-0 space-y-2">
          {!voted && (
            <p className="text-[11px] text-muted-foreground -mt-1">
              Vote no jogo que paga {multiplier}× os pontos · fecha {closesLabel}
            </p>
          )}
          {candidates.map(({ match }) => {
            const v = votes[match.id] ?? 0
            const pct = total > 0 ? Math.round((v / total) * 100) : 0
            const isVote = voted === match.id
            const isLeader = match.id === leaderId
            return (
              <button
                key={match.id}
                type="button"
                onClick={() => vote(match.id)}
                disabled={pending}
                className={`w-full text-left rounded-lg border p-2.5 relative overflow-hidden transition-all ${
                  isVote ? "border-primary ring-1 ring-primary/40" : "hover:border-primary/40"
                } ${voted ? "cursor-default" : "cursor-pointer"}`}
              >
                {voted && (
                  <div
                    className={`absolute inset-y-0 left-0 ${isLeader ? "bg-primary/10" : "bg-muted/60"} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <TeamCrest name={match.home.name} iso={match.home.iso} logoUrl={match.home.logoUrl} size={16} preferFlag />
                    <span className="text-xs font-semibold truncate">{localizeTeamName(match.home.name)}</span>
                    <span className="text-[10px] text-muted-foreground">×</span>
                    <TeamCrest name={match.away.name} iso={match.away.iso} logoUrl={match.away.logoUrl} size={16} preferFlag />
                    <span className="text-xs font-semibold truncate">{localizeTeamName(match.away.name)}</span>
                  </div>
                  {voted ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isLeader && <Trophy className="size-3 text-amber-500" />}
                      {isVote && <CheckCircle2 className="size-3.5 text-primary" />}
                      <span className="font-mono font-bold text-xs">{pct}%</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {formatKickoff(match.startsAt)}
                    </span>
                  )}
                </div>
                {voted && (
                  <div className="relative text-[10px] text-muted-foreground mt-0.5 font-mono">{v} votos</div>
                )}
              </button>
            )
          })}

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>{total} votos no total</span>
            {voted ? (
              <span className="text-primary font-medium">Voto registrado ✓</span>
            ) : (
              <span>Toque pra votar</span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
