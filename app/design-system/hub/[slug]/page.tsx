import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Sparkles, Plus, Trophy } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CompetitionsProvider } from "@/lib/competitions-context"
import { CompetitionHubHero } from "@/components/competitions/CompetitionHubHero"
import { MatchCard } from "@/components/competitions/MatchCard"
import { StandingsTable } from "@/components/competitions/StandingsTable"
import { KnockoutBracket } from "@/components/competitions/KnockoutBracket"
import { TopLeaguesGrid } from "@/components/competitions/TopLeaguesGrid"
import { ALL_MOCKS, type MockMatch } from "../mock-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const DAY_LABELS_PT: Record<number, string> = {
  0: "Domingo", 1: "Segunda", 2: "Terça", 3: "Quarta",
  4: "Quinta", 5: "Sexta", 6: "Sábado",
}

function dayLabel(date: Date, today: Date): string {
  const diffDays = Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return "Hoje"
  if (diffDays === 1) return "Amanhã"
  if (diffDays === -1) return "Ontem"
  return `${DAY_LABELS_PT[date.getDay()]} · ${date.getDate()}/${date.getMonth() + 1}`
}

function groupByDay(matches: MockMatch[]): Array<{ key: string; date: Date; matches: MockMatch[] }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const groups = new Map<string, { key: string; date: Date; matches: MockMatch[] }>()
  for (const m of matches) {
    const d = new Date(m.date)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)
    if (!groups.has(key)) groups.set(key, { key, date: d, matches: [] })
    groups.get(key)!.matches.push(m)
  }
  return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const mock = ALL_MOCKS[slug]
  if (!mock) notFound()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const matchGroups = groupByDay(mock.matches)

  return (
    <CompetitionsProvider>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link href="/design-system/hub">
            <ChevronLeft className="size-4 mr-1" />
            Voltar
          </Link>
        </Button>

        {/* HERO */}
        <CompetitionHubHero
          slug={mock.slug}
          name={mock.name}
          season={mock.season}
          description={mock.description}
          countryCode={mock.countryCode}
          icon={mock.icon}
          participantsCount={mock.totalParticipants}
          betsCount={mock.totalUserLeagues * 100}
          upcomingMatchesCount={mock.upcomingMatchesCount}
          isActive={mock.totalParticipants > 0}
        />

        {/* TABS */}
        <Tabs defaultValue="jogos" className="w-full">
          <TabsList
            className="w-full overflow-x-auto no-scrollbar justify-start sticky top-14 z-10 bg-background/95 backdrop-blur"
          >
            <TabsTrigger value="jogos">Jogos</TabsTrigger>
            <TabsTrigger value="classificacao">Classificação</TabsTrigger>
            {mock.hasKnockout && <TabsTrigger value="mata-mata">Mata-mata</TabsTrigger>}
            <TabsTrigger value="ligas">Ligas</TabsTrigger>
          </TabsList>

          {/* JOGOS */}
          <TabsContent value="jogos" className="space-y-5 pt-3">
            {matchGroups.length === 0 ? (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Sem jogos agendados ainda.
                </CardContent>
              </Card>
            ) : (
              matchGroups.map((g) => (
                <section key={g.key} className="space-y-2">
                  <h2 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground px-1 flex items-center gap-1.5">
                    {dayLabel(g.date, today)}
                    <span className="text-[10px] font-normal opacity-60">({g.matches.length})</span>
                  </h2>
                  <div className="space-y-2">
                    {g.matches.map((m) => (
                      <MatchCard
                        key={m.id}
                        home={m.home}
                        away={m.away}
                        date={m.date}
                        status={m.status}
                        liveMinute={m.liveMinute}
                        homeScore={m.homeScore}
                        awayScore={m.awayScore}
                        stageLabel={m.stageLabel}
                        venue={m.venue}
                        betsCount={m.betsCount}
                        popularPick={m.popularPick}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </TabsContent>

          {/* CLASSIFICAÇÃO */}
          <TabsContent value="classificacao" className="space-y-5 pt-3">
            {mock.standings.map((group, idx) => (
              <StandingsTable
                key={idx}
                label={group.label}
                rows={group.rows}
                qualifyTop={mock.hasKnockout ? 2 : 4}
              />
            ))}
          </TabsContent>

          {/* MATA-MATA */}
          {mock.hasKnockout && mock.bracket && (
            <TabsContent value="mata-mata" className="space-y-3 pt-3">
              <Card className="bg-amber-50/40 dark:bg-amber-950/20 border-amber-400/30">
                <CardContent className="p-3 text-xs flex items-start gap-2">
                  <Sparkles className="size-3.5 mt-0.5 shrink-0 text-amber-600" />
                  <p className="text-muted-foreground">
                    Mata-mata ainda aguardando definição da fase de grupos. Times vão aparecer
                    conforme cada grupo termina.
                  </p>
                </CardContent>
              </Card>
              <KnockoutBracket rounds={mock.bracket} />
            </TabsContent>
          )}

          {/* LIGAS */}
          <TabsContent value="ligas" className="space-y-3 pt-3">
            <div className="space-y-1 px-1">
              <h2 className="font-bold text-sm">Ligas mais populares</h2>
              <p className="text-xs text-muted-foreground">
                Bolões focados em {mock.name}. Solicite entrada ou crie a sua.
              </p>
            </div>
            <TopLeaguesGrid leagues={mock.topLeagues} competitionName={mock.name} />

            <Card className="bg-primary/[0.03] border-primary/20 mt-4">
              <CardContent className="p-4 text-center space-y-2">
                <Trophy className="size-5 text-primary mx-auto" />
                <div className="font-bold text-sm">Quer começar uma do zero?</div>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Cria uma liga focada em {mock.name} e chama a galera. Grátis e sem dinheiro real.
                </p>
                <Button size="sm" className="gap-1.5 mt-1">
                  <Plus className="size-3.5" />
                  Criar minha liga
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CompetitionsProvider>
  )
}
