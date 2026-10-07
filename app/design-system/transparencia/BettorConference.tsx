"use client"

import { useMemo, useState } from "react"
import { Search, CheckCircle2, XCircle, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Flag } from "@/components/Flag"

/**
 * PROTÓTIPO — conferência por apostador do jogo encerrado.
 * Top 10 que acertaram / erraram (toggle) + busca por nickname.
 * Em produção: lê bets (status won/lost, stake, payout) + profiles (nickname,
 * bets_publicly_visible) via RPC SECURITY DEFINER — só quem tem histórico
 * público aparece. Mock estático aqui.
 */

type Pick = "home" | "draw" | "away"
type Props = {
  winner: Pick
  paidOdd: number
  picks: Record<Pick, { short: string; iso: string | null }>
  totalBettors: number
}

const NAMES = [
  "thiagozin", "marina.go", "pedrocas", "ju_almeida", "rafa10", "bia_santos",
  "gugaa", "leo.martins", "camila_p", "dudu7", "fer_souza", "carol.m",
  "vinizinho", "tati.r", "bruno.costa", "lara_oli", "matheuus", "nanda90",
  "rod_silva", "paty", "gabsz", "ney.torce", "duda.r", "igor_p",
  "mel.alves", "caio.ferr", "sofiaa", "artur_m", "babi", "zequinha",
  "ma.lima", "joaozin",
]
const STAKES = [80, 150, 500, 100, 300, 1000, 50, 250, 200, 400, 120, 700]
const pickFor = (i: number): Pick => {
  const m = i % 16
  return m < 9 ? "home" : m < 13 ? "draw" : "away"
}

export function BettorConference({ winner, paidOdd, picks, totalBettors }: Props) {
  const [tab, setTab] = useState<"won" | "lost">("won")
  const [q, setQ] = useState("")

  const all = useMemo(() => {
    return NAMES.map((nickname, i) => {
      const pick = pickFor(i)
      const stake = STAKES[i % STAKES.length]
      const won = pick === winner
      const net = won ? Math.round(stake * paidOdd) - stake : -stake
      return { nickname, pick, stake, won, net }
    })
  }, [winner, paidOdd])

  const wonList = useMemo(() => all.filter((b) => b.won).sort((a, b) => b.net - a.net), [all])
  const lostList = useMemo(() => all.filter((b) => !b.won).sort((a, b) => b.stake - a.stake), [all])

  const query = q.trim().toLowerCase()
  const searchHits = query
    ? all.filter((b) => b.nickname.toLowerCase().includes(query)).sort((a, b) => b.stake - a.stake)
    : []

  const list = query ? searchHits : (tab === "won" ? wonList : lostList).slice(0, 10)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <Users className="size-4 text-primary" />
            Conferência por apostador
          </h3>
          <span className="text-[10px] text-muted-foreground">{all.length} de {totalBettors} públicos</span>
        </div>

        {/* busca */}
        <div className="relative">
          <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="buscar por nickname..."
            className="h-8 text-xs pl-8"
          />
        </div>

        {/* toggle (some quando buscando) */}
        {!query && (
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setTab("won")}
              className={`h-7 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                tab === "won" ? "bg-background shadow-sm text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              }`}
            >
              <CheckCircle2 className="size-3.5" /> Acertaram ({wonList.length})
            </button>
            <button
              onClick={() => setTab("lost")}
              className={`h-7 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                tab === "lost" ? "bg-background shadow-sm text-rose-600 dark:text-rose-400" : "text-muted-foreground"
              }`}
            >
              <XCircle className="size-3.5" /> Erraram ({lostList.length})
            </button>
          </div>
        )}

        {/* lista */}
        <div className="divide-y max-h-72 overflow-y-auto -mx-1">
          {list.map((b, i) => {
            const meta = picks[b.pick]
            return (
              <div key={b.nickname} className="flex items-center gap-2 px-1 py-1.5 text-xs">
                {query ? (
                  b.won
                    ? <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    : <XCircle className="size-3.5 text-rose-400 shrink-0" />
                ) : (
                  <span className="w-5 text-center font-mono text-muted-foreground shrink-0">{i + 1}</span>
                )}
                <span className="flex-1 min-w-0 font-medium truncate">{b.nickname}</span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 w-16 justify-end">
                  {meta.iso && <Flag iso={meta.iso} size={12} />}
                  <span className="truncate">{meta.short}</span>
                </span>
                <span className="font-mono text-muted-foreground tabular-nums shrink-0 w-12 text-right">{b.stake}</span>
                <span className={`font-mono font-bold tabular-nums shrink-0 w-16 text-right ${b.won ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                  {b.net > 0 ? `+${b.net.toLocaleString("pt-BR")}` : b.net.toLocaleString("pt-BR")}
                </span>
              </div>
            )
          })}
          {query && searchHits.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum apostador público com esse nick.</p>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground">
          Só aparecem apostadores com histórico público. Colunas: palpite · pts apostados · lucro/prejuízo líquido.
        </p>
      </CardContent>
    </Card>
  )
}
