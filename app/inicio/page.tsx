import Link from "next/link"
import { Flame, Target, Users, Sparkles, Gift, Plus, KeyRound, AlertCircle, Share2, Compass, Trophy, Crown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/layout/AppShell"
import { TodayGamesCarousel } from "@/components/dashboard/TodayGamesCarousel"
import { OpenBetsList } from "@/components/dashboard/OpenBetsList"
import { MyLeaguesList } from "@/components/dashboard/MyLeaguesList"
import { MatchCardQuickBet } from "@/components/games/MatchCardQuickBet"
import { DailyPollCard, type PollCandidateView } from "@/components/dashboard/DailyPollCard"
import {
  getCurrentProfile, getAllMatches, getAllCompetitions,
  getMyLeagues, getMyOpenBets, isDemoMode, getUnreadNotificationsCount, getActivePoll,
} from "@/lib/data"
import { formatCountdown, isSameDay } from "@/lib/format"
import { redirect } from "next/navigation"

export default async function InicioPage() {
  const profile = await getCurrentProfile()

  // App público (vitrine): visitante anônimo navega. Só o onboarding do 1º
  // acesso de quem ESTÁ logado ainda redireciona.
  if (profile && !isDemoMode() && !profile.onboardedAt) redirect("/onboarding")

  const [allMatches, competitions, myLeagues, openBets, unreadCount, activePoll] = await Promise.all([
    getAllMatches(),
    getAllCompetitions(),
    getMyLeagues(),
    getMyOpenBets(),
    getUnreadNotificationsCount(),
    getActivePoll(),
  ])

  // Enquete "jogo do dia x2": enriquece os candidatos (match_id) com os Match
  // já carregados pra reusar bandeira/nome localizado. Só mostra com ≥2 candidatos.
  const matchById = new Map(allMatches.map((m) => [m.id, m]))
  const pollCandidates: PollCandidateView[] = activePoll
    ? activePoll.candidates
        .map((c) => {
          const match = matchById.get(c.matchId)
          return match ? { match, votes: c.votes } : null
        })
        .filter((x): x is PollCandidateView => x !== null)
    : []
  const showPoll = activePoll && pollCandidates.length >= 2

  // Copa em destaque; demais competições ativas viram seção "Outros campeonatos"
  const copa = competitions.find((c) => c.slug === "copa-do-mundo-2026")
  const now = new Date()

  const isCopaMatch = (competitionId: string) => !copa || competitionId === copa.id
  const upcoming = allMatches
    .filter((m) => m.status === "scheduled" && m.startsAt.getTime() > now.getTime())
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())

  const copaToday = allMatches
    .filter((m) => isCopaMatch(m.competitionId) && isSameDay(m.startsAt, now))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
  // Jogos de hoje ficam só na seção "Hoje na Copa" — sem duplicar em "Próximos"
  const copaUpcoming = upcoming
    .filter((m) => isCopaMatch(m.competitionId) && !isSameDay(m.startsAt, now))
    .slice(0, 3)

  // Outros campeonatos: só jogos na próxima semana (evita mostrar rodada distante)
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const otherCompsUpcoming = competitions
    .filter((c) => c.isActiveForBetting && copa && c.id !== copa.id)
    .map((c) => ({
      comp: c,
      matches: upcoming
        .filter((m) => m.competitionId === c.id && m.startsAt <= sevenDaysOut)
        .slice(0, 2),
    }))
    .filter((entry) => entry.matches.length > 0)

  const nextMatchCountdown = copaUpcoming[0]
    ? formatCountdown(copaUpcoming[0].startsAt)
    : null
  const todayPlayable = copaToday.filter((m) => m.status === "scheduled").length

  // Filtra apostas em aberto pra mostrar só as de hoje/amanhã no dashboard.
  // Resto fica em /apostas (link "ver todas").
  const endOfTomorrow = new Date()
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1)
  endOfTomorrow.setHours(23, 59, 59, 999)
  const nearTermBets = openBets.filter((b) => b.kickoff <= endOfTomorrow)
  const futureBetsCount = openBets.length - nearTermBets.length

  return (
    <AppShell authed={!!profile} balance={profile?.balance} nickname={profile?.nickname} avatarUrl={profile?.avatarUrl} unreadNotifications={unreadCount}>
      {isDemoMode() && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
          <span>
            <strong>Modo demo:</strong> dados mockados.
            Configure <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded font-mono">.env.local</code>{" "}
            com chaves do Supabase pra usar dados reais.
          </span>
        </div>
      )}

      <div className="space-y-6 animate-in fade-in duration-300">
        {/* GREETING (logado) / BOAS-VINDAS (anônimo) */}
        {profile ? (
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight">
              Oi, {profile.fullName?.split(" ")[0] || profile.nickname} 👋
            </h1>
            {nextMatchCountdown && (
              <p className="text-sm text-muted-foreground">
                {todayPlayable > 0 && <><strong className="text-foreground">{todayPlayable} jogos</strong> pra você palpitar hoje · </>}
                próximo apito em <strong className="text-foreground">{nextMatchCountdown}</strong>
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-background to-amber-50/30 dark:to-amber-950/20 p-4 space-y-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight">Bem-vindo ao SuperChamps ⚡</h1>
            <p className="text-sm text-muted-foreground">
              Bolão da Copa 2026 sem dinheiro real — só palpite, ranking e zoeira. Explore os jogos e as ligas à vontade; crie sua conta pra palpitar (ganha <strong className="text-foreground">1.000 pts</strong> de largada).
            </p>
            <div className="flex gap-2 pt-0.5">
              <Button size="sm" asChild><Link href="/cadastro">Criar conta grátis</Link></Button>
              <Button size="sm" variant="outline" asChild><Link href="/login">Entrar</Link></Button>
            </div>
          </div>
        )}

        {/* 0. ENQUETE JOGO DO DIA x2 — faixa colável/dispensável, auto-contida (só logado: votar exige conta) */}
        {showPoll && profile && (
          <DailyPollCard
            pollId={activePoll!.id}
            multiplier={activePoll!.multiplier}
            closesAt={activePoll!.closesAt.toISOString()}
            gameDate={activePoll!.gameDate}
            myVoteMatchId={activePoll!.myVoteMatchId}
            candidates={pollCandidates}
          />
        )}

        {/* 1. HOJE NA COPA (destaque) */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-sm uppercase tracking-wider flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Flame className="size-3.5 text-rose-500" />
              Hoje na Copa
            </h2>
            <Link href="/jogos" className="text-xs text-primary hover:underline font-medium">
              Calendário completo
            </Link>
          </div>
          <TodayGamesCarousel matches={copaToday} />
        </section>

        {/* 2. PRÓXIMOS NA COPA */}
        {copaUpcoming.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Trophy className="size-3.5 text-amber-500" />
                Próximos na Copa
              </h2>
              <Link href="/jogos" className="text-xs text-primary hover:underline font-medium">
                Calendário completo
              </Link>
            </div>
            <div className="space-y-2">
              {copaUpcoming.map((g) => (
                <MatchCardQuickBet key={g.id} match={g} balance={profile?.balance ?? 0} authed={!!profile} />
              ))}
            </div>
          </section>
        )}

        {/* 3. OUTROS CAMPEONATOS (só próximos) */}
        {otherCompsUpcoming.length > 0 && (
          <section className="space-y-2.5">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
              <Compass className="size-3.5" />
              Outros campeonatos
            </h2>
            <div className="space-y-4">
              {otherCompsUpcoming.map(({ comp, matches }) => (
                <div key={comp.id} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <span className="text-sm leading-none">{comp.icon || "⚽"}</span>
                      {comp.name}
                    </span>
                    <Link
                      href={`/jogos?comp=${comp.slug}`}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Ver todos
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {matches.map((g) => (
                      <MatchCardQuickBet key={g.id} match={g} balance={profile?.balance ?? 0} authed={!!profile} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. APOSTAS EM ABERTO (só hoje/amanhã — resto vai pra /apostas) */}
        {openBets.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Target className="size-3.5" />
                {nearTermBets.length > 0 ? "Apostas pra hoje e amanhã" : "Suas apostas em aberto"}
              </h2>
              <Badge variant="outline" className="text-xs h-5 px-2">
                {nearTermBets.length > 0 ? `${nearTermBets.length}/${openBets.length}` : openBets.length}
              </Badge>
            </div>
            {nearTermBets.length > 0 ? (
              <OpenBetsList bets={nearTermBets} />
            ) : (
              <Card>
                <CardContent className="py-5 text-center text-sm text-muted-foreground space-y-1.5">
                  <p>
                    Nenhuma aposta pra hoje ou amanhã. Você tem{" "}
                    <strong className="text-foreground font-semibold">{openBets.length}</strong>{" "}
                    em jogos futuros.
                  </p>
                </CardContent>
              </Card>
            )}
            {futureBetsCount > 0 && nearTermBets.length > 0 && (
              <Link
                href="/apostas"
                className="block text-center text-xs text-primary hover:underline font-medium pt-1"
              >
                +{futureBetsCount} {futureBetsCount === 1 ? "aposta" : "apostas"} em jogos futuros · Ver todas
              </Link>
            )}
            {nearTermBets.length === 0 && (
              <Link
                href="/apostas"
                className="block text-center text-xs text-primary hover:underline font-medium pt-1"
              >
                Ver todas em /apostas
              </Link>
            )}
          </section>
        )}

        {/* SEÇÕES PESSOAIS (só logado) — ligas, atalhos, referral */}
        {profile && (
        <>
        {/* 4. MINHAS LIGAS */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3.5" />
              Suas ligas
            </h2>
            <Badge variant="outline" className="text-xs h-5 px-2">
              {myLeagues.length}/10
            </Badge>
          </div>
          <MyLeaguesList leagues={myLeagues} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href="/ligas/criar">
                <Plus className="size-3.5" />
                Criar liga
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href="/ligas/entrar">
                <KeyRound className="size-3.5" />
                Entrar com código
              </Link>
            </Button>
          </div>
        </section>

        {/* ATALHOS */}
        <section className="space-y-2.5">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            Atalhos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Tô com uma liga no SuperChamps pra Copa 2026, vai entrar?\n\n` +
                `Palpita nos jogos, compete comigo, sem grana de verdade — só ranking e zoeira.\n\n` +
                `Entra com meu código *${profile.referralCode}*:\n` +
                `https://superchamps.com.br/cadastro?ref=${profile.referralCode}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50/80 to-background dark:from-emerald-950/30 dark:border-emerald-900/50 hover:shadow-md transition-all active:scale-[0.99]">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 grid place-items-center shrink-0">
                    <Gift className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      Chama a galera pelo zap
                      <Share2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cada amigo que entrar vale +50 pts pra você · até 5 · código{" "}
                      <code className="font-mono text-foreground">{profile.referralCode}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
            <Card className="border-amber-300/60 bg-gradient-to-br from-amber-50/80 to-background dark:from-amber-950/30 dark:border-amber-900/50">
              <CardContent className="p-3.5 flex items-center gap-3">
                <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 grid place-items-center shrink-0">
                  <Crown className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    SuperChamps PRO
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-400">em breve</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Copa do Mundo e Brasileirão Série A são <strong className="text-foreground">grátis</strong>.
                    Seja PRO pra jogar Premier League, La Liga e outras competições.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        </>
        )}

        {/* EMAIL VERIFICATION REMINDER */}
        {profile && !profile.emailVerifiedAt && !isDemoMode() && (
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50">
            <CardContent className="p-4 text-sm">
              <strong className="text-amber-900 dark:text-amber-200">E-mail não confirmado.</strong>{" "}
              <span className="text-amber-700 dark:text-amber-300">
                Cheque sua caixa de entrada — necessário antes da 1ª aposta.
              </span>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
