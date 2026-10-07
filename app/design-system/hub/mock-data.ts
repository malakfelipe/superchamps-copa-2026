/**
 * Mock data pro hub de competição — usado no design system pra prototipagem.
 * Estrutura espelha o que viria do data layer real:
 *  - Competition meta
 *  - Matches agrupados por data
 *  - Standings (single table ou by group)
 *  - Knockout bracket (se aplicável)
 *  - Top user leagues que jogam essa competição (descoberta social)
 */

export type MockTeam = {
  name: string
  countryCode: string | null
  shortName?: string
}

export type MockMatch = {
  id: string
  date: Date
  home: MockTeam
  away: MockTeam
  status: "scheduled" | "live" | "finished"
  liveMinute?: number | null
  homeScore?: number | null
  awayScore?: number | null
  stage: string                // "group_a", "regular", "round_of_16"
  stageLabel: string           // "Grupo A · Rodada 1", "Rodada 7", "Oitavas"
  venue?: string | null
  // pra exibir o "termômetro" social
  betsCount: number
  popularPick?: "home" | "draw" | "away"
}

export type MockStandingRow = {
  rank: number
  team: MockTeam
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  recentForm?: ("W" | "D" | "L")[]    // últimos 5
}

export type MockStandingGroup = {
  label: string                          // "Grupo A", "Tabela única"
  rows: MockStandingRow[]
}

export type MockBracketMatch = {
  home?: MockTeam
  away?: MockTeam
  homeScore?: number | null
  awayScore?: number | null
  status: "scheduled" | "live" | "finished" | "tbd"
}

export type MockBracketRound = {
  label: string                          // "Oitavas", "Quartas"
  matches: MockBracketMatch[]
}

export type MockUserLeague = {
  slug: string
  name: string
  ownerNickname: string
  memberCount: number
  isFavorite?: boolean
  description?: string
}

export type CompetitionMockData = {
  slug: string
  name: string
  season: string
  countryCode: string | null
  icon?: string
  description: string
  hasGroups: boolean
  hasKnockout: boolean
  // Stats topo
  totalParticipants: number
  totalUserLeagues: number
  upcomingMatchesCount: number
  // Conteúdo
  matches: MockMatch[]
  standings: MockStandingGroup[]
  bracket?: MockBracketRound[]
  topLeagues: MockUserLeague[]
}

// Helpers
function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}
function setTime(d: Date, h: number, m = 0): Date {
  const out = new Date(d)
  out.setHours(h, m, 0, 0)
  return out
}

const NOW = new Date()

// ─── COPA DO MUNDO 2026 ────────────────────────────────────────────────────

const TEAMS = {
  brasil: { name: "Brasil", countryCode: "br", shortName: "BRA" },
  argentina: { name: "Argentina", countryCode: "ar", shortName: "ARG" },
  franca: { name: "França", countryCode: "fr", shortName: "FRA" },
  alemanha: { name: "Alemanha", countryCode: "de", shortName: "GER" },
  espanha: { name: "Espanha", countryCode: "es", shortName: "ESP" },
  inglaterra: { name: "Inglaterra", countryCode: "gb-eng", shortName: "ENG" },
  portugal: { name: "Portugal", countryCode: "pt", shortName: "POR" },
  mexico: { name: "México", countryCode: "mx", shortName: "MEX" },
  marrocos: { name: "Marrocos", countryCode: "ma", shortName: "MAR" },
  croacia: { name: "Croácia", countryCode: "hr", shortName: "CRO" },
  uruguai: { name: "Uruguai", countryCode: "uy", shortName: "URU" },
  japao: { name: "Japão", countryCode: "jp", shortName: "JPN" },
  italia: { name: "Itália", countryCode: "it", shortName: "ITA" },
  holanda: { name: "Holanda", countryCode: "nl", shortName: "NED" },
  belgica: { name: "Bélgica", countryCode: "be", shortName: "BEL" },
  senegal: { name: "Senegal", countryCode: "sn", shortName: "SEN" },
} as const

