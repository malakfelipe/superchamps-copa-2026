/**
 * Camada de acesso a dados.
 *
 * Detecta automaticamente "demo mode" quando NEXT_PUBLIC_SUPABASE_URL não está
 * configurada ou aponta pra placeholder. Nesse caso retorna mocks; senão tenta
 * Supabase real.
 *
 * Pra forçar demo mode mesmo com Supabase configurado, defina:
 *   NEXT_PUBLIC_DEMO_MODE=true
 */
import { createClient } from "@/lib/supabase/server"
import { localizeTeamName } from "@/lib/teams"
import {
  MOCK_PROFILE, MOCK_MATCHES, MOCK_MY_LEAGUES, MOCK_OPEN_BETS, MOCK_RECENT_FINISHED,
  MOCK_TRANSACTIONS, MOCK_LEAGUE_MEMBERS, getMockMatchDetails,
  MOCK_PUBLIC_PROFILES, MOCK_PUBLIC_FINISHED_BETS, MOCK_NOTIFICATIONS,
} from "./mock"
import { fetchMatchPools, emptyBundle } from "./match-pools"
import type {
  Profile, Match, LeagueMembership, OpenBet, FinishedBet,
  WalletTransaction, LeagueMember, MatchDetails,
  PublicProfile, PublicFinishedBet, Notification, NotificationType,
  GameStatus, Stage, MarketType, BetStatus, Pool1X2, PoolScore,
  GroupStanding, TeamStanding,
  DiscoverableLeague, PendingJoinRequest, PublicLeagueInfo,
  BlogPost, BlogPostSummary, BlogPillar,
  Sport, Competition, ActivePoll, MatchTransparencyData, TransparencyBettor,
} from "./types"

export * from "./types"

function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return true
  if (url.includes("placeholder") || url.includes("seu_project_ref")) return true
  return false
}

// ─── PROFILE ───────────────────────────────────────────────────────────────

export async function getCurrentProfile(): Promise<Profile | null> {
  if (isDemoMode()) return MOCK_PROFILE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Cast manual até gerarmos types via `supabase gen types typescript`
  type ProfileRow = {
    id: string
    nickname: string
    avatar_url: string | null
    country_code: string | null
    balance: number
    referral_code: string
    email_verified_at: string | null
    onboarded_at: string | null
    bets_publicly_visible: boolean
    is_super_admin: boolean
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, nickname, avatar_url, country_code, balance, referral_code, " +
      "email_verified_at, onboarded_at, bets_publicly_visible, is_super_admin",
    )
    .eq("id", user.id)
    .single()

  if (error || !data) return null
  const row = data as unknown as ProfileRow

  return {
    id: row.id,
    nickname: row.nickname,
    fullName: null,
    avatarUrl: row.avatar_url,
    countryCode: row.country_code,
    balance: row.balance,
    referralCode: row.referral_code,
    emailVerifiedAt: row.email_verified_at ? new Date(row.email_verified_at) : null,
    onboardedAt: row.onboarded_at ? new Date(row.onboarded_at) : null,
    betsPubliclyVisible: row.bets_publicly_visible,
    isSuperAdmin: row.is_super_admin === true,
  }
}

// ─── MATCHES ───────────────────────────────────────────────────────────────

export async function getAllMatches(): Promise<Match[]> {
  if (isDemoMode()) return MOCK_MATCHES

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  type MatchRow = {
    id: string
    competition_id: string
    external_id: string | null
    home_team: string
    home_team_code: string | null
    home_team_logo: string | null
    away_team: string
    away_team_code: string | null
    away_team_logo: string | null
    starts_at: string
    status: GameStatus
    stage: Stage
    venue: string | null
    home_score: number | null
    away_score: number | null
    home_pen: number | null
    away_pen: number | null
    payout_multiplier: number | null
    teams_confirmed: boolean
    bet_markets: Array<{
      id: string
      market_type: MarketType
      bets: Array<{ stake: number; status: BetStatus; user_id: string }>
    }> | null
  }

  // Filtra apenas competições ativas pra apostas (Fase 1 — só Copa).
  // Brasileirão A/B continuam sincronizando dados via cron mas ficam escondidos.
  // Bets do user (RLS-permitidas) só pra myBetStatus. Pool agregado vem da RPC.
  const { data, error } = await supabase
    .from("matches")
    .select(`
      id, competition_id, external_id, home_team, home_team_code, home_team_logo,
      away_team, away_team_code, away_team_logo, starts_at, status, stage, venue,
      home_score, away_score, home_pen, away_pen, payout_multiplier, teams_confirmed,
      competitions!inner ( is_active_for_betting ),
      bet_markets ( id, market_type, bets ( stake, status, user_id ) )
    `)
    .eq("competitions.is_active_for_betting", true)
    .order("starts_at", { ascending: true })

  if (error || !data) return []

  const rows = data as unknown as MatchRow[]
  const pools = await fetchMatchPools(supabase, rows.map((m) => m.id))

  return rows.map((m): Match => {
    const bundle = pools.get(m.id) ?? emptyBundle()
    const { pool1x2, poolTotal, betsCount } = bundle

    const oddValues = [pool1x2.home, pool1x2.draw, pool1x2.away]
      .filter((p) => p > 0)
      .map((p) => poolTotal / p)
    const topOdd = oddValues.length > 0 ? Math.min(...oddValues) : 1.0

    let myBetStatus: Match["myBetStatus"] = "none"
    if (user) {
      const myBets = (m.bet_markets || []).flatMap((bm) =>
        (bm.bets || []).filter((b) => b.user_id === user.id)
      )
      if (myBets.some((b) => b.status === "open")) myBetStatus = "open"
      else if (myBets.some((b) => b.status === "won")) myBetStatus = "won"
      else if (myBets.some((b) => b.status === "lost")) myBetStatus = "lost"
      else if (myBets.some((b) => b.status === "refunded")) myBetStatus = "refunded"
    }

    return {
      id: m.id,
      competitionId: m.competition_id,
      externalId: m.external_id,
      home: {
        name: m.home_team,
        short: m.home_team_code || m.home_team.slice(0, 3).toUpperCase(),
        iso: m.home_team_code?.toLowerCase() || undefined,
        logoUrl: m.home_team_logo || null,
      },
      away: {
        name: m.away_team,
        short: m.away_team_code || m.away_team.slice(0, 3).toUpperCase(),
        iso: m.away_team_code?.toLowerCase() || undefined,
        logoUrl: m.away_team_logo || null,
      },
      startsAt: new Date(m.starts_at),
      status: m.status,
      stage: m.stage,
      venue: m.venue,
      homeScore: m.home_score,
      awayScore: m.away_score,
      homePen: m.home_pen,
      awayPen: m.away_pen,
      poolTotal,
      topOdd: Number(topOdd.toFixed(2)),
      pool1x2: poolTotal > 0 ? pool1x2 : undefined,
      betsCount,
      myBetStatus,
      market1x2Id: (m.bet_markets || []).find((bm) => bm.market_type === "1x2")?.id || null,
      payoutMultiplier: m.payout_multiplier,
      teamsConfirmed: m.teams_confirmed,
      myOpenStake: user
        ? (m.bet_markets || [])
            .flatMap((bm) => (bm.bets || []).filter((b) => b.user_id === user.id && b.status === "open"))
            .reduce((acc, b) => acc + b.stake, 0)
        : 0,
    }
  })
}

