/**
 * Helper pra ler pools parimutuel via RPC `get_match_pools` (SECURITY DEFINER).
 *
 * Por quê: RLS na tabela `bets` esconde palpites OPEN de outros usuários (correto
 * pra privacidade individual). Mas pra calcular odds parimutuel precisamos dos
 * agregados completos. A RPC contorna isso retornando SOMENTE agregados
 * (stake por outcome, contagens), nunca user_id.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Pool1X2, PoolScore } from "./types"

type PoolRow = {
  match_id: string
  market_type: string
  outcome: string
  pool_stake: number | string
  bets_count: number
  bettors_count: number
}

export type MatchPoolBundle = {
  poolTotal: number          // soma só do mercado 1x2 (usado na fórmula parimutuel)
  totalStake: number         // soma de TODOS os mercados (usado em avgStake e stats)
  pool1x2: Pool1X2
  poolScore: PoolScore
  betsCount: number          // total open bets em todos markets
  bettorsCount: number       // distinct users no market 1x2
}

export function emptyBundle(): MatchPoolBundle {
  return {
    poolTotal: 0,
    totalStake: 0,
    pool1x2: { home: 0, draw: 0, away: 0 },
    poolScore: {},
    betsCount: 0,
    bettorsCount: 0,
  }
}

export async function fetchMatchPools(
  supabase: SupabaseClient,
  matchIds: string[],
): Promise<Map<string, MatchPoolBundle>> {
  const out = new Map<string, MatchPoolBundle>()
  if (matchIds.length === 0) return out

  const { data, error } = await supabase.rpc("get_match_pools", { p_match_ids: matchIds })
  if (error || !data) {
    if (error) console.error("[fetchMatchPools] RPC error:", error)
    return out
  }

  for (const r of data as PoolRow[]) {
    let bundle = out.get(r.match_id)
    if (!bundle) {
      bundle = emptyBundle()
      out.set(r.match_id, bundle)
    }

    const stake = Number(r.pool_stake)

    if (r.market_type === "1x2") {
      if (r.outcome === "home" || r.outcome === "draw" || r.outcome === "away") {
        bundle.pool1x2[r.outcome] = stake
        bundle.poolTotal += stake
      }
      // bettors_count por outcome em 1x2 é disjunto (user só aposta em 1 outcome)
      bundle.bettorsCount += Number(r.bettors_count)
    } else if (r.market_type === "exact_score") {
      bundle.poolScore[r.outcome] = stake
    }

    bundle.betsCount += Number(r.bets_count)
    bundle.totalStake += stake
  }

  return out
}
