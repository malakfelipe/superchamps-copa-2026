"use client"

import { useTransition } from "react"
import { X, Target } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { toast } from "sonner"
import { cancelBetAction } from "../actions"
import type { OpenBet } from "@/lib/data/types"

type Props = {
  bets: OpenBet[]
  kickoff: Date
  oddNowByOutcome: Record<string, number>  // pra calcular payout potencial atualizado
}

export function MyBetsHere({ bets, kickoff, oddNowByOutcome }: Props) {
  const [pending, startTransition] = useTransition()

  const canCancel = (kickoff: Date) => {
    // 5 min antes do kickoff
    return kickoff.getTime() - Date.now() > 5 * 60 * 1000
  }

  const handleCancel = (betId: string) => {
    startTransition(async () => {
      const result = await cancelBetAction(betId)
      if (result.ok) {
        toast.success("Aposta cancelada. Stake devolvido ao saldo.")
      } else {
        toast.error(result.error || "Erro ao cancelar")
      }
    })
  }

  if (bets.length === 0) return null

  return (
    <>
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm">Suas apostas neste jogo</h2>
            <Badge variant="outline" className="text-xs">{bets.length}</Badge>
          </div>
          <div className="divide-y">
            {bets.map((b) => {
              const oddNow = oddNowByOutcome[b.outcome] ?? b.oddNow
              const potential = Math.floor(b.stake * oddNow)
              const cancellable = canCancel(kickoff)
              return (
                <div key={b.id} className="py-2.5 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Target className="size-3.5 text-primary shrink-0" />
                      <span className="font-semibold text-sm">{b.outcomeLabel}</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1 font-mono">
                        {b.marketType === "1x2" ? "1X2" : "Placar"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono font-medium text-foreground">{b.stake}</span> pts ·
                      odd na aposta <span className="font-mono">{b.oddAtPlacement.toFixed(2)}</span>
                      {Math.abs(oddNow - b.oddAtPlacement) > 0.05 && (
                        <span className={`ml-1 font-mono ${oddNow > b.oddAtPlacement ? "text-emerald-600" : "text-amber-600"}`}>
                          → {oddNow.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5">
                      Potencial: <span className="font-mono font-bold text-primary">+{potential} pts</span>
                    </div>
                  </div>
                  {cancellable ? (
                    <ConfirmDialog
                      trigger={
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                          disabled={pending}
                        >
                          <X className="size-4 mr-1" />
                          Cancelar
                        </Button>
                      }
                      title="Cancelar aposta?"
                      description={
                        <>
                          Aposta: <strong>{b.outcomeLabel}</strong>
                          <br />
                          Stake de <strong>{b.stake} pts</strong> será devolvido ao seu saldo.
                          Esta ação é irreversível.
                        </>
                      }
                      confirmLabel="Sim, cancelar"
                      cancelLabel="Não, manter"
                      destructive
                      onConfirm={() => handleCancel(b.id)}
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                      cutoff passou
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
