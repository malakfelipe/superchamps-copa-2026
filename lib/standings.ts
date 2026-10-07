/**
 * Calcula tabela de classificação a partir de matches finalizados.
 *
 * Vantagem vs buscar via API: dado vem do DB que a gente já tem. Sem
 * round-trip extra. Funciona pra qualquer competição (Brasileirão, ligas
 * européias, etc.). Pra Copa, mantemos `getStandings()` existente que usa
 * a tabela `standings` específica de mundial.
 *
 * Algoritmo padrão de ponto corrido:
 *   3 pts por vitória, 1 por empate, 0 por derrota.
 *   Tiebreaker: pontos → saldo de gols → gols pró → ordem alfabética.
 */
import type { Match, GroupStanding } from "./data/types"
import { localizeTeamName } from "@/lib/teams"
import type { StandingRow } from "@/components/competitions/StandingsTable"

type Team = { name: string; countryCode: string | null; logoUrl: string | null }

export function computeStandings(matches: Match[]): StandingRow[] {
  // 1. Pega todos os times únicos (com logo se disponível)
  const teams = new Map<string, Team>()
  for (const m of matches) {
    if (!teams.has(m.home.name)) {
      teams.set(m.home.name, {
        name: m.home.name,
        countryCode: m.home.iso || null,
        logoUrl: m.home.logoUrl || null,
      })
    }
    if (!teams.has(m.away.name)) {
      teams.set(m.away.name, {
        name: m.away.name,
        countryCode: m.away.iso || null,
        logoUrl: m.away.logoUrl || null,
      })
    }
  }

  // 2. Agrega stats por time só de matches finalizados
  type Stats = {
    team: Team
    played: number
    won: number
    drawn: number
    lost: number
    goalsFor: number
    goalsAgainst: number
  }
  const stats = new Map<string, Stats>()
  for (const team of teams.values()) {
    stats.set(team.name, {
      team,
      played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0,
    })
  }

  for (const m of matches) {
    if (m.status !== "finished" || m.homeScore == null || m.awayScore == null) continue

    const h = stats.get(m.home.name)
    const a = stats.get(m.away.name)
    if (!h || !a) continue

    h.played++
    a.played++
    h.goalsFor += m.homeScore
    h.goalsAgainst += m.awayScore
    a.goalsFor += m.awayScore
    a.goalsAgainst += m.homeScore

    if (m.homeScore > m.awayScore) {
      h.won++
      a.lost++
    } else if (m.homeScore < m.awayScore) {
      a.won++
      h.lost++
    } else {
      h.drawn++
      a.drawn++
    }
  }

  // 3. Converte pra StandingRow + ordena
  const rows: StandingRow[] = Array.from(stats.values())
    .map((s) => ({
      rank: 0, // setado abaixo
      team: {
        name: s.team.name,
        countryCode: s.team.countryCode,
        logoUrl: s.team.logoUrl,
      },
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDiff: s.goalsFor - s.goalsAgainst,
      points: s.won * 3 + s.drawn,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
      return a.team.name.localeCompare(b.team.name)
    })
    .map((r, i) => ({ ...r, rank: i + 1 }))

  return rows
}

/**
 * Computa o "form" recente (últimos N jogos) de cada time a partir de todos
 * os matches finalizados. Retorna Map<teamName, ("W"|"D"|"L")[]> da mais
 * recente pra mais antiga (índice 0 = jogo mais recente).
 */
export function computeRecentFormByTeam(
  matches: Match[],
  limit = 5,
): Map<string, ("W" | "D" | "L")[]> {
  // Ordena finalizados por data desc (mais recente primeiro)
  const finished = matches
    .filter((m) => m.status === "finished" && m.homeScore != null && m.awayScore != null)
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())

  const byTeam = new Map<string, ("W" | "D" | "L")[]>()

  for (const m of finished) {
    const hScore = m.homeScore!
    const aScore = m.awayScore!
    const homeRes: "W" | "D" | "L" = hScore > aScore ? "W" : hScore < aScore ? "L" : "D"
    const awayRes: "W" | "D" | "L" = aScore > hScore ? "W" : aScore < hScore ? "L" : "D"

    const homeArr = byTeam.get(m.home.name) || []
    if (homeArr.length < limit) {
      byTeam.set(m.home.name, [...homeArr, homeRes])
    }
    const awayArr = byTeam.get(m.away.name) || []
    if (awayArr.length < limit) {
      byTeam.set(m.away.name, [...awayArr, awayRes])
    }
  }

  return byTeam
}

/** Map team name → { rank, points, optional groupLabel pra Copa }. */
export type TeamRankPts = { rank: number; points: number; groupLabel?: string }

export function buildRankLookupFromTable(rows: StandingRow[]): Map<string, TeamRankPts> {
  const m = new Map<string, TeamRankPts>()
  for (const r of rows) {
    m.set(r.team.name, { rank: r.rank, points: r.points })
  }
  return m
}

/**
 * Pra Copa: extrai rank por grupo a partir do `GroupStanding[]` existente.
 * Indexa por nome original (en) E pelo nome PT-BR — assim funciona
 * independente de qual versão do nome o match traz.
 */
export function buildRankLookupFromGroups(groups: GroupStanding[]): Map<string, TeamRankPts> {
  const m = new Map<string, TeamRankPts>()
  for (const g of groups) {
    for (const t of g.teams) {
      const entry: TeamRankPts = {
        rank: t.position,
        points: t.pts,
        groupLabel: `Grupo ${g.group.toUpperCase()}`,
      }
      m.set(t.name, entry)
      m.set(localizeTeamName(t.name), entry)
    }
  }
  return m
}
