import Link from "next/link"
import { Calendar, Flame, GitBranch, CheckCircle2, Crown, Trophy, ChevronRight, Lock, Users, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/components/layout/AppShell"
import { MatchCardQuickBet } from "@/components/games/MatchCardQuickBet"
import { KnockoutPendingCard } from "@/components/games/KnockoutPendingCard"
import { CompetitionHubHero } from "@/components/competitions/CompetitionHubHero"
import { StandingsTable } from "@/components/competitions/StandingsTable"
import {
  computeStandings, computeRecentFormByTeam,
  buildRankLookupFromTable, buildRankLookupFromGroups,
  type TeamRankPts,
} from "@/lib/standings"
import {
  getCurrentProfile, getUnreadNotificationsCount, getStandings,
  getAllCompetitions, getCompetitionBySlug, getMatchesForCompetition,
  getCompetitionStats, searchLeagues,
} from "@/lib/data"
import { dayLabel, brtDayKey } from "@/lib/format"
import { localizeTeamName } from "@/lib/teams"
import { Flag } from "@/components/Flag"
import type { Match } from "@/lib/data/types"
import { JogosNavStrip } from "./JogosNavStrip"
import { CompetitionLeaguesList } from "@/app/competicoes/[slug]/CompetitionLeaguesList"
import type { CompetitionMeta } from "@/lib/competitions-context"

function groupByDay(items: Match[]): { label: string; date: Date; items: Match[] }[] {
  const groups: Record<string, { date: Date; items: Match[] }> = {}
  const ordered: string[] = []
  for (const g of items) {
    const k = brtDayKey(g.startsAt)
    if (!groups[k]) {
      groups[k] = { date: g.startsAt, items: [] }
      ordered.push(k)
    }
    groups[k].items.push(g)
  }
  return ordered.map((k) => ({ label: dayLabel(groups[k].date), date: groups[k].date, items: groups[k].items }))
}

const VALID_TABS = ["upcoming", "live", "finished", "standings", "bracket", "leagues"] as const
type TabValue = typeof VALID_TABS[number]

const DEFAULT_COMPETITION_SLUG = "copa-do-mundo-2026"

export default async function JogosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; comp?: string }>
}) {
  const profile = await getCurrentProfile()  // null = visitante anônimo (app público)

  const { tab: rawTab, comp: rawComp } = await searchParams
  const initialTab: TabValue = VALID_TABS.includes(rawTab as TabValue) ? (rawTab as TabValue) : "upcoming"

  // 1. Resolve a competição selecionada via ?comp=slug, default Copa
  const allCompetitions = await getAllCompetitions()
  const selectedSlug = rawComp?.trim() || DEFAULT_COMPETITION_SLUG
  const selectedCompetition =
    allCompetitions.find((c) => c.slug === selectedSlug) ||
    allCompetitions.find((c) => c.slug === DEFAULT_COMPETITION_SLUG) ||
    allCompetitions.find((c) => c.isActiveForBetting && !c.isProOnly)

  if (!selectedCompetition) {
    return (
      <AppShell authed={!!profile} balance={profile?.balance} nickname={profile?.nickname} avatarUrl={profile?.avatarUrl}>
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Sem competições ativas no momento.
        </CardContent></Card>
      </AppShell>
    )
  }

  // 2. Fetch específico dessa competição + dados auxiliares em paralelo
  const [all, unreadCount, standings, stats, focusedLeagues] = await Promise.all([
    getMatchesForCompetition(selectedCompetition.id, { limit: 500 }),
    getUnreadNotificationsCount(),
    selectedCompetition.slug === DEFAULT_COMPETITION_SLUG ? getStandings() : Promise.resolve([]),
    getCompetitionStats(selectedCompetition.id),
    searchLeagues(null, 30, selectedCompetition.id),
  ])

  const competitionsForStrip: CompetitionMeta[] = allCompetitions.map((c) => ({
    slug: c.slug,
    name: c.name,
    season: c.externalSeason ? String(c.externalSeason) : undefined,
    countryCode: c.countryCode,
    icon: c.icon,
    active: c.isActiveForBetting,
    requiresPro: c.isProOnly,
    memberCount: 0,
  }))

  // Esta é a competição "principal" do conteúdo da página
  const activeCompetition = selectedCompetition
  const isProOnly = selectedCompetition.isProOnly
  const hasGroupsAndKnockout = selectedCompetition.slug === DEFAULT_COMPETITION_SLUG
  const upcoming = all
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
  const live = all.filter((m) => m.status === "live")
  const finished = all
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())

  const groupedUpcoming = groupByDay(upcoming)
  const groupedFinished = groupByDay(finished)

  // Standings calculados localmente pra competições de ponto corrido
  // (Brasileirão A, ligas europeias). Copa usa `getStandings()` específica.
  const tableStandings = hasGroupsAndKnockout ? [] : computeStandings(all)

  // Lookups pra enriquecer MatchCardProd com forma + rank + pts
  const formByTeam = computeRecentFormByTeam(all, 5)
  const rankByTeam: Map<string, TeamRankPts> = hasGroupsAndKnockout
    ? buildRankLookupFromGroups(standings)
    : buildRankLookupFromTable(tableStandings)

  // Helper pra montar TeamMeta a partir do match.home/away
  const metaFor = (originalName: string, localizedName: string) => {
    const form = formByTeam.get(originalName) || formByTeam.get(localizedName)
    const rank = rankByTeam.get(originalName) || rankByTeam.get(localizedName)
    if (!form && !rank) return undefined
    return {
      form,
      rank: rank?.rank,
      points: rank?.points,
      groupLabel: rank?.groupLabel,
    }
  }

  // Bracket por fase eliminatória
  const KNOCKOUT_STAGES: { key: Match["stage"]; label: string; code: string; expected: number; dates: string }[] = [
    { key: "round_of_32", label: "16-avos", code: "R32", expected: 16, dates: "15–18 jun" },
    { key: "round_of_16", label: "Oitavas", code: "R16", expected: 8, dates: "22–25 jun" },
    { key: "quarter",     label: "Quartas", code: "QF",  expected: 4, dates: "29 jun – 02 jul" },
    { key: "semi",        label: "Semifinais", code: "SF", expected: 2, dates: "08–09 jul" },
    { key: "third",       label: "3° lugar", code: "3°", expected: 1, dates: "18 jul" },
    { key: "final",       label: "Final", code: "F", expected: 1, dates: "19 jul" },
  ]
  const knockoutByStage = KNOCKOUT_STAGES.map((s) => ({
    ...s,
    matches: all
      .filter((m) => m.stage === s.key)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
  }))
  const hasAnyKnockout = knockoutByStage.some((s) => s.matches.length > 0)

  return (
    <AppShell authed={!!profile} balance={profile?.balance} nickname={profile?.nickname} avatarUrl={profile?.avatarUrl} unreadNotifications={unreadCount}>
      {/* Nav strip — switch entre competições (navega pra /competicoes/[slug] se diferente da ativa) */}
      <JogosNavStrip competitions={competitionsForStrip} activeSlug={activeCompetition?.slug ?? null} />

      <div className="space-y-4 animate-in fade-in duration-300 pt-3">
        {/* HERO da competição — só desktop. No mobile o nav strip já dá o contexto
            e o hero comia uma tela inteira sem agregar. */}
        <div className="hidden sm:block">
          <CompetitionHubHero
            slug={selectedCompetition.slug}
            name={selectedCompetition.name}
            season={selectedCompetition.externalSeason ? String(selectedCompetition.externalSeason) : ""}
            countryCode={selectedCompetition.countryCode}
            icon={selectedCompetition.icon || undefined}
            participantsCount={stats.participantsCount}
            betsCount={stats.betsCount}
            upcomingMatchesCount={upcoming.length}
            isActive={selectedCompetition.isActiveForBetting && !isProOnly}
          />
        </div>

        {/* Contexto compacto mobile: stats numa linha só */}
        <div className="sm:hidden flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            <strong className="text-foreground font-mono">{stats.participantsCount}</strong> jogadores
          </span>
          <span>
            <strong className="text-foreground font-mono">{stats.betsCount.toLocaleString("pt-BR")}</strong> palpites
          </span>
          <span>
            <strong className="text-foreground font-mono">{upcoming.length}</strong> próximos
          </span>
        </div>

        {/* Aviso PRO se a competição selecionada precisa assinatura */}
        {isProOnly && (
          <Card className="bg-amber-50/40 dark:bg-amber-950/20 border-amber-400/30">
            <CardContent className="p-3 text-xs flex items-start gap-2">
              <Lock className="size-3.5 mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-foreground">⭐ Competição PRO em breve</p>
                <p className="text-muted-foreground mt-0.5">
                  Apostas em {selectedCompetition.name} vão liberar com a assinatura PRO.
                  Por enquanto você pode explorar os jogos sincronizados.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue={initialTab} className="w-full">
          {/* Mobile: barra rolável (grid fixo estourava com 6 tabs). Desktop: grid. */}
          <TabsList
            className={`flex w-full justify-start overflow-x-auto no-scrollbar sm:grid ${hasGroupsAndKnockout ? "sm:grid-cols-6" : "sm:grid-cols-5"}`}
          >
            <TabsTrigger value="upcoming" className="shrink-0 text-[11px] sm:text-xs">
              Próximos
              <span className="font-mono text-muted-foreground ml-1 text-[10px]">{upcoming.length}</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="shrink-0 gap-1 text-[11px] sm:text-xs">
              <Flame className="size-3 text-rose-500" />
              <span className="font-mono text-muted-foreground text-[10px]">{live.length}</span>
            </TabsTrigger>
            <TabsTrigger value="finished" className="shrink-0 text-[11px] sm:text-xs">
              Encerr.
              <span className="font-mono text-muted-foreground ml-1 text-[10px]">{finished.length}</span>
            </TabsTrigger>
            <TabsTrigger value="standings" className="shrink-0 text-[11px] sm:text-xs">
              {hasGroupsAndKnockout ? "Grupos" : "Tabela"}
            </TabsTrigger>
            {hasGroupsAndKnockout && (
              <TabsTrigger value="bracket" className="shrink-0 gap-1 text-[11px] sm:text-xs">
                <GitBranch className="size-3" />
                Mata-mata
              </TabsTrigger>
            )}
            <TabsTrigger value="leagues" className="shrink-0 gap-1 text-[11px] sm:text-xs">
              <Users className="size-3" />
              Ligas
              <span className="font-mono text-muted-foreground text-[10px]">{focusedLeagues.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3">
            {groupedUpcoming.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum jogo agendado.</CardContent></Card>
            ) : (
              groupedUpcoming.map((g) => (
                <div key={g.label} className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center justify-between">
                    <span>{g.label}</span>
                    <span className="font-mono">{g.items.length} {g.items.length === 1 ? "jogo" : "jogos"}</span>
                  </div>
                  <div className="space-y-2">
                    {g.items.map((m) => <MatchCardQuickBet
                      key={m.id}
                      match={m}
                      balance={profile?.balance ?? 0} authed={!!profile}
                      homeMeta={metaFor(m.home.name, localizeTeamName(m.home.name))}
                      awayMeta={metaFor(m.away.name, localizeTeamName(m.away.name))}
                      preferFlag={hasGroupsAndKnockout}
                    />)}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="live" className="space-y-2">
            {live.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum jogo ao vivo agora.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {live.map((m) => <MatchCardQuickBet
                      key={m.id}
                      match={m}
                      balance={profile?.balance ?? 0} authed={!!profile}
                      homeMeta={metaFor(m.home.name, localizeTeamName(m.home.name))}
                      awayMeta={metaFor(m.away.name, localizeTeamName(m.away.name))}
                      preferFlag={hasGroupsAndKnockout}
                    />)}
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center px-2 pt-1">
              <Flame className="size-3 inline -mt-0.5 mr-1 text-rose-500" />
              Apostas fecham no kickoff — jogos ao vivo são só pra acompanhar.
            </p>
          </TabsContent>

          <TabsContent value="finished" className="space-y-3">
            {groupedFinished.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum jogo encerrado.</CardContent></Card>
            ) : (
              groupedFinished.map((g) => (
                <div key={g.label + g.date.toISOString()} className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center justify-between">
                    <span>{g.label}</span>
                    <span className="font-mono">{g.items.length} {g.items.length === 1 ? "jogo" : "jogos"}</span>
                  </div>
                  <div className="space-y-2">
                    {g.items.map((m) => <MatchCardQuickBet
                      key={m.id}
                      match={m}
                      balance={profile?.balance ?? 0} authed={!!profile}
                      homeMeta={metaFor(m.home.name, localizeTeamName(m.home.name))}
                      awayMeta={metaFor(m.away.name, localizeTeamName(m.away.name))}
                      preferFlag={hasGroupsAndKnockout}
                    />)}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="standings" className="space-y-3">
            {!hasGroupsAndKnockout && (
              <>
                <StandingsTable
                  label="Classificação"
                  rows={tableStandings}
                  qualifyTop={4}
                  preferFlag={hasGroupsAndKnockout}
                />
                {tableStandings.length > 0 && tableStandings.every((r) => r.played === 0) && (
                  <p className="text-[11px] text-muted-foreground px-1 flex items-center gap-1.5">
                    <Sparkles className="size-3" />
                    Tabela vai ganhar vida quando os jogos forem encerrando.
                  </p>
                )}
                {tableStandings.length === 0 && (
                  <Card className="bg-muted/40 border-dashed">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      Sem times confirmados ainda.
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            {hasGroupsAndKnockout && (
              <>
            <div className="text-xs text-muted-foreground px-1 flex items-start gap-1.5">
              <CheckCircle2 className="size-3.5 mt-0.5 text-emerald-500 shrink-0" />
              <span>
                <strong className="text-foreground">Top 2 de cada grupo</strong> classifica direto.
                Os <strong className="text-foreground">8 melhores terceiros</strong> também avançam.
              </span>
            </div>
            {standings.length === 0 ? (
              <Card className="bg-muted/40 border-dashed">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Standings serão renderizados quando os jogos de fase de grupos forem sincronizados.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {standings.map((g) => (
                  <Card key={g.group}>
                    <CardContent className="p-0">
                      <div className="px-3 py-2 bg-muted/40 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                        <span>Grupo {g.group}</span>
                        <span className="text-[10px] text-muted-foreground font-normal normal-case">
                          {g.teams.reduce((acc, t) => acc + t.gp, 0)} jogos disputados
                        </span>
                      </div>
                      <div className="text-[11px]">
                        <div className="grid grid-cols-[20px_1fr_24px_24px_24px_24px_28px_28px] gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase text-muted-foreground tracking-wider border-b">
                          <span></span>
                          <span>Time</span>
                          <span className="text-center">J</span>
                          <span className="text-center">V</span>
                          <span className="text-center">E</span>
                          <span className="text-center">D</span>
                          <span className="text-center">SG</span>
                          <span className="text-center">PTS</span>
                        </div>
                        {g.teams.map((t) => {
                          const isAdvancing = t.position <= 2
                          return (
                            <div
                              key={t.name}
                              className={`grid grid-cols-[20px_1fr_24px_24px_24px_24px_28px_28px] gap-1 px-2.5 py-1.5 items-center border-l-2 ${
                                isAdvancing ? "border-l-primary bg-primary/[0.03]" : "border-l-transparent"
                              }`}
                            >
                              <span className="font-mono text-[10px] font-bold text-muted-foreground">
                                {t.position}°
                              </span>
                              <span className="flex items-center gap-1.5 min-w-0">
                                <Flag name={t.name} iso={t.iso} size={14} />
                                <span className="truncate text-xs">{localizeTeamName(t.name)}</span>
                              </span>
                              <span className="text-center font-mono">{t.gp}</span>
                              <span className="text-center font-mono">{t.w}</span>
                              <span className="text-center font-mono">{t.d}</span>
                              <span className="text-center font-mono">{t.l}</span>
                              <span className={`text-center font-mono ${t.gd > 0 ? "text-emerald-600" : t.gd < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                {t.gd > 0 ? "+" : ""}{t.gd}
                              </span>
                              <span className="text-center font-mono font-bold">{t.pts}</span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
              </>
            )}
          </TabsContent>

          <TabsContent value="bracket" className="space-y-3">
            <div className="space-y-1">
              <h2 className="font-bold text-sm flex items-center gap-1.5">
                <GitBranch className="size-4 text-primary" />
                Chaveamento da fase eliminatória
              </h2>
              <p className="text-xs text-muted-foreground">
                32 jogos no mata-mata. Conforme cada fase termina, a próxima preenche.
              </p>
            </div>
            {knockoutByStage.map((stage) => (
              <div key={stage.code} className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">{stage.code}</Badge>
                    {stage.label}
                  </span>
                  <span className="font-mono normal-case">
                    {stage.matches.length}/{stage.expected} {stage.expected === 1 ? "jogo" : "jogos"} · {stage.dates}
                  </span>
                </div>
                {stage.matches.length > 0 ? (
                  <div className="space-y-2">
                    {stage.matches.map((m) => m.teamsConfirmed === false ? (
                      <KnockoutPendingCard key={m.id} match={m} />
                    ) : (
                      <MatchCardQuickBet
                        key={m.id}
                        match={m}
                        balance={profile?.balance ?? 0} authed={!!profile}
                        homeMeta={metaFor(m.home.name, localizeTeamName(m.home.name))}
                        awayMeta={metaFor(m.away.name, localizeTeamName(m.away.name))}
                        preferFlag={hasGroupsAndKnockout}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="py-3 text-center text-xs text-muted-foreground">
                      Aguardando definição
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
            {!hasAnyKnockout && (
              <p className="text-[11px] text-muted-foreground text-center px-2 flex items-center justify-center gap-1.5 pt-2">
                <Crown className="size-3 text-amber-500" />
                Bracket vai ganhar vida quando a fase de grupos terminar.
              </p>
            )}
          </TabsContent>

          {/* LIGAS focadas nessa competição */}
          <TabsContent value="leagues" className="space-y-3">
            <div className="space-y-1 px-1">
              <h2 className="font-bold text-sm">Bolões focados em {selectedCompetition.name}</h2>
              <p className="text-xs text-muted-foreground">
                Ligas (de bolão) criadas pra acompanhar essa competição. Solicite entrada ou crie a sua.
              </p>
            </div>
            <CompetitionLeaguesList initial={focusedLeagues} competitionName={selectedCompetition.name} />
            {!isProOnly && (
              <Card className="bg-primary/[0.03] border-primary/20 mt-4">
                <CardContent className="p-4 text-center space-y-2">
                  <Sparkles className="size-5 text-primary mx-auto" />
                  <div className="font-bold text-sm">Quer começar uma do zero?</div>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Cria liga focada em {selectedCompetition.name} e chama a galera.
                  </p>
                  <Button size="sm" className="gap-1.5 mt-1" asChild>
                    <Link href={`/ligas/criar?competition=${selectedCompetition.slug}`}>
                      Criar minha liga
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
