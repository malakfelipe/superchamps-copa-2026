"use client"

/**
 * MatchCardProd + quick-bet: tocar numa odd box abre o BetDrawer direto na
 * lista, sem navegar pro /jogos/[id] (Proposta 3 do design system).
 *
 * Cai pro comportamento normal (card inteiro navega) quando o jogo não está
 * mais agendado ou o mercado 1X2 não veio na listagem.
 */
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { MatchCardProd } from "./MatchCardProd"
import { QuickBetDrawer, type BetTarget } from "./QuickBetDrawer"
import { localizeTeamName } from "@/lib/teams"
import type { Match, Stage } from "@/lib/data/types"
import type { TeamMeta } from "@/components/competitions/MatchCardWithOdds"

const KNOCKOUT_STAGES: Stage[] = [
  "round_of_32", "round_of_16", "quarter", "semi", "third", "final",
]

type Props = {
  match: Match
  balance: number
  /** Logado? Quando false, tocar numa odd manda pro login (app público). */
  authed?: boolean
  homeMeta?: TeamMeta
  awayMeta?: TeamMeta
  preferFlag?: boolean
  className?: string
}

export function MatchCardQuickBet({ match, balance, authed = true, homeMeta, awayMeta, preferFlag, className }: Props) {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<BetTarget | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const canQuickBet =
    match.status === "scheduled" &&
    !!match.market1x2Id &&
    match.startsAt.getTime() > Date.now()

  const handlePick = (outcome: "home" | "draw" | "away") => {
    // Anônimo: reconduz pro login com next pra voltar ao jogo depois.
    if (!authed) {
      router.push(`/login?next=${encodeURIComponent(pathname || "/jogos")}`)
      return
    }
    if (!match.market1x2Id) return
    if (outcome === "draw" && KNOCKOUT_STAGES.includes(match.stage)) {
      toast("Mata-mata não tem empate — escolhe quem se classifica.")
      return
    }
    const pool = match.pool1x2 ?? { home: 0, draw: 0, away: 0 }
    const total = pool.home + pool.draw + pool.away
    const poolForOutcome = pool[outcome]
    const labels = {
      home: `${localizeTeamName(match.home.name)} vence`,
      draw: "Empate",
      away: `${localizeTeamName(match.away.name)} vence`,
    }
    setTarget({
      marketId: match.market1x2Id,
      marketType: "1x2",
      outcome,
      outcomeLabel: labels[outcome],
      currentOdd: poolForOutcome > 0 ? +(total / poolForOutcome).toFixed(2) : 0,
      poolForOutcome,
      poolTotal: total,
    })
    setOpen(true)
  }

  return (
    <>
      <MatchCardProd
        match={match}
        homeMeta={homeMeta}
        awayMeta={awayMeta}
        preferFlag={preferFlag}
        className={className}
        onOddClick={canQuickBet ? handlePick : undefined}
      />
      <QuickBetDrawer
        open={open}
        onOpenChange={setOpen}
        target={target}
        balance={balance}
        matchExposure={match.myOpenStake ?? 0}
      />
    </>
  )
}
