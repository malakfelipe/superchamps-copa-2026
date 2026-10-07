/**
 * Edge Function: sync-competition-fixtures
 *
 * Roda 1x/dia via pg_cron. Itera sobre TODAS as competições ativas em
 * `competitions` (external_source='api-sports') e faz upsert dos jogos.
 *
 * Suporta múltiplas competições simultâneas (Copa do Mundo, Brasileirão A/B,
 * Libertadores, etc.). Cada competition row em DB define `external_id` e
 * `external_season` que vão pra API-Football.
 *
 * Deploy: supabase functions deploy sync-competition-fixtures
 * Test:   curl -X POST https://<project>.supabase.co/functions/v1/sync-competition-fixtures \
 *              -H "Authorization: Bearer <service_role>"
 */
import { adminClient } from "../_shared/supabase-admin.ts"
import { getCompetitionMatches, getCompetitionGroups } from "../_shared/api-sports.ts"

// Competições com fase de grupos: precisam de /standings pra resolver group_a..l
// (Copa do Mundo, Eurocopa, Copa América, etc.)
const COMPETITIONS_WITH_GROUPS = new Set<string>(["1" /* Copa do Mundo */])

Deno.serve(async () => {
  try {
    const supabase = adminClient()

    // 1. Lista competições ativas no API-Football
    const { data: comps, error: compError } = await supabase
      .from("competitions")
      .select("id, name, external_id, external_source, external_season, status")
      .eq("external_source", "api-sports")
      .in("status", ["scheduled", "active"])

    if (compError) throw new Error(`fetch competitions: ${compError.message}`)
    if (!comps || comps.length === 0) {
      return Response.json({
        ok: true,
        message: "no active competitions to sync",
        timestamp: new Date().toISOString(),
      })
    }

    type Comp = {
      id: string
      name: string
      external_id: string
      external_source: string
      external_season: number | null
      status: string
    }

    const results: Array<Record<string, unknown>> = []

    // 2. Loop por competição (sequencial pra respeitar rate limit ~10 req/s)
    for (const comp of comps as Comp[]) {
      try {
        if (!comp.external_season) {
          throw new Error(`competition "${comp.name}" sem external_season — UPDATE necessário`)
        }

        // Se a competição tem fase de grupos, busca /standings primeiro
        // pra montar mapa team → "group_a".
        let groupMap: Map<string, string> | undefined
        if (COMPETITIONS_WITH_GROUPS.has(comp.external_id)) {
          groupMap = await getCompetitionGroups(comp.external_id, comp.external_season)
          console.log(`${comp.name}: groupMap com ${groupMap.size} times`)
        }

        const matches = await getCompetitionMatches(
          comp.external_id,
          comp.external_season,
          { groupMap },
        )
        console.log(`${comp.name}: ${matches.length} jogos retornados`)

        // Filtra jogos sem times definidos (mata-mata pendente em mundiais)
        const playable = matches.filter(
          (m) =>
            m.homeTeam.name &&
            m.awayTeam.name &&
            !m.homeTeam.name.toUpperCase().includes("TBD") &&
            !m.awayTeam.name.toUpperCase().includes("TBD"),
        )
        const skipped = matches.length - playable.length

        if (playable.length === 0) {
          results.push({
            competition: comp.name,
            synced: 0,
            total: matches.length,
            skipped,
            note: "nenhum jogo com times definidos",
          })
          continue
        }

        const upsertPayload = playable.map((m) => ({
          competition_id: comp.id,
          external_id: m.externalId,
          home_team: m.homeTeam.name,
          home_team_code: m.homeTeam.code,
          home_team_logo: m.homeTeam.logo ?? null,
          away_team: m.awayTeam.name,
          away_team_code: m.awayTeam.code,
          away_team_logo: m.awayTeam.logo ?? null,
          starts_at: m.startsAt,
          status: m.status,
          stage: m.stage,
          venue: m.venue,
          home_score: m.homeScore,
          away_score: m.awayScore,
          home_pen: m.homePen,
          away_pen: m.awayPen,
          winner_outcome: m.winnerOutcome,
        }))

        const { error: upsertError, count } = await supabase
          .from("matches")
          .upsert(upsertPayload, { onConflict: "external_id", count: "exact" })

        if (upsertError) throw new Error(`upsert matches: ${upsertError.message}`)

        results.push({
          competition: comp.name,
          synced: count ?? playable.length,
          total: matches.length,
          skipped,
        })
      } catch (err) {
        console.error(`falha em "${comp.name}":`, err)
        results.push({
          competition: comp.name,
          error: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    return Response.json({
      ok: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("sync-competition-fixtures error:", err)
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
})
