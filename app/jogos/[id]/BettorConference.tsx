"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Search, CheckCircle2, XCircle, Users, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Flag } from "@/components/Flag"
import { formatPts } from "@/lib/format"
import { searchMatchBettorsAction } from "./actions"
import type { TransparencyBettor } from "@/lib/data/types"

type Pick = "home" | "draw" | "away"

type Props = {
  matchId: string
  topWon: TransparencyBettor[]
  topLost: TransparencyBettor[]
  winnersCount: number
  losersCount: number
  picks: Record<Pick, { short: string; iso: string | null }>
}

export function BettorConference({ matchId, topWon, topLost, winnersCount, losersCount, picks }: Props) {
  const [tab, setTab] = useState<"won" | "lost">("won")
  const [q, setQ] = useState("")
  const [results, setResults] = useState<TransparencyBettor[] | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const query = q.trim()
    if (!query) { setResults(null); return }
    const t = setTimeout(() => {
      startTransition(async () => setResults(await searchMatchBettorsAction(matchId, query)))
    }, 300)
    return () => clearTimeout(t)
  }, [q, matchId])

  const searching = q.trim().length > 0
  const list = searching ? (results ?? []) : (tab === "won" ? topWon : topLost)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-1.5">
          <Users className="size-4 text-primary" />
          Conferência por apostador
        </h3>

        {/* busca */}
        <div className="relative">
          {pending
            ? <Loader2 className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 animate-spin" />
            : <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />}
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="buscar por nickname..."
            className="h-8 text-xs pl-8"
          />
        </div>

        {/* toggle (some quando buscando) */}
        {!searching && (
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setTab("won")}
              className={`h-7 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                tab === "won" ? "bg-background shadow-sm text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              }`}
            >
              <CheckCircle2 className="size-3.5" /> Acertaram ({winnersCount})
            </button>
            <button
              onClick={() => setTab("lost")}
              className={`h-7 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                tab === "lost" ? "bg-background shadow-sm text-rose-600 dark:text-rose-400" : "text-muted-foreground"
              }`}
            >
              <XCircle className="size-3.5" /> Erraram ({losersCount})
            </button>
          </div>
        )}

        {/* lista */}
        <div className="divide-y max-h-72 overflow-y-auto -mx-1">
          {list.map((b, i) => {
            const meta = picks[b.outcome]
            return (
              <div key={`${b.nickname}-${i}`} className="flex items-center gap-2 px-1 py-1.5 text-xs">
                {searching ? (
                  b.won
                    ? <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    : <XCircle className="size-3.5 text-rose-400 shrink-0" />
                ) : (
                  <span className="w-5 text-center font-mono text-muted-foreground shrink-0">{i + 1}</span>
                )}
                <Link href={`/u/${b.nickname}`} className="flex-1 min-w-0 font-medium truncate hover:text-primary hover:underline">
                  {b.nickname}
                </Link>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 w-16 justify-end">
                  {meta?.iso && <Flag iso={meta.iso} size={12} />}
                  <span className="truncate">{meta?.short}</span>
                </span>
                <span className="font-mono text-muted-foreground tabular-nums shrink-0 w-12 text-right">{b.stake}</span>
                <span className={`font-mono font-bold tabular-nums shrink-0 w-16 text-right ${b.won ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                  {b.net > 0 ? `+${formatPts(b.net)}` : formatPts(b.net)}
                </span>
              </div>
            )
          })}
          {searching && !pending && (results?.length ?? 0) === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum apostador público com esse nick.</p>
          )}
          {!searching && list.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Ninguém {tab === "won" ? "acertou" : "errou"} esse mercado.
            </p>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground">
          Só aparecem apostadores com histórico público. Colunas: palpite · pts apostados · lucro/prejuízo líquido.
        </p>
      </CardContent>
    </Card>
  )
}
