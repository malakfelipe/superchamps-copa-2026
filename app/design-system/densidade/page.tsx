import Link from "next/link"
import { ChevronLeft, Clock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flag } from "@/components/Flag"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Propostas de adensamento do MatchCard pra lista de jogos (mobile-first).
 * Estáticas — quando uma for aprovada, vira variant do MatchCardWithOdds.
 */

type MockMatch = {
  home: { name: string; iso: string; short: string }
  away: { name: string; iso: string; short: string }
  time: string
  group: string
  odds: { h: number; d: number; a: number }
  fav: "h" | "d" | "a"
  bettors: number
  pool: string
  bet?: boolean
}

const MOCKS: MockMatch[] = [
  {
    home: { name: "México", iso: "mx", short: "MÉX" },
    away: { name: "África do Sul", iso: "za", short: "ÁFR" },
    time: "16:00", group: "Grupo A",
    odds: { h: 1.42, d: 4.49, a: 13.46 }, fav: "h",
    bettors: 28, pool: "1,7k", bet: true,
  },
  {
    home: { name: "Coreia do Sul", iso: "kr", short: "COR" },
    away: { name: "Tchéquia", iso: "cz", short: "TCH" },
    time: "23:00", group: "Grupo A",
    odds: { h: 1.29, d: 11.0, a: 7.33 }, fav: "h",
    bettors: 17, pool: "660",
  },
  {
    home: { name: "Brasil", iso: "br", short: "BRA" },
    away: { name: "Marrocos", iso: "ma", short: "MAR" },
    time: "17:00", group: "Grupo C",
    odds: { h: 2.53, d: 3.64, a: 3.03 }, fav: "h",
    bettors: 19, pool: "910",
  },
]

// ─── PROPOSTA 1: COMPACTO (2 linhas) ────────────────────────────────────────