export const COPA_MOCK: CompetitionMockData = {
  slug: "copa-do-mundo-2026",
  name: "Copa do Mundo",
  season: "2026",
  countryCode: null,
  icon: "🏆",
  description: "48 seleções. 12 grupos. 104 jogos. Jun-Jul 2026 no México, EUA e Canadá.",
  hasGroups: true,
  hasKnockout: true,
  totalParticipants: 12450,
  totalUserLeagues: 480,
  upcomingMatchesCount: 72,

  matches: [
    // Hoje
    {
      id: "wc-1", date: setTime(NOW, 14, 0),
      home: TEAMS.mexico, away: TEAMS.marrocos,
      status: "scheduled", stage: "group_a", stageLabel: "Grupo A · Rodada 1",
      venue: "Estadio Azteca, Cidade do México",
      betsCount: 2840, popularPick: "home",
    },
    {
      id: "wc-2", date: setTime(NOW, 18, 0),
      home: TEAMS.brasil, away: TEAMS.croacia,
      status: "scheduled", stage: "group_g", stageLabel: "Grupo G · Rodada 1",
      venue: "MetLife Stadium, NJ",
      betsCount: 4120, popularPick: "home",
    },
    // Amanhã
    {
      id: "wc-3", date: setTime(addDays(NOW, 1), 13, 0),
      home: TEAMS.argentina, away: TEAMS.italia,
      status: "scheduled", stage: "group_d", stageLabel: "Grupo D · Rodada 1",
      venue: "Mercedes-Benz Stadium, Atlanta",
      betsCount: 3700, popularPick: "home",
    },
    {
      id: "wc-4", date: setTime(addDays(NOW, 1), 16, 0),
      home: TEAMS.franca, away: TEAMS.senegal,
      status: "scheduled", stage: "group_b", stageLabel: "Grupo B · Rodada 1",
      venue: "BC Place, Vancouver",
      betsCount: 2150, popularPick: "home",
    },
    {
      id: "wc-5", date: setTime(addDays(NOW, 1), 20, 0),
      home: TEAMS.alemanha, away: TEAMS.japao,
      status: "scheduled", stage: "group_e", stageLabel: "Grupo E · Rodada 1",
      venue: "AT&T Stadium, Dallas",
      betsCount: 1980, popularPick: "home",
    },
    // Em 2 dias
    {
      id: "wc-6", date: setTime(addDays(NOW, 2), 15, 0),
      home: TEAMS.espanha, away: TEAMS.uruguai,
      status: "scheduled", stage: "group_c", stageLabel: "Grupo C · Rodada 1",
      venue: "SoFi Stadium, Los Angeles",
      betsCount: 1750, popularPick: "home",
    },
    {
      id: "wc-7", date: setTime(addDays(NOW, 2), 18, 0),
      home: TEAMS.portugal, away: TEAMS.belgica,
      status: "scheduled", stage: "group_h", stageLabel: "Grupo H · Rodada 1",
      venue: "Gillette Stadium, Boston",
      betsCount: 1620, popularPick: "draw",
    },
    {
      id: "wc-8", date: setTime(addDays(NOW, 2), 21, 0),
      home: TEAMS.inglaterra, away: TEAMS.holanda,
      status: "scheduled", stage: "group_f", stageLabel: "Grupo F · Rodada 1",
      venue: "Estadio Akron, Guadalajara",
      betsCount: 2240, popularPick: "home",
    },
  ],

  standings: [
    {
      label: "Grupo A",
      rows: [
        { rank: 1, team: TEAMS.mexico,   played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
        { rank: 2, team: TEAMS.marrocos, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
        { rank: 3, team: { name: "Cabo Verde", countryCode: "cv", shortName: "CPV" }, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
        { rank: 4, team: { name: "Curaçao",     countryCode: "cw", shortName: "CUW" }, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
      ],
    },
    {
      label: "Grupo B",
      rows: [
        { rank: 1, team: TEAMS.franca,  played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
        { rank: 2, team: TEAMS.senegal, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
        { rank: 3, team: { name: "Tunísia",  countryCode: "tn", shortName: "TUN" }, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
        { rank: 4, team: { name: "Equador",  countryCode: "ec", shortName: "ECU" }, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
      ],
    },
  ],

  bracket: [
    { label: "Oitavas", matches: Array.from({ length: 8 }, (): MockBracketMatch => ({ status: "tbd" })) },
    { label: "Quartas", matches: Array.from({ length: 4 }, (): MockBracketMatch => ({ status: "tbd" })) },
    { label: "Semis",   matches: Array.from({ length: 2 }, (): MockBracketMatch => ({ status: "tbd" })) },
    { label: "Final",   matches: [{ status: "tbd" }] },
  ],

  topLeagues: [
    { slug: "familia-malak", name: "Família Malak", ownerNickname: "malakfelipe", memberCount: 18, description: "O bolão tradicional da família. Há 4 Copas." },
    { slug: "lordsgg",       name: "Lord's Gathering Group", ownerNickname: "thiago_a", memberCount: 14, description: "Galera do trampo, viciados em estatística." },
    { slug: "amigos-fac",    name: "Amigos da Faculdade", ownerNickname: "mariazinha", memberCount: 26, description: "Quem perder paga o churrasco da semifinal." },
    { slug: "liessin08",     name: "Liessin08", ownerNickname: "matheus_m", memberCount: 8 },
    { slug: "loucos-pelo-jogo", name: "Loucos pelo jogo", ownerNickname: "neto", memberCount: 31, description: "Liga aberta, 31 membros, ranking apertado." },
  ],
}

// ─── BRASILEIRÃO SÉRIE A 2026 ──────────────────────────────────────────────

const BR_TEAMS = {
  flamengo:    { name: "Flamengo",      countryCode: "br" },
  palmeiras:   { name: "Palmeiras",     countryCode: "br" },
  corinthians: { name: "Corinthians",   countryCode: "br" },
  saopaulo:    { name: "São Paulo",     countryCode: "br" },
  vasco:       { name: "Vasco",         countryCode: "br" },
  fluminense:  { name: "Fluminense",    countryCode: "br" },
  internacional:{ name: "Internacional",countryCode: "br" },
  gremio:      { name: "Grêmio",        countryCode: "br" },
  cruzeiro:    { name: "Cruzeiro",      countryCode: "br" },
  atleticomg:  { name: "Atlético-MG",   countryCode: "br" },
  bahia:       { name: "Bahia",         countryCode: "br" },
  santos:      { name: "Santos",        countryCode: "br" },
} as const

export const BRASILEIRAO_MOCK: CompetitionMockData = {
  slug: "brasileirao-a-2026",
  name: "Brasileirão Série A",
  season: "2026",
  countryCode: "br",
  description: "20 times. 38 rodadas. Abr/2026 a Dez/2026. Brasileirão é Brasileirão.",
  hasGroups: false,
  hasKnockout: false,
  totalParticipants: 0,
  totalUserLeagues: 0,
  upcomingMatchesCount: 287,

  matches: [
    {
      id: "br-1", date: setTime(NOW, 16, 0),
      home: BR_TEAMS.flamengo, away: BR_TEAMS.fluminense,
      status: "scheduled", stage: "regular", stageLabel: "Rodada 8",
      venue: "Maracanã, Rio de Janeiro",
      betsCount: 0,
    },
    {
      id: "br-2", date: setTime(NOW, 19, 0),
      home: BR_TEAMS.palmeiras, away: BR_TEAMS.corinthians,
      status: "scheduled", stage: "regular", stageLabel: "Rodada 8",
      venue: "Allianz Parque, São Paulo",
      betsCount: 0,
    },
    {
      id: "br-3", date: setTime(addDays(NOW, 1), 18, 30),
      home: BR_TEAMS.gremio, away: BR_TEAMS.internacional,
      status: "scheduled", stage: "regular", stageLabel: "Rodada 8",
      venue: "Arena do Grêmio, Porto Alegre",
      betsCount: 0,
    },
  ],

  standings: [
    {
      label: "Classificação",
      rows: [
        { rank: 1, team: BR_TEAMS.flamengo,     played: 7, won: 6, drawn: 0, lost: 1, goalsFor: 14, goalsAgainst: 3,  goalDiff: 11, points: 18, recentForm: ["W","W","W","W","L"] },
        { rank: 2, team: BR_TEAMS.palmeiras,    played: 7, won: 5, drawn: 1, lost: 1, goalsFor: 13, goalsAgainst: 5,  goalDiff: 8,  points: 16, recentForm: ["W","W","D","W","L"] },
        { rank: 3, team: BR_TEAMS.atleticomg,   played: 7, won: 5, drawn: 0, lost: 2, goalsFor: 11, goalsAgainst: 6,  goalDiff: 5,  points: 15, recentForm: ["W","W","W","L","W"] },
        { rank: 4, team: BR_TEAMS.cruzeiro,     played: 7, won: 4, drawn: 2, lost: 1, goalsFor: 10, goalsAgainst: 5,  goalDiff: 5,  points: 14, recentForm: ["W","D","W","W","D"] },
        { rank: 5, team: BR_TEAMS.bahia,        played: 7, won: 4, drawn: 1, lost: 2, goalsFor: 9,  goalsAgainst: 6,  goalDiff: 3,  points: 13, recentForm: ["W","L","W","D","W"] },
        { rank: 6, team: BR_TEAMS.fluminense,   played: 7, won: 4, drawn: 1, lost: 2, goalsFor: 8,  goalsAgainst: 5,  goalDiff: 3,  points: 13, recentForm: ["W","L","W","W","D"] },
        { rank: 7, team: BR_TEAMS.gremio,       played: 7, won: 3, drawn: 3, lost: 1, goalsFor: 9,  goalsAgainst: 7,  goalDiff: 2,  points: 12, recentForm: ["D","W","D","W","D"] },
        { rank: 8, team: BR_TEAMS.corinthians,  played: 7, won: 3, drawn: 2, lost: 2, goalsFor: 8,  goalsAgainst: 8,  goalDiff: 0,  points: 11, recentForm: ["W","D","L","W","D"] },
        { rank: 9, team: BR_TEAMS.internacional,played: 7, won: 3, drawn: 1, lost: 3, goalsFor: 9,  goalsAgainst: 10, goalDiff: -1, points: 10, recentForm: ["L","W","L","D","W"] },
        { rank: 10,team: BR_TEAMS.saopaulo,     played: 7, won: 2, drawn: 3, lost: 2, goalsFor: 6,  goalsAgainst: 7,  goalDiff: -1, points: 9,  recentForm: ["D","D","W","L","D"] },
        { rank: 11,team: BR_TEAMS.santos,       played: 7, won: 2, drawn: 2, lost: 3, goalsFor: 7,  goalsAgainst: 9,  goalDiff: -2, points: 8,  recentForm: ["L","W","D","L","D"] },
        { rank: 12,team: BR_TEAMS.vasco,        played: 7, won: 1, drawn: 3, lost: 3, goalsFor: 5,  goalsAgainst: 8,  goalDiff: -3, points: 6,  recentForm: ["L","D","D","W","L"] },
      ],
    },
  ],

  topLeagues: [
    { slug: "brasileirao-fla", name: "Brasileirão dos Fla", ownerNickname: "rubronegra", memberCount: 12, description: "Só torcedores do Mengão." },
    { slug: "df-united",        name: "DF United",            ownerNickname: "victor_m",   memberCount: 8 },
  ],
}

export const ALL_MOCKS: Record<string, CompetitionMockData> = {
  [COPA_MOCK.slug]: COPA_MOCK,
  [BRASILEIRAO_MOCK.slug]: BRASILEIRAO_MOCK,
}
