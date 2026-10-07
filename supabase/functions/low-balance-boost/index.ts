/**
 * Edge Function: low-balance-boost
 *
 * Cron diário (06:00 BRT). Pra todos os usuários com saldo < 10 pts,
 * credita +50 pts automaticamente e registra `wallet_transactions`.
 *
 * Garante que ninguém fique "morto" no jogo, mas mantém a consequência
 * de apostar mal (saldo só cresce de volta com o tempo).
 */
import { adminClient } from "../_shared/supabase-admin.ts"

const BOOST_AMOUNT = 50
const THRESHOLD = 10

Deno.serve(async () => {
  try {
    const supabase = adminClient()

    const { data, error } = await supabase.rpc("apply_low_balance_boost", {
      p_threshold: THRESHOLD,
      p_amount: BOOST_AMOUNT,
    })

    if (error) {
      console.error("apply_low_balance_boost RPC error:", error)
      return Response.json({ ok: false, error: error.message }, { status: 500 })
    }

    return Response.json({
      ok: true,
      users_boosted: data,
      amount: BOOST_AMOUNT,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("low-balance-boost error:", err)
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
})
