"use client"

/**
 * Drawer de aposta compartilhado — usado na página do jogo (BetSection) e no
 * quick-bet direto do card da listagem (MatchCardQuickBet).
 */
import { useEffect, useState, useTransition } from "react"
import { Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { placeBetAction } from "@/app/jogos/actions"

export type BetTarget = {
  marketId: string
  marketType: "1x2" | "exact_score"
  outcome: string
  outcomeLabel: string
  currentOdd: number
  poolForOutcome: number
  poolTotal: number
}

export function QuickBetDrawer({
  open, onOpenChange, target, balance, matchExposure = 0,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  target: BetTarget | null
  balance: number
  /** Soma das apostas abertas do user NESSE jogo — o cap de 50% é por jogo. */
  matchExposure?: number
}) {
  const [stake, setStake] = useState<number>(50)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (open) setStake(Math.min(50, Math.max(10, Math.floor(balance / 2))))
  }, [open, balance])

  if (!target) return null

  // Cap por JOGO: exposição total ≤ 50% do bankroll pré-exposição (espelho do place_bet)
  const maxStake = Math.max(
    0,
    Math.min(
      Math.floor((balance + matchExposure) * 0.5) - matchExposure,
      balance,
    ),
  )
  const minStake = 10
  const stakeValid = stake >= minStake && stake <= maxStake && stake <= balance

  const isFirstBet = target.poolForOutcome === 0
  const effectiveOdd = isFirstBet
    ? +((target.poolTotal + stake) / stake).toFixed(2)
    : target.currentOdd
  const potentialWin = Math.floor(stake * effectiveOdd)
  const profit = potentialWin - stake

  const presets = [10, 50, 100, Math.floor(maxStake / 2), maxStake]
    .filter((v, i, arr) => v >= minStake && v <= maxStake && arr.indexOf(v) === i)

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await placeBetAction(target.marketId, target.outcome, stake)
      if (result.ok) {
        toast.success(`Aposta colocada! ${stake} pts em ${target.outcomeLabel}`)
        onOpenChange(false)
      } else {
        toast.error(result.error || "Erro ao apostar")
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t-2 sm:max-w-lg sm:mx-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-xl">
            Apostar em <span className="text-primary">{target.outcomeLabel}</span>
          </SheetTitle>
          <SheetDescription>
            {isFirstBet ? (
              <span className="text-amber-600 font-medium">
                Ninguém apostou aqui ainda — você seria o primeiro
              </span>
            ) : (
              <>
                Odd atual: <span className="font-mono font-semibold text-foreground">{target.currentOdd.toFixed(2)}</span>
                <span className="text-muted-foreground"> · saldo {balance} pts</span>
              </>
            )}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 pt-2">
          <div>
            <p className="text-sm font-medium mb-2 text-muted-foreground">Stake (pontos)</p>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {presets.map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant={stake === v ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => setStake(v)}
                  disabled={pending}
                >
                  {v}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              value={stake}
              onChange={(e) => setStake(Math.max(0, parseInt(e.target.value) || 0))}
              className="text-2xl font-bold h-14 font-mono"
              disabled={pending}
            />
            <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
              <span>Mín {minStake} pts</span>
              <span>
                Máx {maxStake} pts (50% do saldo por jogo
                {matchExposure > 0 && <> · {matchExposure} já apostados aqui</>})
              </span>
            </div>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">
                  {isFirstBet ? "Se acertar (odd estimada)" : "Se acertar, ganha"}
                </span>
                <span className="font-mono text-2xl font-bold text-primary">
                  {potentialWin} <span className="text-base font-normal">pts</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between text-sm text-muted-foreground">
                <span>Lucro líquido</span>
                <span className="font-mono font-semibold text-primary">+{profit} pts</span>
              </div>
              {isFirstBet && (
                <div className="text-xs text-muted-foreground pt-1 border-t">
                  Odd estimada se ninguém mais apostar: <span className="font-mono font-medium">{effectiveOdd.toFixed(2)}</span>.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
            <p>
              Odd congelada no kickoff. Cancelamento permitido até 5 min antes.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button className="flex-1" disabled={!stakeValid || pending} onClick={handleConfirm}>
              <Check className="size-4 mr-1.5" />
              {pending ? "Enviando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