// ─── LEAGUES ───────────────────────────────────────────────────────────────

export async function getMyLeagues(): Promise<LeagueMembership[]> {
  if (isDemoMode()) return MOCK_MY_LEAGUES

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  type Row = {
    leagues: {
      id: string
      name: string
      slug: string
      description: string | null
      visibility: "public" | "private" | "global"
      invite_code: string | null
      owner_id: string
      created_at: string
      competition_id: string | null
      competitions: {
        id: string
        slug: string | null
        name: string
        country_code: string | null
        icon: string | null
        external_season: number | null
      } | null
    } | null
  }

  // 1. Leagues do user (membership ativa) + dados da competição focada
  const { data: memberships, error } = await supabase
    .from("league_members")
    .select(`
      leagues (
        id, name, slug, description, visibility, invite_code, owner_id, created_at,
        competition_id,
        competitions ( id, slug, name, country_code, icon, external_season )
      )
    `)
    .eq("user_id", user.id)
    .is("left_at", null)

  if (error || !memberships) return []

  const leagues = (memberships as unknown as Row[])
    .map((r) => r.leagues)
    .filter((l): l is NonNullable<Row["leagues"]> => l !== null)
  if (leagues.length === 0) return []

  // 2. Owner nicknames + rankings (total_members vem do tamanho do ranking)
  const ownerIds = Array.from(new Set(leagues.map((l) => l.owner_id)))

  const [{ data: owners }, rankings] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nickname")
      .in("id", ownerIds),
    Promise.all(
      leagues.map((l) =>
        supabase.rpc("get_league_rankings", { p_league_id: l.id }).then((r) => ({
          leagueId: l.id,
          rows: (r.data as Array<{ user_id: string; net_points: number }> | null) || [],
        })),
      ),
    ),
  ])

  const nicknameByOwner = new Map<string, string>()
  for (const o of (owners as unknown as { id: string; nickname: string }[]) || []) {
    nicknameByOwner.set(o.id, o.nickname)
  }

  // 3. Monta o resultado
  return leagues.map((l): LeagueMembership => {
    const ranking = rankings.find((r) => r.leagueId === l.id)?.rows || []
    const myIdx = ranking.findIndex((row) => row.user_id === user.id)
    const myNetPoints = myIdx >= 0 ? Number(ranking[myIdx].net_points) : 0
    const myRank = myIdx >= 0 ? myIdx + 1 : 0

    return {
      id: l.id,
      name: l.name,
      slug: l.slug,
      emoji: undefined,
      visibility: l.visibility,
      ownerId: l.owner_id,
      ownerNickname: nicknameByOwner.get(l.owner_id) || "?",
      inviteCode: l.invite_code,
      totalMembers: ranking.length,
      description: l.description,
      createdAt: new Date(l.created_at),
      competition: l.competitions ? {
        id: l.competitions.id,
        slug: l.competitions.slug || l.competitions.id,
        name: l.competitions.name,
        countryCode: l.competitions.country_code,
        icon: l.competitions.icon,
        season: l.competitions.external_season ? String(l.competitions.external_season) : null,
      } : null,
      myRank,
      myNetPoints,
      trend: 0, // sem snapshot diário implementado ainda
    }
  })
}

// ─── BETS ──────────────────────────────────────────────────────────────────

export async function getMyOpenBets(): Promise<OpenBet[]> {
  if (isDemoMode()) return MOCK_OPEN_BETS

  const all = await getMyAllBets()
  return all.open
}

export async function getMyOpenBetsForMatch(matchId: string): Promise<OpenBet[]> {
  const all = await getMyOpenBets()
  return all.filter((b) => b.matchId === matchId)
}

export async function getMyRecentFinished(limit = 5): Promise<FinishedBet[]> {
  if (isDemoMode()) return MOCK_RECENT_FINISHED.slice(0, limit)
  const all = await getMyAllBets()
  return all.finished.slice(0, limit)
}

export async function getMatchById(id: string): Promise<MatchDetails | null> {
  if (isDemoMode()) return getMockMatchDetails(id)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  type Row = {
    id: string
    competition_id: string
    external_id: string | null
    home_team: string
    home_team_code: string | null
    home_team_logo: string | null
    away_team: string
    away_team_code: string | null
    away_team_logo: string | null
    starts_at: string
    status: GameStatus
    stage: Stage
    venue: string | null
    home_score: number | null
    away_score: number | null
    home_pen: number | null
    away_pen: number | null
    payout_multiplier: number | null
    teams_confirmed: boolean
    bet_markets: Array<{
      id: string
      market_type: MarketType
      bets: Array<{ stake: number; status: BetStatus; user_id: string }>
    }> | null
  }

  // Filtra apenas competições ativas — usuário não pode acessar match de
  // competição inativa nem que tente direto pelo URL.
  // Bets do user (RLS-permitidas) só pra myBetStatus. Pool agregado vem da RPC.
  const { data, error } = await supabase
    .from("matches")
    .select(`
      id, competition_id, external_id, home_team, home_team_code, home_team_logo,
      away_team, away_team_code, away_team_logo, starts_at, status, stage, venue,
      home_score, away_score, home_pen, away_pen, payout_multiplier, teams_confirmed,
      competitions!inner ( is_active_for_betting ),
      bet_markets ( id, market_type, bets ( stake, status, user_id ) )
    `)
    .eq("id", id)
    .eq("competitions.is_active_for_betting", true)
    .single()

  if (error || !data) return null
  const m = data as unknown as Row

  const market1x2 = (m.bet_markets || []).find((bm) => bm.market_type === "1x2")
  const marketScore = (m.bet_markets || []).find((bm) => bm.market_type === "exact_score")

  const pools = await fetchMatchPools(supabase, [m.id])
  const bundle = pools.get(m.id) ?? emptyBundle()
  const { pool1x2, poolScore, poolTotal, totalStake, betsCount, bettorsCount } = bundle

  const oddValues = [pool1x2.home, pool1x2.draw, pool1x2.away]
    .filter((p) => p > 0)
    .map((p) => poolTotal / p)
  const topOdd = oddValues.length > 0 ? Math.min(...oddValues) : 1.0

  // myBetStatus + exposição aberta minha nesse jogo (cap 50% por jogo)
  let myBetStatus: Match["myBetStatus"] = "none"
  let myOpenStake = 0
  if (user) {
    const myBets = (m.bet_markets || []).flatMap((bm) =>
      (bm.bets || []).filter((b) => b.user_id === user.id)
    )
    if (myBets.some((b) => b.status === "open")) myBetStatus = "open"
    else if (myBets.some((b) => b.status === "won")) myBetStatus = "won"
    else if (myBets.some((b) => b.status === "lost")) myBetStatus = "lost"
    else if (myBets.some((b) => b.status === "refunded")) myBetStatus = "refunded"
    myOpenStake = myBets.filter((b) => b.status === "open").reduce((acc, b) => acc + b.stake, 0)
  }

  const avgStake = betsCount > 0 ? Math.round(totalStake / betsCount) : 0

  return {
    id: m.id,
    competitionId: m.competition_id,
    externalId: m.external_id,
    home: {
      name: m.home_team,
      short: m.home_team_code || m.home_team.slice(0, 3).toUpperCase(),
      iso: m.home_team_code?.toLowerCase() || undefined,
    },
    away: {
      name: m.away_team,
      short: m.away_team_code || m.away_team.slice(0, 3).toUpperCase(),
      iso: m.away_team_code?.toLowerCase() || undefined,
    },
    startsAt: new Date(m.starts_at),
    status: m.status,
    stage: m.stage,
    venue: m.venue,
    homeScore: m.home_score,
    awayScore: m.away_score,
    homePen: m.home_pen,
    awayPen: m.away_pen,
    poolTotal,
    topOdd: Number(topOdd.toFixed(2)),
    myBetStatus,
    pool1x2,
    poolScore,
    bettorsCount,
    avgStake,
    market1x2Id: market1x2?.id || "",
    marketScoreId: marketScore?.id || "",
    myOpenStake,
    payoutMultiplier: m.payout_multiplier,
    teamsConfirmed: m.teams_confirmed,
  }
}

