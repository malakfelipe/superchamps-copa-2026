"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronLeft, Vote, Zap, Clock, CheckCircle2, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flag } from "@/components/Flag"

/**
 * PROTÓTIPO — enquete "Jogo do Dia x2".
 * Modelo de votação pra escolher qual jogo do dia seguinte (fase de grupos,
 * a partir da 2ª rodada) recebe multiplicador x2. Estático; quando aprovado,
 * vira tabela `daily_polls` + `poll_votes` + cron que aplica payout_multiplier=2
 * no jogo vencedor ao fechar a votação.
 */

type Candidate = {
  id: string
  home: { name: string; iso: string }
  away: { name: string; iso: string }
  kickoff: string
  votes: number
}

const INITIAL: Candidate[] = [
  { id: "g1", home: { name: "Brasil", iso: "br" }, away: { name: "Haiti", iso: "ht" }, kickoff: "20 jun · 17:00", votes: 412 },
  { id: "g2", home: { name: "Holanda", iso: "nl" }, away: { name: "Suécia", iso: "se" }, kickoff: "20 jun · 14:00", votes: 287 },
  { id: "g3", home: { name: "Alemanha", iso: "de" }, away: { name: "Costa do Marfim", iso: "ci" }, kickoff: "20 jun · 11:00", votes: 198 },
  { id: "g4", home: { name: "Turquia", iso: "tr" }, away: { name: "Paraguai", iso: "py" }, kickoff: "20 jun · 23:00", votes: 64 },
]

export default function EnquetePage() {
  const [candidates, setCandidates] = useState(INITIAL)
  const [voted, setVoted] = useState<string | null>(null)

  const total = candidates.reduce((acc, c) => acc + c.votes, 0)
  const leaderId = [...candidates].sort((a, b) => b.votes - a.votes)[0]?.id

  const vote = (id: string) => {
    if (voted) return
    setVoted(id)
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c)))
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link href="/design-system">
            <ChevronLeft className="size-4 mr-1" />
            Design Sandbox
          </Link>
        </Button>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Vote className="size-5 text-primary" />
          Enquete — Jogo do Dia x2
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          A comunidade vota em qual jogo do dia seguinte paga <strong>x2</strong>. Só fase de grupos,
          a partir da 2ª rodada. Vencedor recebe o multiplicador quando a votação fecha (meia-noite).
        </p>
      </div>

      <div className="max-w-md">
        <Card className="overflow-hidden border-2 border-primary/30">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-primary/15 via-amber-100/30 to-background dark:via-amber-950/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-lg bg-primary/15 grid place-items-center">
                  <Zap className="size-5 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight">Jogo do Dia x2</div>
                  <div className="text-[11px] text-muted-foreground">Vote no jogo de amanhã que paga dobro</div>
                </div>
              </div>
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Clock className="size-2.5" />
                fecha 00:00
              </Badge>
            </div>
          </div>

          <CardContent className="p-3 space-y-2">
            {candidates.map((c) => {
              const pct = total > 0 ? Math.round((c.votes / total) * 100) : 0
              const isVote = voted === c.id
              const isLeader = c.id === leaderId
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => vote(c.id)}
                  disabled={!!voted}
                  className={`w-full text-left rounded-lg border p-2.5 relative overflow-hidden transition-all ${
                    isVote ? "border-primary ring-1 ring-primary/40" : "hover:border-primary/40"
                  } ${voted ? "cursor-default" : "cursor-pointer"}`}
                >
                  {/* barra de fundo proporcional aos votos (só após votar) */}
                  {voted && (
                    <div
                      className={`absolute inset-y-0 left-0 ${isLeader ? "bg-primary/10" : "bg-muted/60"} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                  <div className="relative flex items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Flag iso={c.home.iso} size={16} />
                      <span className="text-xs font-semibold truncate">{c.home.name}</span>
                      <span className="text-[10px] text-muted-foreground">×</span>
                      <Flag iso={c.away.iso} size={16} />
                      <span className="text-xs font-semibold truncate">{c.away.name}</span>
                    </div>
                    {voted ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLeader && <Trophy className="size-3 text-amber-500" />}
                        {isVote && <CheckCircle2 className="size-3.5 text-primary" />}
                        <span className="font-mono font-bold text-xs">{pct}%</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">{c.kickoff}</span>
                    )}
                  </div>
                  {voted && (
                    <div className="relative text-[10px] text-muted-foreground mt-0.5 font-mono">
                      {c.votes} votos
                    </div>
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
        </Card>

        <Card className="bg-muted/40 border-dashed mt-3">
          <CardContent className="p-3 text-[11px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Lógica pra produção</p>
            <p>• Candidatos = jogos de grupo do dia seguinte (rodada ≥ 2), 3–5 por dia.</p>
            <p>• 1 voto por usuário · barra/percentual aparecem após votar.</p>
            <p>• Cron 00:00 fecha a enquete → seta <code className="font-mono">payout_multiplier = 2</code> no jogo vencedor → badge &quot;PAGA x2&quot; aparece sozinho (mesma infra do knockout).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
