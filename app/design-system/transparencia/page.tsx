import Link from "next/link"
import { ChevronLeft, ScrollText, CheckCircle2, XCircle, Trophy, Scale, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flag } from "@/components/Flag"
import { BettorConference } from "./BettorConference"
import type { Metadata } from "next"

export const metadata: Metadata = { robots: { index: false, follow: false } }

/**
 * PROTÓTIPO — Transparência do jogo encerrado (palpites 1X2 agregados).
 * 3 versões do bloco que entra em /jogos/[id] quando o jogo termina: mostra
 * como o pool 1X2 se distribuiu, qual resultado venceu, a odd congelada no
 * apito e o multiplicador aplicado. Estático; quando aprovado, vira componente
 * alimentado por bet_market_snapshots + bets (odd_at_settle/payout).
 */

const MATCH = {
  home: { name: "Brasil", iso: "br", short: "BRA", score: 2 },
  away: { name: "Haiti", iso: "ht", short: "HAI", score: 1 },
  stage: "Grupo C",
  multiplier: 2, // jogo do dia x2 (enquete)
  winner: "home" as const,
}

type Row = { key: "home" | "draw" | "away"; label: string; iso: string | null; bettors: number; pool: number }
const ROWS: Row[] = [
  { key: "home", label: "Brasil vence", iso: "br", bettors: 142, pool: 8200 },
  { key: "draw", label: "Empate", iso: null, bettors: 38, pool: 2100 },
  { key: "away", label: "Haiti vence", iso: "ht", bettors: 24, pool: 1300 },
]

const TOTAL = ROWS.reduce((a, r) => a + r.pool, 0)              // 11.600
const BETTORS = ROWS.reduce((a, r) => a + r.bettors, 0)        // 204
const WIN_POOL = ROWS.find((r) => r.key === MATCH.winner)!.pool // 8.200
const BASE_ODD = TOTAL / WIN_POOL                              // 1,41
const PAID_ODD = BASE_ODD * MATCH.multiplier                   // 2,83
const PAID_TOTAL = Math.round(TOTAL * MATCH.multiplier)        // 23.200

const fmt = (n: number) => n.toLocaleString("pt-BR")
const odd = (n: number) => n.toFixed(2).replace(".", ",")
const share = (pool: number) => Math.round((pool / TOTAL) * 100)
const oddOf = (pool: number) => (pool > 0 ? TOTAL / pool : 0)

