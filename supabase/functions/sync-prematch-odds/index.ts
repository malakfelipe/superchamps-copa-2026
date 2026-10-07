/**
 * Edge Function: sync-prematch-odds
 *
 * Roda a cada 6h via pg_cron. Pra cada competição configurada no
 * fake_bot_config (Copa + Brasileirão A), busca as odds pré-match 1X2 da
 * API-Football numa janela de ~14 dias à frente, converte em PROBABILIDADE
 * JUSTA (sem vig) e grava em matches.prematch_probs. Esse vetor é o alvo de
 * equilíbrio que o fake-bet-drip persegue.
 *
 * Jogos sem cobertura de odds ficam com prematch_probs = null → o drip usa
 * fallback sintético.
 */
import { adminClient } from "../_shared/supabase-admin.ts"
import { getCompetitionOdds } from "../_shared/api-sports.ts"

const WINDOW_DAYS = 14

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

Deno.serve(async () => {
  try {
    const supabase = adminClient()

    // 1. Competições alvo (da config do robô)
    const { data: cfg } = await supabase
      .from("fake_bot_config")
      .select("comp_slugs")
      .eq("id", 1)
      .maybeSingle()
    const slugs = (cfg?.comp_slugs as string[] | undefined) ?? [
      "copa-do-mundo-2026",
      "brasileirao-a-2026",
    ]

    const { data: comps, error: compErr } = await supabase
      .from("competitions")
      .select("id, name, slug, external_id, external_season")
      .in("slug", slugs)
      .eq("external_source", "api-sports")
    if (compErr) throw new Error(`fetch competitions: ${compErr.message}`)
    if (!comps || comps.length === 0) {
      return Response.json({ ok: true, skipped: true, reason: "no_competitions" })
    }

    const now = new Date()
    const from = ymd(now)
    const to = ymd(new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000))

    let updated = 0
    const results: Array<Record<string, unknown>> = []

    for (const comp of comps as Array<{ name: string; external_id: string; external_season: number | null }>) {
      if (!comp.external_season) continue
      const { probs: oddsMap, rawFixtures } = await getCompetitionOdds(comp.external_id, comp.external_season, from, to)

      let compUpdated = 0
      for (const [externalId, probs] of oddsMap) {
        const { error, count } = await supabase
          .from("matches")
          .update({
            prematch_probs: {
              home: Number(probs.home.toFixed(4)),
              draw: Number(probs.draw.toFixed(4)),
              away: Number(probs.away.toFixed(4)),
              source: "api",
              updated_at: now.toISOString(),
            },
          }, { count: "exact" })
          .eq("external_id", externalId)
          .eq("status", "scheduled")
        if (!error && count) compUpdated += count
      }
      updated += compUpdated
      // raw_fixtures = quantos fixtures a API trouxe com odds (diagnóstico de cobertura)
      results.push({ competition: comp.name, league: comp.external_id, season: comp.external_season,
        raw_fixtures: rawFixtures, parsed_with_1x2: oddsMap.size, updated: compUpdated })
    }

    return Response.json({ ok: true, window: { from, to }, updated, results, timestamp: now.toISOString() })
  } catch (err) {
    console.error("sync-prematch-odds error:", err)
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
})
