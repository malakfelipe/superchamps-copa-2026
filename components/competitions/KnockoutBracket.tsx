import { Flag } from "@/components/Flag"
import { cn } from "@/lib/utils"

type Team = { name: string; countryCode?: string | null; shortName?: string }

export type BracketMatch = {
  home?: Team
  away?: Team
  homeScore?: number | null
  awayScore?: number | null
  status: "scheduled" | "live" | "finished" | "tbd"
}

export type BracketRound = {
  label: string
  matches: BracketMatch[]
}

type Props = {
  rounds: BracketRound[]
  className?: string
}

/**
 * Bracket visual de mata-mata. Cada coluna é uma fase; vai diminuindo
 * a quantidade de jogos. Mobile: scroll horizontal.
 */
export function KnockoutBracket({ rounds, className }: Props) {
  return (
    <div className={cn("overflow-x-auto -mx-2 px-2 pb-2", className)}>
      <div className="inline-flex gap-3 items-center min-w-full">
        {rounds.map((round, idx) => (
          <div key={idx} className="flex flex-col gap-2 shrink-0">
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground text-center mb-1">
              {round.label}
            </div>
            <div
              className="flex flex-col justify-around gap-2"
              style={{ minHeight: rounds[0].matches.length * 52 }}
            >
              {round.matches.map((match, mIdx) => (
                <BracketMatchCard key={mIdx} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BracketMatchCard({ match }: { match: BracketMatch }) {
  const isTbd = match.status === "tbd" || (!match.home && !match.away)
  return (
    <div
      className={cn(
        "rounded-md border bg-card text-[11px] w-[140px] shrink-0",
        isTbd && "border-dashed opacity-50",
        match.status === "live" && "ring-1 ring-red-500/30",
      )}
    >
      <BracketTeamRow team={match.home} score={match.homeScore} dim={!isTbd && match.status === "finished" && (match.awayScore ?? 0) > (match.homeScore ?? 0)} />
      <div className="border-t" />
      <BracketTeamRow team={match.away} score={match.awayScore} dim={!isTbd && match.status === "finished" && (match.homeScore ?? 0) > (match.awayScore ?? 0)} />
    </div>
  )
}

function BracketTeamRow({ team, score, dim }: { team?: Team; score?: number | null; dim?: boolean }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1.5", dim && "opacity-50")}>
      {team?.countryCode ? (
        <Flag iso={team.countryCode} size={12} className="shrink-0" />
      ) : (
        <div className="size-3 rounded bg-muted shrink-0" />
      )}
      <div className="font-medium truncate flex-1">{team?.shortName || team?.name || "—"}</div>
      {score != null && (
        <div className="font-mono font-bold shrink-0">{score}</div>
      )}
    </div>
  )
}
