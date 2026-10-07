/**
 * MatchCard de produção — wrapper do design system MatchCardWithOdds que:
 *   - Usa o tipo Match real da camada de dados
 *   - Localiza nomes em PT
 *   - Encaixa no fluxo: clique vai pra /jogos/[id]
 *   - Adiciona badges de bet status ("apostado", "acertou", "errou")
 *   - Mostra o "PAGA 2×" pro mata-mata
 *
 * Substitui o `<GameRow>` em /jogos e /inicio.
 */
import Link from "next/link"
import { CheckCircle2, XCircle, Target, RotateCcw } from "lucide-react"
import { MatchCardWithOdds, type TeamMeta } from "@/components/competitions/MatchCardWithOdds"
import { cn } from "@/lib/utils"
import { localizeTeamName } from "@/lib/teams"
import { deriveMatchOdds } from "@/lib/match-odds"
import { multiplierLabel } from "@/lib/multipliers"
import type { Match, Stage } from "@/lib/data/types"

const STAGE_LABEL: Record<Stage, string> = {
  group_a: "Grupo A", group_b: "Grupo B", group_c: "Grupo C", group_d: "Grupo D",
  group_e: "Grupo E", group_f: "Grupo F", group_g: "Grupo G", group_h: "Grupo H",
  group_i: "Grupo I", group_j: "Grupo J", group_k: "Grupo K", group_l: "Grupo L",
  round_of_32: "16-avos", round_of_16: "Oitavas", quarter: "Quartas",
  semi: "Semifinal", third: "3° lugar", final: "Final",
}

type Props = {
  match: Match
  homeMeta?: TeamMeta
  awayMeta?: TeamMeta
  /**
   * Força bandeira em vez de escudo. Use pra Copa do Mundo e torneios de
   * seleção — escudos de federação ficam feios e perdem identidade do país.
   */
  preferFlag?: boolean
  className?: string
  /** Quick-bet: repassado pro MatchCardWithOdds (só funciona dentro de client tree). */
  onOddClick?: (outcome: "home" | "draw" | "away") => void
}

/** Short de 3 letras tirado do nome PT-BR (em vez do TLA inglês da API). */
function shortFromName(localizedName: string): string {
  return localizedName.toUpperCase().slice(0, 3)
}

export function MatchCardProd({ match, homeMeta, awayMeta, preferFlag, className, onOddClick }: Props) {
  const stageLabel = STAGE_LABEL[match.stage] || match.stage
  const odds = deriveMatchOdds(match)

  // Badge "PAGA x3/x5" (knockout) ou "x2" (jogo do dia via enquete)
  const multLabel = multiplierLabel(match.stage, match.payoutMultiplier)
  const stageLabelFull = multLabel
    ? `${stageLabel} · PAGA ${multLabel}`
    : stageLabel

  // Localiza nomes primeiro pra usar nas iniciais (BRA, ARG, COR, TCH, etc.)
  const homeName = localizeTeamName(match.home.name)
  const awayName = localizeTeamName(match.away.name)

  return (
    <Link href={`/jogos/${match.id}`} className={cn("block group", className)}>
      <div className="relative">
        <MatchCardWithOdds
          home={{
            name: homeName,
            countryCode: match.home.iso || null,
            shortName: shortFromName(homeName),
            logoUrl: match.home.logoUrl || null,
          }}
          away={{
            name: awayName,
            countryCode: match.away.iso || null,
            shortName: shortFromName(awayName),
            logoUrl: match.away.logoUrl || null,
          }}
          date={match.startsAt}
          status={match.status === "cancelled" || match.status === "postponed" ? "scheduled" : match.status}
          liveMinute={match.liveMinute}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
          homePen={match.homePen}
          awayPen={match.awayPen}
          stageLabel={stageLabelFull}
          venue={match.venue}
          odds={odds}
          variant="boxes"
          onOddClick={onOddClick}
          homeMeta={homeMeta}
          awayMeta={awayMeta}
          preferFlag={preferFlag}
          className={cn(
            "group-hover:border-primary/40 transition-colors",
            match.myBetStatus && match.myBetStatus !== "none" && "bg-primary/[0.03]",
          )}
        />
        {match.myBetStatus && match.myBetStatus !== "none" && (
          <div className="absolute top-2 right-2">
            <MyBetBadge status={match.myBetStatus} />
          </div>
        )}
      </div>
    </Link>
  )
}

function MyBetBadge({ status }: { status: "open" | "won" | "lost" | "refunded" }) {
  const config = {
    open:     { Icon: Target,        label: "apostado", cls: "bg-primary/15 text-primary" },
    won:      { Icon: CheckCircle2,  label: "acertou",  cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    lost:     { Icon: XCircle,       label: "errou",    cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
    refunded: { Icon: RotateCcw,     label: "refund",   cls: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  }[status]
  const { Icon, label, cls } = config
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", cls)}>
      <Icon className="size-2.5" />
      {label}
    </span>
  )
}
