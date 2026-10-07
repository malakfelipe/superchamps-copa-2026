/**
 * Cliente da API-Football (api-sports.io v3).
 *
 * Token vem de Supabase Secrets: `supabase secrets set API_SPORTS_KEY=...`
 *
 * Docs:    https://www.api-football.com/documentation-v3
 * Pricing: https://api-sports.io/sports/football (Pro $19/mo, 7500 req/dia, 1 seat)
 *
 * Diferenças vs football-data.org (que estava antes):
 *   - Auth header: `x-apisports-key` em vez de `X-Auth-Token`
 *   - Endpoint base: api-sports.io v3
 *   - Estrutura de fixture totalmente diferente (normalizada via NormalizedMatch)
 *   - Requer `league_id + season` em vez de só código (`WC`)
 *   - Status codes alfanuméricos curtos: NS, FT, AET, PEN, etc.
 *   - Rate limit no Pro: ~10 req/segundo, 7.500/dia
 */

import type { NormalizedMatch, GameStatus, WinnerOutcome } from "./_types.ts"

const BASE_URL = "https://v3.football.api-sports.io"

// ─── HTTP CLIENT ──────────────────────────────────────────────────────────

type ApiSportsErrorObj = string[] | Record<string, string>

type ApiSportsResponse<T> = {
  get: string
  parameters: Record<string, string>
  errors: ApiSportsErrorObj
  results: number
  paging: { current: number; total: number }
  response: T
}

async function fetchJson<T>(path: string): Promise<ApiSportsResponse<T>> {
  const key = Deno.env.get("API_SPORTS_KEY")
  if (!key) throw new Error("API_SPORTS_KEY não configurada nos Supabase Secrets")

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-apisports-key": key },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`api-sports ${path} HTTP ${res.status}: ${text}`)
  }

  const data = (await res.json()) as ApiSportsResponse<T>

  // API retorna 200 mas com `errors` populado em caso de quota/auth/etc.
  const hasErrors = Array.isArray(data.errors)
    ? data.errors.length > 0
    : data.errors && Object.keys(data.errors).length > 0
  if (hasErrors) {
    throw new Error(`api-sports ${path} retornou errors: ${JSON.stringify(data.errors)}`)
  }

  return data
}

// ─── ENDPOINT TYPES ───────────────────────────────────────────────────────

