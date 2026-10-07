/**
 * Tipos compartilhados da camada de dados.
 * Refletem o schema SQL em supabase/migrations/0001_initial_schema.sql
 */

export type GameStatus = "scheduled" | "live" | "finished" | "cancelled" | "postponed"

/** Linha da tabela `sports`. */
export type Sport = {
  id: string
  slug: string
  name: string
  icon: string | null
  hasDraw: boolean
  displayOrder: number
  isActive: boolean
}

/** Linha da tabela `competitions` enriquecida com sport. */
export type Competition = {
  id: string
  slug: string
  name: string
  externalId: string
  externalSource: string
  externalSeason: number | null
  sport: Sport | null
  countryCode: string | null
  icon: string | null
  displayOrder: number
  betMarkets: string[]
  isActiveForBetting: boolean
  /**
   * Requer assinatura PRO pra apostar. Hoje sem cobrança implementada → UI
   * mostra "PRO em breve" + bloqueio no place_bet. Quando PRO virar live,
   * passa a checar tier do user.
   */
  isProOnly: boolean
  status: string
  startsAt: Date | null
  endsAt: Date | null
}
export type MarketType = "1x2" | "exact_score" | "group_winner"
export type BetStatus = "open" | "won" | "lost" | "refunded" | "cancelled"
export type LeagueVisibility = "public" | "private" | "global"

export type Stage =
  | "group_a" | "group_b" | "group_c" | "group_d" | "group_e" | "group_f"
  | "group_g" | "group_h" | "group_i" | "group_j" | "group_k" | "group_l"
  | "round_of_32" | "round_of_16" | "quarter" | "semi" | "third" | "final"

export type Team = {
  name: string
  short: string
  iso?: string
  /** URL do escudo do time. Usado pra ligas de clubes (Brasileirão, Europa).
   *  Pra Copa do Mundo (seleções), preferimos a bandeira do país via Flag. */
  logoUrl?: string | null
}

export type Profile = {
  id: string
  nickname: string
  fullName?: string | null
  avatarUrl?: string | null
  countryCode?: string | null
  balance: number
  referralCode: string
  emailVerifiedAt: Date | null
  onboardedAt: Date | null
  betsPubliclyVisible: boolean
  /** Painel /admin/fakes e RPCs admin_*. Só a conta do founder. */
  isSuperAdmin?: boolean
}

export type Match = {
  id: string
  competitionId: string
  externalId?: string | null
  home: Team
  away: Team
  startsAt: Date
  status: GameStatus
  stage: Stage
  venue?: string | null
  homeScore?: number | null
  awayScore?: number | null
  /** Placar dos pênaltis (só em jogo decidido na disputa). */
  homePen?: number | null
  awayPen?: number | null
  liveMinute?: number | null
  poolTotal: number       // calculado de bet_markets agregados (soma de todos os stakes 1X2 open)
  topOdd: number          // menor odd entre os 3 resultados de 1X2
  /** Distribuição do pool 1X2 por outcome. Indefinido se pool vazio. */
  pool1x2?: Pool1X2
  betsCount?: number      // qtd de apostas abertas no jogo (todos os mercados); opcional p/ mocks
  myBetStatus?: "none" | "open" | "won" | "lost" | "refunded"
  /** ID do mercado 1X2 — habilita quick-bet direto do card na listagem. */
  market1x2Id?: string | null
  /** Soma das MINHAS apostas abertas nesse jogo (todos os mercados) — pro cap de 50% por jogo. */
  myOpenStake?: number
  /** Override do multiplicador de payout (enquete "jogo do dia"). NULL = default do stage. */
  payoutMultiplier?: number | null
  /** Times confirmados (mata-mata). false = ainda placeholder → aposta fechada. undefined = grupos (sempre aberto). */
  teamsConfirmed?: boolean
}

export type LeagueCompetitionRef = {
  id: string
  slug: string
  name: string
  countryCode: string | null
  icon: string | null
  season: string | null
}

