import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MatchCardWithOdds, type MatchOdds } from "@/components/competitions/MatchCardWithOdds"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Mock data — 3 jogos representativos com odds diferentes (favorito claro, equilibrado, zebra)
const TEAMS = {
  brasil: { name: "Brasil", countryCode: "br", shortName: "BRA" },
  argentina: { name: "Argentina", countryCode: "ar", shortName: "ARG" },
  franca: { name: "França", countryCode: "fr", shortName: "FRA" },
  marrocos: { name: "Marrocos", countryCode: "ma", shortName: "MAR" },
  espanha: { name: "Espanha", countryCode: "es", shortName: "ESP" },
  uruguai: { name: "Uruguai", countryCode: "uy", shortName: "URU" },
} as const

const NOW = new Date()
function setTime(h: number, m = 0, offsetDays = 0): Date {
  const d = new Date(NOW)
  d.setDate(d.getDate() + offsetDays)
  d.setHours(h, m, 0, 0)
  return d
}

const SAMPLE_MATCHES = [
  // Jogo 1: favorito claro
  {
    id: "m1", home: TEAMS.brasil, away: TEAMS.marrocos,
    date: setTime(18, 0), status: "scheduled" as const,
    stageLabel: "Grupo G · Rodada 1", venue: "MetLife Stadium",
    odds: {
      home: 1.43, draw: 5.56, away: 8.33,
      poolHome: 70, poolDraw: 18, poolAway: 12,
      totalBets: 4120,
      poolTotalPoints: 285400,    // stake médio ~70 pts × 4120 = 285K
    } satisfies MatchOdds,
  },
  // Jogo 2: equilibrado
  {
    id: "m2", home: TEAMS.argentina, away: TEAMS.franca,
    date: setTime(20, 30), status: "scheduled" as const,
    stageLabel: "Grupo D · Rodada 2", venue: "Mercedes-Benz Stadium",
    odds: {
      home: 2.86, draw: 3.10, away: 2.50,
      poolHome: 35, poolDraw: 32, poolAway: 40,
      totalBets: 3700,
      poolTotalPoints: 248200,
    } satisfies MatchOdds,
  },
  // Jogo 3: zebra na cara
  {
    id: "m3", home: TEAMS.uruguai, away: TEAMS.espanha,
    date: setTime(15, 0, 1), status: "scheduled" as const,
    stageLabel: "Grupo C · Rodada 1", venue: "SoFi Stadium",
    odds: {
      home: 6.25, draw: 4.20, away: 1.59,
      poolHome: 16, poolDraw: 24, poolAway: 63,
      totalBets: 1750,
      poolTotalPoints: 96800,
    } satisfies MatchOdds,
  },
]

const VARIANTS = [
  {
    key: "boxes" as const,
    title: "Opção A — Boxes 1X2 + stats do pool",
    subtitle: "ESCOLHIDA. Boxes Sofascore + nº de palpiteiros + pontos em disputa no rodapé.",
    chosen: true,
    pros: ["Padrão do mercado", "Tap-to-bet 1 click", "Destaque do favorito", "Stats sociais embaixo"],
    cons: ["Vibe 'casa de aposta'", "Ocupa altura significativa"],
  },
  {
    key: "pool" as const,
    title: "Opção B — Pool bar",
    subtitle: "Assinatura SuperChamps. Mostra que odd vem do pool, não da casa.",
    chosen: false,
    pros: ["Educativo da mecânica parimutuel", "Diferenciado (ninguém faz)", "Tom: 'a galera define a odd'"],
    cons: ["Requer aprender o conceito", "Mais alto que A", "Pode confundir iniciante"],
  },
  {
    key: "minimal" as const,
    title: "Opção C — Minimal",
    subtitle: "Anti-bet. Só favorito + odd compacta. Tap pra expandir.",
    chosen: false,
    pros: ["Não incentiva palpite na hora", "Coerente com posicionamento anti-bet", "Caber mais cards na tela"],
    cons: ["Menos informativo", "Exige extra tap pra ver outras odds", "Pode parecer 'falta de info'"],
  },
]

