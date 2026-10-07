"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { isDemoMode, searchLeagues } from "@/lib/data"
import type { DiscoverableLeague } from "@/lib/data/types"

// ─── CREATE LEAGUE ─────────────────────────────────────────────────────────

export type CreateLeagueResult = {
  error?: string
  fieldErrors?: Partial<Record<"name" | "competitionId", string>>
  slug?: string
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
}

function generateInviteCode(prefix: string): string {
  const code = Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
    .slice(0, 4)
  return `${prefix.toUpperCase().slice(0, 6).replace(/[^A-Z0-9]/g, "")}-${code}`
}

export async function createLeagueAction(
  _prev: CreateLeagueResult,
  formData: FormData,
): Promise<CreateLeagueResult> {
  const name = String(formData.get("name") || "").trim()
  const description = String(formData.get("description") || "").trim() || null
  // Visibilidade é SEMPRE 'private' agora (G1: ligas públicas eliminadas — só existe a Liga Global)
  const visibility = "private" as const
  const rulesText = String(formData.get("rulesText") || "").trim() || null
  // Owner decide se quer esconder a lista de membros/ranking de não-membros (default: visível)
  const hideMembers = formData.get("hideMembers") === "on"
  const membersVisible = !hideMembers
  // Competição focada (obrigatório). Hoje só Copa é ativa pra apostas;
  // o form só permite selecionar competições ativas, mas validamos server-side.
  const competitionId = String(formData.get("competitionId") || "").trim() || null

  const fieldErrors: CreateLeagueResult["fieldErrors"] = {}
  if (name.length < 3 || name.length > 50) {
    fieldErrors.name = "Nome: 3 a 50 caracteres"
  }
  if (!competitionId) {
    fieldErrors.competitionId = "Escolha uma competição pra essa liga"
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6)
  const inviteCode = generateInviteCode(name)

  if (isDemoMode()) {
    // Em demo mode não persiste; só redireciona pro placeholder
    return { error: "Em modo demo a criação não persiste. Configure o Supabase no .env.local pra criar ligas reais." }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sessão expirada. Faça login de novo." }

  // Valida que competição existe, ativa pra apostas E NÃO é PRO (defesa em profundidade)
  if (competitionId) {
    const { data: comp } = await supabase
      .from("competitions")
      .select("id, is_active_for_betting, is_pro_only")
      .eq("id", competitionId)
      .single()
    if (!comp) {
      return { fieldErrors: { competitionId: "Competição não encontrada" } }
    }
    const c = comp as { is_active_for_betting: boolean; is_pro_only: boolean }
    if (!c.is_active_for_betting) {
      return { fieldErrors: { competitionId: "Essa competição ainda não aceita apostas" } }
    }
    if (c.is_pro_only) {
      return { fieldErrors: { competitionId: "Essa competição é PRO (em breve). Por enquanto só Copa e Brasileirão A." } }
    }
  }

  // 1. Insere a liga
  const { data: leagueData, error: leagueError } = await supabase
    .from("leagues")
    .insert({
      name,
      slug,
      description,
      visibility,
      invite_code: inviteCode,
      owner_id: user.id,
      rules_text: rulesText,
      members_visible: membersVisible,
      competition_id: competitionId,
    })
    .select("id, slug")
    .single()

  if (leagueError || !leagueData) {
    return { error: leagueError?.message || "Falha ao criar liga" }
  }

  const league = leagueData as unknown as { id: string; slug: string }

  // 2. Insere owner como membro
  const { error: memberError } = await supabase
    .from("league_members")
    .insert({
      league_id: league.id,
      user_id: user.id,
      role: "owner",
    })

  if (memberError) {
    // estado inconsistente — liga criada mas owner não foi adicionado
    return { error: "Liga criada mas owner falhou. Contate suporte." }
  }

  revalidatePath("/ligas", "layout")
  redirect(`/ligas/${league.slug}`)
}

// ─── JOIN LEAGUE BY CODE ───────────────────────────────────────────────────

export type JoinLeagueResult = {
  error?: string
  fieldErrors?: Partial<Record<"code", string>>
}

export async function joinLeagueAction(
  _prev: JoinLeagueResult,
  formData: FormData,
): Promise<JoinLeagueResult> {
  const code = String(formData.get("code") || "").trim().toUpperCase()

  if (!code || code.length < 4) {
    return { fieldErrors: { code: "Código inválido" } }
  }

  if (isDemoMode()) {
    return { error: "Em modo demo não é possível entrar em ligas reais. Configure o Supabase." }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sessão expirada. Faça login de novo." }

  // Chama a função SECURITY DEFINER que faz tudo atomicamente:
  // valida o invite_code, checa duplicata/banimento e insere membership.
  // Necessário porque RLS bloqueia non-members de ler a liga pelo code.
  const { data: rpcData, error: rpcError } = await supabase
    .rpc("join_league_by_code", { p_code: code })
    .single()

  if (rpcError) {
    const msg = rpcError.message || ""
    if (msg.includes("invalid_code")) {
      return { fieldErrors: { code: "Código não encontrado ou inválido" } }
    }
    if (msg.includes("banned_from_league")) {
      return { error: "Você foi banido dessa liga. Fale com o owner se foi engano." }
    }
    if (msg.includes("not_authenticated")) {
      return { error: "Sessão expirada. Faça login de novo." }
    }
    return { error: msg || "Falha ao entrar na liga" }
  }

  const result = rpcData as unknown as { league_slug: string; league_name: string; already_member: boolean }

  revalidatePath("/ligas", "layout")
  redirect(`/ligas/${result.league_slug}`)
}

// ─── REQUEST TO JOIN DISCOVERABLE LEAGUE ───────────────────────────────────

export type RequestJoinResult = {
  ok?: boolean
  error?: string
  status?: "pending" | "already_pending"
}

export async function requestJoinLeagueAction(leagueId: string): Promise<RequestJoinResult> {
  if (!leagueId) return { error: "Liga inválida" }
  if (isDemoMode()) {
    return { error: "Em modo demo não é possível solicitar entrada em ligas reais." }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sessão expirada. Faça login de novo." }

  const { data, error } = await supabase
    .rpc("request_to_join_league", { p_league_id: leagueId, p_message: null })
    .single()

  if (error) {
    const msg = error.message || ""
    if (msg.includes("league_not_found")) return { error: "Liga não encontrada" }
    if (msg.includes("cannot_request_own_league")) return { error: "Você é o owner dessa liga" }
    if (msg.includes("already_member")) return { error: "Você já está nessa liga" }
    if (msg.includes("banned_from_league")) return { error: "Você foi banido dessa liga" }
    return { error: msg || "Falha ao solicitar entrada" }
  }

  const result = data as unknown as { request_id: string; status: string }
  revalidatePath("/ligas", "layout")
  return { ok: true, status: result.status === "pending" ? "pending" : "already_pending" }
}

// ─── OWNER DECIDES JOIN REQUEST ────────────────────────────────────────────

export type DecideRequestResult = {
  ok?: boolean
  error?: string
  status?: "approved" | "rejected"
}

export async function decideJoinRequestAction(
  requestId: string,
  approve: boolean,
): Promise<DecideRequestResult> {
  if (!requestId) return { error: "Solicitação inválida" }
  if (isDemoMode()) return { error: "Em modo demo não é possível decidir solicitações." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sessão expirada. Faça login de novo." }

  const { data, error } = await supabase
    .rpc("decide_join_request", { p_request_id: requestId, p_approve: approve })
    .single()

  if (error) {
    const msg = error.message || ""
    if (msg.includes("request_not_found")) return { error: "Solicitação não encontrada" }
    if (msg.includes("request_already_decided")) return { error: "Essa solicitação já foi decidida" }
    if (msg.includes("not_league_owner")) return { error: "Só o owner pode decidir" }
    return { error: msg || "Falha ao decidir solicitação" }
  }

  const result = data as unknown as { status: "approved" | "rejected" }
  revalidatePath("/ligas", "layout")
  return { ok: true, status: result.status }
}

// ─── SEARCH LEAGUES (client-facing) ────────────────────────────────────────

export async function searchLeaguesAction(query: string): Promise<DiscoverableLeague[]> {
  const q = (query || "").trim()
  return searchLeagues(q.length > 0 ? q : null, 30)
}

// ─── OWNER TOGGLE MEMBERS VISIBILITY ───────────────────────────────────────

export type ToggleMembersVisibilityResult = {
  ok?: boolean
  error?: string
  membersVisible?: boolean
}

export async function toggleMembersVisibilityAction(
  leagueId: string,
  membersVisible: boolean,
): Promise<ToggleMembersVisibilityResult> {
  if (!leagueId) return { error: "Liga inválida" }
  if (isDemoMode()) return { error: "Em modo demo não persiste." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sessão expirada. Faça login de novo." }

  const { error } = await supabase
    .from("leagues")
    .update({ members_visible: membersVisible })
    .eq("id", leagueId)
    .eq("owner_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/ligas", "layout")
  return { ok: true, membersVisible }
}

// ─── OWNER KICK MEMBER ─────────────────────────────────────────────────────

export type KickMemberResult = {
  ok?: boolean
  error?: string
}

export async function kickMemberAction(
  leagueId: string,
  userId: string,
): Promise<KickMemberResult> {
  if (!leagueId || !userId) return { error: "Parâmetros inválidos" }
  if (isDemoMode()) return { error: "Em modo demo não persiste." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sessão expirada. Faça login de novo." }

  const { error } = await supabase
    .rpc("kick_member", { p_league_id: leagueId, p_user_id: userId })

  if (error) {
    const msg = error.message || ""
    if (msg.includes("not_league_owner")) return { error: "Só o owner pode expulsar" }
    if (msg.includes("cannot_kick_self")) return { error: "Você não pode se expulsar" }
    if (msg.includes("not_member")) return { error: "Esse user não tá na liga" }
    if (msg.includes("league_not_found")) return { error: "Liga não encontrada" }
    return { error: msg || "Falha ao expulsar" }
  }

  revalidatePath("/ligas", "layout")
  return { ok: true }
}

// ─── OWNER DELETE LEAGUE ───────────────────────────────────────────────────

export type DeleteLeagueResult = {
  ok?: boolean
  error?: string
}

export async function deleteLeagueAction(leagueId: string): Promise<DeleteLeagueResult> {
  if (!leagueId) return { error: "Liga inválida" }
  if (isDemoMode()) return { error: "Em modo demo não persiste." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sessão expirada. Faça login de novo." }

  const { error } = await supabase
    .rpc("delete_league", { p_league_id: leagueId })

  if (error) {
    const msg = error.message || ""
    if (msg.includes("not_league_owner")) return { error: "Só o owner pode deletar" }
    if (msg.includes("cannot_delete_global")) return { error: "Liga global não pode ser deletada" }
    if (msg.includes("league_not_found")) return { error: "Liga não encontrada" }
    return { error: msg || "Falha ao deletar" }
  }

  revalidatePath("/ligas", "layout")
  // Caller deve redirecionar pra /ligas após receber ok:true
  return { ok: true }
}