export type League = {
  id: string
  name: string
  slug: string
  emoji?: string
  visibility: LeagueVisibility
  ownerId: string
  ownerNickname: string
  inviteCode?: string | null
  totalMembers: number
  description?: string | null
  createdAt: Date
  /** Temporada encerrada: liga arquivada (read-only, classificação congelada). NULL = ativa. */
  archivedAt?: Date | null
  membersVisible?: boolean
  /** Competição focada pela liga. NULL = Liga Global ou legacy sem afinidade. */
  competition?: LeagueCompetitionRef | null
}

/** Info pública de uma liga vista por visitante não-logado. */
export type PublicLeagueInfo = {
  id: string
  slug: string
  name: string
  description: string | null
  ownerNickname: string
  memberCount: number
  membersVisible: boolean
  createdAt: Date
}

/** Resultado da busca de ligas descobríveis em /ligas. */
export type DiscoverableLeague = {
  id: string
  slug: string
  name: string
  description: string | null
  ownerNickname: string
  memberCount: number
  hasPendingRequest: boolean
  isMember: boolean
}

/** Pilar de conteúdo do blog. Casa com CHECK constraint da DB. */
export type BlogPillar = "bets" | "cultura" | "por_dentro"

/** Post do blog. status='published' apenas. */
export type BlogPost = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  excerpt: string
  contentMdx: string
  coverImageUrl: string | null
  coverImageAlt: string | null
  authorName: string
  pillar: BlogPillar
  tags: string[]
  publishedAt: Date
  updatedAt: Date
  readingTimeMinutes: number | null
}

/** Versão resumida pra listagens (sem o MDX completo). */
export type BlogPostSummary = Omit<BlogPost, "contentMdx">

/** Solicitação de entrada vista pelo owner numa liga. */
export type PendingJoinRequest = {
  id: string
  userId: string
  nickname: string
  avatarUrl: string | null
  countryCode: string | null
  message: string | null
  createdAt: Date
}

export type LeagueMembership = League & {
  myRank: number
  myNetPoints: number
  trend: number           // mudança de posição desde ontem
}

export type OpenBet = {
  id: string
  matchId: string
  matchLabel: string
  homeName: string
  awayName: string
  marketType: MarketType
  outcome: string                  // 'home'/'draw'/'away' (1x2) ou '2-1' (placar)
  outcomeLabel: string
  stake: number
  oddAtPlacement: number
  oddNow: number
  kickoff: Date
}

export type FinishedBet = OpenBet & {
  status: "won" | "lost" | "refunded" | "cancelled"
  payout: number          // 0 se perdeu/cancelou
  settledAt: Date
}

export type WalletTransaction = {
  id: string
  amount: number
  reason: "signup_bonus" | "bet_placed" | "bet_won" | "bet_refunded"
    | "referral_bonus" | "low_balance_boost" | "competition_end_reset" | "admin_adjust"
  title: string
  detail?: string | null
  competition?: string | null
  balanceAfter: number
  createdAt: Date
}

export type LeagueMember = {
  userId: string
  nickname: string
  fullName: string
  countryName: string
  role: "owner" | "member"
  joinedAt: Date
  lastSignedInAt?: Date | null
  netPoints: number
  betsTotal: number
  betsWon: number
  trend: number
  matchesBetIn: number
  matchesAvailable: number
}

export type Pool1X2 = { home: number; draw: number; away: number }
export type PoolScore = Record<string, number>

// ─── STANDINGS ─────────────────────────────────────────────────────────────

export type TeamStanding = {
  name: string             // nome original (en)
  iso?: string             // código ISO pra bandeira
  position: number         // 1-4
  gp: number               // games played (apenas finished)
  w: number
  d: number
  l: number
  gf: number               // goals for
  ga: number               // goals against
  gd: number               // saldo (gf - ga)
  pts: number              // 3W + 1D
}

export type GroupStanding = {
  group: string            // 'A', 'B', etc.
  stage: Stage             // 'group_a', 'group_b', etc.
  teams: TeamStanding[]
}

