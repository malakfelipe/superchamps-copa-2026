/**
 * Edge Function: settle-match
 *
 * Liquida todas as apostas de um jogo finalizado:
 *   - Para cada mercado (1X2 + placar exato):
 *     1. Calcula winning_outcome com base no placar
 *     2. Para cada aposta:
 *        - Se acertou: paga stake × odd_at_settle
 *        - Se errou: nada (stake já foi debitado em place_bet)
 *        - Se pool órfão (ninguém acertou): refund de todas
 *   - Marca market.is_settled e bet.status
 *
 * Disparado por:
 *   - sync-live-scores quando vê status mudar pra "finished"
 *   - admin manualmente via painel
 *
 * Body: { "match_id": "uuid" }
 */
import { adminClient } from "../_shared/supabase-admin.ts"

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "POST only" }, { status: 405 })
  }

  try {
    const { match_id } = await req.json()
    if (!match_id) return Response.json({ error: "match_id required" }, { status: 400 })

    const supabase = adminClient()

    // Chama a RPC que faz toda a liquidação em uma transação
    const { data, error } = await supabase.rpc("settle_match", { p_match_id: match_id })

    if (error) {
      console.error("settle_match RPC error:", error)
      return Response.json({ ok: false, error: error.message }, { status: 500 })
    }

    return Response.json({
      ok: true,
      match_id,
      result: data,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("settle-match error:", err)
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
})
