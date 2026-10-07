"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { isDemoMode } from "@/lib/data"

// ─── PLACE BET ─────────────────────────────────────────────────────────────

export type PlaceBetResult = {
  ok?: boolean
  betId?: string
  error?: string
}

/**
 * Coloca uma aposta. Valida tudo via RPC `place_bet` (SQL transacional).
 *
 * Erros conhecidos da RPC (vêm via PostgresError.message):
 *   - unauthenticated
 *   - stake_below_minimum
 *   - insufficient_balance
 *   - stake_above_50_percent
 *   - market_not_found
 *   - market_already_settled
 *   - market_closed
 *   - cooldown_active
 */
export async function placeBetAction(
  marketId: string,
  outcome: string,
  stake: number,
): Promise<PlaceBetResult> {
  if (isDemoMode()) {
    return { error: "Modo demo: apostas não persistem. Configure Supabase no .env.local." }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("place_bet", {
    p_market_id: marketId,
    p_outcome: outcome,
    p_stake: stake,
  })

  if (error) {
    return { error: translateRpcError(error.message) }
  }

  revalidatePath("/inicio", "layout")
  revalidatePath("/apostas", "layout")
  revalidatePath(`/jogos/[id]`, "page")
  return { ok: true, betId: data as string }
}

// ─── CANCEL BET ────────────────────────────────────────────────────────────

export type CancelBetResult = { ok?: boolean; error?: string }

export async function cancelBetAction(betId: string): Promise<CancelBetResult> {
  if (isDemoMode()) {
    return { error: "Modo demo: apostas não persistem." }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("cancel_bet", { p_bet_id: betId })

  if (error) {
    return { error: translateRpcError(error.message) }
  }

  revalidatePath("/inicio", "layout")
  revalidatePath("/apostas", "layout")
  revalidatePath(`/jogos/[id]`, "page")
  return { ok: true }
}

// ─── ERROR TRANSLATION ─────────────────────────────────────────────────────

function translateRpcError(msg: string): string {
  // Os erros do plpgsql vêm com formato "stake_below_minimum (mínimo 10 pts)"
  // Vou pegar a primeira palavra (código) e traduzir.
  const code = msg.split(/[\s(]/)[0].toLowerCase()

  const translations: Record<string, string> = {
    unauthenticated: "Você precisa estar logado.",
    stake_below_minimum: "Stake mínimo é 10 pontos.",
    insufficient_balance: "Saldo insuficiente.",
    stake_above_50_percent: "Stake máximo é 50% do seu saldo atual.",
    stake_above_50_percent_per_match: "Limite por jogo atingido: suas apostas somadas neste jogo não podem passar de 50% do saldo. Reduza o stake ou cancele uma aposta.",
    market_not_found: "Mercado não encontrado.",
    market_already_settled: "Mercado já foi liquidado.",
    market_closed: "Apostas encerradas (após o kickoff).",
    competition_inactive: "Essa competição ainda não aceita apostas.",
    competition_pro_only: "Essa competição é exclusiva do PRO (em breve). Por enquanto só Copa e Brasileirão A.",
    cooldown_active: "Aguarde 1 segundo entre apostas no mesmo mercado.",
    bet_not_found: "Aposta não encontrada.",
    forbidden: "Você não tem permissão pra essa ação.",
    bet_not_open: "Esta aposta não está mais aberta.",
    cancellation_cutoff_passed: "Não dá pra cancelar (faltam menos de 5 min pro kickoff).",
    profile_not_found: "Perfil não encontrado. Faça login de novo.",
  }

  return translations[code] || `Erro: ${msg}`
}
