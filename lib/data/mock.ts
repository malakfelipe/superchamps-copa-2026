/**
 * Dados mockados pra desenvolvimento sem Supabase conectado.
 * Removido assim que houver dados reais no banco.
 */
import type {
  Profile, Match, LeagueMembership, OpenBet, FinishedBet,
  WalletTransaction, LeagueMember, MatchDetails, Pool1X2, PoolScore,
  PublicProfile, PublicFinishedBet, Notification,
} from "./types"

const NOW = new Date("2026-05-25T15:30:00-03:00")

export const MOCK_PROFILE: Profile = {
  id: "u-jm",
  nickname: "joaomalak",
  fullName: "João Malak",
  avatarUrl: null,
  countryCode: "BR",
  balance: 850,
  referralCode: "JOAOMALAK-A8B3",
  emailVerifiedAt: new Date("2025-08-15T11:30:00-03:00"),
  onboardedAt: new Date("2025-08-15T11:35:00-03:00"),
  betsPubliclyVisible: true,
}

export const MOCK_MATCHES: Match[] = [
  // Finalizados (recentes)
  {
    id: "m-001",
    competitionId: "c-copa",
    home: { name: "Brasil", short: "BRA" }, away: { name: "Sérvia", short: "SRB" },
    startsAt: new Date("2026-05-12T20:00:00-03:00"),
    status: "finished", stage: "group_a", venue: "Estádio Azteca",
    homeScore: 2, awayScore: 0,
    poolTotal: 4200, topOdd: 1.55, myBetStatus: "won",
  },
  {
    id: "m-002",
    competitionId: "c-copa",
    home: { name: "Argentina", short: "ARG" }, away: { name: "Polônia", short: "POL" },
    startsAt: new Date("2026-05-13T16:00:00-03:00"),
    status: "finished", stage: "group_b", venue: "MetLife Stadium",
    homeScore: 2, awayScore: 1,
    poolTotal: 3800, topOdd: 1.42,
  },
  {
    id: "m-003",
    competitionId: "c-copa",
    home: { name: "Brasil", short: "BRA" }, away: { name: "Croácia", short: "CRO" },
    startsAt: new Date("2026-05-20T22:00:00-03:00"),
    status: "finished", stage: "group_a", venue: "Estádio Azteca",
    homeScore: 1, awayScore: 1,
    poolTotal: 4500, topOdd: 1.78, myBetStatus: "lost",
  },
  // Ao vivo
  {
    id: "m-005",
    competitionId: "c-copa",
    home: { name: "Espanha", short: "ESP" }, away: { name: "Alemanha", short: "GER" },
    startsAt: new Date("2026-05-25T17:00:00-03:00"),
    status: "live", stage: "group_b", venue: "SoFi Stadium",
    homeScore: 1, awayScore: 0, liveMinute: 67,
    poolTotal: 3200, topOdd: 2.10,
  },
  {
    id: "m-006",
    competitionId: "c-copa",
    home: { name: "Holanda", short: "NED" }, away: { name: "Senegal", short: "SEN" },
    startsAt: new Date("2026-05-25T18:00:00-03:00"),
    status: "live", stage: "group_e", venue: "Hard Rock Stadium",
    homeScore: 2, awayScore: 1, liveMinute: 38,
    poolTotal: 2500, topOdd: 1.85,
  },
  // Hoje, ainda futuros
  {
    id: "m-007",
    competitionId: "c-copa",
    home: { name: "Brasil", short: "BRA" }, away: { name: "Argentina", short: "ARG" },
    startsAt: new Date("2026-05-25T20:00:00-03:00"),
    status: "scheduled", stage: "group_a", venue: "Estádio Azteca",
    poolTotal: 4500, topOdd: 1.61, myBetStatus: "open",
  },
  {
    id: "m-008",
    competitionId: "c-copa",
    home: { name: "França", short: "FRA" }, away: { name: "Itália", short: "ITA" },
    startsAt: new Date("2026-05-25T21:00:00-03:00"),
    status: "scheduled", stage: "group_c", venue: "Mercedes-Benz Stadium",
    poolTotal: 2800, topOdd: 2.45, myBetStatus: "open",
  },
  // Amanhã
  {
    id: "m-009",
    competitionId: "c-copa",
    home: { name: "Portugal", short: "POR" }, away: { name: "México", short: "MEX" },
    startsAt: new Date("2026-05-26T15:00:00-03:00"),
    status: "scheduled", stage: "group_d", venue: "AT&T Stadium",
    poolTotal: 1800, topOdd: 1.85,
  },
  {
    id: "m-010",
    competitionId: "c-copa",
    home: { name: "Uruguai", short: "URU" }, away: { name: "Japão", short: "JPN" },
    startsAt: new Date("2026-05-26T18:00:00-03:00"),
    status: "scheduled", stage: "group_e", venue: "Hard Rock Stadium",
    poolTotal: 1450, topOdd: 1.95,
  },
  {
    id: "m-011",
    competitionId: "c-copa",
    home: { name: "Bélgica", short: "BEL" }, away: { name: "Marrocos", short: "MAR" },
    startsAt: new Date("2026-05-26T21:00:00-03:00"),
    status: "scheduled", stage: "group_f", venue: "Lumen Field",
    poolTotal: 1320, topOdd: 1.72,
  },
  // 27/05
  {
    id: "m-012",
    competitionId: "c-copa",
    home: { name: "Colômbia", short: "COL" }, away: { name: "Equador", short: "ECU" },
    startsAt: new Date("2026-05-27T16:00:00-03:00"),
    status: "scheduled", stage: "group_g", venue: "BMO Field",
    poolTotal: 980, topOdd: 1.95,
  },
  {
    id: "m-013",
    competitionId: "c-copa",
    home: { name: "Inglaterra", short: "ENG" }, away: { name: "Estados Unidos", short: "USA" },
    startsAt: new Date("2026-05-27T19:00:00-03:00"),
    status: "scheduled", stage: "group_d", venue: "Levi's Stadium",
    poolTotal: 1850, topOdd: 1.65,
  },
]

