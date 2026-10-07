import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ChevronLeft, Crown, Lock, Globe, Users, LogOut, TrendingUp, TrendingDown, Minus, Sparkles,
  EyeOff,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AppShell } from "@/components/layout/AppShell"
import { JsonLd } from "@/components/JsonLd"
import { LeagueInviteActions } from "./LeagueInviteActions"
import { MembersListWithSearch } from "./MembersListWithSearch"
import { PendingRequestsSection } from "./PendingRequestsSection"
import { PublicLeaguePreview } from "./PublicLeaguePreview"
import { RequestJoinButton } from "./RequestJoinButton"
import {
  getCurrentProfile, getLeagueBySlug, getLeagueMembers, getPendingJoinRequests,
  getPublicLeagueInfo, hasPendingJoinRequest,
} from "@/lib/data"
import { formatLongDate, formatPts } from "@/lib/format"
import type { LeagueMember } from "@/lib/data/types"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://superchamps.com.br"

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const info = await getPublicLeagueInfo(slug)
  if (!info) return { title: "Liga não encontrada" }

  const title = `${info.name} — Liga do bolão`
  const description = info.description
    ? `${info.description} — ${info.memberCount} membros competindo na Copa 2026 pelo SuperChamps.`
    : `Liga "${info.name}" com ${info.memberCount} membros no SuperChamps. Bolão da Copa do Mundo 2026 sem dinheiro real.`

  return {
    title,
    description,
    alternates: { canonical: `/ligas/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/ligas/${slug}`,
      type: "website",
      locale: "pt_BR",
    },
  }
}

function avatarColor(id: string): string {
  const palette = [
    "bg-emerald-100 text-emerald-700",
    "bg-blue-100 text-blue-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-purple-100 text-purple-700",
    "bg-cyan-100 text-cyan-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
    "bg-lime-100 text-lime-700",
    "bg-indigo-100 text-indigo-700",
  ]
  const idx = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length
  return palette[idx]
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("")
}

function TrendArrow({ trend }: { trend: number }) {
  if (trend === 0) return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground text-xs">
      <Minus className="size-3" /><span className="font-mono">—</span>
    </span>
  )
  if (trend > 0) return (
    <span className="inline-flex items-center gap-0.5 text-emerald-600 text-xs font-medium">
      <TrendingUp className="size-3" /><span className="font-mono">+{trend}</span>
    </span>
  )
  return (
    <span className="inline-flex items-center gap-0.5 text-destructive text-xs font-medium">
      <TrendingDown className="size-3" /><span className="font-mono">{trend}</span>
    </span>
  )
}

function buildBreadcrumbJsonLd(leagueName: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Ligas", item: `${SITE_URL}/ligas` },
      { "@type": "ListItem", position: 3, name: leagueName, item: `${SITE_URL}/ligas/${slug}` },
    ],
  }
}

