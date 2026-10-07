/**
 * Multiplicador de payout por jogo — ESPELHO da SQL `effective_payout_multiplier`.
 * Mantenha os dois em sincronia: a SQL liquida os pontos, isto só renderiza o badge.
 *
 *   final = x5 · semi/quartas/oitavas/16-avos/3º = x3 · grupos = x1
 *   override (enquete "jogo do dia") só vale na FASE DE GRUPOS — o mata-mata
 *   sempre usa o multiplicador fixo da fase (o x2 nunca rebaixa um x3/x5).
 */
import type { Stage } from "@/lib/data/types"

const STAGE_MULTIPLIER: Partial<Record<Stage, number>> = {
  final: 5,
  semi: 3,
  quarter: 3,
  round_of_16: 3,
  round_of_32: 3,
  third: 3,
}

export function payoutMultiplier(stage: Stage, override?: number | null): number {
  const knockout = STAGE_MULTIPLIER[stage]
  if (knockout) return knockout      // mata-mata ignora override (x2 da enquete não vale aqui)
  return override ?? 1                // grupos: override (enquete) ou 1
}

/** "x3" / "x5" / null (sem badge quando 1x). */
export function multiplierLabel(stage: Stage, override?: number | null): string | null {
  const m = payoutMultiplier(stage, override)
  return m > 1 ? `x${m}` : null
}