// ─── LEAGUES (detalhe) ─────────────────────────────────────────────────────

export async function getLeagueBySlug(slug: string): Promise<LeagueMembership | null> {
  if (isDemoMode()) return MOCK_MY_LEAGUES.find((l) => l.slug === slug) || null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  type LeagueRow = {
    id: string
    name: string
    slug: string
    description: string | null
    visibility: "public" | "private" | "global"
    invite_code: string | null
    owner_id: string
    created_at: string
    archived_at: string | null
    members_visible: boolean | null
    competition_id: string | null
    competitions: {
      id: string
      slug: string | null
      name: string
      country_code: string | null
      icon: string | null
      external_season: number | null
    } | null
  }

  const { data: league, error } = await supabase
    .from("leagues")
    .select(`
      id, name, slug, description, visibility, invite_code, owner_id, created_at, archived_at,
      members_visible, competition_id,
      competitions ( id, slug, name, country_code, icon, external_season )
    `)
    .eq("slug", slug)
    .single()

  if (error || !league) return null
  const l = league as unknown as LeagueRow

  // Paralelo: owner nickname + ranking completo (total_members vem do ranking)
  const [{ data: owner }, { data: rankingRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nickname")
      .eq("id", l.owner_id)
      .single(),
    supabase.rpc("get_league_rankings", { p_league_id: l.id }),
  ])

  const ownerNickname = (owner as unknown as { nickname: string } | null)?.nickname || "?"

  const ranking = (rankingRows as Array<{ user_id: string; net_points: number }> | null) || []
  const totalMembers = ranking.length
  const myIdx = ranking.findIndex((row) => row.user_id === user.id)
  const myNetPoints = myIdx >= 0 ? Number(ranking[myIdx].net_points) : 0
  const myRank = myIdx >= 0 ? myIdx + 1 : 0

  return {
    id: l.id,
    name: l.name,
    slug: l.slug,
    emoji: undefined,
    visibility: l.visibility,
    ownerId: l.owner_id,
    ownerNickname,
    inviteCode: l.invite_code,
    totalMembers,
    description: l.description,
    createdAt: new Date(l.created_at),
    archivedAt: l.archived_at ? new Date(l.archived_at) : null,
    membersVisible: l.members_visible ?? true,
    competition: l.competitions ? {
      id: l.competitions.id,
      slug: l.competitions.slug || l.competitions.id,
      name: l.competitions.name,
      countryCode: l.competitions.country_code,
      icon: l.competitions.icon,
      season: l.competitions.external_season ? String(l.competitions.external_season) : null,
    } : null,
    myRank,
    myNetPoints,
    trend: 0,
  }
}

export async function getLeagueMembers(leagueId: string): Promise<LeagueMember[]> {
  if (isDemoMode()) return MOCK_LEAGUE_MEMBERS

  const supabase = await createClient()

  // Paralelo: rankings + total de jogos disponíveis (denominador da cobertura)
  const [{ data: rankingRows, error }, { data: totalMatches }] = await Promise.all([
    supabase.rpc("get_league_rankings", { p_league_id: leagueId }),
    supabase.rpc("get_total_settled_matches"),
  ])

  if (error || !rankingRows) return []

  type Row = {
    user_id: string
    nickname: string
    country_code: string | null
    avatar_url: string | null
    joined_at: string
    last_signed_in_at: string | null
    role: "owner" | "member"
    net_points: number
    bets_total: number
    bets_won: number
    matches_bet_in: number
  }

  const matchesAvailable = Number(totalMatches) || 0

  return (rankingRows as unknown as Row[]).map((r): LeagueMember => ({
    userId: r.user_id,
    nickname: r.nickname,
    fullName: r.nickname, // sem full_name no profile; usa nickname
    countryName: r.country_code || "",
    role: r.role,
    joinedAt: new Date(r.joined_at),
    lastSignedInAt: r.last_signed_in_at ? new Date(r.last_signed_in_at) : null,
    netPoints: Number(r.net_points) || 0,
    betsTotal: Number(r.bets_total) || 0,
    betsWon: Number(r.bets_won) || 0,
    trend: 0,
    matchesBetIn: Number(r.matches_bet_in) || 0,
    matchesAvailable,
  }))
}

// ─── WALLET ────────────────────────────────────────────────────────────────

