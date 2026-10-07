/**
 * Variantes de MatchCard com odds visíveis. 3 abordagens em A/B/C:
 *
 *  A. boxes   — 3 pílulas 1X2 estilo Sofascore. Familiar mas vibe bet.
 *  B. pool    — Barra de pool distribuído. Visualiza parimutuel (assinatura SC).
 *  C. minimal — Só favorito + odd discreta. Anti-bet.
 *
 * O componente decide o footer pelo `variant`. O resto (times, score, header)
 * é compartilhado com `<MatchCard>` regular.
 */
import { Clock, TrendingUp, Flame, Coins } from "lucide-react"
import { TeamCrest } from "@/components/TeamCrest"
import { Flag } from "@/components/Flag"
import { cn } from "@/lib/utils"
import { formatTime, formatPts } from "@/lib/format"

/**
 * Formato compacto pra grandes números.
 * 950 → "950"
 * 4120 → "4,1K"
 * 285000 → "285K"
 * 1240000 → "1,2M"
 */
function compactNumber(n: number): string {
  return formatPts(n)  // k / MM / bi unificado (economia inflada)
}

type Team = {
  name: string
  countryCode?: string | null
  shortName?: string
  /** URL do escudo do clube (ignorado se `preferFlag` no card). */
  logoUrl?: string | null
}

export type MatchOdds = {
  home: number
  draw: number
  away: number
  /** Distribuição percentual do pool por outcome (soma 100). */
  poolHome: number
  poolDraw: number
  poolAway: number
  /** Total de palpiteiros no jogo. */
  totalBets: number
  /** Total de pontos virtuais em disputa no pool (soma dos stakes). */
  poolTotalPoints: number
}

type Variant = "boxes" | "pool" | "minimal"

export type TeamMeta = {
  /** Forma recente: array de 5 (ou menos) "W"/"D"/"L", mais recente primeiro. */
  form?: ("W" | "D" | "L")[]
  /** Posição na competição. 1-N. */
  rank?: number
  /** Pontos. */
  points?: number
  /** Opcional pra Copa: "Grupo G". */
  groupLabel?: string
}

type Props = {
  home: Team
  away: Team
  date: Date
  status: "scheduled" | "live" | "finished"
  liveMinute?: number | null
  homeScore?: number | null
  awayScore?: number | null
  homePen?: number | null
  awayPen?: number | null
  stageLabel?: string
  venue?: string | null
  odds?: MatchOdds
  variant: Variant
  /** Opcional: rank + pts + form do mandante */
  homeMeta?: TeamMeta
  /** Opcional: rank + pts + form do visitante */
  awayMeta?: TeamMeta
  /** Força bandeira em vez de escudo. Use pra Copa (torneios de seleção). */
  preferFlag?: boolean
  className?: string
  onClick?: () => void
  /** Quick-bet: tocar numa odd box chama com o outcome em vez de navegar. */
  onOddClick?: (outcome: "home" | "draw" | "away") => void
}

