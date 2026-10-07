import Link from "next/link"
import { redirect } from "next/navigation"
import {
  TrendingUp, TrendingDown, Target, ArrowDownRight, ArrowUpRight, Gift, Zap,
  RefreshCw, RotateCcw, Wrench, Sparkles, CheckCircle2, XCircle, Coins, Receipt,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Flag } from "@/components/Flag"
import { AppShell } from "@/components/layout/AppShell"
import { EmptyState } from "@/components/EmptyState"
import { OpenBetRowClient } from "./OpenBetRowClient"
import {
  getCurrentProfile, getMyAllBets, getMyTransactions,
} from "@/lib/data"
import { formatRelative, formatLongDate, formatPts } from "@/lib/format"
import { localizeTeamName } from "@/lib/teams"
import type { FinishedBet, WalletTransaction } from "@/lib/data/types"

const VALID_TABS = ["open", "finished", "wallet"] as const
type TabValue = typeof VALID_TABS[number]

const REASON_META: Record<WalletTransaction["reason"], { label: string; Icon: typeof Sparkles; bg: string; color: string }> = {
  signup_bonus: { label: "Cadastro", Icon: Sparkles, bg: "bg-violet-100 dark:bg-violet-950/50", color: "text-violet-600 dark:text-violet-400" },
  bet_placed: { label: "Aposta", Icon: ArrowDownRight, bg: "bg-slate-100 dark:bg-slate-800", color: "text-slate-600 dark:text-slate-400" },
  bet_won: { label: "Vitória", Icon: ArrowUpRight, bg: "bg-emerald-100 dark:bg-emerald-950/50", color: "text-emerald-600 dark:text-emerald-400" },
  bet_refunded: { label: "Reembolso", Icon: RotateCcw, bg: "bg-blue-100 dark:bg-blue-950/50", color: "text-blue-600 dark:text-blue-400" },
  referral_bonus: { label: "Indicação", Icon: Gift, bg: "bg-amber-100 dark:bg-amber-950/50", color: "text-amber-600 dark:text-amber-400" },
  low_balance_boost: { label: "Ajuda diária", Icon: Zap, bg: "bg-cyan-100 dark:bg-cyan-950/50", color: "text-cyan-600 dark:text-cyan-400" },
  competition_end_reset: { label: "Reset", Icon: RefreshCw, bg: "bg-rose-100 dark:bg-rose-950/50", color: "text-rose-600 dark:text-rose-400" },
  admin_adjust: { label: "Ajuste", Icon: Wrench, bg: "bg-purple-100 dark:bg-purple-950/50", color: "text-purple-600 dark:text-purple-400" },
}