export async function getMyTransactions(): Promise<WalletTransaction[]> {
  if (isDemoMode()) return MOCK_TRANSACTIONS

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  type TxRow = {
    id: string
    amount: number
    reason: WalletTransaction["reason"]
    balance_after: number
    created_at: string
    related_bet_id: string | null
    related_competition_id: string | null
    related_user_id: string | null
    related_user: { nickname: string } | null
  }

  const { data, error } = await supabase
    .from("wallet_transactions")
    .select(
      "id, amount, reason, balance_after, created_at, related_bet_id, related_competition_id, related_user_id, " +
      "related_user:profiles!wallet_transactions_related_user_id_fkey(nickname)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error || !data) return []

  const REASON_TITLES: Record<WalletTransaction["reason"], string> = {
    signup_bonus: "Bônus de cadastro",
    bet_placed: "Aposta realizada",
    bet_won: "Aposta acertada",
    bet_refunded: "Aposta reembolsada",
    referral_bonus: "Bônus de indicação",
    low_balance_boost: "Ajuda de saldo baixo",
    competition_end_reset: "Reset de competição",
    admin_adjust: "Ajuste administrativo",
  }

  return (data as unknown as TxRow[]).map((t) => {
    let title = REASON_TITLES[t.reason] || t.reason
    let detail: string | null = null

    if (t.reason === "referral_bonus" && t.related_user?.nickname) {
      title = `@${t.related_user.nickname} usou seu código`
      detail = "Bônus de indicação · +50 pts"
    }

    return {
      id: t.id,
      amount: t.amount,
      reason: t.reason,
      title,
      detail,
      competition: null,
      balanceAfter: t.balance_after,
      createdAt: new Date(t.created_at),
    }
  })
}

export async function getMyAllBets(): Promise<{ open: OpenBet[]; finished: FinishedBet[] }> {
  if (isDemoMode()) return { open: MOCK_OPEN_BETS, finished: MOCK_RECENT_FINISHED }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { open: [], finished: [] }

  type BetRow = {
    id: string
    market_id: string
    outcome: string
    stake: number
    odd_at_settle: number | null
    status: BetStatus
    payout: number | null
    placed_at: string
    settled_at: string | null
    bet_markets: {
      id: string
      market_type: MarketType
      match_id: string | null
      closes_at: string
      matches: {
        id: string
        home_team: string
        away_team: string
        starts_at: string
      } | null
    } | null
  }

  const { data, error } = await supabase
    .from("bets")
    .select(`
      id, market_id, outcome, stake, odd_at_settle, status, payout, placed_at, settled_at,
      bet_markets (
        id, market_type, match_id, closes_at,
        matches ( id, home_team, away_team, starts_at )
      )
    `)
    .eq("user_id", user.id)
    .order("placed_at", { ascending: false })

  if (error || !data) return { open: [], finished: [] }

  const rows = data as unknown as BetRow[]

  // Pool completo via RPC (RLS esconde bets open de outros users) — só pras
  // apostas abertas; finalizadas usam odd_at_settle gravada no settle.
  const openMatchIds = Array.from(new Set(
    rows
      .filter((r) => r.status === "open" && r.bet_markets?.match_id)
      .map((r) => r.bet_markets!.match_id as string),
  ))
  const pools = await fetchMatchPools(supabase, openMatchIds)

  const open: OpenBet[] = []
  const finished: FinishedBet[] = []

  for (const r of rows) {
    const market = r.bet_markets
    const match = market?.matches
    if (!market || !match) continue

    // Odd atual a partir do pool agregado; fallback pra odd de settle (bets
    // finalizadas não têm mais pool open)
    const bundle = market.match_id ? pools.get(market.match_id) : undefined
    let oddNow = r.odd_at_settle ? Number(r.odd_at_settle) : 1.0
    if (bundle) {
      if (market.market_type === "1x2" && (r.outcome === "home" || r.outcome === "draw" || r.outcome === "away")) {
        const stake = bundle.pool1x2[r.outcome]
        oddNow = stake > 0 ? Number((bundle.poolTotal / stake).toFixed(2)) : 1.0
      } else if (market.market_type === "exact_score") {
        const stake = bundle.poolScore[r.outcome] || 0
        const scoreTotal = Object.values(bundle.poolScore).reduce((acc, s) => acc + s, 0)
        oddNow = stake > 0 ? Number((scoreTotal / stake).toFixed(2)) : 1.0
      }
    }

    const outcomeLabel = formatOutcomeLabel(r.outcome, market.market_type, match.home_team, match.away_team)

    const baseBet: OpenBet = {
      id: r.id,
      matchId: match.id,
      matchLabel: `${match.home_team} × ${match.away_team}`,
      homeName: match.home_team,
      awayName: match.away_team,
      marketType: market.market_type,
      outcome: r.outcome,
      outcomeLabel,
      stake: r.stake,
      oddAtPlacement: r.odd_at_settle || oddNow,
      oddNow,
      kickoff: new Date(market.closes_at),
    }

    if (r.status === "open") {
      open.push(baseBet)
    } else if (r.status !== "cancelled") {
      // canceladas não entram nas "finalizadas" (nem contam no total/win-rate)
      finished.push({
        ...baseBet,
        status: r.status as FinishedBet["status"],
        payout: r.payout || 0,
        settledAt: r.settled_at ? new Date(r.settled_at) : new Date(),
      })
    }
  }

  return { open, finished }
}

// ─── STANDINGS ─────────────────────────────────────────────────────────────

/**
 * Deriva standings dos grupos a partir dos matches já no DB.
 * Pré-Copa: todos os times aparecem zerados.
 * Durante a Copa: stats vão evoluindo conforme jogos viram 'finished'.
 */
export async function getStandings(): Promise<GroupStanding[]> {
  const matches = await getAllMatches()
  const groupMatches = matches.filter((m) => m.stage.startsWith("group_"))

  // Agrupa por stage (group_a, group_b, etc.)
  const byStage = new Map<Stage, Match[]>()
  for (const m of groupMatches) {
    if (!byStage.has(m.stage)) byStage.set(m.stage, [])
    byStage.get(m.stage)!.push(m)
  }

  const groups: GroupStanding[] = []
  for (const [stage, stageMatches] of byStage.entries()) {
    // Extrai times únicos do grupo
    const teamMap = new Map<string, { name: string; iso?: string }>()
    for (const m of stageMatches) {
      teamMap.set(m.home.name, { name: m.home.name, iso: m.home.iso })
      teamMap.set(m.away.name, { name: m.away.name, iso: m.away.iso })
    }

    // Inicia stats zerados
    const stats = new Map<string, TeamStanding>()
    for (const [name, info] of teamMap.entries()) {
      stats.set(name, {
        name,
        iso: info.iso,
        position: 0,
        gp: 0, w: 0, d: 0, l: 0,
        gf: 0, ga: 0, gd: 0, pts: 0,
      })
    }

    // Acumula stats dos jogos finalizados
    for (const m of stageMatches) {
      if (m.status !== "finished") continue
      if (m.homeScore == null || m.awayScore == null) continue

      const homeStat = stats.get(m.home.name)
      const awayStat = stats.get(m.away.name)
      if (!homeStat || !awayStat) continue

      homeStat.gp += 1
      awayStat.gp += 1
      homeStat.gf += m.homeScore
      homeStat.ga += m.awayScore
      awayStat.gf += m.awayScore
      awayStat.ga += m.homeScore

      if (m.homeScore > m.awayScore) {
        homeStat.w += 1; homeStat.pts += 3
        awayStat.l += 1
      } else if (m.homeScore < m.awayScore) {
        awayStat.w += 1; awayStat.pts += 3
        homeStat.l += 1
      } else {
        homeStat.d += 1; homeStat.pts += 1
        awayStat.d += 1; awayStat.pts += 1
      }
      homeStat.gd = homeStat.gf - homeStat.ga
      awayStat.gd = awayStat.gf - awayStat.ga
    }

    // Ordena: pts desc → gd desc → gf desc → nome asc
    const sorted = Array.from(stats.values()).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if (b.gd !== a.gd) return b.gd - a.gd
      if (b.gf !== a.gf) return b.gf - a.gf
      return a.name.localeCompare(b.name)
    })
    sorted.forEach((t, i) => { t.position = i + 1 })

    groups.push({
      group: stage.replace("group_", "").toUpperCase(),
      stage,
      teams: sorted,
    })
  }

  // Ordena grupos alfabeticamente (A, B, C, ..., L)
  return groups.sort((a, b) => a.group.localeCompare(b.group))
}