type ApiFootballFixture = {
  fixture: {
    id: number
    referee: string | null
    timezone: string
    date: string                                  // ISO 8601
    timestamp: number
    status: { long: string; short: string; elapsed: number | null }
    venue: { id: number | null; name: string | null; city: string | null }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string | null
    flag: string | null
    season: number
    round: string                                 // "Group A - 1", "Round of 16", "Regular Season - 5"
  }
  teams: {
    home: { id: number; name: string; logo: string | null; winner: boolean | null }
    away: { id: number; name: string; logo: string | null; winner: boolean | null }
  }
  goals: { home: number | null; away: number | null }
  score: {
    halftime: { home: number | null; away: number | null }
    fulltime: { home: number | null; away: number | null }
    extratime: { home: number | null; away: number | null }
    penalty: { home: number | null; away: number | null }
  }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────

/**
 * Lista todos os jogos de uma competição numa temporada.
 * Usado pelo sync-competition-fixtures (1x/dia).
 *
 * `groupMap` opcional: pra competições com fase de grupos (Copa do Mundo,
 * Eurocopa, etc.) o endpoint /fixtures retorna `round="Group Stage - N"`
 * sem dizer qual grupo é. Passa um mapa team → "group_a" e sobrescreve o
 * stage. Pega via getCompetitionGroups().
 */
export async function getCompetitionMatches(
  leagueId: string,
  season: number,
  options?: { groupMap?: Map<string, string> },
): Promise<NormalizedMatch[]> {
  const data = await fetchJson<ApiFootballFixture[]>(
    `/fixtures?league=${encodeURIComponent(leagueId)}&season=${season}`,
  )
  return data.response.map((f) => normalizeFixture(f, options?.groupMap))
}

// ─── STANDINGS / GRUPOS ───────────────────────────────────────────────────

type StandingsResponse = Array<{
  league: {
    id: number
    name: string
    season: number
    standings: Array<
      Array<{
        rank: number
        team: { id: number; name: string }
        group: string // ex: "World Cup - Group A"
      }>
    >
  }
}>

/**
 * Retorna mapa `teamName → "group_a" | "group_b" | ...` pra uma competição
 * com fase de grupos. Vazio se a competição não tem grupos (Brasileirão etc.)
 * ou se o sorteio ainda não foi publicado.
 */
export async function getCompetitionGroups(
  leagueId: string,
  season: number,
): Promise<Map<string, string>> {
  const map = new Map<string, string>()

  try {
    const data = await fetchJson<StandingsResponse>(
      `/standings?league=${encodeURIComponent(leagueId)}&season=${season}`,
    )
    if (data.response.length === 0) return map

    const standings = data.response[0].league.standings

    for (const groupStanding of standings) {
      if (groupStanding.length === 0) continue
      const groupLabel = groupStanding[0].group // ex: "World Cup - Group A"
      const m = groupLabel.match(/group\s+([a-l])/i)
      if (!m) continue
      const groupCode = `group_${m[1].toLowerCase()}`
      for (const t of groupStanding) {
        map.set(t.team.name, groupCode)
      }
    }
  } catch (err) {
    console.warn(`getCompetitionGroups falhou (league=${leagueId}):`, err)
  }

  return map
}

/**
 * Lista jogos de uma competição numa janela de datas (YYYY-MM-DD inclusivo).
 * Usado pelo sync-live-scores quando há jogos ativos.
 */
export async function getCompetitionMatchesInWindow(
  leagueId: string,
  season: number,
  dateFrom: string,
  dateTo: string,
  options?: { groupMap?: Map<string, string> },
): Promise<NormalizedMatch[]> {
  const data = await fetchJson<ApiFootballFixture[]>(
    `/fixtures?league=${encodeURIComponent(leagueId)}&season=${season}` +
      `&from=${dateFrom}&to=${dateTo}`,
  )
  return data.response.map((f) => normalizeFixture(f, options?.groupMap))
}

// ─── ODDS (pré-match, mercado Match Winner 1X2) ─────────────────────────────

type ApiOddsResponse = Array<{
  fixture: { id: number }
  bookmakers: Array<{
    id: number
    name: string
    bets: Array<{
      id: number
      name: string                                  // "Match Winner"
      values: Array<{ value: string; odd: string }> // value: "Home"|"Draw"|"Away"
    }>
  }>
}>

export type FairProbs = { home: number; draw: number; away: number }

/** Dias YYYY-MM-DD inclusivos entre from e to (cap em maxDays). */
function enumerateDays(from: string, to: string, maxDays: number): string[] {
  const out: string[] = []
  const d = new Date(from + "T00:00:00Z")
  const end = new Date(to + "T00:00:00Z")
  while (d <= end && out.length < maxDays) {
    out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

/**
 * Odds pré-match 1X2 de uma competição, convertidas em PROBABILIDADE JUSTA
 * (sem overround/vig): p_i = (1/odd_i) / Σ(1/odd_j).
 *
 * IMPORTANTE: o endpoint /odds NÃO aceita from/to (isso é do /fixtures) — só
 * `date` (um dia). Iteramos dia a dia da janela. Odds ficam disponíveis ~7
 * dias antes do jogo.
 *
 * Retorna { probs, rawFixtures } — rawFixtures = quantos fixtures a API trouxe
 * com odds (diagnóstico de cobertura, independente do nosso parser).
 */
export async function getCompetitionOdds(
  leagueId: string,
  season: number,
  dateFrom: string,
  dateTo: string,
): Promise<{ probs: Map<string, FairProbs>; rawFixtures: number }> {
  const out = new Map<string, FairProbs>()
  let rawFixtures = 0

  for (const day of enumerateDays(dateFrom, dateTo, 10)) {
    let page = 1
    let totalPages = 1
    do {
      let data: ApiSportsResponse<ApiOddsResponse>
      try {
        data = await fetchJson<ApiOddsResponse>(
          `/odds?league=${encodeURIComponent(leagueId)}&season=${season}&date=${day}&page=${page}`,
        )
      } catch (err) {
        console.warn(`getCompetitionOdds falhou (league=${leagueId}, date=${day}, page=${page}):`, err)
        break
      }
      for (const row of data.response) {
        rawFixtures++
        const fixtureId = String(row.fixture.id)
        if (out.has(fixtureId)) continue
        const probs = extractFairProbs(row)
        if (probs) out.set(fixtureId, probs)
      }
      totalPages = data.paging?.total ?? 1
      page++
    } while (page <= totalPages && page <= 10)
  }

  return { probs: out, rawFixtures }
}

/** Acha o mercado Match Winner com 3 odds válidas e converte em prob justa. */
function extractFairProbs(row: ApiOddsResponse[number]): FairProbs | null {
  for (const bm of row.bookmakers || []) {
    const mw = (bm.bets || []).find(
      (b) => /match\s*winner|1x2|fulltime\s*result/i.test(b.name),
    )
    if (!mw) continue

    let oddH = 0, oddD = 0, oddA = 0
    for (const v of mw.values) {
      const o = parseFloat(v.odd)
      if (!Number.isFinite(o) || o <= 1) continue
      const label = v.value.toLowerCase()
      if (label === "home" || label === "1") oddH = o
      else if (label === "draw" || label === "x") oddD = o
      else if (label === "away" || label === "2") oddA = o
    }
    if (oddH > 1 && oddD > 1 && oddA > 1) {
      const iH = 1 / oddH, iD = 1 / oddD, iA = 1 / oddA
      const sum = iH + iD + iA            // = 1 + overround
      return { home: iH / sum, draw: iD / sum, away: iA / sum } // remove o vig
    }
  }
  return null
}

// ─── NORMALIZATION ────────────────────────────────────────────────────────

function normalizeFixture(
  f: ApiFootballFixture,
  groupMap?: Map<string, string>,
): NormalizedMatch {
  const status = mapStatus(f.fixture.status.short)
  let stage = parseStage(f.league.round)

  // Pra Copa do Mundo, parseStage devolve "regular" porque API-Football só
  // diz "Group Stage - N" sem dizer o grupo. Usamos o groupMap (vindo do
  // endpoint /standings) pra resolver group_a..l por nome do time.
  if (stage === "regular" && groupMap && /group\s*stage/i.test(f.league.round)) {
    const groupByHome = groupMap.get(f.teams.home.name)
    const groupByAway = groupMap.get(f.teams.away.name)
    if (groupByHome && groupByHome === groupByAway) {
      stage = groupByHome
    } else if (groupByHome) {
      stage = groupByHome
    } else if (groupByAway) {
      stage = groupByAway
    }
  }

  return {
    externalId: String(f.fixture.id),
    competitionExternalId: String(f.league.id),
    homeTeam: { name: f.teams.home.name, code: null, logo: f.teams.home.logo || null },
    awayTeam: { name: f.teams.away.name, code: null, logo: f.teams.away.logo || null },
    startsAt: f.fixture.date,
    status,
    stage,
    venue: f.fixture.venue?.name || null,
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    homePen: f.score?.penalty?.home ?? null,
    awayPen: f.score?.penalty?.away ?? null,
    winnerOutcome: deriveWinner(f.teams.home.winner, f.teams.away.winner, f.goals.home, f.goals.away, status),
    liveMinute: f.fixture.status.elapsed,
  }
}

/** Mapeia código de status do API-Football pro nosso enum interno. */
export function mapStatus(short: string): GameStatus {
  switch (short) {
    case "TBD":
    case "NS":
      return "scheduled"
    case "1H":
    case "HT":
    case "2H":
    case "ET":
    case "BT":
    case "P":
    case "LIVE":
      return "live"
    case "FT":
    case "AET":
    case "PEN":
      return "finished"
    case "PST":
      return "postponed"
    case "SUSP":
    case "INT":
    case "CANC":
    case "ABD":
    case "AWD":
    case "WO":
      return "cancelled"
    default:
      console.warn(`api-sports: status desconhecido "${short}", assumindo "scheduled"`)
      return "scheduled"
  }
}

/**
 * Parser de `league.round` (formato livre) pro nosso campo `stage`.
 * Exemplos:
 *   "Group A - 1"          → "group_a"
 *   "Round of 16"          → "round_of_16"
 *   "Quarter-finals"       → "quarter"
 *   "Semi-finals"          → "semi"
 *   "3rd Place Final"      → "third"
 *   "Final"                → "final"
 *   "Regular Season - 5"   → "regular"
 *   "Rodada 5"             → "regular"
 */
export function parseStage(round: string): string {
  const r = (round || "").toLowerCase().trim()

  // Knockout
  if (/round\s*of\s*32|1\/16/.test(r)) return "round_of_32"
  if (/round\s*of\s*16|1\/8/.test(r)) return "round_of_16"
  if (/quarter|1\/4/.test(r)) return "quarter"
  if (/semi|1\/2/.test(r)) return "semi"
  if (/(3rd|third)\s*place/.test(r)) return "third"
  if (r === "final" || r.endsWith(" final")) return "final"

  // Grupos: "Group A - 1", "Group B"
  const groupMatch = r.match(/group\s+([a-l])\b/)
  if (groupMatch) return `group_${groupMatch[1].toLowerCase()}`

  // Ligas contínuas
  return "regular"
}

/**
 * Deriva o vencedor. Prioriza o flag oficial da API (`teams.*.winner`), que já
 * reflete prorrogação E pênaltis — essencial no mata-mata (um jogo 1-1 decidido
 * nos pênaltis tem goals empatado, mas a API marca quem avançou). Sem flag
 * (fase de grupos / empate real), decide pelo placar.
 */
function deriveWinner(
  homeWon: boolean | null,
  awayWon: boolean | null,
  home: number | null,
  away: number | null,
  status: GameStatus,
): WinnerOutcome {
  if (status !== "finished") return null
  if (homeWon === true) return "home"
  if (awayWon === true) return "away"
  if (home == null || away == null) return null
  if (home > away) return "home"
  if (home < away) return "away"
  return "draw"
}