// ─── Header compartilhado do jogo encerrado ──────────────────────────────────
function FinishedHeader() {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <div className="flex items-center gap-2 min-w-0">
        <Flag name={MATCH.home.name} iso={MATCH.home.iso} size={22} />
        <span className="font-bold text-sm truncate">{MATCH.home.name}</span>
      </div>
      <div className="text-center shrink-0">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Encerrado</div>
        <div className="font-mono font-extrabold text-base">{MATCH.home.score}–{MATCH.away.score}</div>
      </div>
      <div className="flex items-center gap-2 min-w-0 justify-end">
        <span className="font-bold text-sm truncate">{MATCH.away.name}</span>
        <Flag name={MATCH.away.name} iso={MATCH.away.iso} size={22} />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// V1 — Barras + vencedor destacado
// ════════════════════════════════════════════════════════════════════════════
function VersaoBarras() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <ScrollText className="size-4 text-primary" />
            Como o bolão palpitou · 1X2
          </h3>
          <Badge variant="outline" className="gap-1 h-5 px-1.5 text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400/40">
            <Trophy className="size-3" /> pagou x{MATCH.multiplier}
          </Badge>
        </div>

        {ROWS.map((r) => {
          const won = r.key === MATCH.winner
          return (
            <div key={r.key} className={`space-y-1 rounded-lg p-2 -mx-1 ${won ? "bg-emerald-500/10 ring-1 ring-emerald-500/30" : "opacity-70"}`}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  {r.iso && <Flag iso={r.iso} size={18} />}
                  {r.label}
                  {won
                    ? <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-3" /> ACERTOU</span>
                    : <XCircle className="size-3 text-muted-foreground/60" />}
                </span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-xs text-muted-foreground">{share(r.pool)}%</span>
                  <span className={`font-bold tabular-nums w-14 text-right ${won ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    {odd(oddOf(r.pool))}x
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${won ? "bg-emerald-500" : "bg-muted-foreground/40"}`} style={{ width: `${share(r.pool)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{fmt(r.pool)} pts · {r.bettors} apostadores</span>
                {won && <span className="font-medium text-emerald-600 dark:text-emerald-400">{odd(BASE_ODD)}x × {MATCH.multiplier} = {odd(PAID_ODD)}x pago</span>}
              </div>
            </div>
          )
        })}

        <div className="flex items-center justify-center gap-3 pt-1 border-t text-[11px] text-muted-foreground">
          <span><strong className="text-foreground font-mono">{fmt(TOTAL)}</strong> pts no pool</span>
          <span className="text-muted-foreground/40">·</span>
          <span><strong className="text-foreground font-mono">{BETTORS}</strong> apostadores</span>
          <span className="text-muted-foreground/40">·</span>
          <span><strong className="text-foreground font-mono">{fmt(PAID_TOTAL)}</strong> pts pagos</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// V2 — Auditoria parimutuel (tabela densa + a conta)
// ════════════════════════════════════════════════════════════════════════════
function VersaoAuditoria() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 space-y-2.5">
        <h3 className="font-bold text-sm flex items-center gap-1.5">
          <Scale className="size-4 text-primary" />
          Auditoria do bolão
        </h3>

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="text-left font-semibold px-2 py-1.5">Resultado</th>
                <th className="text-right font-semibold px-2 py-1.5">Apost.</th>
                <th className="text-right font-semibold px-2 py-1.5">Pool</th>
                <th className="text-right font-semibold px-2 py-1.5">Fatia</th>
                <th className="text-right font-semibold px-2 py-1.5">Odd</th>
                <th className="text-center font-semibold px-1 py-1.5"></th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {ROWS.map((r) => {
                const won = r.key === MATCH.winner
                return (
                  <tr key={r.key} className={`border-t ${won ? "bg-emerald-500/10" : ""}`}>
                    <td className="px-2 py-1.5">
                      <span className="flex items-center gap-1.5 font-sans font-medium">
                        {r.iso && <Flag iso={r.iso} size={14} />}
                        {r.label}
                      </span>
                    </td>
                    <td className="text-right px-2 py-1.5 tabular-nums">{r.bettors}</td>
                    <td className="text-right px-2 py-1.5 tabular-nums">{fmt(r.pool)}</td>
                    <td className="text-right px-2 py-1.5 tabular-nums text-muted-foreground">{share(r.pool)}%</td>
                    <td className={`text-right px-2 py-1.5 tabular-nums font-bold ${won ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>{odd(oddOf(r.pool))}x</td>
                    <td className="text-center px-1 py-1.5">
                      {won ? <CheckCircle2 className="size-3.5 text-emerald-500 inline" /> : <XCircle className="size-3.5 text-muted-foreground/40 inline" />}
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t bg-muted/30 font-semibold">
                <td className="px-2 py-1.5 font-sans">Total</td>
                <td className="text-right px-2 py-1.5 tabular-nums">{BETTORS}</td>
                <td className="text-right px-2 py-1.5 tabular-nums">{fmt(TOTAL)}</td>
                <td className="text-right px-2 py-1.5 tabular-nums text-muted-foreground">100%</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* a conta do pagamento */}
        <div className="rounded-lg bg-muted/40 border p-2.5 space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Odd do vencedor</span>
            <span className="font-mono">{fmt(TOTAL)} ÷ {fmt(WIN_POOL)} = <strong className="text-foreground">{odd(BASE_ODD)}x</strong></span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Multiplicador (jogo do dia)</span>
            <span className="font-mono">× {MATCH.multiplier} → <strong className="text-emerald-600 dark:text-emerald-400">{odd(PAID_ODD)}x pago</strong></span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t">
            <span className="text-muted-foreground">142 ganhadores · pago</span>
            <span className="font-mono font-bold">{fmt(PAID_TOTAL)} pts</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Odds congeladas no apito final (snapshot registrado). Apostas individuais ficam privadas — aqui é só o agregado.
        </p>
      </CardContent>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// V3 — Donut + chips
// ════════════════════════════════════════════════════════════════════════════
function VersaoDonut() {
  // pathLength=100 → dasharray em % direto
  const segs = ROWS.map((r) => ({ ...r, pct: (r.pool / TOTAL) * 100 }))
  let acc = 0
  const arcs = segs.map((s) => {
    const seg = { ...s, offset: -acc }
    acc += s.pct
    return seg
  })
  const colorOf = (key: string) => (key === MATCH.winner ? "var(--color-emerald-500, #10b981)" : key === "draw" ? "#94a3b8" : "#cbd5e1")

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-1.5">
          <PieChart className="size-4 text-primary" />
          Distribuição dos palpites · 1X2
        </h3>

        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <svg viewBox="0 0 120 120" className="size-28 -rotate-90">
              <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" className="text-muted/40" strokeWidth="14" />
              {arcs.map((a) => (
                <circle
                  key={a.key}
                  cx="60" cy="60" r="42" fill="none"
                  stroke={colorOf(a.key)}
                  strokeWidth={a.key === MATCH.winner ? 17 : 14}
                  pathLength={100}
                  strokeDasharray={`${a.pct} ${100 - a.pct}`}
                  strokeDashoffset={a.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 grid place-items-center rotate-0">
              <div className="text-center leading-none">
                <div className="text-[9px] text-muted-foreground uppercase">pool</div>
                <div className="font-mono font-extrabold text-sm">{(TOTAL / 1000).toFixed(1)}k</div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            {segs.map((s) => {
              const won = s.key === MATCH.winner
              return (
                <div key={s.key} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full shrink-0" style={{ background: colorOf(s.key) }} />
                  <span className={`flex items-center gap-1 truncate ${won ? "font-bold" : "text-muted-foreground"}`}>
                    {s.iso && <Flag iso={s.iso} size={14} />}
                    {s.label}
                    {won && <CheckCircle2 className="size-3 text-emerald-500" />}
                  </span>
                  <span className="ml-auto font-mono tabular-nums">{Math.round(s.pct)}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* chips */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-emerald-500/10 p-2 text-center">
            <div className="text-[9px] text-muted-foreground uppercase">Vencedor</div>
            <div className="font-bold text-xs flex items-center justify-center gap-1 mt-0.5"><Flag iso="br" size={14} /> Brasil</div>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <div className="text-[9px] text-muted-foreground uppercase">Odd paga</div>
            <div className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{odd(PAID_ODD)}x</div>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <div className="text-[9px] text-muted-foreground uppercase">Multiplic.</div>
            <div className="font-mono font-bold text-xs mt-0.5">x{MATCH.multiplier}</div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          {BETTORS} apostadores · {fmt(PAID_TOTAL)} pts pagos a 142 ganhadores
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function TransparenciaPage() {
  const variants = [
    {
      n: "Versão 1 — Barras + vencedor + conferência",
      note: "Evolui o bloco atual: resultado em verde, odd paga e multiplicador inline. Abaixo, conferência por apostador (top 10 acertaram/erraram + busca).",
      el: (
        <div className="space-y-3">
          <VersaoBarras />
          <BettorConference
            winner={MATCH.winner}
            paidOdd={PAID_ODD}
            picks={{
              home: { short: "Brasil", iso: "br" },
              draw: { short: "Empate", iso: null },
              away: { short: "Haiti", iso: "ht" },
            }}
            totalBettors={BETTORS}
          />
        </div>
      ),
    },
    { n: "Versão 2 — Auditoria parimutuel", note: "Tabela densa (apostadores · pool · fatia · odd · ✓/✗) + a conta do pagamento. Máxima transparência.", el: <VersaoAuditoria /> },
    { n: "Versão 3 — Donut + chips", note: "Visual da distribuição + cartões de vencedor/odd/multiplicador. Mais escaneável, menos números.", el: <VersaoDonut /> },
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link href="/design-system">
            <ChevronLeft className="size-4 mr-1" />
            Design Sandbox
          </Link>
        </Button>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <ScrollText className="size-5 text-primary" />
          Transparência do jogo encerrado · 1X2
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Bloco pra <strong>/jogos/[id]</strong> quando o jogo termina: como o pool 1X2 se distribuiu,
          qual resultado venceu, a odd congelada no apito e o multiplicador aplicado — pra qualquer um
          auditar que o pagamento foi justo. 3 versões abaixo.
        </p>
      </div>

      <div className="max-w-md space-y-8">
        {variants.map((v) => (
          <div key={v.n} className="space-y-2">
            <div className="space-y-0.5">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">{v.n}</div>
              <p className="text-[11px] text-muted-foreground">{v.note}</p>
            </div>
            <FinishedHeader />
            {v.el}
          </div>
        ))}
      </div>
    </div>
  )
}