function formatOutcomeLabel(outcome: string, marketType: MarketType, homeName: string, awayName: string): string {
  const homePT = localizeTeamName(homeName)
  const awayPT = localizeTeamName(awayName)
  if (marketType === "1x2") {
    if (outcome === "home") return `${homePT} vence`
    if (outcome === "draw") return "Empate"
    if (outcome === "away") return `${awayPT} vence`
    return outcome
  }
  if (marketType === "exact_score") {
    return `Placar ${outcome.replace("-", " × ")}`
  }
  return outcome
}

// ─── PUBLIC PROFILES ────────────────────────────────────────────────────────

export async function getProfileByNickname(nickname: string): Promise<PublicProfile | null> {
  if (isDemoMode()) {
    return MOCK_PUBLIC_PROFILES.find((p) => p.nickname === nickname) || null
  }

  const supabase = await createClient()

  type ProfileRow = {
    id: string
    nickname: string
    avatar_url: string | null
    country_code: string | null
    balance: number
    referral_code: string
    bets_publicly_visible: boolean
    onboarded_at: string | null
    email_verified_at: string | null
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, nickname, avatar_url, country_code, balance, referral_code, " +
      "bets_publicly_visible, onboarded_at, email_verified_at",
    )
    .eq("nickname", nickname)
    .single()

  if (error || !profile) return null
  const p = profile as unknown as ProfileRow

  // Pega Liga Global id (pra ranking dela)
  const { data: globalLeague } = await supabase
    .from("leagues")
    .select("id")
    .eq("visibility", "global")
    .maybeSingle()
  const globalLeagueId = (globalLeague as { id: string } | null)?.id || null

  // Agregados paralelos
  const [
    { data: betsRows },
    { count: ownedCount },
    { count: memberCount },
    { data: totalMatchesData },
    { data: lastSignInData },
    { count: privateLeaguesCount },
    globalRankings,
    { data: referralTxs },
    { data: lastBetData },
    { count: balanceAhead },
    { count: totalProfiles },
  ] = await Promise.all([
    supabase
      .from("bets")
      .select("status, stake, payout, odd_at_settle, market_id")
      .eq("user_id", p.id)
      .in("status", ["won", "lost", "refunded"]),
    supabase
      .from("leagues")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", p.id),
    supabase
      .from("league_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", p.id)
      .is("left_at", null),
    supabase.rpc("get_total_settled_matches"),
    supabase.rpc("get_user_last_sign_in", { p_user_id: p.id }),
    supabase
      .from("league_members")
      .select("league_id, leagues!inner(visibility)", { count: "exact", head: true })
      .eq("user_id", p.id)
      .is("left_at", null)
      .eq("leagues.visibility", "private"),
    globalLeagueId
      ? supabase.rpc("get_league_rankings", { p_league_id: globalLeagueId })
      : Promise.resolve({ data: null }),
    supabase
      .from("wallet_transactions")
      .select("amount")
      .eq("user_id", p.id)
      .eq("reason", "referral_bonus"),
    // última atividade real (última aposta colocada, qualquer status)
    supabase
      .from("bets")
      .select("placed_at")
      .eq("user_id", p.id)
      .order("placed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // rank por patrimônio (quantos têm saldo maior) + total
    supabase.from("profiles").select("id", { count: "exact", head: true }).gt("balance", p.balance),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ])

  // Stats de indicação
  const referralRows = (referralTxs as { amount: number }[] | null) || []
  const referralStats = {
    count: referralRows.length,
    totalPoints: referralRows.reduce((acc, r) => acc + r.amount, 0),
  }

  // Computa stats da Liga Global pra esse user
  type GlobalRow = {
    user_id: string
    net_points: number
    bets_won: number
    bets_total: number
  }
  const globalList = (globalRankings.data as unknown as GlobalRow[]) || []
  const globalIdx = globalList.findIndex((r) => r.user_id === p.id)
  const globalLeagueStats = globalIdx >= 0 ? {
    rank: globalIdx + 1,
    total: globalList.length,
    netPoints: Number(globalList[globalIdx].net_points) || 0,
    betsWon: Number(globalList[globalIdx].bets_won) || 0,
    betsTotal: Number(globalList[globalIdx].bets_total) || 0,
  } : null

  type BetStat = {
    status: BetStatus
    stake: number
    payout: number | null
    odd_at_settle: number | null
    market_id: string
  }
  const bets = (betsRows as unknown as BetStat[]) || []
  const wonBets = bets.filter((b) => b.status === "won")
  const lost = bets.filter((b) => b.status === "lost").length
  const refunded = bets.filter((b) => b.status === "refunded").length

  const netPoints = bets.reduce((acc, b) => {
    if (b.status === "won") return acc + ((b.payout || 0) - b.stake)
    if (b.status === "lost") return acc - b.stake
    return acc
  }, 0)
  const avgOdd = wonBets.length > 0
    ? wonBets.reduce((acc, b) => acc + (b.odd_at_settle || 1), 0) / wonBets.length
    : 0
  const biggestWin = wonBets.length > 0
    ? Math.max(...wonBets.map((b) => (b.payout || 0) - b.stake))
    : 0
  const uniqueMarkets = new Set(bets.map((b) => b.market_id)).size

  return {
    id: p.id,
    nickname: p.nickname,
    fullName: null,
    avatarUrl: p.avatar_url,
    countryCode: p.country_code,
    balance: p.balance,
    referralCode: p.referral_code,
    emailVerifiedAt: p.email_verified_at ? new Date(p.email_verified_at) : null,
    onboardedAt: p.onboarded_at ? new Date(p.onboarded_at) : null,
    betsPubliclyVisible: p.bets_publicly_visible,
    countryName: p.country_code || "",
    isOwnerOf: ownedCount || 0,
    ligasJoined: memberCount || 0,
    privateLeaguesCount: privateLeaguesCount || 0,
    competitionsPlayed: 1,
    allTimeRank: 0,
    allTimeNetPoints: netPoints,
    // Último acesso = mais recente entre login e última aposta (atividade real)
    lastSignedInAt: (() => {
      const login = lastSignInData ? new Date(lastSignInData as string) : null
      const lastBet = (lastBetData as { placed_at: string } | null)?.placed_at
        ? new Date((lastBetData as { placed_at: string }).placed_at)
        : null
      if (login && lastBet) return login > lastBet ? login : lastBet
      return login ?? lastBet
    })(),
    balanceRank: (balanceAhead ?? 0) + 1,
    balanceRankTotal: totalProfiles ?? 0,
    globalLeagueStats,
    referralStats,
    copaStats: {
      bets: wonBets.length + lost + refunded,
      won: wonBets.length,
      lost,
      refunded,
      avgOdd: Number(avgOdd.toFixed(2)),
      netPoints,
      biggestWin,
      matchesAvailable: Number(totalMatchesData) || 0,
      matchesBetIn: uniqueMarkets,
    },
    sharedLeagues: [],
  }
}

export async function getFinishedBetsByUserId(userId: string): Promise<PublicFinishedBet[]> {
  if (isDemoMode()) return MOCK_PUBLIC_FINISHED_BETS[userId] || []

  const supabase = await createClient()

  type Row = {
    id: string
    outcome: string
    stake: number
    odd_at_settle: number | null
    status: BetStatus
    payout: number | null
    settled_at: string | null
    bet_markets: {
      market_type: MarketType
      closes_at: string
      matches: {
        id: string
        home_team: string
        away_team: string
        stage: Stage
      } | null
    } | null
  }

  // RLS bloqueia automaticamente se o owner desativou bets_publicly_visible
  const { data, error } = await supabase
    .from("bets")
    .select(`
      id, outcome, stake, odd_at_settle, status, payout, settled_at,
      bet_markets ( market_type, closes_at, matches ( id, home_team, away_team, stage ) )
    `)
    .eq("user_id", userId)
    .in("status", ["won", "lost", "refunded"])
    .order("settled_at", { ascending: false })
    .limit(50)

  if (error || !data) return []

  return (data as unknown as Row[])
    .filter((r) => r.bet_markets?.matches)
    .map((r): PublicFinishedBet => {
      const market = r.bet_markets!
      const match = market.matches!
      const outcomeLabel = formatOutcomeLabel(
        r.outcome, market.market_type, match.home_team, match.away_team,
      )
      return {
        id: r.id,
        matchId: match.id,
        matchLabel: `${match.home_team} × ${match.away_team}`,
        homeName: match.home_team,
        awayName: match.away_team,
        marketType: market.market_type,
        outcome: r.outcome,
        outcomeLabel,
        stake: r.stake,
        oddAtPlacement: r.odd_at_settle || 1.0,
        oddNow: r.odd_at_settle || 1.0,
        kickoff: new Date(market.closes_at),
        status: r.status as FinishedBet["status"],
        payout: r.payout || 0,
        settledAt: r.settled_at ? new Date(r.settled_at) : new Date(),
        isClub: false,
        stage: match.stage,
      }
    })
    // ordena por data do jogo (kickoff) decrescente — mais recente primeiro
    .sort((a, b) => b.kickoff.getTime() - a.kickoff.getTime())
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────

export async function getMyNotifications(): Promise<Notification[]> {
  if (isDemoMode()) return MOCK_NOTIFICATIONS

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  type Row = {
    id: string
    type: NotificationType
    title: string
    message: string
    link: string | null
    unread: boolean
    created_at: string
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, message, link, unread, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error || !data) return []

  return (data as unknown as Row[]).map((n): Notification => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link || undefined,
    unread: n.unread,
    createdAt: new Date(n.created_at),
  }))
}