export const MOCK_MY_LEAGUES: LeagueMembership[] = [
  {
    id: "l-1",
    name: "Liga dos Amigos",
    slug: "liga-dos-amigos",
    emoji: "🏆",
    visibility: "private",
    ownerId: "u-carlos",
    ownerNickname: "Carlinhos_F",
    inviteCode: "AMIGOS-K8T2",
    totalMembers: 15,
    description: "Bolão dos amigos da faculdade",
    createdAt: new Date("2026-02-10"),
    myRank: 4,
    myNetPoints: 450,
    trend: 3,
  },
  {
    id: "l-2",
    name: "Galera do Trabalho",
    slug: "galera-do-trabalho",
    emoji: "💼",
    visibility: "private",
    ownerId: "u-jm",
    ownerNickname: "joaomalak",
    inviteCode: "TRAB-X9P3",
    totalMembers: 8,
    description: null,
    createdAt: new Date("2026-03-01"),
    myRank: 2,
    myNetPoints: 280,
    trend: 1,
  },
  {
    id: "l-3",
    name: "Liga Global",
    slug: "global",
    emoji: "🌎",
    visibility: "global",
    ownerId: "system",
    ownerNickname: "SuperChamps",
    inviteCode: null,
    totalMembers: 510,
    description: "Liga aberta a todos os usuários",
    createdAt: new Date("2026-01-01"),
    myRank: 47,
    myNetPoints: 250,
    trend: -28,
  },
]