export default async function LigaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const profile = await getCurrentProfile()

  // MODO 1 — Visitante não-logado: preview público
  if (!profile) {
    const publicInfo = await getPublicLeagueInfo(slug)
    if (!publicInfo) notFound()
    return (
      <>
        <JsonLd data={buildBreadcrumbJsonLd(publicInfo.name, slug)} />
        <PublicLeaguePreview league={publicInfo} />
      </>
    )
  }

  // Tenta ler a liga via RLS (só funciona se for owner ou member ativo)
  const league = await getLeagueBySlug(slug)

  // MODO 2 — Logado mas não-membro/não-owner: limited view + botão de solicitar
  if (!league) {
    const publicInfo = await getPublicLeagueInfo(slug)
    if (!publicInfo) notFound()
    const pending = await hasPendingJoinRequest(publicInfo.id)
    return (
      <AppShell balance={profile.balance} nickname={profile.nickname} avatarUrl={profile.avatarUrl}>
        <div className="space-y-5">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
            <Link href="/ligas">
              <ChevronLeft className="size-4 mr-1" />
              Voltar pras ligas
            </Link>
          </Button>

          <Card className="overflow-hidden border-2">
            <div className="bg-gradient-to-br from-primary/20 via-amber-100/30 to-rose-100/20 dark:from-primary/30 dark:via-amber-950/30 dark:to-rose-950/20 px-5 py-6">
              <div className="size-14 rounded-2xl bg-background/80 grid place-items-center shrink-0 shadow-sm mx-auto mb-3">
                <Users className="size-7 text-primary" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-center leading-tight">
                {publicInfo.name}
              </h1>
              <div className="text-xs text-muted-foreground text-center mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Crown className="size-3" />
                  {publicInfo.ownerNickname}
                </span>
                <span>·</span>
                <span>{publicInfo.memberCount} {publicInfo.memberCount === 1 ? "membro" : "membros"}</span>
                <span>·</span>
                <span>Desde {formatLongDate(publicInfo.createdAt)}</span>
              </div>
              {publicInfo.description && (
                <p className="text-sm text-foreground/80 mt-3 text-center leading-snug">
                  {publicInfo.description}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="text-center space-y-1">
                <h2 className="font-bold text-base">Quer entrar nessa liga?</h2>
                <p className="text-sm text-muted-foreground leading-snug">
                  {pending
                    ? "Você já tem uma solicitação pendente. O owner foi notificado — só esperar."
                    : "Mande sua solicitação. O owner decide se aceita."}
                </p>
              </div>
              <RequestJoinButton
                leagueId={publicInfo.id}
                leagueName={publicInfo.name}
                initialPending={pending}
              />
            </CardContent>
          </Card>

          {!publicInfo.membersVisible && (
            <Card className="bg-muted/40 border-dashed">
              <CardContent className="p-3 text-[11px] text-muted-foreground flex items-start gap-2">
                <EyeOff className="size-3.5 mt-0.5 shrink-0" />
                <p>
                  O owner escolheu manter a lista de membros privada. Você vai conhecer a galera depois que entrar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    )
  }

  // MODO 3 — Owner ou member: fluxo completo (abaixo)
  const isOwner = league.ownerId === profile.id
  const [members, pendingRequests] = await Promise.all([
    getLeagueMembers(league.id),
    isOwner ? getPendingJoinRequests(league.id) : Promise.resolve([]),
  ])
  const sorted = [...members].sort((a, b) => b.netPoints - a.netPoints || b.betsWon - a.betsWon)
  const me = sorted.find((m) => m.userId === profile.id)
  const myRank = sorted.findIndex((m) => m.userId === profile.id) + 1
  const owner = members.find((m) => m.role === "owner")
  const isGlobal = league.visibility === "global"

  // Estratégia de exibição do ranking pra ligas grandes:
  //   - Sempre mostra Top 20
  //   - Se o user estiver fora do Top 20, mostra janela de ±3 ao redor
  const TOP_LIMIT = 20
  const WINDOW = 3
  const top = sorted.slice(0, TOP_LIMIT)
  const userOutsideTop = myRank > TOP_LIMIT
  const windowStart = userOutsideTop ? Math.max(TOP_LIMIT, myRank - 1 - WINDOW) : 0
  const windowEnd = userOutsideTop ? Math.min(sorted.length, myRank + WINDOW) : 0
  const windowSlice = userOutsideTop ? sorted.slice(windowStart, windowEnd) : []
  const gapCount = userOutsideTop ? windowStart - TOP_LIMIT : 0

  return (
    <AppShell balance={profile.balance} nickname={profile.nickname} avatarUrl={profile.avatarUrl}>
      <div className="space-y-5">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link href="/ligas">
            <ChevronLeft className="size-4 mr-1" />
            Voltar pras ligas
          </Link>
        </Button>

        {/* HERO denso — identidade + "sua posição" num bloco só */}
        <Card className="overflow-hidden border-2">
          <div className={`px-3 py-2.5 ${
            isGlobal
              ? "bg-gradient-to-br from-primary/25 via-primary/10 to-background dark:from-primary/30 dark:via-primary/15"
              : "bg-gradient-to-br from-primary/20 via-amber-100/30 to-rose-100/20 dark:from-primary/30 dark:via-amber-950/30 dark:to-rose-950/20"
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-background/80 grid place-items-center shrink-0 shadow-sm">
                {isGlobal ? (
                  <Globe className="size-5 text-primary" />
                ) : league.emoji ? (
                  <span className="text-xl leading-none">{league.emoji}</span>
                ) : (
                  <Users className="size-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h1 className="font-extrabold text-base tracking-tight leading-tight truncate">{league.name}</h1>
                  {isGlobal ? (
                    <Badge variant="default" className="gap-1 text-[10px] h-4 px-1.5">
                      <Globe className="size-2.5" />
                      Global
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 text-[10px] h-4 px-1.5">
                      <Lock className="size-2.5" />
                      Privada
                    </Badge>
                  )}
                  {league.archivedAt && (
                    <Badge variant="outline" className="gap-1 text-[10px] h-4 px-1.5 bg-muted text-muted-foreground border-muted-foreground/30">
                      🏁 Temporada encerrada
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-1.5">
                  <span>{league.totalMembers} {league.totalMembers === 1 ? "membro" : "membros"}</span>
                  {league.competition && (
                    <>
                      <span>·</span>
                      <span>{league.competition.name}</span>
                    </>
                  )}
                  {!isGlobal && owner && (
                    <>
                      <span>·</span>
                      <span>owner <strong className="text-foreground">{owner.nickname}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SUA POSIÇÃO — colada no hero */}
          {me && (
            <CardContent className="px-3 py-2 border-t bg-primary/[0.03]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid place-items-center size-8 rounded-lg bg-primary text-primary-foreground font-extrabold text-sm shrink-0">
                    #{myRank}
                  </span>
                  <div className="min-w-0 text-[11px] text-muted-foreground leading-tight">
                    <div className="font-semibold text-foreground text-xs">
                      Sua posição · #{myRank} de {league.totalMembers}
                    </div>
                    {myRank === 1 ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        👑 Você está liderando!
                      </span>
                    ) : sorted[myRank - 2] ? (
                      <span className="truncate">
                        próximo: <strong className="text-foreground">{sorted[myRank - 2].nickname}</strong>
                        {" "}(+{sorted[myRank - 2].netPoints - me.netPoints} pts)
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className={`font-mono font-extrabold text-sm leading-none ${me.netPoints >= 0 ? "text-primary" : "text-destructive"}`}>
                      {me.netPoints >= 0 ? "+" : ""}{formatPts(me.netPoints)}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">saldo</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-sm leading-none">
                      {me.betsTotal > 0 ? `${Math.round((me.betsWon / me.betsTotal) * 100)}%` : "—"}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      acertos{me.betsTotal > 0 ? ` · ${me.betsWon}/${me.betsTotal}` : ""}
                    </div>
                  </div>
                  <TrendArrow trend={me.trend} />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* TABS */}
        <Tabs defaultValue="ranking" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="rules">Regras</TabsTrigger>
          </TabsList>

          {/* RANKING */}
          <TabsContent value="ranking" className="space-y-3">
            {/* TABELA — Top 20 (top 3 com medalha, sem pódio separado) */}
            {sorted.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    <div className="grid grid-cols-[36px_1fr_52px_64px] gap-2 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium bg-muted/30">
                      <div>#</div>
                      <div>
                        {sorted.length > TOP_LIMIT ? `Top ${TOP_LIMIT}` : "Apostador"}
                      </div>
                      <div className="text-right">Acertos</div>
                      <div className="text-right">Saldo</div>
                    </div>
                    {top.map((m, idx) => (
                      <RankingRow key={m.userId} m={m} place={idx + 1} isMe={m.userId === profile.id} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* JANELA AO REDOR DO USER (se ele está fora do Top 20) */}
            {userOutsideTop && me && (
              <>
                <div className="flex items-center gap-3 px-2">
                  <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                  <span className="text-[11px] text-muted-foreground font-mono italic">
                    +{gapCount} jogadores no meio
                  </span>
                  <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      <div className="grid grid-cols-[36px_1fr_52px_64px] gap-2 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium bg-muted/30">
                        <div>#</div>
                        <div>Você e a vizinhança</div>
                        <div className="text-right">Acertos</div>
                        <div className="text-right">Saldo</div>
                      </div>
                      {windowSlice.map((m, idx) => {
                        const place = windowStart + idx + 1
                        return <RankingRow key={m.userId} m={m} place={place} isMe={m.userId === profile.id} />
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <p className="text-xs text-muted-foreground px-1">
              <Sparkles className="size-3 inline mr-1 -mt-0.5" />
              Desempate por número de acertos, depois por data de entrada.
            </p>
          </TabsContent>

          {/* MEMBROS */}
          <TabsContent value="members">
            <MembersListWithSearch
              members={members}
              currentUserId={profile.id}
              isOwner={isOwner}
              leagueId={league.id}
            />
          </TabsContent>

          {/* RULES */}
          <TabsContent value="rules" className="space-y-2">
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-sm">Regras desta liga</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {league.description || "O owner ainda não definiu regras adicionais."}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/40 border-dashed">
              <CardContent className="p-4 text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground">Regras gerais do SuperChamps</p>
                <p>
                  • Ranking pelo <strong>saldo líquido de pontos ganhos</strong> dentro da liga.
                </p>
                <p>
                  • Desempate por <strong>maior número de acertos</strong>.
                </p>
                <p>
                  • Saldo reseta a 1.000 pts ao final de cada competição. Histórico fica no ranking all-time.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* PAINEL DO OWNER — só pra owner de liga privada (não-global). Fica no fim pra não competir com o conteúdo principal. */}
        {isOwner && !isGlobal && (
          <PendingRequestsSection
            leagueId={league.id}
            leagueName={league.name}
            membersVisible={league.membersVisible ?? true}
            requests={pendingRequests}
          />
        )}

        {/* FOOTER — convite + sair (só pra ligas privadas) */}
        {!isGlobal && (
          <div className="space-y-3 pt-2">
            <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="text-center space-y-1">
                  <div className="size-10 rounded-full bg-primary/10 grid place-items-center mx-auto">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div className="font-bold text-sm">Bora chamar mais gente</div>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    {league.totalMembers === 1
                      ? "Liga sem gente é igual churrasco sem cerveja. Manda o convite no zap aí."
                      : "Quanto mais palpite, melhor o ranking — e mais zoeira."}
                  </p>
                </div>
                <LeagueInviteActions
                  leagueName={league.name}
                  leagueSlug={league.slug}
                  inviteCode={league.inviteCode}
                />

              </CardContent>
            </Card>

            {league.ownerId !== profile.id && (
              <div className="text-center pt-2">
                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5">
                  <LogOut className="size-3.5" />
                  Sair desta liga
                </Button>
              </div>
            )}
          </div>
        )}

        {isGlobal && (
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="p-4 text-center text-xs text-muted-foreground">
              <Globe className="size-4 text-primary inline mr-1 -mt-0.5" />
              Você tá na <strong className="text-foreground">{league.name}</strong> desde o dia que se cadastrou.
              {league.competition ? (
                <> Aqui é onde toda a comunidade compete em <strong className="text-foreground">{league.competition.name}</strong>.</>
              ) : (
                <> Aqui é onde toda a comunidade compete.</>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

// Top 3 ganha medalha + tint na linha (substitui o antigo pódio)
const MEDAL: Record<number, { emoji: string; row: string }> = {
  1: { emoji: "🥇", row: "bg-amber-500/10" },
  2: { emoji: "🥈", row: "bg-slate-400/10" },
  3: { emoji: "🥉", row: "bg-orange-400/10" },
}

function RankingRow({ m, place, isMe }: { m: LeagueMember; place: number; isMe: boolean }) {
  const medal = MEDAL[place]
  return (
    <Link
      href={`/u/${m.nickname}`}
      className={`grid grid-cols-[36px_1fr_52px_64px] gap-2 px-2.5 py-1.5 items-center text-sm ${
        isMe ? "bg-primary/5 ring-1 ring-primary/30" : medal ? `${medal.row} hover:bg-muted/40` : "hover:bg-muted/40"
      } transition-colors`}
    >
      <div className={`font-mono font-bold text-xs ${isMe ? "text-primary" : "text-muted-foreground"}`}>
        {medal ? <span className="text-base leading-none">{medal.emoji}</span> : place}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <Avatar className="size-6 shrink-0">
          <AvatarFallback className={`${avatarColor(m.userId)} text-[10px] font-bold`}>
            {initials(m.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className={`text-xs ${isMe || medal ? "font-bold" : "font-medium"} truncate`}>
          {m.nickname}
          {isMe && <span className="text-muted-foreground font-normal text-[11px] ml-1">(você)</span>}
        </div>
      </div>
      <div className="text-right leading-tight">
        <div className="font-mono text-xs">{m.betsTotal > 0 ? `${Math.round((m.betsWon / m.betsTotal) * 100)}%` : "—"}</div>
        <div className="font-mono text-[9px] text-muted-foreground">{m.betsWon}/{m.betsTotal}</div>
      </div>
      <div className={`font-mono font-bold text-right text-xs ${m.netPoints >= 0 ? "" : "text-destructive"}`}>
        {m.netPoints >= 0 ? "+" : ""}{formatPts(m.netPoints)}
      </div>
    </Link>
  )
}
