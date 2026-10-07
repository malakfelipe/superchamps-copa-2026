/**
 * Lockup visual de uma competição. Combina:
 *   - Ícone (bandeira do país ou emoji fallback)
 *   - Nome curto
 *   - Temporada (opcional)
 *   - Tokens de cor do `competitions-design.ts`
 *
 * 3 tamanhos: sm (chip inline), md (card row, default), lg (hero/destaque).
 *
 * Usado em:
 *   - Cards de jogo (sm — pra dizer de qual competição é)
 *   - Listas de competição (md)
 *   - Hero de página de competição (lg)
 *   - Dropdown de seleção (sm/md)
 */
import { cn } from "@/lib/utils"
import { Flag } from "@/components/Flag"
import { getCompetitionDesign } from "@/lib/competitions-design"

type Variant = "chip" | "row" | "hero"

type Props = {
  slug?: string | null
  name: string
  /** Ex: "2026", "26/27", "Temporada 2026/27" */
  season?: string | null
  /** ISO code da bandeira (br, gb-eng, es...). Opcional — fallback pra emoji. */
  countryCode?: string | null
  /** Emoji ou ícone curto, fallback se countryCode ausente. */
  icon?: string | null
  variant?: Variant
  /** Se true, renderiza apenas a parte visual (sem nome). Útil pra grid. */
  iconOnly?: boolean
  className?: string
}

const VARIANT_STYLES: Record<Variant, {
  container: string
  iconSize: number
  nameClass: string
  seasonClass: string
  gap: string
  padding: string
}> = {
  chip: {
    container: "rounded-md text-xs",
    iconSize: 14,
    nameClass: "font-medium text-[11px]",
    seasonClass: "ml-1 opacity-60 text-[10px]",
    gap: "gap-1.5",
    padding: "px-1.5 py-0.5",
  },
  row: {
    container: "rounded-lg text-sm",
    iconSize: 20,
    nameClass: "font-semibold text-sm",
    seasonClass: "ml-1.5 opacity-60 text-xs font-normal",
    gap: "gap-2",
    padding: "px-2.5 py-1.5",
  },
  hero: {
    container: "rounded-xl text-base",
    iconSize: 36,
    nameClass: "font-extrabold text-xl tracking-tight",
    seasonClass: "ml-2 opacity-70 text-base font-normal",
    gap: "gap-3",
    padding: "px-4 py-2.5",
  },
}

export function CompetitionLockup({
  slug,
  name,
  season,
  countryCode,
  icon,
  variant = "row",
  iconOnly = false,
  className,
}: Props) {
  const design = getCompetitionDesign(slug)
  const styles = VARIANT_STYLES[variant]
  const resolvedIcon = icon || design.icon || "⚽"

  return (
    <div
      className={cn(
        "inline-flex items-center border",
        design.accentBg,
        design.accentBorder,
        styles.container,
        styles.gap,
        styles.padding,
        "border-opacity-30",
        className,
      )}
    >
      {countryCode ? (
        <Flag iso={countryCode} size={styles.iconSize} />
      ) : (
        <span style={{ fontSize: styles.iconSize, lineHeight: 1 }}>{resolvedIcon}</span>
      )}
      {!iconOnly && (
        <span className={cn(styles.nameClass, design.accent)}>
          {name}
          {season && <span className={styles.seasonClass}>{season}</span>}
        </span>
      )}
    </div>
  )
}
