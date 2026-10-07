"use client"

import Link from "next/link"
import { useTransition } from "react"
import { Clock, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Flag } from "@/components/Flag"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { toast } from "sonner"
import { cancelBetAction } from "../jogos/actions"
import { formatCountdown } from "@/lib/format"
import { localizeTeamName } from "@/lib/teams"
import type { OpenBet } from "@/lib/data/types"

export function OpenBetRowClient({ bet }: { bet: OpenBet }) {
  const [pending, startTransition] = useTransition()
  const potential = Math.floor(bet.stake * bet.oddNow)
  const cancellable = bet.kickoff.getTime() - Date.now() > 5 * 60 * 1000
  const matchLabelPT = `${localizeTeamName(bet.homeName)} × ${localizeTeamName(bet.awayName)}`

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelBetAction(bet.id)
      if (result.ok) toast.success("Aposta cancelada. Stake devolvido.")
      else toast.error(result.error || "Erro ao cancelar")
    })
  }

  return (
    <>
      <div className="block px-3.5 py-3 hover:bg-accent transition-colors">
        <Link href={`/jogos/${bet.matchId}`} className="block">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
              <Flag name={bet.homeName} size={18} />
              <Flag name={bet.awayName} size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-sm">{bet.outcomeLabel}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  <Clock className="size-3 inline -mt-0.5 mr-0.5" />
                  {formatCountdown(bet.kickoff)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground truncate mt-0.5">{matchLabelPT}</div>
              <div className="flex items-center justify-between mt-1.5 text-sm gap-3">
                <span className="text-muted-foreground text-xs">
                  <span className="font-mono font-medium text-foreground">{bet.stake}</span> pts ·
                  odd <span className="font-mono font-medium text-foreground">{bet.oddNow.toFixed(2)}</span>
                </span>
                <span className="font-mono font-bold text-primary text-sm">+{potential} pts</span>
              </div>
            </div>
          </div>
        </Link>
        <div className="flex items-center justify-end gap-2 mt-2 pl-10">
          {cancellable ? (
            <ConfirmDialog
              trigger={
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 text-xs"
                  disabled={pending}
                >
                  <X className="size-3 mr-1" />
                  {pending ? "Cancelando..." : "Cancelar"}
                </Button>
              }
              title="Cancelar aposta?"
              description={
                <>
                  Aposta: <strong>{bet.outcomeLabel}</strong> ({matchLabelPT})
                  <br />
                  Stake de <strong>{bet.stake} pts</strong> será devolvido ao saldo.
                </>
              }
              confirmLabel="Sim, cancelar"
              cancelLabel="Não, manter"
              destructive
              onConfirm={handleCancel}
            />
          ) : (
            <span className="text-[10px] text-muted-foreground">cutoff passou</span>
          )}
          <Link href={`/jogos/${bet.matchId}`} className="text-muted-foreground">
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </>
  )
}
