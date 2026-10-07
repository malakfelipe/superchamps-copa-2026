import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ChevronLeft, BadgeCheck, Crown, CheckCircle2, XCircle, RotateCcw,
  Target, TrendingDown, Trophy, Coins, Percent, Award, Eye, Sparkles, Lock, Globe, Clock, Pencil, Gift,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Flag } from "@/components/Flag"
import { AppShell } from "@/components/layout/AppShell"
import { ShareProfileButton } from "./ShareProfileButton"
import {
  getCurrentProfile, getProfileByNickname, getFinishedBetsByUserId,
} from "@/lib/data"
import { formatLongDate, formatRelative, formatPts } from "@/lib/format"
import { localizeTeamName } from "@/lib/teams"
import type { PublicFinishedBet } from "@/lib/data/types"

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("")
}

const KNOCKOUT_LABEL: Record<string, string> = {
  round_of_32: "16-avos", round_of_16: "Oitavas", quarter: "Quartas",
  semi: "Semifinal", third: "3º lugar", final: "Final",
}
function stageLabel(s?: string): string {
  if (!s) return ""
  if (s.startsWith("group")) return "Fase de grupos"
  return KNOCKOUT_LABEL[s] ?? s
}

const STATUS_META = {
  won: { Icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-950/40", border: "border-l-emerald-500", label: "Acertou" },
  lost: { Icon: XCircle, color: "text-destructive", bg: "bg-rose-100 dark:bg-rose-950/40", border: "border-l-rose-400", label: "Errou" },
  refunded: { Icon: RotateCcw, color: "text-blue-600 dark:text-blue-500", bg: "bg-blue-100 dark:bg-blue-950/40", border: "border-l-blue-400", label: "Reembolso" },
  cancelled: { Icon: RotateCcw, color: "text-muted-foreground", bg: "bg-muted", border: "border-l-slate-400", label: "Cancelou" },
} as const

export default async function PublicProfilePage({ params }: { params: Promise<{ nickname: string }> }) {
  const me = await getCurrentProfile()  // null = visitante anônimo (perfil é público)

  const { nickname } = await params
  const profile = await getProfileByNickname(nickname)
  if (!profile) notFound()

  // Flag: este é o próprio usuário? (anônimo nunca é dono)
  const isOwnProfile = profile.id === me?.id

  // Verifica privacidade
  if (!profile.betsPubliclyVisible && !isOwnProfile) {
    return (
      <AppShell authed={!!me} balance={me?.balance} nickname={me?.nickname} avatarUrl={me?.avatarUrl}>
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <div className="size-12 rounded-full bg-muted grid place-items-center mx-auto">
              <Lock className="size-5 text-muted-foreground" />
            </div>
            <h1 className="font-bold text-xl">Perfil privado</h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {profile.nickname} optou por ocultar o histórico de apostas.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/ligas">Voltar</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  const finishedBets = await getFinishedBetsByUserId(profile.id)

  // Maior vitória (won c/ maior lucro líquido) e pior derrota (lost c/ maior stake)
  const wins = finishedBets.filter((b) => b.status === "won")
  const biggestWin = wins.length
    ? wins.reduce((a, b) => (b.payout - b.stake > a.payout - a.stake ? b : a))
    : null
  const losses = finishedBets.filter((b) => b.status === "lost")
  const worstLoss = losses.length ? losses.reduce((a, b) => (b.stake > a.stake ? b : a)) : null

  // Stats defensivos (lidar com zeros e nulls)
  const winRate = profile.copaStats.bets > 0
    ? Math.round((profile.copaStats.won / profile.copaStats.bets) * 100)
    : 0
  const matchesBetPct = profile.copaStats.matchesAvailable > 0
    ? Math.round((profile.copaStats.matchesBetIn / profile.copaStats.matchesAvailable) * 100)
    : 0
  const hasStats = profile.copaStats.bets > 0
  const memberSince = profile.onboardedAt
  const competitionsLabel = profile.competitionsPlayed === 1 ? "competição" : "competições"
  const privateLeagues = profile.privateLeaguesCount ?? Math.max(0, profile.ligasJoined - 1)
  const globalStats = profile.globalLeagueStats
  const liquido = globalStats?.netPoints ?? profile.copaStats.netPoints
  const liquidoRank = globalStats?.rank ?? null

  return (
    <AppShell authed={!!me} balance={me?.balance} nickname={me?.nickname} avatarUrl={me?.avatarUrl}>
      <div className="space-y-5">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link href={isOwnProfile ? "/perfil" : "/ligas"}>
            <ChevronLeft className="size-4 mr-1" />
            Voltar
          </Link>
        </Button>

        {/* Banner: este é o próprio perfil público */}
        {isOwnProfile && (
          <Card className="bg-primary/[0.04] border-primary/30">
            <CardContent className="p-3 flex items-center gap-2.5">
              <Eye className="size-4 text-primary shrink-0" />
              <div className="flex-1 text-xs">
                <strong className="text-foreground">Este é o seu perfil público.</strong>{" "}
                Assim que outros usuários te veem.
              </div>
              <Button size="sm" variant="ghost" className="gap-1.5 shrink-0" asChild>
                <Link href="/perfil/editar">
                  <Pencil className="size-3.5" />
                  Editar
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* HERO */}
        <Card className="overflow-hidden border-2">
          <div className="bg-gradient-to-br from-primary/15 via-amber-100/20 to-rose-100/20 dark:from-primary/25 dark:via-amber-950/30 dark:to-rose-950/20 px-5 py-5">
            <div className="flex items-start gap-4">
              <Avatar className="size-20 ring-4 ring-background shadow-md">
                <AvatarFallback className="bg-primary/10 text-primary font-extrabold text-2xl">
                  {initials(profile.fullName || profile.nickname)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <h1 className="font-extrabold text-xl truncate">{profile.nickname}</h1>
                  {profile.emailVerifiedAt && (
                    <BadgeCheck className="size-4 text-primary shrink-0" aria-label="Verificado" />
                  )}
                  {profile.isOwnerOf > 0 && (
                    <Badge variant="outline" className="gap-1 text-[10px] h-5 border-amber-400/50 text-amber-700 dark:text-amber-400 px-1.5">
                      <Crown className="size-2.5 fill-amber-500" />
                      Owner em {profile.isOwnerOf}
                    </Badge>
                  )}
                </div>
                {(profile.fullName || profile.countryName) && (
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                    {profile.countryName && <Flag name={profile.countryName} size={14} />}
                    {profile.fullName || profile.countryName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {memberSince && <>Membro desde {formatLongDate(memberSince)} · </>}
                  {privateLeagues} {privateLeagues === 1 ? "liga privada" : "ligas privadas"}
                  {profile.competitionsPlayed > 0 && (
                    <> · {profile.competitionsPlayed} {competitionsLabel} jogadas</>
                  )}
                </p>
                {profile.lastSignedInAt && (
                  <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    Último acesso {formatRelative(profile.lastSignedInAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Compartilhar — só faz sentido pro próprio perfil */}
            {isOwnProfile && (
              <div className="flex flex-wrap gap-2 mt-4">
                <ShareProfileButton nickname={profile.nickname} />
              </div>
            )}
          </div>
        </Card>

        {/* STATS NA LIGA GLOBAL */}
        {globalStats && globalStats.total > 0 && (
          <Card className="bg-gradient-to-r from-primary/10 via-background to-background border-primary/20">
            <CardContent className="p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-9 rounded-lg bg-primary/15 grid place-items-center shrink-0">
                    <Globe className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-tight">Liga Global</div>
                    <div className="text-[11px] text-muted-foreground">Onde toda a comunidade compete</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Posição</div>
                  <div className="font-mono font-extrabold text-2xl text-primary leading-none">
                    #{globalStats.rank}
                    <span className="text-sm text-muted-foreground font-normal">/{globalStats.total}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-primary/10">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Saldo na liga</div>
                  <div className={`font-mono font-bold ${globalStats.netPoints >= 0 ? "text-primary" : "text-destructive"}`}>
                    {globalStats.netPoints >= 0 ? "+" : ""}{globalStats.netPoints} pts
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Acertos</div>
                  <div className="font-mono font-bold">
                    {globalStats.betsWon}/{globalStats.betsTotal}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* HISTÓRICO — blocos condensados */}
        {hasStats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                Histórico no SuperChamps
              </h2>
              {profile.copaStats.matchesAvailable > 0 && (
                <Badge variant="outline" className="text-[10px] h-5">{matchesBetPct}% jogos apostados</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Índice de acertos */}
              <Card><CardContent className="p-3">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-0.5">
                  <Percent className="size-3" /> Índice de acertos
                </div>
                <div className="font-mono font-extrabold text-2xl text-emerald-600 leading-none">{winRate}%</div>
                <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                  <span className="text-emerald-600">{profile.copaStats.won}W</span>
                  {" · "}<span className="text-destructive">{profile.copaStats.lost}L</span>
                  {" · "}{profile.copaStats.refunded}R
                </div>
              </CardContent></Card>

              {/* Ganhos */}
              <Card><CardContent className="p-3">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-0.5">
                  <Coins className="size-3" /> Ganhos
                </div>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className={`font-mono font-extrabold text-xl leading-none ${liquido >= 0 ? "text-primary" : "text-destructive"}`} title={`${liquido.toLocaleString("pt-BR")} pts`}>
                    {liquido >= 0 ? "+" : ""}{formatPts(liquido)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">líquido{liquidoRank ? ` · #${liquidoRank}` : ""}</span>
                </div>
                <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                  <span className="font-mono font-bold text-sm" title={`${profile.balance.toLocaleString("pt-BR")} pts`}>{formatPts(profile.balance)}</span>
                  <span className="text-[10px] text-muted-foreground">
                    patrimônio{profile.balanceRank ? ` · #${profile.balanceRank}` : ""}
                  </span>
                </div>
              </CardContent></Card>
            </div>

            {/* Maior vitória / Pior derrota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <HighlightBet kind="win" bet={biggestWin} />
              <HighlightBet kind="loss" bet={worstLoss} />
            </div>
          </div>
        )}

        {!hasStats && (
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="p-6 text-center space-y-2">
              <div className="size-12 rounded-full bg-muted grid place-items-center mx-auto">
                <Target className="size-5 text-muted-foreground" />
              </div>
              <div className="font-semibold text-sm">Sem apostas finalizadas ainda</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {profile.nickname} ainda não tem histórico público de apostas.
              </p>
            </CardContent>
          </Card>
        )}

        {/* INDICAÇÕES — condensado */}
        {profile.referralStats && profile.referralStats.count > 0 && (
          <Card className="bg-gradient-to-r from-amber-50/60 via-background to-background dark:from-amber-950/20 border-amber-200/40 dark:border-amber-900/30">
            <CardContent className="px-3 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 text-xs">
                <Gift className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-semibold">Indicações</span>
                <span className="text-muted-foreground truncate">
                  {profile.referralStats.count} {profile.referralStats.count === 1 ? "amigo" : "amigos"} · {profile.referralStats.count}/5
                </span>
              </div>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                +{profile.referralStats.totalPoints}
              </span>
            </CardContent>
          </Card>
        )}

        {/* ALL-TIME (só mostra se tiver rank) */}
        {profile.allTimeRank > 0 && profile.allTimeNetPoints !== 0 && (
          <Card className="bg-gradient-to-r from-amber-50/40 via-background to-background dark:from-amber-950/20 border-amber-200/40 dark:border-amber-900/30">
            <CardContent className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 grid place-items-center shrink-0">
                  <Award className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm">Ranking all-time</div>
                  <div className="text-xs text-muted-foreground">
                    {profile.allTimeNetPoints > 0 ? "+" : ""}{formatPts(profile.allTimeNetPoints)} pts em {profile.competitionsPlayed} {competitionsLabel}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono font-extrabold text-2xl text-amber-600 dark:text-amber-400">
                  #{profile.allTimeRank}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TABS */}
        <Tabs defaultValue="bets" className="w-full">
          <TabsList className="grid grid-cols-1 w-full">
            <TabsTrigger value="bets" className="gap-1.5">
              <Eye className="size-3.5" />
              Histórico público de apostas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bets" className="space-y-2">
            {finishedBets.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                Sem apostas finalizadas ainda.
              </CardContent></Card>
            ) : (
              finishedBets.map((b) => <PublicBetCard key={b.id} bet={b} />)
            )}
          </TabsContent>
        </Tabs>

        {/* TRANSPARENCY NOTE */}
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-3.5 text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-2 mb-0.5">
              <Eye className="size-3.5 text-foreground" />
              <span className="font-semibold text-foreground">Transparência radical</span>
            </div>
            <p>
              No SuperChamps, todo histórico de apostas <strong className="text-foreground">finalizadas</strong> é público — você pode estudar como outros chegaram aos resultados deles.
            </p>
            <p>
              <Sparkles className="size-3 inline -mt-0.5 mr-0.5" />
              Apostas em aberto (antes do kickoff) ficam <strong className="text-foreground">privadas</strong> até a hora do jogo.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

// Maior vitória / Pior derrota — bloco condensado de destaque
function HighlightBet({ kind, bet }: { kind: "win" | "loss"; bet: PublicFinishedBet | null }) {
  const isWin = kind === "win"
  const HeaderIcon = isWin ? Trophy : TrendingDown
  const titulo = isWin ? "Maior vitória" : "Pior derrota"
  if (!bet) {
    return (
      <Card className="bg-muted/30 border-dashed"><CardContent className="p-3">
        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          <HeaderIcon className="size-3" /> {titulo}
        </div>
        <div className="text-xs text-muted-foreground mt-2">— ainda não tem</div>
      </CardContent></Card>
    )
  }
  const net = isWin ? bet.payout - bet.stake : -bet.stake
  const homePT = localizeTeamName(bet.homeName)
  const awayPT = localizeTeamName(bet.awayName)
  return (
    <Card className={`border-l-4 ${isWin ? "border-l-emerald-500" : "border-l-rose-400"}`}>
      <CardContent className="p-3 space-y-1">
        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          <HeaderIcon className={`size-3 ${isWin ? "text-emerald-600" : "text-destructive"}`} /> {titulo}
        </div>
        <div className={`font-mono font-extrabold text-xl leading-none ${isWin ? "text-emerald-600" : "text-destructive"}`}>
          {net >= 0 ? "+" : ""}{net} pts
        </div>
        <div className="text-[11px] text-muted-foreground font-mono">
          {bet.stake} pts · {bet.outcomeLabel} · odd {bet.oddAtPlacement.toFixed(2)}
        </div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1 min-w-0">
          {!bet.isClub && <><Flag name={bet.homeName} size={11} /><Flag name={bet.awayName} size={11} /></>}
          <span className="truncate">{homePT} × {awayPT}</span>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {stageLabel(bet.stage)} · {formatLongDate(bet.kickoff)}
        </div>
      </CardContent>
    </Card>
  )
}

function PublicBetCard({ bet }: { bet: PublicFinishedBet }) {
  const meta = STATUS_META[bet.status]
  const net = bet.status === "won" ? bet.payout - bet.stake
            : bet.status === "refunded" ? 0
            : -bet.stake
  const homePT = localizeTeamName(bet.homeName)
  const awayPT = localizeTeamName(bet.awayName)
  return (
    <Card className={`border-l-4 ${meta.border}`}>
      <CardContent className="px-3 py-2 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            {bet.isClub ? <span>⚽</span> : <><Flag name={bet.homeName} size={12} /><Flag name={bet.awayName} size={12} /></>}
            <span className="font-semibold truncate">{homePT} × {awayPT}</span>
          </div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
            {bet.outcomeLabel} · <span className="font-mono">{bet.stake}</span> pts · odd <span className="font-mono">{bet.oddAtPlacement.toFixed(2)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`font-mono font-bold text-sm ${net > 0 ? "text-emerald-600" : net < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {net > 0 ? "+" : ""}{net}
          </div>
          <div className="text-[10px] text-muted-foreground">{formatLongDate(bet.kickoff)}</div>
        </div>
      </CardContent>
    </Card>
  )
}
