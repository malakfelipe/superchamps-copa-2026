"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

/**
 * Ações do painel admin de fakes. A autorização REAL acontece nas RPCs
 * (admin_* checam profiles.is_super_admin via _assert_super_admin) — aqui é
 * só transporte + tradução de erro.
 */

export type AdminActionResult = { ok?: boolean; error?: string }

/** Sobe o MESMO palpite (jogo + outcome + stake) pra vários fakes de uma vez. */
export async function placeFakeBetsBulkAction(
  fakeIds: string[],
  marketId: string,
  outcome: string,
  stake: number,
): Promise<{ ok?: boolean; placed: number; failed: Array<{ fakeId: string; error: string }> }> {
  const supabase = await createClient()
  let placed = 0
  const failed: Array<{ fakeId: string; error: string }> = []

  for (const fakeId of fakeIds) {
    const { error } = await supabase.rpc("admin_place_fake_bet", {
      p_fake_id: fakeId,
      p_market_id: marketId,
      p_outcome: outcome,
      p_stake: stake,
    })
    if (error) failed.push({ fakeId, error: translateAdminError(error.message) })
    else placed++
  }

  if (placed > 0) revalidateAfterChange()
  return { ok: failed.length === 0, placed, failed }
}

export type EditorBetRow = {
  betId: string
  userId: string
  nickname: string
  isFake: boolean
  isMine: boolean
  editable: boolean
  outcome: "home" | "draw" | "away"
  stake: number
  status: string
  userWins: number
}

/** Todas as apostas 1X2 de um jogo, com flags de editabilidade + acertos. */
export async function listMatchEditorAction(matchId: string): Promise<{ rows?: EditorBetRow[]; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_match_bets_editor", { p_match_id: matchId })
  if (error) return { error: translateAdminError(error.message) }
  const rows = ((data as Array<{
    bet_id: string; user_id: string; nickname: string; is_fake: boolean; is_mine: boolean
    editable: boolean; outcome: string; stake: number; status: string; user_wins: number
  }> | null) || []).map((r) => ({
    betId: r.bet_id, userId: r.user_id, nickname: r.nickname, isFake: r.is_fake, isMine: r.is_mine,
    editable: r.editable, outcome: r.outcome as "home" | "draw" | "away",
    stake: r.stake, status: r.status, userWins: Number(r.user_wins),
  }))
  return { rows }
}

/** Move resultado, cancela, ou troca o dono (reassign) das apostas — minhas ou de fakes. */
export async function editBetsAction(
  betIds: string[],
  action: "move" | "cancel" | "reassign",
  opts?: { newOutcome?: "home" | "draw" | "away"; newUserId?: string },
): Promise<{ ok?: boolean; affected?: number; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_edit_bets", {
    p_bet_ids: betIds,
    p_action: action,
    p_new_outcome: opts?.newOutcome ?? null,
    p_new_user_id: opts?.newUserId ?? null,
  })
  if (error) return { error: translateAdminError(error.message) }
  revalidateAfterChange()
  return { ok: true, affected: (data as { affected: number } | null)?.affected ?? 0 }
}

export type FakeUserBet = {
  betId: string; marketId: string; matchId: string
  home: string; away: string; startsAt: string; stage: string; matchStatus: string
  status: string; outcome: "home" | "draw" | "away"; stake: number; editable: boolean
}

/** Lista os palpites 1X2 de um fake específico (pra editar/selecionar por usuário). */
export async function listFakeUserBetsAction(fakeId: string): Promise<{ rows?: FakeUserBet[]; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_list_fake_user_bets", { p_fake_id: fakeId })
  if (error) return { error: translateAdminError(error.message) }
  const rows = ((data as Array<{
    bet_id: string; market_id: string; match_id: string; home_team: string; away_team: string
    starts_at: string; stage: string; match_status: string
    bet_status: string; outcome: string; stake: number; editable: boolean
  }> | null) || []).map((r) => ({
    betId: r.bet_id, marketId: r.market_id, matchId: r.match_id,
    home: r.home_team, away: r.away_team, startsAt: r.starts_at, stage: r.stage, matchStatus: r.match_status,
    status: r.bet_status, outcome: r.outcome as "home" | "draw" | "away", stake: r.stake, editable: r.editable,
  }))
  return { rows }
}

