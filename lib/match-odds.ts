/**
 * Deriva `MatchOdds` (formato do componente visual) a partir do tipo `Match`
 * da produção. Centraliza a matemática parimutuel:
 *
 *   odd = poolTotal / stake_no_outcome
 *   percentual = stake_no_outcome / poolTotal × 100
 *
 * Retorna `undefined` se pool vazio (sem apostas) — o componente esconde a
 * seção de odds nesse caso.
 */
import type { Match } from "@/lib/data/types"
import type { MatchOdds } from "@/components/competitions/MatchCardWithOdds"

export function deriveMatchOdds(match: Match): MatchOdds | undefined {
  if (!match.pool1x2 || match.poolTotal <= 0) return undefined

  const { home: hp, draw: dp, away: ap } = match.pool1x2
  const total = match.poolTotal

  // Odd justa parimutuel = total/pool_outcome. Se outcome sem stakes, odd=∞;
  // representamos como 0 (UI mostra "—" ou skip — convenção)
  const homeOdd = hp > 0 ? Number((total / hp).toFixed(2)) : 0
  const drawOdd = dp > 0 ? Number((total / dp).toFixed(2)) : 0
  const awayOdd = ap > 0 ? Number((total / ap).toFixed(2)) : 0

  const homePct = Math.round((hp / total) * 100)
  const drawPct = Math.round((dp / total) * 100)
  // Compensa arredondamento (soma sempre 100)
  const awayPct = 100 - homePct - drawPct

  return {
    home: homeOdd,
    draw: drawOdd,
    away: awayOdd,
    poolHome: homePct,
    poolDraw: drawPct,
    poolAway: awayPct,
    totalBets: match.betsCount ?? 0,
    poolTotalPoints: total,
  }
}