export function MatchCardWithOdds({
  home, away, date, status, liveMinute, homeScore, awayScore, homePen, awayPen,
  stageLabel, venue, odds, variant,
  homeMeta, awayMeta, preferFlag = false,
  className, onClick, onOddClick,
}: Props) {
  // Sempre BRT (helper usa Intl com TZ explícita). Evita drift quando servidor
  // tá em UTC (ex: Vercel) ou quando user tá noutro fuso.
  const timeStr = formatTime(date)
  const isLive = status === "live"
  const isFinished = status === "finished"
  const hasScore = isLive || isFinished
  // Decidido nos pênaltis: tempo normal empatado + placar de pênaltis presente
  const decidedByPen = isFinished && homeScore != null && homeScore === awayScore && homePen != null && awayPen != null
  const homeWins = isFinished && ((homeScore ?? 0) > (awayScore ?? 0) || (decidedByPen && (homePen ?? 0) > (awayPen ?? 0)))
  const awayWins = isFinished && ((awayScore ?? 0) > (homeScore ?? 0) || (decidedByPen && (awayPen ?? 0) > (homePen ?? 0)))

  return (
    <div
      className={cn(
        "p-3 rounded-lg border bg-card hover:border-primary/40 transition-colors",
        isLive && "ring-1 ring-red-500/30",
        className,
      )}
    >
      {/* HEADER: stage + status */}
      {(stageLabel || isLive) && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          {stageLabel && <span className="uppercase tracking-wider font-semibold">{stageLabel}</span>}
          {isLive && (
            <span className="flex items-center gap-1 text-red-500 font-bold uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
              AO VIVO {liveMinute ? `${liveMinute}'` : ""}
            </span>
          )}
        </div>
      )}

      {/* MAIN: teams + score/time/venue */}
      <button
        type="button"
        onClick={onClick}
        className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-left"
      >
        <TeamSide team={home} meta={homeMeta} preferFlag={preferFlag} align="left" isWinner={homeWins} />
        <div className="text-center min-w-[72px] max-w-[120px]">
          {hasScore ? (
            <div className="space-y-0.5">
              <div className="font-bold text-xl font-mono leading-none">
                {homeScore ?? "—"}<span className="mx-1.5 text-muted-foreground/50">×</span>{awayScore ?? "—"}
              </div>
              {decidedByPen && (
                <div className="text-[9px] font-mono text-muted-foreground leading-none">pên {homePen}-{awayPen}</div>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
              <Clock className="size-2.5" />
              {timeStr}
            </div>
          )}
          {venue && (
            <div className="text-[9px] text-muted-foreground/70 leading-tight mt-0.5 line-clamp-2">
              {venue}
            </div>
          )}
        </div>
        <TeamSide team={away} meta={awayMeta} preferFlag={preferFlag} align="right" isWinner={awayWins} />
      </button>

      {/* ODDS — varia conforme variant */}
      {odds && !hasScore && (
        <div className="mt-2.5 pt-2.5 border-t border-dashed">
          {variant === "boxes" && <OddsBoxes home={home} away={away} odds={odds} onOddClick={onOddClick} />}
          {variant === "pool" && <OddsPool home={home} away={away} odds={odds} />}
          {variant === "minimal" && <OddsMinimal home={home} away={away} odds={odds} />}
        </div>
      )}
    </div>
  )
}

function TeamSide({
  team, meta, preferFlag, align, isWinner,
}: { team: Team; meta?: TeamMeta; preferFlag?: boolean; align: "left" | "right"; isWinner: boolean }) {
  // P4: clubes (escudo) usam layout mais denso — Copa (bandeira) mantém o maior.
  // Forma+posição numa sub-linha compacta que não estoura no mobile.
  const compact = !preferFlag
  return (
    <div className={cn("flex items-center min-w-0", compact ? "gap-1.5" : "gap-2", align === "right" && "flex-row-reverse text-right")}>
      {/* TeamCrest decide entre escudo (clube) e bandeira (seleção). */}
      <TeamCrest
        name={team.name}
        iso={team.countryCode || undefined}
        logoUrl={team.logoUrl}
        preferFlag={preferFlag}
        size={compact ? 20 : 28}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className={cn("font-semibold leading-tight truncate", compact ? "text-xs" : "text-sm", !isWinner && "text-muted-foreground/70 font-medium")}>
          {team.name}
        </div>
        {meta && (meta.rank != null || (meta.form && meta.form.length > 0)) && (
          <div className={cn("flex items-center gap-1 mt-0.5", align === "right" && "justify-end")}>
            {meta.rank != null && (
              <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap">
                {meta.rank}º{meta.points != null && <> · <span className="text-foreground font-semibold">{meta.points}</span>pts</>}
              </span>
            )}
            {meta.form && meta.form.length > 0 && (
              <div className={cn("flex items-center gap-0.5 shrink-0", align === "right" && "flex-row-reverse")}>
                {meta.form.map((r, i) => (
                  <span
                    key={i}
                    className={cn(
                      compact ? "size-1.5 rounded-full" : "size-2 rounded-[2px]",
                      "inline-block",
                      r === "W" && "bg-emerald-500",
                      r === "D" && "bg-muted-foreground/40",
                      r === "L" && "bg-rose-500",
                    )}
                    title={r === "W" ? "Vitória" : r === "D" ? "Empate" : "Derrota"}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Odd 0 = outcome sem nenhuma aposta (payout indefinido em parimutuel).
// Nunca é favorito e exibe "—" em vez de número.
function lowestStakedOdd(odds: MatchOdds): number {
  const staked = [odds.home, odds.draw, odds.away].filter((o) => o > 0)
  return staked.length > 0 ? Math.min(...staked) : 0
}

function formatOdd(odd: number): string {
  return odd > 0 ? odd.toFixed(2) : "—"
}

// ─── VARIANT A: BOXES (Sofascore-style) ─────────────────────────────────────

function OddsBoxes({ home, away, odds, onOddClick }: { home: Team; away: Team; odds: MatchOdds; onOddClick?: (outcome: "home" | "draw" | "away") => void }) {
  const lowestOdd = lowestStakedOdd(odds)

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-1.5">
        <OddBox label="1" subLabel={home.shortName || home.name.slice(0, 3).toUpperCase()} odd={odds.home} isFavorite={odds.home > 0 && odds.home === lowestOdd} onPick={onOddClick && (() => onOddClick("home"))} />
        <OddBox label="X" subLabel="Empate" odd={odds.draw} isFavorite={odds.draw > 0 && odds.draw === lowestOdd} onPick={onOddClick && (() => onOddClick("draw"))} />
        <OddBox label="2" subLabel={away.shortName || away.name.slice(0, 3).toUpperCase()} odd={odds.away} isFavorite={odds.away > 0 && odds.away === lowestOdd} onPick={onOddClick && (() => onOddClick("away"))} />
      </div>
      {/* Stats do pool: palpiteiros + pontos em disputa */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground pt-0.5">
        <span className="flex items-center gap-1">
          <Flame className="size-2.5" />
          {compactNumber(odds.totalBets)} {odds.totalBets === 1 ? "palpiteiro" : "palpiteiros"}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="flex items-center gap-1">
          <Coins className="size-2.5" />
          <span className="font-mono font-semibold text-foreground/80">{compactNumber(odds.poolTotalPoints)}</span> pts no pool
        </span>
      </div>
    </div>
  )
}

function OddBox({ label, subLabel, odd, isFavorite, onPick }: { label: string; subLabel: string; odd: number; isFavorite: boolean; onPick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick && ((e) => {
        // Quick-bet: não deixa o clique borbulhar pro Link do card
        e.preventDefault()
        e.stopPropagation()
        onPick()
      })}
      className={cn(
        "rounded-md border px-2 py-1.5 transition-colors text-center group",
        isFavorite ? "bg-primary/[0.04] border-primary/30 hover:bg-primary/10" : "bg-muted/30 hover:bg-muted/60",
      )}
    >
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider leading-tight">
        {label} · {subLabel}
      </div>
      <div className={cn("font-mono font-bold text-sm leading-tight mt-0.5", isFavorite ? "text-primary" : odd <= 0 && "text-muted-foreground/50")}>
        {formatOdd(odd)}
      </div>
    </button>
  )
}

// ─── VARIANT B: POOL BAR (parimutuel signature) ─────────────────────────────

function OddsPool({ home, away, odds }: { home: Team; away: Team; odds: MatchOdds }) {
  return (
    <div className="space-y-1.5">
      {/* Barra de distribuição */}
      <div className="h-2 rounded-full overflow-hidden flex bg-muted">
        <div
          className="bg-primary/80 transition-all"
          style={{ width: `${odds.poolHome}%` }}
          title={`${home.name}: ${odds.poolHome}%`}
        />
        <div
          className="bg-muted-foreground/30 transition-all"
          style={{ width: `${odds.poolDraw}%` }}
          title={`Empate: ${odds.poolDraw}%`}
        />
        <div
          className="bg-amber-500/80 transition-all"
          style={{ width: `${odds.poolAway}%` }}
          title={`${away.name}: ${odds.poolAway}%`}
        />
      </div>
      {/* Labels com %, odd e total */}
      <div className="grid grid-cols-3 gap-1 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-primary/80 shrink-0" />
          <span className="font-semibold">{odds.poolHome}%</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono font-bold text-primary">{formatOdd(odds.home)}x</span>
        </div>
        <div className="flex items-center gap-1 justify-center">
          <span className="size-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
          <span className="font-semibold">{odds.poolDraw}%</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono font-bold">{formatOdd(odds.draw)}x</span>
        </div>
        <div className="flex items-center gap-1 justify-end">
          <span className="size-1.5 rounded-full bg-amber-500/80 shrink-0" />
          <span className="font-semibold">{odds.poolAway}%</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{formatOdd(odds.away)}x</span>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1 pt-0.5">
        <Flame className="size-2.5" />
        {odds.totalBets.toLocaleString("pt-BR")} palpites no pool
      </div>
    </div>
  )
}

// ─── VARIANT C: MINIMAL (anti-bet) ──────────────────────────────────────────

function OddsMinimal({ home, away, odds }: { home: Team; away: Team; odds: MatchOdds }) {
  // Identifica o favorito (menor odd entre outcomes COM aposta)
  const minOdd = lowestStakedOdd(odds)
  let favorite: { team: string; odd: number; countryCode?: string | null }
  if (odds.home === minOdd) favorite = { team: home.name, odd: odds.home, countryCode: home.countryCode }
  else if (odds.away === minOdd) favorite = { team: away.name, odd: odds.away, countryCode: away.countryCode }
  else favorite = { team: "Empate", odd: odds.draw }

  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <TrendingUp className="size-3" />
        <span>Favorita do pool:</span>
        {favorite.countryCode && <Flag iso={favorite.countryCode} size={12} />}
        <span className="font-semibold text-foreground">{favorite.team}</span>
        <span className="font-mono font-bold text-primary">{favorite.odd.toFixed(2)}x</span>
      </div>
      <button type="button" className="text-[10px] text-muted-foreground hover:text-foreground underline">
        ver odds
      </button>
    </div>
  )
}