/** Cria fakes a partir de nicknames (1 por linha). */
export async function createFakesAction(
  nicknames: string[],
): Promise<{ created: number; skipped: Array<{ nickname: string; reason: string }>; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_create_fakes", { p_nicknames: nicknames })
  if (error) return { created: 0, skipped: [], error: translateAdminError(error.message) }
  const rows = (data as Array<{ nickname: string; created: boolean; reason: string }> | null) || []
  const created = rows.filter((r) => r.created).length
  const skipped = rows.filter((r) => !r.created).map((r) => ({ nickname: r.nickname, reason: r.reason }))
  if (created > 0) revalidateAfterChange()
  return { created, skipped }
}

// ─── ROBÔ: config, perfis, equilíbrio ───────────────────────────────────────

export async function setBotEnabledAction(enabled: boolean): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_set_bot_enabled", { p_enabled: enabled })
  if (error) return { error: translateAdminError(error.message) }
  revalidatePath("/admin/fakes")
  return { ok: true }
}

export async function runFakeDripAction(): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_run_fake_drip")
  if (error) return { error: translateAdminError(error.message) }
  return { ok: true }
}

export type FakeProfileRow = {
  userId: string; nickname: string; balance: number
  betFrequency: number; riskAppetite: number; canHedge: boolean
  stakePctMin: number; stakePctMax: number
}

export async function listFakeProfilesAction(): Promise<{ rows?: FakeProfileRow[]; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_list_fake_profiles")
  if (error) return { error: translateAdminError(error.message) }
  const rows = ((data as Array<{
    user_id: string; nickname: string; balance: number
    bet_frequency: number; risk_appetite: number; can_hedge: boolean
    stake_pct_min: number; stake_pct_max: number
  }> | null) || []).map((r) => ({
    userId: r.user_id, nickname: r.nickname, balance: r.balance,
    betFrequency: Number(r.bet_frequency), riskAppetite: Number(r.risk_appetite),
    canHedge: Boolean(r.can_hedge),
    stakePctMin: Number(r.stake_pct_min), stakePctMax: Number(r.stake_pct_max),
  }))
  return { rows }
}

export async function setFakeProfileAction(
  userId: string, freq: number, risk: number, stake: number, canHedge: boolean,
): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_set_fake_profile", {
    p_user_id: userId, p_freq: freq, p_risk: risk, p_stake: stake, p_can_hedge: canHedge,
  })
  if (error) return { error: translateAdminError(error.message) }
  revalidatePath("/admin/fakes")
  return { ok: true }
}

/** Salva vários perfis de fake numa única chamada (bulk). Cada um com sua faixa [pct_min, pct_max]. */
export async function setFakeProfilesBulkAction(
  rows: Array<{ user_id: string; freq: number; risk: number; pct_min: number; pct_max: number; can_hedge: boolean }>,
): Promise<AdminActionResult & { saved?: number }> {
  if (rows.length === 0) return { ok: true, saved: 0 }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_set_fake_profiles_bulk", { p_rows: rows })
  if (error) return { error: translateAdminError(error.message) }
  revalidatePath("/admin/fakes")
  return { ok: true, saved: Number(data) || rows.length }
}

/** Renomeia um fake (nickname único, case-insensitive). */
export async function renameFakeAction(userId: string, nickname: string): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_rename_fake", { p_user_id: userId, p_nickname: nickname })
  if (error) return { error: translateAdminError(error.message) }
  revalidatePath("/admin/fakes")
  return { ok: true }
}

/**
 * Aplica uma faixa de apetite (% do saldo) em massa. userIds=null → todos os fakes;
 * senão só os listados (ex.: os filtrados na busca). min/max em [0,1].
 */
export async function applyStakeBandAction(
  userIds: string[] | null, min: number, max: number,
): Promise<AdminActionResult & { affected?: number }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_apply_stake_band", {
    p_user_ids: userIds, p_min: min, p_max: max,
  })
  if (error) return { error: translateAdminError(error.message) }
  revalidatePath("/admin/fakes")
  return { ok: true, affected: Number(data) || 0 }
}

export type MatchBalance = {
  prematch: { home: number; draw: number; away: number } | null
  override: { home: number; draw: number; away: number } | null
  band: number
  pool: { home: number; draw: number; away: number }
  /** Meta de apostadores fake do jogo (null = usa default global). */
  targetBettors: number | null
  /** Meta de pote de fakes do jogo, em pontos (null = usa default global). */
  targetPool: number | null
  defBettors: number          // default global (fallback) de apostadores
  defPool: number             // default global (fallback) de pote
  fakeBettors: number         // apostadores fake distintos JÁ no jogo
  fakePool: number            // pote de fakes JÁ no jogo
}