export async function getUnreadNotificationsCount(): Promise<number> {
  if (isDemoMode()) return MOCK_NOTIFICATIONS.filter((n) => n.unread).length

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("unread", true)

  return count || 0
}

// ─── LEAGUE DISCOVERY ─────────────────────────────────────────────────────

/**
 * Busca todas as ligas privadas (não-global). Ordenadas por nº de membros desc.
 * `competitionId` opcional: filtra só ligas focadas naquela competição.
 */
export async function searchLeagues(
  query: string | null = null,
  limit = 30,
  competitionId: string | null = null,
): Promise<DiscoverableLeague[]> {
  if (isDemoMode()) return []

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("search_leagues", {
    p_query: query,
    p_limit: limit,
    p_competition_id: competitionId,
  })

  if (error || !data) return []

  type Row = {
    id: string
    slug: string
    name: string
    description: string | null
    owner_nickname: string
    member_count: number
    has_pending_request: boolean
    is_member: boolean
  }

  return (data as unknown as Row[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    ownerNickname: r.owner_nickname,
    memberCount: Number(r.member_count),
    hasPendingRequest: r.has_pending_request,
    isMember: r.is_member,
  }))
}

/** Checa se o usuário atual tem solicitação pendente pra essa liga. */
export async function hasPendingJoinRequest(leagueId: string): Promise<boolean> {
  if (isDemoMode()) return false
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data, error } = await supabase
    .from("league_join_requests")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle()
  return !error && !!data
}

/** Info pública da liga (acessível sem autenticação). Usado no preview pra visitantes. */
export async function getPublicLeagueInfo(slug: string): Promise<PublicLeagueInfo | null> {
  if (isDemoMode()) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc("get_public_league_info", { p_slug: slug })
    .single()

  if (error || !data) return null

  type Row = {
    id: string
    slug: string
    name: string
    description: string | null
    owner_nickname: string
    member_count: number
    members_visible: boolean
    created_at: string
  }
  const r = data as unknown as Row
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    ownerNickname: r.owner_nickname,
    memberCount: Number(r.member_count),
    membersVisible: r.members_visible,
    createdAt: new Date(r.created_at),
  }
}

/** Solicitações pendentes da liga (RLS garante acesso só pro owner). */
export async function getPendingJoinRequests(leagueId: string): Promise<PendingJoinRequest[]> {
  if (isDemoMode()) return []

  const supabase = await createClient()
  // user_id é um dos 2 FKs pra profiles (o outro é decided_by), então precisa
  // do hint explícito com o nome do constraint pra desambiguar a embed.
  const { data, error } = await supabase
    .from("league_join_requests")
    .select(`
      id, user_id, message, created_at,
      profiles!league_join_requests_user_id_fkey (nickname, avatar_url, country_code)
    `)
    .eq("league_id", leagueId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getPendingJoinRequests] supabase error:", error.message)
    return []
  }
  if (!data) return []

  type Row = {
    id: string
    user_id: string
    message: string | null
    created_at: string
    profiles: {
      nickname: string
      avatar_url: string | null
      country_code: string | null
    } | null
  }

  return (data as unknown as Row[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    nickname: r.profiles?.nickname || "?",
    avatarUrl: r.profiles?.avatar_url || null,
    countryCode: r.profiles?.country_code || null,
    message: r.message,
    createdAt: new Date(r.created_at),
  }))
}

// ─── BLOG ──────────────────────────────────────────────────────────────────

type BlogRow = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  excerpt: string
  content_mdx: string
  cover_image_url: string | null
  cover_image_alt: string | null
  author_name: string | null
  pillar: BlogPillar
  tags: string[] | null
  published_at: string
  updated_at: string
  reading_time_minutes: number | null
}

function rowToBlogPost(r: BlogRow): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    excerpt: r.excerpt,
    contentMdx: r.content_mdx,
    coverImageUrl: r.cover_image_url,
    coverImageAlt: r.cover_image_alt,
    authorName: r.author_name || "SuperChamps",
    pillar: r.pillar,
    tags: r.tags || [],
    publishedAt: new Date(r.published_at),
    updatedAt: new Date(r.updated_at),
    readingTimeMinutes: r.reading_time_minutes,
  }
}