export const MOCK_OPEN_BETS: OpenBet[] = [
  {
    id: "ob-1",
    matchId: "m-007",
    matchLabel: "Brasil × Argentina",
    homeName: "Brasil", awayName: "Argentina",
    marketType: "1x2",
    outcome: "home",
    outcomeLabel: "Brasil vence",
    stake: 100,
    oddAtPlacement: 1.55,
    oddNow: 1.61,
    kickoff: new Date("2026-05-25T20:00:00-03:00"),
  },
  {
    id: "ob-2",
    matchId: "m-007",
    matchLabel: "Brasil × Argentina",
    homeName: "Brasil", awayName: "Argentina",
    marketType: "exact_score",
    outcome: "1-0",
    outcomeLabel: "Placar 1 × 0",
    stake: 75,
    oddAtPlacement: 4.80,
    oddNow: 4.92,
    kickoff: new Date("2026-05-25T20:00:00-03:00"),
  },
  {
    id: "ob-3",
    matchId: "m-008",
    matchLabel: "França × Itália",
    homeName: "França", awayName: "Itália",
    marketType: "1x2",
    outcome: "draw",
    outcomeLabel: "Empate",
    stake: 50,
    oddAtPlacement: 3.20,
    oddNow: 3.45,
    kickoff: new Date("2026-05-25T21:00:00-03:00"),
  },
]

export const MOCK_RECENT_FINISHED: FinishedBet[] = [
  {
    id: "fb-1",
    matchId: "m-005",
    matchLabel: "Espanha × Alemanha",
    homeName: "Espanha", awayName: "Alemanha",
    marketType: "exact_score",
    outcome: "2-1",
    outcomeLabel: "Placar 2 × 1",
    stake: 50,
    oddAtPlacement: 9.60,
    oddNow: 9.60,
    kickoff: new Date("2026-05-23T20:00:00-03:00"),
    status: "won",
    payout: 480,
    settledAt: new Date("2026-05-23T22:50:00-03:00"),
  },
]

// ─── WALLET TRANSACTIONS ─────────────────────────────────────────────────

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: "tx-101", amount: -50, reason: "bet_placed", title: "Aposta: Empate Brasil × Argentina", detail: "Mercado 1X2 · odd 5.00 · stake 50 pts", competition: "Copa 2026", balanceAfter: 850, createdAt: new Date("2026-05-24T14:32:00-03:00") },
  { id: "tx-100", amount: +480, reason: "bet_won", title: "Acertou Espanha × Alemanha 2-1", detail: "Placar exato · odd 9.60 · stake 50 pts", competition: "Copa 2026", balanceAfter: 900, createdAt: new Date("2026-05-24T12:48:00-03:00") },
  { id: "tx-099", amount: -100, reason: "bet_placed", title: "Aposta: Brasil vence", detail: "Mercado 1X2 · odd 1.61 · stake 100 pts", competition: "Copa 2026", balanceAfter: 420, createdAt: new Date("2026-05-24T09:14:00-03:00") },
  { id: "tx-098", amount: -75, reason: "bet_placed", title: "Aposta: Placar 1 × 0 Brasil", detail: "Placar exato · odd 4.92 · stake 75 pts", competition: "Copa 2026", balanceAfter: 520, createdAt: new Date("2026-05-23T18:35:00-03:00") },
  { id: "tx-097", amount: +30, reason: "bet_refunded", title: "Aposta reembolsada", detail: "Jogo cancelado: Polônia × Equador", competition: "Copa 2026", balanceAfter: 595, createdAt: new Date("2026-05-23T12:00:00-03:00") },
  { id: "tx-096", amount: +210, reason: "bet_won", title: "Acertou França vence", detail: "1X2 · odd 4.20 · stake 50 pts", competition: "Copa 2026", balanceAfter: 565, createdAt: new Date("2026-05-22T20:18:00-03:00") },
  { id: "tx-095", amount: +100, reason: "referral_bonus", title: "Você convidou MariSCC", detail: "Bônus de indicação · 7/20 do mês", competition: null, balanceAfter: 355, createdAt: new Date("2026-05-21T10:14:00-03:00") },
  { id: "tx-094", amount: +50, reason: "low_balance_boost", title: "Ajuda de saldo baixo", detail: "Saldo estava em 8 pts · boost diário", competition: null, balanceAfter: 255, createdAt: new Date("2026-05-08T06:00:00-03:00") },
  { id: "tx-001", amount: +1000, reason: "signup_bonus", title: "Bem-vindo ao SuperChamps!", detail: "Bônus de cadastro", competition: null, balanceAfter: 1000, createdAt: new Date("2025-08-15T11:20:00-03:00") },
]

