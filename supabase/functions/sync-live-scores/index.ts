/**
 * Edge Function: sync-live-scores
 *
 * Roda a cada 2min via pg_cron. Estratégia otimizada:
 *   1. Pre-check no DB — se NÃO tem jogo ativo agora (live ou scheduled
 *      em ≤30min ou recém-jogado nas últimas 4h), pula e retorna
 *      {skipped: true} sem chamar a API. Economiza ~95% das calls em
 *      pré e pós competição.
 *   2. Quando há jogos ativos, identifica as competitions afetadas e
 *      busca SÓ os jogos delas no dia (endpoint escopado por
 *      league + season + date).
 *   3. Atualiza placar/status. O trigger SQL on_match_finished cuida do
 *      settle automaticamente. Sem precisar invocar settle-match.
 */
import { adminClient } from "../_shared/supabase-admin.ts"
import { getCompetitionMatchesInWindow, getCompetitionGroups } from "../_shared/api-sports.ts"

const COMPETITIONS_WITH_GROUPS = new Set<string>(["1"])

Deno.serve(async () => {
  try {
    const supabase = adminClient()

    // ─── Pre-check: tem jogo ativo agora? ────────────────────────────────
    const now = new Date()
    const lowerBound = new Date(now.getTime() - 6 * 60 * 60 * 1000)   // -6h (jogo longo)
    const upperBound = new Date(now.getTime() + 30 * 60 * 1000)        // +30min

    // Inclui QUALQUER jogo ainda 'live' no DB (independente de horário) — sem
    // isso, um jogo que terminou perto da virada da meia-noite UTC fica órfão
    // em 'live' pra sempre (foi o que travou o Brasil×Marrocos). Mais os
    // 'scheduled' dentro da janela de horário.
    const { data: activeMatches, error: checkError } = await supabase
      .from("matches")
      .select("competition_id")
      .or(
        `status.eq.live,and(status.eq.scheduled,starts_at.gte.${lowerBound.toISOString()},starts_at.lte.${upperBound.toISOString()})`,
      )

    if (checkError) throw new Error(`db pre-check: ${checkError.message}`)

    if (!activeMatches || activeMatches.length === 0) {
      return Response.json({
        ok: true,
        skipped: true,
        reason: "no_active_matches",
        timestamp: now.toISOString(),
      })
    }

    // ─── Identifica quais competitions têm jogos ativos ──────────────────
    const activeCompIds = Array.from(
      new Set((activeMatches as Array<{ competition_id: string }>).map((m) => m.competition_id)),
    )

    const { data: comps, error: compError } = await supabase
      .from("competitions")
      .select("id, name, external_id, external_source, external_season")
      .in("id", activeCompIds)
      .eq("external_source", "api-sports")

    if (compError) throw new Error(`fetch competitions: ${compError.message}`)
    if (!comps || comps.length === 0) {
      return Response.json({
        ok: true,
        skipped: true,
        reason: "no_api-sports_competitions_active",
        timestamp: now.toISOString(),
      })
    }

    type Comp = {
      id: string
      name: string
      external_id: string
      external_source: string
      external_season: number | null
    }

    // Janela de DOIS dias UTC (ontem + hoje): um jogo que começa 22:00 UTC e
    // termina depois da meia-noite cai em "ontem" quando a função roda já no
    // dia seguinte. Buscar só `today` deixava esse jogo sem nunca receber o
    // 'finished' que dispara o settle.
    const today = now.toISOString().slice(0, 10)                              // YYYY-MM-DD UTC
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    let totalUpdated = 0
    let totalFinished = 0
    const results: Array<Record<string, unknown>> = []

    // ─── Fetch + update por competition ──────────────────────────────────
    for (const comp of comps as Comp[]) {
      if (!comp.external_season) {
        console.warn(`competition "${comp.name}" sem external_season, pulando`)
        continue
      }

      try {
        let groupMap: Map<string, string> | undefined
        if (COMPETITIONS_WITH_GROUPS.has(comp.external_id)) {
          groupMap = await getCompetitionGroups(comp.external_id, comp.external_season)
        }

        const todaysMatches = await getCompetitionMatchesInWindow(
          comp.external_id,
          comp.external_season,
          yesterday,
          today,
          { groupMap },
        )

        let compUpdated = 0
        let compFinished = 0

        for (const m of todaysMatches) {
          const { data: updated, error } = await supabase
            .from("matches")
            .update({
              status: m.status,
              home_score: m.homeScore,
              away_score: m.awayScore,
              home_pen: m.homePen,
              away_pen: m.awayPen,
              winner_outcome: m.winnerOutcome,
              settled_at: m.status === "finished" ? new Date().toISOString() : null,
            })
            .eq("external_id", m.externalId)
            .select("id, status")
            .maybeSingle()

          if (error) {
            console.error(`update match ${m.externalId}: ${error.message}`)
            continue
          }

          if (updated) {
            compUpdated++
            totalUpdated++
            // O trigger SQL on_match_finished chama settle_match automático.
            if ((updated as { status: string }).status === "finished") {
              compFinished++
              totalFinished++
            }
          }
        }

        results.push({
          competition: comp.name,
          fetched: todaysMatches.length,
          updated: compUpdated,
          finished_now: compFinished,
        })
      } catch (err) {
        console.error(`falha em "${comp.name}":`, err)
        results.push({
          competition: comp.name,
          error: err instanceof Error ? err.message : "Unknown",
        })
      }
    }

    return Response.json({
      ok: true,
      skipped: false,
      updated: totalUpdated,
      finished_now: totalFinished,
      results,
      timestamp: now.toISOString(),
    })
  } catch (err) {
    console.error("sync-live-scores error:", err)
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
})