export default async function ApostasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  const { tab: rawTab } = await searchParams
  const initialTab: TabValue = VALID_TABS.includes(rawTab as TabValue)
    ? (rawTab as TabValue)
    : "open"

  const [bets, txs] = await Promise.all([getMyAllBets(), getMyTransactions()])

  const totalStakes = bets.open.reduce((acc, b) => acc + b.stake, 0)
  const totalPotential = bets.open.reduce((acc, b) => acc + Math.floor(b.stake * b.oddNow), 0)
  const wonCount = bets.finished.filter((b) => b.status === "won").length
  const lostCount = bets.finished.filter((b) => b.status === "lost").length
  const finishedTotal = bets.finished.length
  const winRate = finishedTotal > 0 ? Math.round((wonCount / finishedTotal) * 100) : 0
  const totalNet = bets.finished.reduce((acc, b) => {
    if (b.status === "won") return acc + (b.payout - b.stake)
    if (b.status === "lost") return acc - b.stake
    return acc
  }, 0)

  return (
    <AppShell balance={profile.balance} nickname={profile.nickname} avatarUrl={profile.avatarUrl}>
      <div className="space-y-5 animate-in fade-in duration-300">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">Apostas</h1>
            <p className="text-sm text-muted-foreground">Histórico, em aberto e carteira.</p>
          </div>
          <Card className="bg-primary/[0.04] border-primary/20 shrink-0">
            <CardContent className="px-3.5 py-2 flex items-center gap-2">
              <div className="size-9 rounded-lg bg-primary/15 grid place-items-center">
                <Coins className="size-4 text-primary" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Saldo</div>
                <div className="font-mono font-extrabold text-lg text-primary leading-none" title={`${profile.balance.toLocaleString("pt-BR")} pts`}>
                  {formatPts(profile.balance)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Card><CardContent className="p-3 space-y-0.5">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Target className="size-3.5" />
              Em aberto
            </div>
            <div className="font-mono font-bold text-xl">{bets.open.length}</div>
            <div className="text-[11px] text-muted-foreground"><span className="font-mono">{totalStakes}</span> pts em jogo</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 space-y-0.5">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="size-3.5" />
              Líquido
            </div>
            <div className={`font-mono font-bold text-xl ${totalNet >= 0 ? "text-primary" : "text-destructive"}`}>
              {totalNet >= 0 ? "+" : ""}{totalNet}
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-3 space-y-0.5">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              Acertos
            </div>
            <div className="font-mono font-bold text-xl">{wonCount}/{finishedTotal}</div>
            <div className="text-[11px] text-muted-foreground">{winRate}%</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 space-y-0.5">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingDown className="size-3.5" />
              Potencial
            </div>
            <div className="font-mono font-bold text-xl text-primary">+{totalPotential}</div>
            <div className="text-[11px] text-muted-foreground">se acertar todas</div>
          </CardContent></Card>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="open">Em aberto <span className="font-mono ml-1 text-[10px]">{bets.open.length}</span></TabsTrigger>
            <TabsTrigger value="finished">Finalizadas <span className="font-mono ml-1 text-[10px]">{finishedTotal}</span></TabsTrigger>
            <TabsTrigger value="wallet">Carteira</TabsTrigger>
          </TabsList>

          <TabsContent value="open">
            {bets.open.length === 0 ? (
              <EmptyState
                Icon={Target}
                title="Nenhuma aposta em aberto"
                description="Tá esperando o quê? Os próximos jogos da Copa já estão pegando palpites."
                actions={[{ label: "Ver jogos", href: "/jogos" }]}
              />
            ) : (
              <Card><CardContent className="p-0"><div className="divide-y">
                {bets.open.map((b) => <OpenBetRowClient key={b.id} bet={b} />)}
              </div></CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="finished">
            {bets.finished.length === 0 ? (
              <EmptyState
                Icon={CheckCircle2}
                title="Sem apostas finalizadas"
                description="Quando os jogos forem encerrados, suas apostas aparecem aqui com o resultado."
              />
            ) : (
              <Card><CardContent className="p-0"><div className="divide-y">
                {bets.finished.map((b) => <FinishedBetRow key={b.id} bet={b} />)}
              </div></CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="wallet" className="space-y-3">
            {txs.length === 0 ? (
              <EmptyState
                Icon={Receipt}
                title="Sem movimentações ainda"
                description="Suas apostas, vitórias, reembolsos e bônus aparecem aqui em ordem cronológica."
                actions={[{ label: "Ver jogos", href: "/jogos" }]}
              />
            ) : (
            <Card>
              <CardContent className="p-0">
                <div className="px-3.5 py-2 bg-muted/30 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Extrato de transações
                </div>
                <div className="divide-y">
                  {txs.map((t) => {
                    const meta = REASON_META[t.reason]
                    const positive = t.amount > 0
                    const Icon = meta.Icon
                    return (
                      <div key={t.id} className="flex items-start gap-3 px-3.5 py-3">
                        <div className={`size-9 rounded-lg ${meta.bg} grid place-items-center shrink-0`}>
                          <Icon className={`size-4 ${meta.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-sm leading-snug">{t.title}</div>
                            <div className={`font-mono font-bold text-sm shrink-0 ${positive ? "text-emerald-600" : "text-foreground"}`}>
                              {positive ? "+" : ""}{formatPts(t.amount)}
                            </div>
                          </div>
                          {t.detail && (
                            <div className="text-xs text-muted-foreground mt-0.5">{t.detail}</div>
                          )}
                          <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                                {meta.label}
                              </Badge>
                              {t.competition && <span>{t.competition}</span>}
                              <span>·</span>
                              <span>{formatRelative(t.createdAt)}</span>
                            </div>
                            <span className="text-[10px] font-mono">Saldo: {t.balanceAfter}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}


function FinishedBetRow({ bet }: { bet: FinishedBet }) {
  const net = bet.status === "won" ? bet.payout - bet.stake : bet.status === "refunded" ? 0 : -bet.stake
  const Icon = bet.status === "won" ? CheckCircle2 : bet.status === "lost" ? XCircle : RotateCcw
  const color = bet.status === "won" ? "text-emerald-600" : bet.status === "lost" ? "text-destructive" : "text-blue-600"
  const matchLabelPT = `${localizeTeamName(bet.homeName)} × ${localizeTeamName(bet.awayName)}`
  return (
    <Link href={`/jogos/${bet.matchId}`} className="block px-3.5 py-3 hover:bg-accent transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
          <Flag name={bet.homeName} size={18} />
          <Flag name={bet.awayName} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold text-sm">{bet.outcomeLabel}</span>
            <Icon className={`size-4 ${color} shrink-0`} />
          </div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">{matchLabelPT}</div>
          <div className="flex items-center justify-between mt-1.5 text-sm gap-3">
            <span className="text-muted-foreground text-xs">
              <span className="font-mono font-medium text-foreground">{bet.stake}</span> pts ·
              odd <span className="font-mono font-medium text-foreground">{bet.oddAtPlacement.toFixed(2)}</span>
            </span>
            <span className={`font-mono font-bold text-sm ${net > 0 ? "text-emerald-600" : net < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {net > 0 ? "+" : ""}{net} pts
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">{formatLongDate(bet.settledAt)}</div>
        </div>
      </div>
    </Link>
  )
}