export async function getMatchBalanceAction(matchId: string): Promise<{ data?: MatchBalance; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_get_match_balance", { p_match_id: matchId })
  if (error) return { error: translateAdminError(error.message) }
  const r = (data as Array<{
    prematch: Record<string, number> | null; override: Record<string, number> | null; band: number
    pool_home: number; pool_draw: number; pool_away: number
    target_bettors: number | null; target_pool: number | null
    def_bettors: number; def_pool: number; fake_bettors: number; fake_pool: number
  }> | null)?.[0]
  if (!r) return { error: "Jogo não encontrado." }
  const asTriple = (o: Record<string, number> | null) =>
    o ? { home: Number(o.home), draw: Number(o.draw), away: Number(o.away) } : null
  return {
    data: {
      prematch: asTriple(r.prematch), override: asTriple(r.override), band: Number(r.band),
      pool: { home: Number(r.pool_home), draw: Number(r.pool_draw), away: Number(r.pool_away) },
      targetBettors: r.target_bettors != null ? Number(r.target_bettors) : null,
      targetPool: r.target_pool != null ? Number(r.target_pool) : null,
      defBettors: Number(r.def_bettors), defPool: Number(r.def_pool),
      fakeBettors: Number(r.fake_bettors), fakePool: Number(r.fake_pool),
    },
  }
}

/** Define metas de volume de fakes do jogo (apostadores + pote). null = volta pro default global. */
export async function setMatchTargetsAction(
  matchId: string, bettors: number | null, pool: number | null,
): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_set_match_targets", {
    p_match_id: matchId, p_target_bettors: bettors, p_target_pool: pool,
  })
  if (error) return { error: translateAdminError(error.message) }
  revalidatePath("/admin/fakes")
  return { ok: true }
}

export async function setMatchBalanceAction(
  matchId: string,
  target: { home: number; draw: number; away: number } | null,
  band: number | null,
): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_set_match_balance", {
    p_match_id: matchId, p_target: target, p_band: band,
  })
  if (error) return { error: translateAdminError(error.message) }
  revalidatePath("/admin/fakes")
  return { ok: true }
}

export type RecentFakeBet = {
  nickname: string; homeTeam: string; awayTeam: string
  outcome: "home" | "draw" | "away"; stake: number; placedAt: string; compSlug: string
}

/** Últimos palpites de fakes (feed do robô). */
export async function listRecentFakeBetsAction(limit = 40): Promise<{ rows?: RecentFakeBet[]; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_recent_fake_bets", { p_limit: limit })
  if (error) return { error: translateAdminError(error.message) }
  const rows = ((data as Array<{
    nickname: string; home_team: string; away_team: string; outcome: string; stake: number; placed_at: string; comp_slug: string
  }> | null) || []).map((r) => ({
    nickname: r.nickname, homeTeam: r.home_team, awayTeam: r.away_team,
    outcome: r.outcome as "home" | "draw" | "away", stake: r.stake, placedAt: r.placed_at, compSlug: r.comp_slug,
  }))
  return { rows }
}

// ─── ENQUETES "JOGO DO DIA x2" ───────────────────────────────────────────────

export type AdminPollCandidate = {
  matchId: string; home: string; away: string; stage: string
  kickoff: string; matchStatus: string; votes: number; isWinner: boolean
}
export type AdminPoll = {
  id: string; gameDate: string; closesAt: string; status: string
  multiplier: number; winnerMatchId: string | null; totalVotes: number
  candidates: AdminPollCandidate[]
}

/** Lista enquetes (últimos 7 dias + futuras) com candidatos, votos e vencedor. */
export async function listPollsAction(): Promise<{ rows?: AdminPoll[]; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_list_polls")
  if (error) return { error: translateAdminError(error.message) }
  return { rows: (data as AdminPoll[] | null) ?? [] }
}

/** Manipula os votos de um candidato (ajusta votos fake até o alvo). */
export async function setCandidateVotesAction(
  pollId: string, matchId: string, target: number,
): Promise<{ ok?: boolean; total?: number; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_set_candidate_votes", {
    p_poll_id: pollId, p_match_id: matchId, p_target: target,
  })
  if (error) return { error: translateAdminError(error.message) }
  revalidateAfterChange()
  return { ok: true, total: (data as { total: number } | null)?.total }
}

/** Define o jogo que paga x2 da enquete (só grupos, não liquidado). */
export async function setPollWinnerAction(pollId: string, matchId: string): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_set_poll_winner", { p_poll_id: pollId, p_match_id: matchId })
  if (error) return { error: translateAdminError(error.message) }
  revalidateAfterChange()
  return { ok: true }
}

