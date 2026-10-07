import { redirect } from "next/navigation"
import { AdminFakesPanel } from "./AdminFakesPanel"
import type { AdminLeague, KnockoutGame } from "./actions"
import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile, getAllMatches, getAllCompetitions } from "@/lib/data"
import { localizeTeamName } from "@/lib/teams"
import { formatKickoff } from "@/lib/format"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Painel escondido de gestão dos fakes (não linkado em lugar nenhum).
 * Gate duplo: redirect aqui + checagem de is_super_admin dentro das RPCs —
 * mesmo que alguém descubra a URL ou chame a RPC direto, leva `forbidden`.
 */
export default async function AdminFakesPage({
  searchParams,
}: {
  searchParams: Promise<{ comp?: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")
  if (!profile.isSuperAdmin) redirect("/inicio")

  const { comp: rawComp } = await searchParams
  const supabase = await createClient()
  const [{ data: fakesData }, { data: fakeBetsData }, { data: globalLeague }, { data: botCfgData }, { data: profilesData }, { data: recentData }, { data: leaguesData }, { data: knockoutData }, allMatchesRaw, allComps] = await Promise.all([
    supabase.rpc("admin_list_fakes"),
    supabase.rpc("admin_list_fake_bets"),
    supabase.from("leagues").select("id").eq("slug", "global").maybeSingle(),
    supabase.rpc("admin_get_bot_config"),
    supabase.rpc("admin_list_fake_profiles"),
    supabase.rpc("admin_recent_fake_bets", { p_limit: 40 }),
    supabase.rpc("admin_list_fake_leagues"),
    supabase.rpc("admin_list_knockout_schedule"),
    getAllMatches(),
    getAllCompetitions(),
  ])

  const leagues = (leaguesData as AdminLeague[] | null) ?? []
  const knockout = (knockoutData as KnockoutGame[] | null) ?? []
  // Competições onde faz sentido focar uma liga de fake (grátis/ativas)
  const competitions = allComps
    .filter((c) => c.isActiveForBetting)
    .map((c) => ({ id: c.id, name: c.name }))

  const botConfig = (botCfgData as Array<{
    enabled: boolean; target_min: number; target_max: number; ramp_hours: number; default_band: number; comp_slugs: string[]
    default_bettors: number; default_pool: number; stake_pct_min: number; stake_pct_max: number
  }> | null)?.[0] ?? null

  const fakeProfiles = ((profilesData as Array<{
    user_id: string; nickname: string; balance: number
    bet_frequency: number; risk_appetite: number; can_hedge: boolean
    stake_pct_min: number; stake_pct_max: number
  }> | null) || []).map((r) => ({
    userId: r.user_id, nickname: r.nickname, balance: r.balance,
    betFrequency: Number(r.bet_frequency), riskAppetite: Number(r.risk_appetite),
    canHedge: Boolean(r.can_hedge),
    stakePctMin: Number(r.stake_pct_min), stakePctMax: Number(r.stake_pct_max),
  }))

  const recentBets = ((recentData as Array<{
    nickname: string; home_team: string; away_team: string; outcome: string; stake: number; placed_at: string; comp_slug: string
  }> | null) || []).map((r) => ({
    nickname: r.nickname, homeTeam: r.home_team, awayTeam: r.away_team,
    outcome: r.outcome as "home" | "draw" | "away", stake: r.stake, placedAt: r.placed_at, compSlug: r.comp_slug,
  }))

  // Competições geríveis = as que o robô cobre (comp_slugs). Seletor Copa / Brasileirão A.
  const COPA_SLUG = "copa-do-mundo-2026"
  const manageComps = allComps
    .filter((c) => (botConfig?.comp_slugs ?? [COPA_SLUG]).includes(c.slug))
    .map((c) => ({ slug: c.slug, name: c.name, id: c.id }))
  const selectedComp =
    manageComps.find((c) => c.slug === rawComp) ??
    manageComps.find((c) => c.slug === COPA_SLUG) ??
    manageComps[0] ?? null
  const selectedSlug = selectedComp?.slug ?? COPA_SLUG
  const allMatches = selectedComp
    ? allMatchesRaw.filter((m) => m.competitionId === selectedComp.id)
    : allMatchesRaw

  // Ranking da Liga Global da Copa → posição de cada fake no dropdown
  const rankByUser = new Map<string, { rank: number; netPoints: number }>()
  if (globalLeague?.id) {
    const { data: ranking } = await supabase.rpc("get_league_rankings", {
      p_league_id: (globalLeague as { id: string }).id,
    })
    for (const [i, row] of ((ranking as Array<{ user_id: string; net_points: number }> | null) || []).entries()) {
      rankByUser.set(row.user_id, { rank: i + 1, netPoints: Number(row.net_points) })
    }
  }

  const fakes = ((fakesData as Array<{ id: string; nickname: string; balance: number }> | null) || [])
    .map((f) => ({
      ...f,
      rank: rankByUser.get(f.id)?.rank ?? null,
      netPoints: rankByUser.get(f.id)?.netPoints ?? 0,
    }))
    // Ordem do ranking global (1º primeiro; sem rank vai pro fim)
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))

  // Pares (fake, jogo) com aposta aberta — o painel filtra o dropdown pra
  // mostrar só fakes sem palpite no jogo selecionado
  const fakeBets = ((fakeBetsData as Array<{ fake_id: string; match_id: string }> | null) || [])
    .map((r) => ({ fakeId: r.fake_id, matchId: r.match_id }))

  // Seletor único do gerenciador: TODOS os jogos. Ordem: futuros/em-andamento
  // por data crescente, e os já concluídos no fim (também crescente).
  const STATUS_TAG: Record<string, string> = { scheduled: "", live: "● LIVE", finished: "✓ FIM" }
  const viewMatches = [...allMatches]
    .filter((m) => !!m.market1x2Id)
    .sort((a, b) => {
      const af = a.status === "finished" ? 1 : 0
      const bf = b.status === "finished" ? 1 : 0
      if (af !== bf) return af - bf                       // concluídos depois
      return a.startsAt.getTime() - b.startsAt.getTime()  // crescente por data
    })
    .map((m) => {
      const tag = STATUS_TAG[m.status] ?? ""
      const score = m.status === "finished" || m.status === "live"
        ? ` (${m.homeScore ?? 0}-${m.awayScore ?? 0})`
        : ""
      return {
        id: m.id,
        market1x2Id: m.market1x2Id as string,
        status: m.status,
        home: localizeTeamName(m.home.name),
        away: localizeTeamName(m.away.name),
        label: `${tag ? tag + " · " : ""}${formatKickoff(m.startsAt)} — ${localizeTeamName(m.home.name)} × ${localizeTeamName(m.away.name)}${score}`,
        kickoff: formatKickoff(m.startsAt),
        pool: m.pool1x2 ?? { home: 0, draw: 0, away: 0 },
        bettorsCount: m.betsCount ?? 0,
        poolTotal: m.poolTotal,
      }
    })

  // Shell mínimo: sem AppHeader/BottomTabBar — painel admin isolado, sem links
  // pro resto do site (evita sair do contexto sem querer).
  return (
    <div className="min-h-screen bg-muted/30">
      <main className="max-w-3xl mx-auto px-4 py-5">
        <AdminFakesPanel
          me={{ id: profile.id, nickname: profile.nickname, balance: profile.balance }}
          fakes={fakes}
          viewMatches={viewMatches}
          fakeBets={fakeBets}
          botConfig={botConfig}
          fakeProfiles={fakeProfiles}
          recentBets={recentBets}
          leagues={leagues}
          competitions={competitions}
          knockout={knockout}
          selectedCompSlug={selectedSlug}
          comps={manageComps.map((c) => ({ slug: c.slug, name: c.name }))}
        />
      </main>
    </div>
  )
}
