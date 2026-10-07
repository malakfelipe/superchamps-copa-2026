"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Crown, Check, Loader2, Send } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { requestJoinLeagueAction } from "@/app/ligas/actions"
import type { DiscoverableLeague } from "@/lib/data/types"

type Props = {
  initial: DiscoverableLeague[]
  competitionName: string
}

/**
 * Lista de ligas focadas numa competição. Aparece no hub /competicoes/[slug]
 * aba "Ligas". Permite solicitar entrada in-line, mesma lógica de /ligas search.
 */
export function CompetitionLeaguesList({ initial, competitionName }: Props) {
  const [leagues, setLeagues] = useState<DiscoverableLeague[]>(initial)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  async function handleRequest(leagueId: string, leagueName: string) {
    setPendingIds((prev) => new Set(prev).add(leagueId))
    const res = await requestJoinLeagueAction(leagueId)
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.delete(leagueId)
      return next
    })

    if (res.error) {
      toast.error(res.error)
      return
    }

    toast.success(`Solicitação enviada pra ${leagueName}`, {
      description: "O owner vai receber notificação. Você é avisado quando decidir.",
    })

    setLeagues((prev) =>
      prev.map((l) => (l.id === leagueId ? { ...l, hasPendingRequest: true } : l)),
    )
  }

  if (leagues.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-6 text-center space-y-2">
          <Users className="size-5 text-muted-foreground mx-auto" />
          <p className="text-sm font-semibold">Sem ligas focadas ainda</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Seja o primeiro a criar uma liga focada em {competitionName}.
            Chama a galera no zap.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {leagues.map((league) => (
        <Card key={league.id} className="overflow-hidden">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
              <Users className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={`/ligas/${league.slug}`}
                  className="font-bold text-sm truncate hover:text-primary transition-colors"
                >
                  {league.name}
                </Link>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-0.5 shrink-0">
                  <Users className="size-2.5" />
                  {league.memberCount}
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <Crown className="size-3 shrink-0" />
                <span className="truncate">{league.ownerNickname}</span>
                {league.description && (
                  <>
                    <span>·</span>
                    <span className="truncate">{league.description}</span>
                  </>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {league.isMember ? (
                <Button size="sm" variant="outline" disabled className="gap-1">
                  <Check className="size-3.5" />
                  Membro
                </Button>
              ) : league.hasPendingRequest ? (
                <Button size="sm" variant="outline" disabled className="gap-1 text-amber-600">
                  <Send className="size-3.5" />
                  Pendente
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleRequest(league.id, league.name)}
                  disabled={pendingIds.has(league.id)}
                  className="gap-1"
                >
                  {pendingIds.has(league.id) ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  Solicitar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
