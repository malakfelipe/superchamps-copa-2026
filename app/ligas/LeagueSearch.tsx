"use client"

import { useEffect, useState, useTransition, useRef } from "react"
import Link from "next/link"
import { Search, Users, Crown, Check, Loader2, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { searchLeaguesAction, requestJoinLeagueAction } from "./actions"
import type { DiscoverableLeague } from "@/lib/data/types"

type Props = {
  initialResults: DiscoverableLeague[]
}

export function LeagueSearch({ initialResults }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<DiscoverableLeague[]>(initialResults)
  const [isPending, startTransition] = useTransition()
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce: dispara busca 300ms depois do user parar de digitar
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchLeaguesAction(query)
        setResults(data)
      })
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

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
      description: "O owner vai receber uma notificação. Você é avisado quando decidir.",
    })

    // Atualiza estado local pra refletir pendente
    setResults((prev) =>
      prev.map((l) => (l.id === leagueId ? { ...l, hasPendingRequest: true } : l)),
    )
  }

  return (
    <section className="space-y-3">
      <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
        <Search className="size-3.5" />
        Explorar ligas
      </h2>

      <div className="relative">
        <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar liga pelo nome..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-11"
          autoComplete="off"
        />
        {isPending && (
          <Loader2 className="size-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
        )}
      </div>

      {results.length === 0 ? (
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-6 text-center space-y-1.5">
            <Search className="size-5 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold">
              {query.trim() ? "Nada encontrado" : "Nenhuma liga aberta ainda"}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {query.trim()
                ? "Tenta outro nome. Só ligas que o owner marcou como buscáveis aparecem aqui."
                : "Ligas só aparecem quando o owner ativa a opção de descoberta. Por enquanto, entre com código de convite."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {results.map((league) => (
            <LeagueRow
              key={league.id}
              league={league}
              onRequest={handleRequest}
              isRequesting={pendingIds.has(league.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function LeagueRow({
  league,
  onRequest,
  isRequesting,
}: {
  league: DiscoverableLeague
  onRequest: (leagueId: string, leagueName: string) => void
  isRequesting: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="size-11 rounded-xl bg-primary/10 grid place-items-center shrink-0">
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
              onClick={() => onRequest(league.id, league.name)}
              disabled={isRequesting}
              className="gap-1"
            >
              {isRequesting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Solicitar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