// ─── LEAGUE MEMBERS (mock) ────────────────────────────────────────────────

export const MOCK_LEAGUE_MEMBERS: LeagueMember[] = [
  { userId: "u-carlos", nickname: "Carlinhos_F", fullName: "Carlos Mendes", countryName: "Brasil", role: "owner", joinedAt: new Date("2026-02-10"), netPoints: 1240, betsTotal: 28, betsWon: 18, trend: 0, matchesBetIn: 14, matchesAvailable: 15 },
  { userId: "u-patricia", nickname: "PatriciaGoal", fullName: "Patrícia Lima", countryName: "Brasil", role: "member", joinedAt: new Date("2026-02-12"), netPoints: 980, betsTotal: 26, betsWon: 16, trend: 1, matchesBetIn: 13, matchesAvailable: 15 },
  { userId: "u-rafa", nickname: "rafa.s", fullName: "Rafael Souza", countryName: "Argentina", role: "member", joinedAt: new Date("2026-02-15"), netPoints: 870, betsTotal: 24, betsWon: 15, trend: -1, matchesBetIn: 12, matchesAvailable: 15 },
  { userId: "u-jm", nickname: "joaomalak", fullName: "João Malak", countryName: "Brasil", role: "member", joinedAt: new Date("2026-02-11"), netPoints: 450, betsTotal: 22, betsWon: 12, trend: 3, matchesBetIn: 11, matchesAvailable: 15 },
  { userId: "u-mari", nickname: "MariSCC", fullName: "Mariana Castro", countryName: "Brasil", role: "member", joinedAt: new Date("2026-02-13"), netPoints: 380, betsTotal: 20, betsWon: 11, trend: -2, matchesBetIn: 10, matchesAvailable: 15 },
  { userId: "u-pedro", nickname: "pedrinhoF", fullName: "Pedro Rocha", countryName: "Brasil", role: "member", joinedAt: new Date("2026-02-14"), netPoints: 290, betsTotal: 18, betsWon: 10, trend: 0, matchesBetIn: 9, matchesAvailable: 15 },
  { userId: "u-felipe", nickname: "Lipe_RJ", fullName: "Felipe Oliveira", countryName: "Brasil", role: "member", joinedAt: new Date("2026-02-18"), netPoints: 220, betsTotal: 16, betsWon: 9, trend: 2, matchesBetIn: 8, matchesAvailable: 15 },
  { userId: "u-ana", nickname: "anabittencourt", fullName: "Ana Bittencourt", countryName: "Portugal", role: "member", joinedAt: new Date("2026-02-20"), netPoints: 110, betsTotal: 14, betsWon: 8, trend: 1, matchesBetIn: 7, matchesAvailable: 15 },
  { userId: "u-lucas", nickname: "lucasFC", fullName: "Lucas Albuquerque", countryName: "Brasil", role: "member", joinedAt: new Date("2026-02-22"), netPoints: 50, betsTotal: 13, betsWon: 7, trend: -1, matchesBetIn: 6, matchesAvailable: 15 },
  { userId: "u-bruno", nickname: "brunoMP", fullName: "Bruno Marques", countryName: "Brasil", role: "member", joinedAt: new Date("2026-02-25"), netPoints: -40, betsTotal: 12, betsWon: 6, trend: 0, matchesBetIn: 6, matchesAvailable: 15 },
  { userId: "u-fer", nickname: "ferFutebol", fullName: "Fernanda Aguiar", countryName: "Brasil", role: "member", joinedAt: new Date("2026-02-28"), netPoints: -90, betsTotal: 12, betsWon: 5, trend: -2, matchesBetIn: 5, matchesAvailable: 15 },
  { userId: "u-cam", nickname: "milainha", fullName: "Camila Andrade", countryName: "Brasil", role: "member", joinedAt: new Date("2026-03-05"), netPoints: -210, betsTotal: 9, betsWon: 4, trend: -1, matchesBetIn: 4, matchesAvailable: 15 },
]