function CardCompacto({ m }: { m: MockMatch }) {
  return (
    <Card>
      <CardContent className="p-2.5 space-y-1.5">
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-[10px] text-muted-foreground font-mono w-9 shrink-0">{m.time}</span>
          <span className="flex items-center gap-1.5 flex-1 min-w-0">
            <Flag iso={m.home.iso} size={16} />
            <span className="font-semibold truncate">{m.home.name}</span>
          </span>
          <span className="text-[10px] text-muted-foreground">×</span>
          <span className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <span className="font-semibold truncate text-right">{m.away.name}</span>
            <Flag iso={m.away.iso} size={16} />
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <OddChip label="1" odd={m.odds.h} fav={m.fav === "h"} />
          <OddChip label="X" odd={m.odds.d} fav={m.fav === "d"} />
          <OddChip label="2" odd={m.odds.a} fav={m.fav === "a"} />
          <span className="text-[10px] text-muted-foreground shrink-0 pl-1 font-mono">
            {m.bettors}🔥 {m.pool}pts
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function OddChip({ label, odd, fav }: { label: string; odd: number; fav: boolean }) {
  return (
    <button
      type="button"
      className={`flex-1 h-8 rounded border text-center flex items-center justify-center gap-1.5 transition-colors ${
        fav
          ? "bg-primary/[0.06] border-primary/30 hover:bg-primary/10"
          : "bg-muted/30 hover:bg-muted/60"
      }`}
    >
      <span className="text-[9px] text-muted-foreground uppercase">{label}</span>
      <span className={`font-mono font-bold text-xs ${fav ? "text-primary" : ""}`}>
        {odd.toFixed(2)}
      </span>
    </button>
  )
}

// ─── PROPOSTA 2: ULTRA (1 linha, estilo Sofascore) ──────────────────────────

function CardUltra({ m }: { m: MockMatch }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="w-9 shrink-0 text-center">
        <div className="text-[10px] font-mono text-muted-foreground">{m.time}</div>
        {m.bet && <div className="text-[8px] text-primary font-bold uppercase">apostado</div>}
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 text-xs">
          <Flag iso={m.home.iso} size={14} />
          <span className="font-medium truncate">{m.home.name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Flag iso={m.away.iso} size={14} />
          <span className="font-medium truncate">{m.away.name}</span>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <OddPill odd={m.odds.h} fav={m.fav === "h"} />
        <OddPill odd={m.odds.d} fav={m.fav === "d"} />
        <OddPill odd={m.odds.a} fav={m.fav === "a"} />
      </div>
    </div>
  )
}

function OddPill({ odd, fav }: { odd: number; fav: boolean }) {
  return (
    <button
      type="button"
      className={`w-12 h-9 rounded border font-mono text-[11px] font-bold transition-colors ${
        fav
          ? "bg-primary/[0.06] border-primary/30 text-primary hover:bg-primary/10"
          : "bg-muted/30 hover:bg-muted/60"
      }`}
    >
      {odd >= 10 ? odd.toFixed(1) : odd.toFixed(2)}
    </button>
  )
}

// ─── PROPOSTA 3: QUICK-BET (aposta direto da lista) ─────────────────────────

function QuickBetMock({ m }: { m: MockMatch }) {
  return (
    <div className="space-y-2">
      <CardCompacto m={m} />
      {/* Representação do sheet que abre ao tocar numa odd */}
      <div className="rounded-t-2xl border-2 border-b-0 bg-background shadow-lg p-4 space-y-3 max-w-sm mx-auto">
        <div className="h-1 w-10 bg-muted rounded-full mx-auto" />
        <div className="text-sm font-bold">
          Apostar em <span className="text-primary">{m.home.name} vence</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Odd atual <span className="font-mono font-semibold text-foreground">{m.odds.h.toFixed(2)}</span> · saldo 653 pts
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {[10, 50, 100, 163, 326].map((v) => (
            <span key={v} className={`h-8 rounded border grid place-items-center text-xs font-medium ${v === 50 ? "bg-primary text-primary-foreground" : "bg-muted/30"}`}>
              {v}
            </span>
          ))}
        </div>
        <Button size="sm" className="w-full">Confirmar 50 pts → ganha 71</Button>
      </div>
    </div>
  )
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function DensidadePage() {
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
          <Zap className="size-5 text-primary" />
          Densidade — lista de jogos
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          O card atual gasta ~150px por jogo. Com 72 jogos na Copa, são ~15 telas de scroll.
          Duas propostas de adensamento + quick-bet. Container estreito = simula mobile.
        </p>
      </div>

      {/* P1 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge>Proposta 1</Badge>
          <h2 className="font-bold text-sm">Compacto — 2 linhas (~76px/jogo, -50%)</h2>
        </div>
        <p className="text-xs text-muted-foreground max-w-xl">
          Times + hora na linha 1, odds + pool na linha 2. Mantém odds tocáveis grandes
          o suficiente pro dedo (h-8 = 32px). Recomendada como padrão do mobile.
        </p>
        <div className="max-w-sm space-y-1.5">
          {MOCKS.map((m, i) => <CardCompacto key={i} m={m} />)}
        </div>
      </section>

      {/* P2 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge>Proposta 2</Badge>
          <h2 className="font-bold text-sm">Ultra — 1 linha por jogo (~52px, -65%, estilo Sofascore)</h2>
        </div>
        <p className="text-xs text-muted-foreground max-w-xl">
          Lista contínua sem card individual — borda entre linhas. Times empilhados à esquerda,
          3 odds à direita. Máxima densidade; perde venue/grupo (ficam só no detalhe).
        </p>
        <Card className="max-w-sm overflow-hidden">
          <CardContent className="p-0">
            {MOCKS.map((m, i) => <CardUltra key={i} m={m} />)}
          </CardContent>
        </Card>
      </section>

      {/* P3 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge>Proposta 3</Badge>
          <h2 className="font-bold text-sm">Quick-bet — apostar sem entrar no jogo</h2>
        </div>
        <p className="text-xs text-muted-foreground max-w-xl">
          Tocar numa odd do card abre o mesmo BetDrawer da página de detalhe, direto na lista.
          Detalhe (/jogos/id) continua existindo pra heatmap de placar + stats.
          Funciona combinada com a Proposta 1 ou 2.
        </p>
        <div className="max-w-sm">
          <QuickBetMock m={MOCKS[0]} />
        </div>
      </section>

      {/* P4 — clubes (Brasileirão etc.) com escudo + forma recente */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge>Proposta 4</Badge>
          <h2 className="font-bold text-sm">Clubes — escudo + forma recente sem estourar (~84px)</h2>
        </div>
        <p className="text-xs text-muted-foreground max-w-xl">
          Hoje no Brasileirão a forma (5 bolinhas) + posição + pts disputam espaço com o nome
          e estouram no mobile. Proposta: nome na linha do escudo; posição, pts e forma viram
          uma sub-linha compacta. Odds embaixo, mesmo padrão da Proposta 1.
        </p>
        <div className="max-w-sm space-y-1.5">
          {CLUB_MOCKS.map((m, i) => <CardClube key={i} m={m} />)}
        </div>
      </section>

      <Card className="bg-muted/40 border-dashed max-w-xl">
        <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
          <Clock className="size-3.5 mt-0.5 shrink-0" />
          <span>
            Pra aprovar: responde com &quot;P1&quot;, &quot;P2&quot;, &quot;P4&quot; ou combinações
            (ex.: &quot;P1+P3, P4 nos clubes&quot;). A escolhida vira variant do MatchCardWithOdds.
          </span>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── PROPOSTA 4: CLUBES (escudo + forma compacta) ───────────────────────────

type MockClub = {
  home: { name: string; color: string; short: string; pos: number; pts: number; form: ("W" | "D" | "L")[] }
  away: { name: string; color: string; short: string; pos: number; pts: number; form: ("W" | "D" | "L")[] }
  time: string
  odds: { h: number; d: number; a: number }
  fav: "h" | "d" | "a"
}

const CLUB_MOCKS: MockClub[] = [
  {
    home: { name: "Fluminense", color: "bg-emerald-800", short: "FLU", pos: 3, pts: 31, form: ["W", "W", "D", "L", "W"] },
    away: { name: "RB Bragantino", color: "bg-red-700", short: "RBB", pos: 5, pts: 29, form: ["D", "W", "W", "L", "D"] },
    time: "17:00", odds: { h: 2.1, d: 3.2, a: 3.4 }, fav: "h",
  },
  {
    home: { name: "Corinthians", color: "bg-zinc-900", short: "COR", pos: 10, pts: 24, form: ["L", "D", "W", "D", "L"] },
    away: { name: "Remo", color: "bg-blue-900", short: "REM", pos: 18, pts: 18, form: ["L", "L", "D", "W", "L"] },
    time: "17:00", odds: { h: 1.65, d: 3.6, a: 5.2 }, fav: "h",
  },
]

function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  const color = { W: "bg-emerald-500", D: "bg-zinc-400", L: "bg-rose-500" }
  return (
    <span className="inline-flex gap-0.5">
      {form.map((r, i) => (
        <span key={i} className={`size-1.5 rounded-full ${color[r]}`} />
      ))}
    </span>
  )
}

function ClubSide({ c, align }: { c: MockClub["home"]; align: "left" | "right" }) {
  return (
    <div className={`flex-1 min-w-0 flex items-center gap-1.5 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      {/* escudo (placeholder — produção usa <TeamCrest logoUrl>) */}
      <span className={`size-5 rounded-full ${c.color} text-white grid place-items-center text-[7px] font-bold shrink-0`}>
        {c.short}
      </span>
      <div className="min-w-0">
        <div className="font-semibold text-xs truncate leading-tight">{c.name}</div>
        <div className={`flex items-center gap-1 text-[9px] text-muted-foreground font-mono ${align === "right" ? "justify-end" : ""}`}>
          {c.pos}° · {c.pts}pts
          <FormDots form={c.form} />
        </div>
      </div>
    </div>
  )
}

function CardClube({ m }: { m: MockClub }) {
  return (
    <Card>
      <CardContent className="p-2.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <ClubSide c={m.home} align="left" />
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">{m.time}</span>
          <ClubSide c={m.away} align="right" />
        </div>
        <div className="flex items-center gap-1.5">
          <OddChip label="1" odd={m.odds.h} fav={m.fav === "h"} />
          <OddChip label="X" odd={m.odds.d} fav={m.fav === "d"} />
          <OddChip label="2" odd={m.odds.a} fav={m.fav === "a"} />
        </div>
      </CardContent>
    </Card>
  )
}
