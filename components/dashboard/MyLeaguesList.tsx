import Link from "next/link"
import { ChevronRight, Lock, Globe, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flag } from "@/components/Flag"
import { getCompetitionDesign } from "@/lib/competitions-design"
import { cn } from "@/lib/utils"
import type { LeagueMembership, LeagueVisibility } from "@/lib/data/types"

function VisibilityIcon({ v }: { v: LeagueVisibility }) {
  if (v === "private") return <Lock className="size-3" />
  if (v === "global") return <Globe className="size-3" />
  return <Users className="size-3" />
}

function visibilityLabel(v: LeagueVisibility): string {
  if (v === "private") return "Privada"
  if (v === "global") return "Global"
  return "Pública"
}

export function MyLeaguesList({ leagues }: { leagues: LeagueMembership[] }) {
  if (leagues.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground space-y-2">
          <p>Você ainda não está em nenhuma liga.</p>
          <div className="flex gap-2 justify-center">
            <Link href="/ligas/criar" className="text-primary hover:underline">Criar liga</Link>
            <span>·</span>
            <Link href="/ligas/entrar" className="text-primary hover:underline">Entrar com código</Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-1.5">
      {leagues.map((l) => {
        const isTop3 = l.myRank <= 3
        const design = l.competition ? getCompetitionDesign(l.competition.slug) : null
        return (
          <Link key={l.id} href={`/ligas/${l.slug}`}>
            <Card
              className={cn(
                "hover:shadow-sm transition-shadow cursor-pointer",
                design && cn("border-l-4 border-opacity-30", design.accentBorder),
              )}
            >
              <CardContent className="px-3 py-2 flex items-center gap-2.5">
                {l.emoji && <div className="text-xl shrink-0">{l.emoji}</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-sm truncate">{l.name}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1 gap-0.5 shrink-0">
                      <VisibilityIcon v={l.visibility} />
                      {visibilityLabel(l.visibility)}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">{l.totalMembers.toLocaleString("pt-BR")} membros</span>
                    {l.competition && design && (
                      <span
                        className={cn("inline-flex items-center gap-1 min-w-0", design.accent)}
                        title={`Focada em ${l.competition.name}`}
                      >
                        ·
                        {l.competition.countryCode ? (
                          <Flag iso={l.competition.countryCode} size={10} />
                        ) : (
                          <span className="text-[9px] leading-none">{l.competition.icon || "⚽"}</span>
                        )}
                        <span className="truncate">{l.competition.name}</span>
                      </span>
                    )}
                    {l.trend !== 0 && (
                      <span className={`shrink-0 ${l.trend > 0 ? "text-emerald-600" : "text-destructive"}`}>
                        {l.trend > 0 ? "↑" : "↓"}{Math.abs(l.trend)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-baseline gap-1.5">
                  <span className={`font-mono font-extrabold text-base leading-none ${isTop3 ? "text-amber-500" : ""}`}>
                    #{l.myRank}
                  </span>
                  <span className={`font-mono text-[11px] ${l.myNetPoints >= 0 ? "text-primary" : "text-destructive"}`}>
                    {l.myNetPoints >= 0 ? "+" : ""}{l.myNetPoints}
                  </span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