// ─── MATCH DETAILS (pools por jogo) ───────────────────────────────────────

const POOL_1X2_DEFAULT: Pool1X2 = { home: 2800, draw: 900, away: 800 }
const POOL_SCORE_DEFAULT: PoolScore = {
  "1-0": 250, "2-1": 200, "1-1": 180, "2-0": 150, "0-0": 120,
  "0-1": 100, "2-2": 80, "3-1": 60, "1-2": 50, "3-0": 40, "0-2": 30,
}

export function getMockMatchDetails(matchId: string): MatchDetails | null {
  const match = MOCK_MATCHES.find((m) => m.id === matchId)
  if (!match) return null
  // Pool baseado no poolTotal já mockado (proporção fixa)
  const scale = match.poolTotal / (POOL_1X2_DEFAULT.home + POOL_1X2_DEFAULT.draw + POOL_1X2_DEFAULT.away)
  return {
    ...match,
    pool1x2: {
      home: Math.round(POOL_1X2_DEFAULT.home * scale),
      draw: Math.round(POOL_1X2_DEFAULT.draw * scale),
      away: Math.round(POOL_1X2_DEFAULT.away * scale),
    },
    poolScore: Object.fromEntries(
      Object.entries(POOL_SCORE_DEFAULT).map(([k, v]) => [k, Math.round(v * scale)]),
    ),
    bettorsCount: Math.max(8, Math.round(match.poolTotal / 100)),
    avgStake: 75,
    // IDs fake só em demo mode — em produção viriam da query SQL
    market1x2Id: `mock-mkt-${matchId}-1x2`,
    marketScoreId: `mock-mkt-${matchId}-score`,
  }
}

// ─── PUBLIC PROFILES (outros usuários) ────────────────────────────────────

export const MOCK_PUBLIC_PROFILES: PublicProfile[] = [
  {
    id: "u-carlos",
    nickname: "Carlinhos_F",
    fullName: "Carlos Mendes",
    avatarUrl: null,
    countryCode: "BR",
    countryName: "Brasil",
    balance: 1850,                            // não usado, só por type compat
    referralCode: "CARLOS-7Z2K",
    emailVerifiedAt: new Date("2025-08-22"),
    onboardedAt: new Date("2025-08-22"),
    betsPubliclyVisible: true,
    isOwnerOf: 2,
    ligasJoined: 4,
    competitionsPlayed: 4,
    allTimeRank: 12,
    allTimeNetPoints: 3450,
    copaStats: {
      bets: 28, won: 18, lost: 9, refunded: 1,
      avgOdd: 3.42, netPoints: 1240, biggestWin: 720,
      matchesAvailable: 24, matchesBetIn: 22,
    },
    sharedLeagues: ["Liga dos Amigos", "Liga Global"],
  },
  {
    id: "u-patricia",
    nickname: "PatriciaGoal",
    fullName: "Patrícia Lima",
    avatarUrl: null,
    countryCode: "BR",
    countryName: "Brasil",
    balance: 1400,
    referralCode: "PAT-3JKD",
    emailVerifiedAt: new Date("2026-02-12"),
    onboardedAt: new Date("2026-02-12"),
    betsPubliclyVisible: true,
    isOwnerOf: 0,
    ligasJoined: 2,
    competitionsPlayed: 1,
    allTimeRank: 28,
    allTimeNetPoints: 980,
    copaStats: {
      bets: 26, won: 16, lost: 9, refunded: 1,
      avgOdd: 3.10, netPoints: 980, biggestWin: 420,
      matchesAvailable: 24, matchesBetIn: 20,
    },
    sharedLeagues: ["Liga dos Amigos"],
  },
]

