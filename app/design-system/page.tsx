import Link from "next/link"
import { Beaker, Palette, Compass, Trophy, Coins, Zap, Vote, ScrollText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Metadata } from "next"

// Não-indexável (também excluído no robots.ts)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const SECTIONS = [
  {
    href: "/design-system/competicoes",
    icon: Palette,
    title: "Parte 1 — Sistema visual de competições",
    description: "Tokens de cor por competição + componente <CompetitionLockup> em todos os tamanhos.",
    status: "✅ Pronto",
  },
  {
    href: "/design-system/navegacao",
    icon: Compass,
    title: "Parte 2 — Navegação multi-esporte",
    description: "Sport switcher + Pinned strip + Selector sheet + Date strip + Favorite star.",
    status: "✅ Pronto",
  },
  {
    href: "/design-system/hub",
    icon: Trophy,
    title: "Parte 3 — Hub de competição",
    description: "Hero + tabs Jogos/Classificação/Mata-mata/Ligas. Adapta a grupos vs ponto corrido.",
    status: "✅ Pronto",
  },
  {
    href: "/design-system/odds",
    icon: Coins,
    title: "Decisão — Odds no MatchCard",
    description: "3 variantes (Boxes / Pool / Minimal) lado a lado em /jogos e /inicio.",
    status: "🤔 Decidir",
  },
  {
    href: "/design-system/densidade",
    icon: Zap,
    title: "Decisão — Densidade da lista de jogos",
    description: "Card compacto (2 linhas) vs ultra (1 linha) + quick-bet direto da lista.",
    status: "🤔 Decidir",
  },
  {
    href: "/design-system/enquete",
    icon: Vote,
    title: "Protótipo — Enquete Jogo do Dia x2",
    description: "Votação da comunidade pra escolher qual jogo de grupos paga dobro.",
    status: "🧪 Protótipo",
  },
  {
    href: "/design-system/transparencia",
    icon: ScrollText,
    title: "Decisão — Transparência do jogo encerrado (1X2)",
    description: "3 versões do bloco pós-jogo: barras+vencedor / auditoria / donut. Pra /jogos/[id] encerrado.",
    status: "🤔 Decidir",
  },
]

export default function DesignSystemIndex() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Beaker className="size-5 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">Design Sandbox</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Espaço pra prototipar visual de features que ainda não estão em produção.
          Não indexado pelo Google. Quando estiver pronto, plug nas rotas reais.
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map(({ href, icon: Icon, title, description, status }) => (
          <Link key={href} href={href}>
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="size-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                  <Icon className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 pt-0.5">{status}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
