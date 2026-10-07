import Link from "next/link"
import { ChevronLeft, Lock, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CompetitionLockup } from "@/components/competitions/CompetitionLockup"
import { COMPETITION_DESIGNS } from "@/lib/competitions-design"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Catálogo mock — usa os mesmos slugs que cravamos no DB.
// Em produção, virá de getCompetitions() ou similar.
const COMPETITIONS = [
  { slug: "copa-do-mundo-2026",     name: "Copa do Mundo",     season: "2026",    country: null,        icon: "🏆",   active: true,  members: 12450 },
  { slug: "brasileirao-a-2026",     name: "Brasileirão A",     season: "2026",    country: "br",        icon: null,   active: false, members: 0 },
  { slug: "brasileirao-b-2026",     name: "Brasileirão B",     season: "2026",    country: "br",        icon: null,   active: false, members: 0 },
  { slug: "premier-league-2026-27", name: "Premier League",    season: "26/27",   country: "gb-eng",    icon: null,   active: false, members: 0 },
  { slug: "la-liga-2026-27",        name: "La Liga",           season: "26/27",   country: "es",        icon: null,   active: false, members: 0 },
  { slug: "bundesliga-2026-27",     name: "Bundesliga",        season: "26/27",   country: "de",        icon: null,   active: false, members: 0 },
  { slug: "serie-a-italia-2026-27", name: "Serie A",           season: "26/27",   country: "it",        icon: null,   active: false, members: 0 },
  { slug: "ligue-1-2026-27",        name: "Ligue 1",           season: "26/27",   country: "fr",        icon: null,   active: false, members: 0 },
  { slug: "primeira-liga-2026-27",  name: "Primeira Liga",     season: "26/27",   country: "pt",        icon: null,   active: false, members: 0 },
]

export default function DesignCompeticoesPage() {
  return (
    <div className="space-y-10">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link href="/design-system">
          <ChevronLeft className="size-4 mr-1" />
          Voltar
        </Link>
      </Button>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Parte 1 — Sistema visual de competições
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Base SuperChamps emerald + accent sutil por competição. Cada uma carimba sua identidade
          em badges, borders e hero, sem sobrescrever a paleta global.
        </p>
      </div>

      {/* SEÇÃO: VARIANTS DO LOCKUP */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
            Lockup — 3 variantes
          </h2>
        </div>

        <div className="space-y-6">
          {/* CHIP — inline em cards de jogo, listings densos */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              <code className="bg-muted px-1 rounded">variant=&quot;chip&quot;</code> — pra appendar a cards de jogo, breadcrumbs
            </div>
            <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-lg">
              {COMPETITIONS.map((c) => (
                <CompetitionLockup
                  key={c.slug}
                  slug={c.slug}
                  name={c.name}
                  season={c.season}
                  countryCode={c.country}
                  icon={c.icon}
                  variant="chip"
                />
              ))}
            </div>
          </div>

          {/* ROW — padrão pra cards e listings */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              <code className="bg-muted px-1 rounded">variant=&quot;row&quot;</code> — padrão pra dropdowns, cards
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
              {COMPETITIONS.map((c) => (
                <CompetitionLockup
                  key={c.slug}
                  slug={c.slug}
                  name={c.name}
                  season={c.season}
                  countryCode={c.country}
                  icon={c.icon}
                  variant="row"
                />
              ))}
            </div>
          </div>

          {/* HERO — pra topo de página de competição */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              <code className="bg-muted px-1 rounded">variant=&quot;hero&quot;</code> — pra topo de página individual
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMPETITIONS.slice(0, 4).map((c) => (
                <CompetitionLockup
                  key={c.slug}
                  slug={c.slug}
                  name={c.name}
                  season={c.season}
                  countryCode={c.country}
                  icon={c.icon}
                  variant="hero"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO: CARDS DE COMPETIÇÃO (preview de uso real) */}
      <section className="space-y-3">
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
          Card de competição (preview)
        </h2>
        <p className="text-xs text-muted-foreground">
          Como ficaria a listagem em <code className="bg-muted px-1 rounded">/competicoes</code>.
          Cada card usa o accent da competição em border-left + gradient leve no hero.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COMPETITIONS.map((c) => {
            const design = COMPETITION_DESIGNS[c.slug] || COMPETITION_DESIGNS["copa-do-mundo-2026"]
            return (
              <Card
                key={c.slug}
                className={`overflow-hidden border-l-4 ${design.accentBorder}`}
              >
                <div className={`${design.heroGradient} px-4 py-3`}>
                  <CompetitionLockup
                    slug={c.slug}
                    name={c.name}
                    season={c.season}
                    countryCode={c.country}
                    icon={c.icon}
                    variant="row"
                  />
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-muted-foreground">
                      {c.active ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Aceita apostas
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Lock className="size-3" />
                          Em breve
                        </span>
                      )}
                    </div>
                    {c.members > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                        {c.members.toLocaleString("pt-BR")} jogando
                      </Badge>
                    )}
                  </div>
                  {c.active && (
                    <p className="text-xs text-muted-foreground">
                      Próximo jogo em 2 dias · 48 seleções confirmadas
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* SEÇÃO: TOKENS EM TABELA */}
      <section className="space-y-3">
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
          Tokens
        </h2>
        <p className="text-xs text-muted-foreground">
          Referência rápida das classes Tailwind por competição. Definidas em{" "}
          <code className="bg-muted px-1 rounded">lib/competitions-design.ts</code>.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-semibold">Slug</th>
                <th className="text-left p-2 font-semibold">Accent</th>
                <th className="text-left p-2 font-semibold">Bg</th>
                <th className="text-left p-2 font-semibold">Border</th>
                <th className="text-left p-2 font-semibold">Ring</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(COMPETITION_DESIGNS).map((d) => (
                <tr key={d.slug} className="border-b">
                  <td className="p-2 font-mono">{d.slug}</td>
                  <td className="p-2">
                    <span className={`inline-block size-4 rounded ${d.accentBg} border ${d.accentBorder}`} />
                  </td>
                  <td className="p-2 font-mono text-muted-foreground">{d.accentBg}</td>
                  <td className="p-2 font-mono text-muted-foreground">{d.accentBorder}</td>
                  <td className="p-2 font-mono text-muted-foreground">{d.accentRing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* INFO */}
      <Card className="bg-primary/[0.03] border-primary/20">
        <CardContent className="p-4 text-xs text-muted-foreground flex items-start gap-2">
          <Sparkles className="size-3.5 mt-0.5 shrink-0 text-primary" />
          <div>
            <p>
              <strong className="text-foreground">Como usar:</strong>{" "}
              <code className="bg-muted px-1 rounded">{`<CompetitionLockup slug="brasileirao-a-2026" name="Brasileirão A" season="2026" countryCode="br" />`}</code>
            </p>
            <p className="mt-1.5">
              Pra novas competições, adicionar entrada em{" "}
              <code className="bg-muted px-1 rounded">COMPETITION_DESIGNS</code>{" "}
              ou usar <code className="bg-muted px-1 rounded">DEFAULT_DESIGN</code> (emerald).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