/** Lista posts publicados, ordenados por data desc. Pillar opcional pra filtro. */
export async function getPublishedPosts(
  pillar?: BlogPillar,
  limit = 50,
): Promise<BlogPostSummary[]> {
  if (isDemoMode()) return []

  const supabase = await createClient()
  let query = supabase
    .from("blog_posts")
    .select(
      "id, slug, title, subtitle, excerpt, cover_image_url, cover_image_alt, author_name, pillar, tags, published_at, updated_at, reading_time_minutes",
    )
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit)

  if (pillar) query = query.eq("pillar", pillar)

  const { data, error } = await query

  if (error || !data) {
    if (error) console.error("[getPublishedPosts] supabase error:", error.message)
    return []
  }

  return (data as unknown as Omit<BlogRow, "content_mdx">[]).map((r) => {
    const full = { ...r, content_mdx: "" } as BlogRow
    const post = rowToBlogPost(full)
    const { contentMdx: _drop, ...summary } = post
    return summary
  })
}

/** Lê post publicado por slug, com content MDX completo. */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (isDemoMode()) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, subtitle, excerpt, content_mdx, cover_image_url, cover_image_alt, author_name, pillar, tags, published_at, updated_at, reading_time_minutes",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle()

  if (error) {
    console.error("[getPostBySlug] supabase error:", error.message)
    return null
  }
  if (!data) return null

  return rowToBlogPost(data as unknown as BlogRow)
}

// ─── SPORTS / COMPETITIONS (multi-esporte) ─────────────────────────────────

type SportRow = {
  id: string
  slug: string
  name: string
  icon: string | null
  has_draw: boolean
  display_order: number
  is_active: boolean
}

type CompetitionRow = {
  id: string
  slug: string | null
  name: string
  external_id: string
  external_source: string
  external_season: number | null
  sport_id: string | null
  country_code: string | null
  icon: string | null
  display_order: number
  bet_markets: string[]
  is_active_for_betting: boolean
  is_pro_only: boolean
  status: string
  starts_at: string | null
  ends_at: string | null
  sports?: SportRow | null
}

function rowToSport(r: SportRow): Sport {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    icon: r.icon,
    hasDraw: r.has_draw,
    displayOrder: r.display_order,
    isActive: r.is_active,
  }
}

function rowToCompetition(r: CompetitionRow): Competition {
  return {
    id: r.id,
    slug: r.slug || r.external_id,
    name: r.name,
    externalId: r.external_id,
    externalSource: r.external_source,
    externalSeason: r.external_season,
    sport: r.sports ? rowToSport(r.sports) : null,
    countryCode: r.country_code,
    icon: r.icon,
    displayOrder: r.display_order,
    betMarkets: r.bet_markets || [],
    isActiveForBetting: r.is_active_for_betting,
    isProOnly: r.is_pro_only,
    status: r.status,
    startsAt: r.starts_at ? new Date(r.starts_at) : null,
    endsAt: r.ends_at ? new Date(r.ends_at) : null,
  }
}

