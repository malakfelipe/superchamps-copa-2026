import { TeamCrest } from "@/components/TeamCrest"
import { cn } from "@/lib/utils"

type Team = { name: string; countryCode?: string | null; shortName?: string; logoUrl?: string | null }

export type StandingRow = {
  rank: number
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  recentForm?: ("W" | "D" | "L")[]
}

type Props = {
  label?: string                      // "Grupo A" / "Tabela única"
  rows: StandingRow[]
  /** Quantidade de colocados em zona "qualificação" (top N). Realça no rank. */
  qualifyTop?: number
  /** Força bandeira em vez de escudo. Use pra torneios de seleção. */
  preferFlag?: boolean
  className?: string
}

export function StandingsTable({ label, rows, qualifyTop = 2, preferFlag = false, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground px-1">
          {label}
        </h3>
      )}
      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr className="text-muted-foreground">
              <th className="text-left font-semibold px-2 py-2 w-8">#</th>
              <th className="text-left font-semibold px-2 py-2">Time</th>
              <th className="text-center font-mono font-semibold px-1.5 py-2 w-7">J</th>
              <th className="text-center font-mono font-semibold px-1.5 py-2 w-7 hidden sm:table-cell">V</th>
              <th className="text-center font-mono font-semibold px-1.5 py-2 w-7 hidden sm:table-cell">E</th>
              <th className="text-center font-mono font-semibold px-1.5 py-2 w-7 hidden sm:table-cell">D</th>
              <th className="text-center font-mono font-semibold px-1.5 py-2 w-9 hidden md:table-cell">GP</th>
              <th className="text-center font-mono font-semibold px-1.5 py-2 w-9 hidden md:table-cell">GC</th>
              <th className="text-center font-mono font-semibold px-1.5 py-2 w-9">SG</th>
              <th className="text-center font-mono font-bold px-2 py-2 w-9">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => {
              const isQualifying = r.rank <= qualifyTop
              return (
                <tr key={r.rank} className="hover:bg-muted/30 transition-colors">
                  <td className="px-2 py-2 relative">
                    {isQualifying && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-emerald-500 rounded-r" />
                    )}
                    <span className={cn("font-mono font-bold", isQualifying ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                      {r.rank}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamCrest
                        name={r.team.name}
                        iso={r.team.countryCode || undefined}
                        logoUrl={r.team.logoUrl}
                        preferFlag={preferFlag}
                        size={22}
                        className="shrink-0"
                      />
                      <span className="font-medium truncate">{r.team.name}</span>
                    </div>
                  </td>
                  <td className="text-center font-mono px-1.5 py-2">{r.played}</td>
                  <td className="text-center font-mono px-1.5 py-2 hidden sm:table-cell">{r.won}</td>
                  <td className="text-center font-mono px-1.5 py-2 hidden sm:table-cell">{r.drawn}</td>
                  <td className="text-center font-mono px-1.5 py-2 hidden sm:table-cell">{r.lost}</td>
                  <td className="text-center font-mono px-1.5 py-2 hidden md:table-cell">{r.goalsFor}</td>
                  <td className="text-center font-mono px-1.5 py-2 hidden md:table-cell">{r.goalsAgainst}</td>
                  <td className={cn("text-center font-mono px-1.5 py-2",
                    r.goalDiff > 0 && "text-emerald-600 dark:text-emerald-400",
                    r.goalDiff < 0 && "text-destructive")}>
                    {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                  </td>
                  <td className="text-center font-mono font-bold px-2 py-2">{r.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {qualifyTop > 0 && rows.length > qualifyTop && (
        <div className="text-[10px] text-muted-foreground px-1 flex items-center gap-1.5">
          <div className="h-2 w-0.5 bg-emerald-500 rounded" />
          Zona de qualificação (top {qualifyTop})
        </div>
      )}
    </div>
  )
}