/** Remove o x2 da enquete (jogo volta a x1). */
export async function clearPollWinnerAction(pollId: string): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_clear_poll_winner", { p_poll_id: pollId })
  if (error) return { error: translateAdminError(error.message) }
  revalidateAfterChange()
  return { ok: true }
}

// ─── LIGAS DE FAKES ──────────────────────────────────────────────────────────

export type AdminLeagueMember = { userId: string; nickname: string; role: "owner" | "member"; isFake: boolean }
export type AdminLeaguePending = { requestId: string; userId: string; nickname: string; message: string | null }
export type AdminLeague = {
  id: string; name: string; slug: string; inviteCode: string | null
  description: string | null; membersVisible: boolean; createdAt: string
  competitionId: string | null; competitionName: string | null
  ownerId: string; ownerNickname: string
  members: AdminLeagueMember[]; pending: AdminLeaguePending[]
}

export async function listFakeLeaguesAction(): Promise<{ rows?: AdminLeague[]; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_list_fake_leagues")
  if (error) return { error: translateAdminError(error.message) }
  return { rows: (data as AdminLeague[] | null) ?? [] }
}

export async function createFakeLeagueAction(
  name: string, ownerId: string, competitionId: string | null, membersVisible: boolean,
  description: string, startAt: string | null,
): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_create_fake_league", {
    p_name: name, p_owner_id: ownerId, p_competition_id: competitionId,
    p_members_visible: membersVisible, p_description: description || null, p_start_at: startAt,
  })
  if (error) return { error: translateAdminError(error.message) }
  revalidateLeagues()
  return { ok: true }
}

/** Adiciona vários fakes de uma vez. joinedAt define desde quando o saldo conta. */
export async function addLeagueMembersAction(
  leagueId: string, userIds: string[], joinedAt: string | null,
): Promise<{ ok?: boolean; added?: number; error?: string }> {
  if (userIds.length === 0) return { ok: true, added: 0 }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_add_league_members", {
    p_league_id: leagueId, p_user_ids: userIds, p_joined_at: joinedAt,
  })
  if (error) return { error: translateAdminError(error.message) }
  revalidateLeagues()
  return { ok: true, added: (data as number | null) ?? 0 }
}

/** Ajusta a data de criação da liga e (opcional) sincroniza o joined_at de todos. */
export async function setLeagueDatesAction(
  leagueId: string, createdAt: string, syncMembers: boolean,
): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_set_league_dates", {
    p_league_id: leagueId, p_created_at: createdAt, p_sync_members: syncMembers,
  })
  if (error) return { error: translateAdminError(error.message) }
  revalidateLeagues()
  return { ok: true }
}

export async function updateLeagueAction(
  leagueId: string, name: string, description: string, membersVisible: boolean,
): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_update_league", {
    p_league_id: leagueId, p_name: name, p_description: description, p_members_visible: membersVisible,
  })
  if (error) return { error: translateAdminError(error.message) }
  revalidateLeagues()
  return { ok: true }
}

export async function deleteLeagueAction(leagueId: string): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_delete_league", { p_league_id: leagueId })
  if (error) return { error: translateAdminError(error.message) }
  revalidateLeagues()
  return { ok: true }
}

export async function setLeagueOwnerAction(leagueId: string, newOwnerId: string): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_set_league_owner", { p_league_id: leagueId, p_new_owner_id: newOwnerId })
  if (error) return { error: translateAdminError(error.message) }
  revalidateLeagues()
  return { ok: true }
}

export async function addLeagueMemberAction(leagueId: string, userId: string): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_add_league_member", { p_league_id: leagueId, p_user_id: userId })
  if (error) return { error: translateAdminError(error.message) }
  revalidateLeagues()
  return { ok: true }
}

export async function removeLeagueMemberAction(leagueId: string, userId: string): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_remove_league_member", { p_league_id: leagueId, p_user_id: userId })
  if (error) return { error: translateAdminError(error.message) }
  revalidateLeagues()
  return { ok: true }
}

export async function decideJoinRequestAction(requestId: string, approve: boolean): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_decide_join_request", { p_request_id: requestId, p_approve: approve })
  if (error) return { error: translateAdminError(error.message) }
  revalidateLeagues()
  return { ok: true }
}

function revalidateLeagues() {
  revalidatePath("/admin/fakes")
  revalidatePath("/ligas", "layout")
}