export type MatchDetails = Match & {
  pool1x2: Pool1X2
  poolScore: PoolScore
  bettorsCount: number
  avgStake: number
  market1x2Id: string         // ID do mercado 1X2 (vem de bet_markets em produção)
  marketScoreId: string       // ID do mercado de placar exato
}

export type PublicProfile = Profile & {
  countryName: string
  isOwnerOf: number
  ligasJoined: number              // todas as ligas (inclui Global)
  privateLeaguesCount?: number     // apenas privadas (real mode only)
  competitionsPlayed: number
  allTimeRank: number
  allTimeNetPoints: number
  lastSignedInAt?: Date | null     // max(login, última aposta) — reflete atividade real
  balanceRank?: number             // posição por patrimônio (saldo) entre todos
  balanceRankTotal?: number
  globalLeagueStats?: {            // real mode only
    rank: number                   // posição na Liga Global
    total: number                  // total de membros na Liga Global
    netPoints: number
    betsWon: number
    betsTotal: number
  } | null
  referralStats?: {                // real mode only
    count: number                  // número de indicações premiadas (max 5)
    totalPoints: number            // soma dos pontos ganhos (count × 50)
  }
  copaStats: {
    bets: number
    won: number
    lost: number
    refunded: number
    avgOdd: number
    netPoints: number
    biggestWin: number
    matchesAvailable: number
    matchesBetIn: number
  }
  sharedLeagues: string[]
}

export type PublicFinishedBet = FinishedBet & {
  isClub?: boolean   // jogos de clubes (Libertadores, Brasileirão) — sem bandeira de país
  stage?: Stage      // pra mostrar "Fase de grupos", "Oitavas", etc. no perfil
}

export type NotificationType =
  | "bet_won"                  // sua aposta acertou
  | "bet_lost"                 // sua aposta errou
  | "bet_refunded"             // jogo cancelado, stake devolvido
  | "league_invite"            // você foi convidado pra uma liga
  | "league_join_request"      // alguém solicitou entrar na sua liga (owner)
  | "league_join_approved"     // sua solicitação foi aprovada (user)
  | "league_join_rejected"     // sua solicitação foi recusada (user)
  | "referral_joined"          // alguém usou seu código
  | "low_balance_boost"        // boost diário de saldo baixo
  | "kickoff_reminder"         // jogo seu começa em breve
  | "competition_end"          // competição encerrou, ranking final
  | "poll_open"                // enquete do dia (jogo x2) aberta pra votação

export type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  link?: string
  unread: boolean
  createdAt: Date
}

// ─── ENQUETE "JOGO DO DIA x2" ────────────────────────────────────────────────

/** Candidato cru da enquete (match_id + votos). Enriquecido com Match na página. */
export type PollCandidate = { matchId: string; votes: number }

/** Enquete ativa (mais próxima aberta) do multiplicador diário. */
export type ActivePoll = {
  id: string
  gameDate: string              // data BRT dos jogos (YYYY-MM-DD)
  closesAt: Date
  multiplier: number            // x2 default
  totalVotes: number
  myVoteMatchId: string | null  // null se ainda não votei (ou deslogado)
  candidates: PollCandidate[]
}

// ─── TRANSPARÊNCIA DO JOGO ENCERRADO ─────────────────────────────────────────

/** Uma aposta (por palpite) na conferência do jogo encerrado. */
export type TransparencyBettor = {
  nickname: string
  outcome: "home" | "draw" | "away"
  stake: number
  net: number       // lucro líquido (won: payout-stake) ou prejuízo (lost: -stake)
  won: boolean
}

/** Agregado 1X2 + toplists de um jogo encerrado, pra controle de transparência. */
export type MatchTransparencyData = {
  settled: boolean
  winnerOutcome: "home" | "draw" | "away" | null
  multiplier: number
  totals: { pool: number; bettors: number; winners: number; losers: number; paid: number }
  outcomes: { key: "home" | "draw" | "away"; pool: number; bettors: number; odd: number }[]
  topWon: TransparencyBettor[]
  topLost: TransparencyBettor[]
}