export const MOCK_PUBLIC_FINISHED_BETS: Record<string, PublicFinishedBet[]> = {
  "u-carlos": [
    { id: "fb-c1", matchId: "m-005", matchLabel: "Espanha × Alemanha", homeName: "Espanha", awayName: "Alemanha", marketType: "exact_score", outcome: "2-1", outcomeLabel: "Placar 2 × 1", stake: 75, oddAtPlacement: 9.6, oddNow: 9.6, kickoff: new Date("2026-05-23T20:00:00-03:00"), status: "won", payout: 720, settledAt: new Date("2026-05-23T22:50:00-03:00") },
    { id: "fb-c2", matchId: "m-003", matchLabel: "Brasil × Croácia", homeName: "Brasil", awayName: "Croácia", marketType: "1x2", outcome: "home", outcomeLabel: "Brasil vence", stake: 100, oddAtPlacement: 1.78, oddNow: 1.78, kickoff: new Date("2026-05-20T22:00:00-03:00"), status: "won", payout: 178, settledAt: new Date("2026-05-20T23:50:00-03:00") },
    { id: "fb-c3", matchId: "m-008-old", matchLabel: "França × Itália", homeName: "França", awayName: "Itália", marketType: "1x2", outcome: "draw", outcomeLabel: "Empate", stake: 50, oddAtPlacement: 3.45, oddNow: 3.45, kickoff: new Date("2026-05-18T22:00:00-03:00"), status: "won", payout: 173, settledAt: new Date("2026-05-18T23:50:00-03:00") },
    { id: "fb-c4", matchId: "m-002", matchLabel: "Argentina × Polônia", homeName: "Argentina", awayName: "Polônia", marketType: "1x2", outcome: "home", outcomeLabel: "Argentina vence", stake: 80, oddAtPlacement: 1.42, oddNow: 1.42, kickoff: new Date("2026-05-13T16:00:00-03:00"), status: "won", payout: 114, settledAt: new Date("2026-05-13T17:50:00-03:00") },
    { id: "fb-c5", matchId: "m-por-mex-old", matchLabel: "Portugal × México", homeName: "Portugal", awayName: "México", marketType: "exact_score", outcome: "2-0", outcomeLabel: "Placar 2 × 0", stake: 60, oddAtPlacement: 7.20, oddNow: 7.20, kickoff: new Date("2026-05-16T22:00:00-03:00"), status: "lost", payout: 0, settledAt: new Date("2026-05-16T23:50:00-03:00") },
    { id: "fb-c6", matchId: "m-eng-egy", matchLabel: "Inglaterra × Egito", homeName: "Inglaterra", awayName: "Egito", marketType: "1x2", outcome: "draw", outcomeLabel: "Empate", stake: 40, oddAtPlacement: 4.10, oddNow: 4.10, kickoff: new Date("2026-05-15T22:00:00-03:00"), status: "lost", payout: 0, settledAt: new Date("2026-05-15T23:50:00-03:00") },
    { id: "fb-c7", matchId: "m-pol-ecu", matchLabel: "Polônia × Equador", homeName: "Polônia", awayName: "Equador", marketType: "1x2", outcome: "home", outcomeLabel: "Polônia vence", stake: 30, oddAtPlacement: 2.10, oddNow: 2.10, kickoff: new Date("2026-05-14T18:00:00-03:00"), status: "refunded", payout: 30, settledAt: new Date("2026-05-14T19:00:00-03:00") },
    { id: "fb-c8", matchId: "m-001", matchLabel: "Brasil × Sérvia", homeName: "Brasil", awayName: "Sérvia", marketType: "1x2", outcome: "home", outcomeLabel: "Brasil vence", stake: 120, oddAtPlacement: 1.55, oddNow: 1.55, kickoff: new Date("2026-05-12T20:00:00-03:00"), status: "won", payout: 186, settledAt: new Date("2026-05-12T21:50:00-03:00") },
    { id: "fb-c9", matchId: "m-final-lib", matchLabel: "Final Libertadores", homeName: "Brasil", awayName: "Brasil", isClub: true, marketType: "1x2", outcome: "home", outcomeLabel: "Botafogo vence", stake: 80, oddAtPlacement: 3.60, oddNow: 3.60, kickoff: new Date("2026-05-04T22:30:00-03:00"), status: "won", payout: 288, settledAt: new Date("2026-05-04T23:50:00-03:00") },
  ],
  "u-patricia": [
    { id: "fb-p1", matchId: "m-003", matchLabel: "Brasil × Croácia", homeName: "Brasil", awayName: "Croácia", marketType: "1x2", outcome: "draw", outcomeLabel: "Empate", stake: 80, oddAtPlacement: 3.20, oddNow: 3.20, kickoff: new Date("2026-05-20T22:00:00-03:00"), status: "won", payout: 256, settledAt: new Date("2026-05-20T23:50:00-03:00") },
    { id: "fb-p2", matchId: "m-002", matchLabel: "Argentina × Polônia", homeName: "Argentina", awayName: "Polônia", marketType: "1x2", outcome: "home", outcomeLabel: "Argentina vence", stake: 60, oddAtPlacement: 1.42, oddNow: 1.42, kickoff: new Date("2026-05-13T16:00:00-03:00"), status: "won", payout: 85, settledAt: new Date("2026-05-13T17:50:00-03:00") },
  ],
}

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n-1",
    type: "bet_won",
    title: "Você acertou Espanha × Alemanha 2-1!",
    message: "Placar exato · odd 9.60 · ganhou +480 pts.",
    link: "/apostas",
    unread: true,
    createdAt: new Date("2026-05-24T12:48:00-03:00"),
  },
  {
    id: "n-2",
    type: "league_invite",
    title: "PatriciaGoal te chamou pra Galera do RJ",
    message: "Liga privada · 6 membros · use o link pra entrar.",
    link: "/ligas/entrar",
    unread: true,
    createdAt: new Date("2026-05-24T10:14:00-03:00"),
  },
  {
    id: "n-3",
    type: "kickoff_reminder",
    title: "Brasil × Argentina começa em 4h",
    message: "Você tem 2 apostas em aberto. Cancelamento até 5min antes.",
    link: "/jogos/m-007",
    unread: true,
    createdAt: new Date("2026-05-24T16:00:00-03:00"),
  },
  {
    id: "n-4",
    type: "referral_joined",
    title: "MariSCC se cadastrou usando seu código!",
    message: "+100 pts creditados. Cap deste mês: 7/20.",
    link: "/perfil/indicar",
    unread: false,
    createdAt: new Date("2026-05-21T10:14:00-03:00"),
  },
  {
    id: "n-5",
    type: "bet_lost",
    title: "Errou Brasil × Croácia",
    message: "Apostou em Brasil vence · resultado: empate 1×1.",
    link: "/jogos/m-003",
    unread: false,
    createdAt: new Date("2026-05-20T23:50:00-03:00"),
  },
  {
    id: "n-6",
    type: "bet_refunded",
    title: "Aposta reembolsada",
    message: "Polônia × Equador foi cancelado. +30 pts devolvidos.",
    link: "/apostas",
    unread: false,
    createdAt: new Date("2026-05-23T12:00:00-03:00"),
  },
  {
    id: "n-7",
    type: "low_balance_boost",
    title: "Boost diário recebido",
    message: "Seu saldo estava em 8 pts. +50 pts creditados.",
    link: "/apostas",
    unread: false,
    createdAt: new Date("2026-05-08T06:00:00-03:00"),
  },
]

export { NOW as MOCK_NOW }