export default function DesignOddsPage() {
  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link href="/design-system">
          <ChevronLeft className="size-4 mr-1" />
          Voltar
        </Link>
      </Button>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Odds no MatchCard — 3 opções
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Antes de prosseguir, decisão de princípio: como mostrar as odds dos jogos no listing
          (sem precisar entrar no detalhe). Compare as 3 abordagens lado a lado em <em>/jogos</em>{" "}
          (lista vertical) e <em>/inicio</em> (carousel horizontal).
        </p>
      </div>

      {/* COMPARAÇÃO STANDALONE — 3 cards lado a lado */}
      <section className="space-y-3">
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
          Card standalone (mesmo jogo, 3 variantes)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VARIANTS.map((v) => (
            <div key={v.key} className={v.chosen ? "space-y-2 ring-2 ring-emerald-500/40 rounded-xl p-2 -m-2" : "space-y-2"}>
              <div className="px-1 flex items-start gap-2">
                <div className="flex-1">
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    {v.title}
                    {v.chosen && (
                      <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-0">
                        ✓ ESCOLHIDA
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{v.subtitle}</div>
                </div>
              </div>
              <MatchCardWithOdds
                home={SAMPLE_MATCHES[0].home}
                away={SAMPLE_MATCHES[0].away}
                date={SAMPLE_MATCHES[0].date}
                status={SAMPLE_MATCHES[0].status}
                stageLabel={SAMPLE_MATCHES[0].stageLabel}
                venue={SAMPLE_MATCHES[0].venue}
                odds={SAMPLE_MATCHES[0].odds}
                variant={v.key}
              />
            </div>
          ))}
        </div>
      </section>

      {/* CONTEXTO /JOGOS — lista vertical */}
      <section className="space-y-3">
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
          Como ficaria em /jogos (lista vertical)
        </h2>
        <p className="text-xs text-muted-foreground">
          Cada coluna mostra os mesmos 3 jogos (favorito claro / equilibrado / zebra) na sua variante.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VARIANTS.map((v) => (
            <div key={v.key} className="space-y-2">
              <Badge variant="outline" className="text-xs">{v.title}</Badge>
              <div className="space-y-2">
                {SAMPLE_MATCHES.map((m) => (
                  <MatchCardWithOdds
                    key={m.id}
                    home={m.home}
                    away={m.away}
                    date={m.date}
                    status={m.status}
                    stageLabel={m.stageLabel}
                    venue={m.venue}
                    odds={m.odds}
                    variant={v.key}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTEXTO /INICIO — carousel horizontal */}
      <section className="space-y-3">
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
          Como ficaria em /inicio (carousel horizontal)
        </h2>
        <p className="text-xs text-muted-foreground">
          Card mais compacto. Scroll horizontal mobile. Cada variante mostrada separadamente.
        </p>

        {VARIANTS.map((v) => (
          <Card key={v.key}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{v.title}</Badge>
                <span className="text-[11px] text-muted-foreground">{v.subtitle}</span>
              </div>
              <div className="-mx-2 px-2 overflow-x-auto no-scrollbar">
                <div className="flex gap-2 w-max">
                  {SAMPLE_MATCHES.map((m) => (
                    <div key={m.id} className="w-[280px] shrink-0">
                      <MatchCardWithOdds
                        home={m.home}
                        away={m.away}
                        date={m.date}
                        status={m.status}
                        stageLabel={m.stageLabel}
                        odds={m.odds}
                        variant={v.key}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* PROS/CONS LADO A LADO */}
      <section className="space-y-3">
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
          Trade-offs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VARIANTS.map((v) => (
            <Card key={v.key}>
              <CardContent className="p-4 space-y-3">
                <div className="font-semibold text-sm">{v.title}</div>
                <div className="space-y-1.5">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                    Prós
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    {v.pros.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-rose-600 dark:text-rose-400">
                    Contras
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    {v.cons.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* NOTA TÉCNICA */}
      <Card className="bg-primary/[0.03] border-primary/20">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground">📐 Nota técnica</p>
          <p>
            Todas as 3 variantes usam a <strong>mesma estrutura</strong>{" "}
            <code className="bg-muted px-1 rounded">{`<MatchCardWithOdds variant="..." />`}</code>.
            Trocar de variante é trocar 1 prop — não precisa refazer componente.
          </p>
          <p>
            Pra contextos sem odd disponível (jogo terminado, em andamento) o footer some automático.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