// ─── MATA-MATA (agenda editável) ─────────────────────────────────────────────

export type KnockoutGame = {
  matchNo: number; stage: string; kickoff: string; venue: string
  homeSlot: string; awaySlot: string; materialized: boolean; confirmed: boolean
}

export async function listKnockoutScheduleAction(): Promise<{ rows?: KnockoutGame[]; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_list_knockout_schedule")
  if (error) return { error: translateAdminError(error.message) }
  return { rows: (data as KnockoutGame[] | null) ?? [] }
}

export async function updateKnockoutSlotAction(
  matchNo: number, homeSlot: string, awaySlot: string, kickoff: string, venue: string,
): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_update_knockout_slot", {
    p_match_no: matchNo, p_home_slot: homeSlot, p_away_slot: awaySlot, p_kickoff: kickoff, p_venue: venue,
  })
  if (error) return { error: translateAdminError(error.message) }
  revalidatePath("/admin/fakes")
  return { ok: true }
}

/** Cria/atualiza o jogo em `matches` a partir da linha de agenda (resolve os slots). */
export async function materializeKnockoutAction(
  matchNo: number,
): Promise<{ ok?: boolean; home?: string; away?: string; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_materialize_knockout_match", { p_match_no: matchNo })
  if (error) return { error: translateAdminError(error.message) }
  const r = data as { matchId: string; home: string; away: string } | null
  revalidatePath("/admin/fakes")
  revalidatePath("/jogos", "layout")
  return { ok: true, home: r?.home, away: r?.away }
}

/** Confirma/reabre os times de um jogo do mata-mata (abre/fecha a aposta). */
export async function setKnockoutConfirmedAction(matchNo: number, confirmed: boolean): Promise<AdminActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("admin_set_knockout_confirmed", { p_match_no: matchNo, p_confirmed: confirmed })
  if (error) return { error: translateAdminError(error.message) }
  revalidatePath("/admin/fakes")
  revalidatePath("/jogos", "layout")
  return { ok: true }
}

function revalidateAfterChange() {
  revalidatePath("/admin/fakes")
  revalidatePath("/inicio", "layout")
  revalidatePath("/jogos", "layout")
  revalidatePath("/apostas", "layout")
}

function translateAdminError(msg: string): string {
  const code = msg.split(/[\s(]/)[0].toLowerCase()
  const translations: Record<string, string> = {
    unauthenticated: "Você precisa estar logado.",
    forbidden: "Conta sem permissão de admin.",
    not_a_fake_account: "Esse usuário não é um fake.",
    invalid_outcome: "Resultado inválido.",
    stake_below_minimum: "Stake mínimo é 10 pontos.",
    insufficient_balance: "Saldo do fake não cobre esse stake.",
    market_not_found: "Mercado não encontrado.",
    market_closed: "Apostas encerradas pra esse jogo.",
    bet_not_open: "Uma das apostas selecionadas não está mais aberta.",
    market_already_settled: "Jogo já liquidado — não dá pra editar.",
    match_already_started: "Jogo em andamento: só dá pra trocar o dono (cancelar/mover afeta as odds).",
    invalid_action: "Ação inválida.",
    invalid_destination: "Destino inválido — só fake ou você.",
    no_destination: "Escolha o novo dono.",
    no_bets_selected: "Nenhuma aposta selecionada.",
    target_must_sum_to_1: "O alvo de equilíbrio precisa somar 100%.",
    invalid_bettors: "Meta de apostadores inválida.",
    invalid_pool: "Meta de pote inválida.",
    poll_not_found: "Enquete não encontrada.",
    not_a_candidate: "Esse jogo não é candidato da enquete.",
    nickname_empty: "O nickname não pode ficar vazio.",
    nickname_taken: "Esse nickname já existe.",
    x2_group_only: "O x2 só vale na fase de grupos — mata-mata já paga x3/x5.",
    invalid_target: "Número de votos inválido.",
    name_required: "Dá um nome pra liga.",
    owner_must_be_fake: "O owner precisa ser um fake.",
    not_a_fake_league: "Essa liga não é uma liga privada de fake.",
    already_member: "Esse usuário já é membro.",
    cannot_remove_owner: "Não dá pra remover o owner — troca o owner antes.",
    request_not_found: "Solicitação não encontrada.",
    request_not_pending: "Solicitação já foi decidida.",
    match_not_found: "Jogo da agenda não encontrado.",
    not_materialized: "Materialize o jogo antes de confirmar os times.",
  }
  return translations[code] || `Erro: ${msg}`
}
