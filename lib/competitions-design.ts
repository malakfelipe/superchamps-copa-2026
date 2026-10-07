/**
 * Design tokens por competição.
 *
 * Filosofia híbrida (decidida em 2026-05-31):
 * - Base SuperChamps emerald continua sendo o primário
 * - Cada competição tem um "accent" sutil — usado em ring de seleção,
 *   border-left de cards, badge color, gradient leve em hero
 * - NÃO sobrescreve a paleta global, só "carimba" identidade
 *
 * Quando adicionar competição nova: replicar uma das entradas com a cor mais
 * próxima da identidade oficial. Se não souber, usar DEFAULT_DESIGN.
 */

export type CompetitionDesign = {
  slug: string
  /** Classe Tailwind pra texto em accent (ex: text-amber-600 dark:text-amber-400) */
  accent: string
  /** Background leve pra badge/chip (ex: bg-amber-100 dark:bg-amber-950/40) */
  accentBg: string
  /** Border-left pra card destacado (ex: border-amber-400 dark:border-amber-600) */
  accentBorder: string
  /** Ring color pra focus/selected (ex: ring-amber-300/50 dark:ring-amber-700/50) */
  accentRing: string
  /** Gradient leve pro hero — sempre via emerald/primary no meio */
  heroGradient: string
  /** Emoji ou ícone curto. Pode sobrescrever o icon vindo do DB. */
  icon?: string
}

export const COMPETITION_DESIGNS: Record<string, CompetitionDesign> = {
  // Copa do Mundo — dourado FIFA tradicional
  "copa-do-mundo-2026": {
    slug: "copa-do-mundo-2026",
    accent: "text-amber-600 dark:text-amber-400",
    accentBg: "bg-amber-100 dark:bg-amber-950/40",
    accentBorder: "border-amber-400 dark:border-amber-600",
    accentRing: "ring-amber-300/50 dark:ring-amber-700/50",
    heroGradient: "bg-gradient-to-br from-amber-100/60 via-primary/10 to-background dark:from-amber-950/40 dark:via-primary/15",
    icon: "🏆",
  },
  // Brasileirão A — verde+amarelo brasileiro
  "brasileirao-a-2026": {
    slug: "brasileirao-a-2026",
    accent: "text-yellow-700 dark:text-yellow-400",
    accentBg: "bg-yellow-100 dark:bg-yellow-950/40",
    accentBorder: "border-yellow-400 dark:border-yellow-600",
    accentRing: "ring-yellow-300/50 dark:ring-yellow-700/50",
    heroGradient: "bg-gradient-to-br from-yellow-100/50 via-primary/10 to-background dark:from-yellow-950/30 dark:via-primary/15",
  },
  // Brasileirão B — mesma vibe mas mais discreta
  "brasileirao-b-2026": {
    slug: "brasileirao-b-2026",
    accent: "text-lime-700 dark:text-lime-400",
    accentBg: "bg-lime-100 dark:bg-lime-950/40",
    accentBorder: "border-lime-400 dark:border-lime-600",
    accentRing: "ring-lime-300/50 dark:ring-lime-700/50",
    heroGradient: "bg-gradient-to-br from-lime-100/40 via-primary/10 to-background dark:from-lime-950/25 dark:via-primary/15",
  },
  // Premier League — roxo oficial
  "premier-league-2026-27": {
    slug: "premier-league-2026-27",
    accent: "text-violet-700 dark:text-violet-400",
    accentBg: "bg-violet-100 dark:bg-violet-950/40",
    accentBorder: "border-violet-400 dark:border-violet-600",
    accentRing: "ring-violet-300/50 dark:ring-violet-700/50",
    heroGradient: "bg-gradient-to-br from-violet-100/50 via-primary/10 to-background dark:from-violet-950/30 dark:via-primary/15",
  },
  // La Liga — vermelho/laranja espanhol
  "la-liga-2026-27": {
    slug: "la-liga-2026-27",
    accent: "text-orange-700 dark:text-orange-400",
    accentBg: "bg-orange-100 dark:bg-orange-950/40",
    accentBorder: "border-orange-400 dark:border-orange-600",
    accentRing: "ring-orange-300/50 dark:ring-orange-700/50",
    heroGradient: "bg-gradient-to-br from-orange-100/50 via-primary/10 to-background dark:from-orange-950/30 dark:via-primary/15",
  },
  // Bundesliga — vermelho com forte tradição preta/dourada
  "bundesliga-2026-27": {
    slug: "bundesliga-2026-27",
    accent: "text-red-700 dark:text-red-400",
    accentBg: "bg-red-100 dark:bg-red-950/40",
    accentBorder: "border-red-400 dark:border-red-600",
    accentRing: "ring-red-300/50 dark:ring-red-700/50",
    heroGradient: "bg-gradient-to-br from-red-100/50 via-primary/10 to-background dark:from-red-950/30 dark:via-primary/15",
  },
  // Serie A — azul italiano clássico
  "serie-a-italia-2026-27": {
    slug: "serie-a-italia-2026-27",
    accent: "text-blue-700 dark:text-blue-400",
    accentBg: "bg-blue-100 dark:bg-blue-950/40",
    accentBorder: "border-blue-400 dark:border-blue-600",
    accentRing: "ring-blue-300/50 dark:ring-blue-700/50",
    heroGradient: "bg-gradient-to-br from-blue-100/50 via-primary/10 to-background dark:from-blue-950/30 dark:via-primary/15",
  },
  // Ligue 1 — azul céu francês
  "ligue-1-2026-27": {
    slug: "ligue-1-2026-27",
    accent: "text-sky-700 dark:text-sky-400",
    accentBg: "bg-sky-100 dark:bg-sky-950/40",
    accentBorder: "border-sky-400 dark:border-sky-600",
    accentRing: "ring-sky-300/50 dark:ring-sky-700/50",
    heroGradient: "bg-gradient-to-br from-sky-100/50 via-primary/10 to-background dark:from-sky-950/30 dark:via-primary/15",
  },
  // Primeira Liga — vermelho português
  "primeira-liga-2026-27": {
    slug: "primeira-liga-2026-27",
    accent: "text-rose-700 dark:text-rose-400",
    accentBg: "bg-rose-100 dark:bg-rose-950/40",
    accentBorder: "border-rose-400 dark:border-rose-600",
    accentRing: "ring-rose-300/50 dark:ring-rose-700/50",
    heroGradient: "bg-gradient-to-br from-rose-100/50 via-primary/10 to-background dark:from-rose-950/30 dark:via-primary/15",
  },
}

/** Fallback pra competições sem design definido. Usa o primário emerald. */
export const DEFAULT_DESIGN: CompetitionDesign = {
  slug: "default",
  accent: "text-primary",
  accentBg: "bg-primary/10",
  accentBorder: "border-primary",
  accentRing: "ring-primary/30",
  heroGradient: "bg-gradient-to-br from-primary/15 via-background to-background",
  icon: "⚽",
}

export function getCompetitionDesign(slug?: string | null): CompetitionDesign {
  if (!slug) return DEFAULT_DESIGN
  return COMPETITION_DESIGNS[slug] || DEFAULT_DESIGN
}
