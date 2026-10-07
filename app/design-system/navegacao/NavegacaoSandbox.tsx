"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SportSwitcher } from "@/components/competitions/SportSwitcher"
import { CompetitionPinnedStrip } from "@/components/competitions/CompetitionPinnedStrip"
import { CompetitionFavoriteStar } from "@/components/competitions/CompetitionFavoriteStar"
import { DateStrip } from "@/components/competitions/DateStrip"
import {
  CompetitionsProvider, useCompetitions,
  type CompetitionMeta, type SportMeta,
} from "@/lib/competitions-context"
import { getCompetitionDesign } from "@/lib/competitions-design"

const SPORTS: SportMeta[] = [
  { slug: "futebol", name: "Futebol", icon: "⚽", active: true },
  { slug: "basquete", name: "NBA", icon: "🏀", active: false },
  { slug: "futebol-americano", name: "NFL", icon: "🏈", active: false },
]

const COMPETITIONS: CompetitionMeta[] = [
  { slug: "copa-do-mundo-2026",     name: "Copa do Mundo",   season: "2026",  countryCode: null,      icon: "🏆", active: true,  memberCount: 12450 },
  { slug: "brasileirao-a-2026",     name: "Brasileirão A",   season: "2026",  countryCode: "br",      icon: null, active: false, memberCount: 0 },
  { slug: "brasileirao-b-2026",     name: "Brasileirão B",   season: "2026",  countryCode: "br",      icon: null, active: false, memberCount: 0 },
  { slug: "premier-league-2026-27", name: "Premier League",  season: "26/27", countryCode: "gb-eng",  icon: null, active: false, memberCount: 0 },
  { slug: "la-liga-2026-27",        name: "La Liga",         season: "26/27", countryCode: "es",      icon: null, active: false, memberCount: 0 },
  { slug: "bundesliga-2026-27",     name: "Bundesliga",      season: "26/27", countryCode: "de",      icon: null, active: false, memberCount: 0 },
  { slug: "serie-a-italia-2026-27", name: "Serie A",         season: "26/27", countryCode: "it",      icon: null, active: false, memberCount: 0 },
  { slug: "ligue-1-2026-27",        name: "Ligue 1",         season: "26/27", countryCode: "fr",      icon: null, active: false, memberCount: 0 },
  { slug: "primeira-liga-2026-27",  name: "Primeira Liga",   season: "26/27", countryCode: "pt",      icon: null, active: false, memberCount: 0 },
]

export function NavegacaoSandbox() {
  return (
    <CompetitionsProvider>
      <div className="space-y-8">
        {/* PREVIEW HEADER ESTILO SOFASCORE */}
        <section className="space-y-2">
          <SectionHeader title="Header de navegação" />
          <Card className="overflow-hidden">
            <div className="bg-background border-b sticky top-0 z-10">
              <div className="px-3 pt-3 pb-1">
                <SportSwitcher sports={SPORTS} />
              </div>
              <div className="px-1 border-t border-b border-border/40">
                <CompetitionPinnedStrip competitions={COMPETITIONS} />
              </div>
              <div className="px-1">
                <DateStrip />
              </div>
            </div>
            <CurrentSelectionDisplay />
          </Card>
        </section>

        {/* ISOLATED: CompetitionPinnedStrip */}
        <section className="space-y-2">
          <SectionHeader title="<CompetitionPinnedStrip>" subtitle="Strip de favoritas (clica nas estrelas no sheet pra ver mudar)" />
          <Card>
            <CardContent className="p-3">
              <CompetitionPinnedStrip competitions={COMPETITIONS} />
            </CardContent>
          </Card>
        </section>

        {/* ISOLATED: SportSwitcher */}
        <section className="space-y-2">
          <SectionHeader title="<SportSwitcher>" subtitle="Pills de esporte. Inativos com badge 'Em breve'" />
          <Card>
            <CardContent className="p-3">
              <SportSwitcher sports={SPORTS} />
            </CardContent>
          </Card>
        </section>

        {/* ISOLATED: DateStrip */}
        <section className="space-y-2">
          <SectionHeader title="<DateStrip>" subtitle="Date picker horizontal. Hoje destacado, scroll horizontal." />
          <Card>
            <CardContent className="p-3">
              <DateStrip />
            </CardContent>
          </Card>
        </section>

        {/* ISOLATED: Star (em lista) */}
        <section className="space-y-2">
          <SectionHeader title="<CompetitionFavoriteStar>" subtitle="Toggle ⭐. Atualiza a strip acima em tempo real." />
          <Card>
            <CardContent className="p-3 space-y-1">
              {COMPETITIONS.map((c) => {
                const design = getCompetitionDesign(c.slug)
                return (
                  <div
                    key={c.slug}
                    className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`size-7 rounded-md grid place-items-center shrink-0 ${design.accentBg}`}>
                        <span className="text-sm">{c.icon || (c.countryCode ? "" : "⚽")}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm leading-tight">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.season}</div>
                      </div>
                    </div>
                    <CompetitionFavoriteStar slug={c.slug} />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </section>

        {/* ESTADO DEBUG */}
        <section className="space-y-2">
          <SectionHeader title="Estado atual" subtitle="Pra debug. Em produção isso fica escondido." />
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <DebugState />
            </CardContent>
          </Card>
        </section>
      </div>
    </CompetitionsProvider>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-1">
      <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">{title}</h2>
      {subtitle && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function CurrentSelectionDisplay() {
  const { selectedSport, selectedCompetitionSlug, selectedDate } = useCompetitions()
  const comp = COMPETITIONS.find((c) => c.slug === selectedCompetitionSlug)
  const design = getCompetitionDesign(selectedCompetitionSlug)

  return (
    <div className={`${design.heroGradient} px-4 py-6`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        Você está filtrando por
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{SPORTS.find((s) => s.slug === selectedSport)?.icon}</span>
        <div>
          <div className="font-bold text-base">{comp?.name || "—"}</div>
          <div className="text-xs text-muted-foreground">
            {comp?.season} · {selectedDate.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
          </div>
        </div>
      </div>
    </div>
  )
}

function DebugState() {
  const { selectedSport, selectedCompetitionSlug, favorites, selectedDate } = useCompetitions()
  return (
    <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto">
{JSON.stringify(
  {
    selectedSport,
    selectedCompetitionSlug,
    favorites,
    selectedDate: selectedDate.toISOString().slice(0, 10),
  },
  null,
  2,
)}
    </pre>
  )
}