export async function getAllSports(): Promise<Sport[]> {
  if (isDemoMode()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sports")
    .select("id, slug, name, icon, has_draw, display_order, is_active")
    .order("display_order", { ascending: true })
  if (error || !data) return []
  return (data as unknown as SportRow[]).map(rowToSport)
}

export async function getAllCompetitions(): Promise<Competition[]> {
  if (isDemoMode()) return [{
    id: "c-copa", slug: "copa-do-mundo-2026", name: "Copa do Mundo FIFA 2026",
    externalId: null, externalSource: "api-sports", externalSeason: 2026,
    sport: { id: "s1", slug: "football", name: "Futebol", icon: "⚽", hasDraw: true, displayOrder: 1, isActive: true },
    countryCode: null, icon: "🏆", displayOrder: 1,
    betMarkets: ["1x2", "exact_score"], isActiveForBetting: true, isProOnly: false,
    status: "active", startsAt: new Date("2026-06-11"), endsAt: new Date("2026-07-19"),
  }] as unknown as Competition[]
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("competitions")
    .select(`
      id, slug, name, external_id, external_source, external_season,
      sport_id, country_code, icon, display_order, bet_markets,
      is_active_for_betting, is_pro_only, status, starts_at, ends_at,
      sports ( id, slug, name, icon, has_draw, display_order, is_active )
    `)
    .order("display_order", { ascending: true })
  if (error || !data) {
    if (error) console.error("[getAllCompetitions]", error.message)
    return []
  }
  return (data as unknown as CompetitionRow[]).map(rowToCompetition)
}

export async function getCompetitionBySlug(slug: string): Promise<Competition | null> {
  if (isDemoMode()) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("competitions")
    .select(`
      id, slug, name, external_id, external_source, external_season,
      sport_id, country_code, icon, display_order, bet_markets,
      is_active_for_betting, is_pro_only, status, starts_at, ends_at,
      sports ( id, slug, name, icon, has_draw, display_order, is_active )
    `)
    .eq("slug", slug)
    .maybeSingle()
  if (error || !data) return null
  return rowToCompetition(data as unknown as CompetitionRow)
}

/**
 * Lista matches de uma competição específica (ativa OU inativa).
 * Diferente de `getAllMatches`, esse não filtra por `is_active_for_betting`,
 * permitindo preview de competições dormentes em /competicoes/[slug].
 */
export async function getMatchesForCompetition(
  competitionId: string,
  options?: { statusFilter?: GameStatus[]; limit?: number },
): Promise<Match[]> {
  if (isDemoMode()) return MOCK_MATCHES.filter((m) => m.competitionId === competitionId)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  type MatchRow = {
    id: string
    competition_id: string
    external_id: string | null
    home_team: string
    home_team_code: string | null
    home_team_logo: string | null
    away_team: string
    away_team_code: string | null
    away_team_logo: string | null
    starts_at: string
    status: GameStatus
    stage: Stage
    venue: string | null
    home_score: number | null
    away_score: number | null
    home_pen: number | null
    away_pen: number | null
    payout_multiplier: number | null
    teams_confirmed: boolean
    bet_markets: Array<{
      id: string
      market_type: MarketType
      bets: Array<{ stake: number; status: BetStatus; user_id: string }>
    }> | null
  }

  let query = supabase
    .from("matches")
    .select(`
      id, competition_id, external_id, home_team, home_team_code, home_team_logo,
      away_team, away_team_code, away_team_logo, starts_at, status, stage, venue,
      home_score, away_score, home_pen, away_pen, payout_multiplier, teams_confirmed,
      bet_markets ( id, market_type, bets ( stake, status, user_id ) )
    `)
    .eq("competition_id", competitionId)
    .order("starts_at", { ascending: true })

  if (options?.statusFilter && options.statusFilter.length > 0) {
    query = query.in("status", options.statusFilter)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error || !data) {
    if (error) console.error("[getMatchesForCompetition]", error.message)
    return []
  }

  const rows = data as unknown as MatchRow[]
  const pools = await fetchMatchPools(supabase, rows.map((r) => r.id))

  return rows.map((m): Match => {
    const bundle = pools.get(m.id) ?? emptyBundle()
    const { pool1x2, poolTotal, betsCount } = bundle

    const oddValues = [pool1x2.home, pool1x2.draw, pool1x2.away]
      .filter((p) => p > 0)
      .map((p) => poolTotal / p)
    const topOdd = oddValues.length > 0 ? Math.min(...oddValues) : 1.0

    let myBetStatus: Match["myBetStatus"] = "none"
    if (user) {
      const myBets = (m.bet_markets || []).flatMap((bm) =>
        (bm.bets || []).filter((b) => b.user_id === user.id),
      )
      if (myBets.some((b) => b.status === "open")) myBetStatus = "open"
      else if (myBets.some((b) => b.status === "won")) myBetStatus = "won"
      else if (myBets.some((b) => b.status === "lost")) myBetStatus = "lost"
      else if (myBets.some((b) => b.status === "refunded")) myBetStatus = "refunded"
    }

    return {
      id: m.id,
      competitionId: m.competition_id,
      externalId: m.external_id,
      home: {
        name: m.home_team,
        short: m.home_team_code || m.home_team.slice(0, 3).toUpperCase(),
        iso: m.home_team_code?.toLowerCase() || undefined,
        logoUrl: m.home_team_logo || null,
      },
      away: {
        name: m.away_team,
        short: m.away_team_code || m.away_team.slice(0, 3).toUpperCase(),
        iso: m.away_team_code?.toLowerCase() || undefined,
        logoUrl: m.away_team_logo || null,
      },
      startsAt: new Date(m.starts_at),
      status: m.status,
      stage: m.stage,
      venue: m.venue,
      homeScore: m.home_score,
      awayScore: m.away_score,
      homePen: m.home_pen,
      awayPen: m.away_pen,
      poolTotal,
      topOdd: Number(topOdd.toFixed(2)),
      pool1x2: poolTotal > 0 ? pool1x2 : undefined,
      betsCount,
      myBetStatus,
      market1x2Id: (m.bet_markets || []).find((bm) => bm.market_type === "1x2")?.id || null,
      payoutMultiplier: m.payout_multiplier,
      teamsConfirmed: m.teams_confirmed,
      myOpenStake: user
        ? (m.bet_markets || [])
            .flatMap((bm) => (bm.bets || []).filter((b) => b.user_id === user.id && b.status === "open"))
            .reduce((acc, b) => acc + b.stake, 0)
        : 0,
    }
  })
}

/**
 * Stats agregadas pra uma competição (usado no hero do hub).
 * Conta:
 *   - jogadores únicos com pelo menos 1 aposta
 *   - total de apostas (todos status)
 *   - próximos jogos (status='scheduled', starts_at > now)
 */
export type CompetitionStats = {
  participantsCount: number
  betsCount: number
  upcomingMatchesCount: number
}

export async function getCompetitionStats(competitionId: string): Promise<CompetitionStats> {
  if (isDemoMode()) {
    return { participantsCount: 0, betsCount: 0, upcomingMatchesCount: 0 }
  }
  const supabase = await createClient()

  // 1. Upcoming matches count
  const { count: upcoming } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("competition_id", competitionId)
    .eq("status", "scheduled")
    .gte("starts_at", new Date().toISOString())

  // 2. Distinct users + total bets via RPC SECURITY DEFINER (RLS esconde
  //    bets open de outros users; agregado precisa do pool completo)
  const { data: stats } = await supabase.rpc("get_competition_stats", {
    p_competition_id: competitionId,
  })
  const row = (stats as Array<{ participants_count: number; bets_count: number }> | null)?.[0]

  return {
    participantsCount: row?.participants_count ?? 0,
    betsCount: row?.bets_count ?? 0,
    upcomingMatchesCount: upcoming || 0,
  }
}

// ─── ENQUETE "JOGO DO DIA x2" ────────────────────────────────────────────────

/** Enquete ativa (mais próxima aberta) do multiplicador diário, ou null. */
export async function getActivePoll(): Promise<ActivePoll | null> {
  if (isDemoMode()) return null

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_active_poll")
  if (error || !data) {
    if (error) console.error("[getActivePoll] supabase error:", error.message)
    return null
  }
  const r = data as {
    id: string; gameDate: string; closesAt: string; multiplier: number
    totalVotes: number; myVoteMatchId: string | null
    candidates: Array<{ matchId: string; votes: number }>
  }
  return {
    id: r.id,
    gameDate: r.gameDate,
    closesAt: new Date(r.closesAt),
    multiplier: Number(r.multiplier),
    totalVotes: Number(r.totalVotes),
    myVoteMatchId: r.myVoteMatchId,
    candidates: (r.candidates ?? []).map((c) => ({ matchId: c.matchId, votes: Number(c.votes) })),
  }
}

// ─── TRANSPARÊNCIA DO JOGO ENCERRADO ─────────────────────────────────────────

function mapTransparencyBettor(r: { nickname: string; outcome: string; stake: number; net: number; won: boolean }): TransparencyBettor {
  return {
    nickname: r.nickname,
    outcome: r.outcome as "home" | "draw" | "away",
    stake: Number(r.stake),
    net: Number(r.net),
    won: Boolean(r.won),
  }
}

/** Agregado 1X2 + top10 ganhadores/perdedores de um jogo encerrado. */
export async function getMatchTransparency(matchId: string): Promise<MatchTransparencyData | null> {
  if (isDemoMode()) return null

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_match_transparency", { p_match_id: matchId })
  if (error || !data) {
    if (error) console.error("[getMatchTransparency] supabase error:", error.message)
    return null
  }
  const r = data as {
    settled: boolean; winnerOutcome: string | null; multiplier: number
    totals: { pool: number; bettors: number; winners: number; losers: number; paid: number }
    outcomes: Array<{ key: string; pool: number; bettors: number; odd: number }>
    topWon: Array<{ nickname: string; outcome: string; stake: number; net: number; won: boolean }>
    topLost: Array<{ nickname: string; outcome: string; stake: number; net: number; won: boolean }>
  }
  return {
    settled: r.settled,
    winnerOutcome: (r.winnerOutcome as "home" | "draw" | "away" | null) ?? null,
    multiplier: Number(r.multiplier),
    totals: {
      pool: Number(r.totals.pool), bettors: Number(r.totals.bettors),
      winners: Number(r.totals.winners), losers: Number(r.totals.losers), paid: Number(r.totals.paid),
    },
    outcomes: (r.outcomes ?? []).map((o) => ({
      key: o.key as "home" | "draw" | "away", pool: Number(o.pool), bettors: Number(o.bettors), odd: Number(o.odd),
    })),
    topWon: (r.topWon ?? []).map(mapTransparencyBettor),
    topLost: (r.topLost ?? []).map(mapTransparencyBettor),
  }
}

/** Busca apostadores públicos por nickname dentro de um jogo. */
export async function searchMatchBettors(matchId: string, query: string): Promise<TransparencyBettor[]> {
  if (isDemoMode()) return []
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("search_match_bettors", { p_match_id: matchId, p_query: query })
  if (error || !data) {
    if (error) console.error("[searchMatchBettors] supabase error:", error.message)
    return []
  }
  return (data as Array<{ nickname: string; outcome: string; stake: number; net: number; won: boolean }>).map(mapTransparencyBettor)
}

export { isDemoMode }
