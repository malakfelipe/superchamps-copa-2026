/**
 * Tipos normalizados compartilhados entre clients de API esportiva.
 *
 * Padrão de portabilidade: qualquer client novo (api-sports, sportsdata, etc.)
 * deve transformar suas estruturas próprias pra `NormalizedMatch` antes de
 * entregar pra Edge Function. Assim a Edge Function não precisa saber QUAL
 * API tá por trás.
 */

export type GameStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "cancelled"
  | "postponed"

export type WinnerOutcome = "home" | "away" | "draw" | null

export type NormalizedMatch = {
  /** ID do jogo no provider externo. String pra suportar IDs longos. */
  externalId: string
  /** ID da competição no provider externo (espelha competitions.external_id). */
  competitionExternalId: string
  homeTeam: { name: string; code: string | null; logo?: string | null }
  awayTeam: { name: string; code: string | null; logo?: string | null }
  /** ISO 8601 UTC, ex: "2026-06-11T20:00:00+00:00" */
  startsAt: string
  status: GameStatus
  /** ex: "group_a", "round_of_16", "quarter", "semi", "final", "regular" */
  stage: string
  venue: string | null
  homeScore: number | null
  awayScore: number | null
  /** Placar dos pênaltis (só em jogo decidido na disputa). NULL caso contrário. */
  homePen: number | null
  awayPen: number | null
  winnerOutcome: WinnerOutcome
  /** Minutos jogados (só durante live). */
  liveMinute: number | null
}

export type CompetitionRef = {
  id: string
  name: string
  externalId: string
  externalSource: string
  externalSeason: number | null
}
