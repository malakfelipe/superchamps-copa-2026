import { Calendar, Users, Coins, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Flag } from "@/components/Flag"
import { CompetitionFavoriteStar } from "./CompetitionFavoriteStar"
import { getCompetitionDesign } from "@/lib/competitions-design"
import { cn } from "@/lib/utils"
import { formatPts } from "@/lib/format"

type Props = {
  slug: string
  name: string
  season: string
  description?: string
  countryCode?: string | null
  icon?: string
  participantsCount?: number
  betsCount?: number
  upcomingMatchesCount?: number
  isActive?: boolean
  className?: string
}

/**
 * Hero de página de competição. Gradient com identidade visual, lockup grande,
 * stats secundárias, CTA principal "Criar liga focada nessa competição".
 */
export function CompetitionHubHero({
  slug, name, season, description, countryCode, icon,
  participantsCount = 0, betsCount = 0, upcomingMatchesCount = 0,
  isActive = true, className,
}: Props) {
  const design = getCompetitionDesign(slug)

  return (
    <div className={cn("relative overflow-hidden border rounded-xl", design.accentBorder, "border-opacity-30", className)}>
      <div className={cn(design.heroGradient, "px-5 py-6 sm:px-6 sm:py-7")}>
        {/* TOP ROW — identity + favorite */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={cn("size-14 rounded-2xl grid place-items-center shrink-0 bg-background/80 backdrop-blur shadow-sm")}>
              {countryCode ? (
                <Flag iso={countryCode} size={36} rounded />
              ) : (
                <span className="text-3xl leading-none">{icon || design.icon || "⚽"}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                Competição
              </div>
              <h1 className={cn("text-xl sm:text-2xl font-extrabold tracking-tight leading-tight", design.accent)}>
                {name}
              </h1>
              <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{season}</div>
            </div>
          </div>
          <CompetitionFavoriteStar slug={slug} size={22} className="shrink-0" />
        </div>

        {description && (
          <p className="text-sm text-foreground/80 leading-snug mb-4 max-w-xl">
            {description}
          </p>
        )}

        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
          <Stat icon={<Calendar className="size-3.5" />} value={upcomingMatchesCount} label="próximos" />
          <Stat icon={<Users className="size-3.5" />} value={participantsCount} label={participantsCount === 1 ? "jogador" : "jogadores"} />
          <Stat icon={<Coins className="size-3.5" />} value={betsCount} label={betsCount === 1 ? "palpite" : "palpites"} />
        </div>

        {/* CTA */}
        {isActive && (
          <Button className="w-full mt-5 gap-1.5" size="lg">
            <TrendingUp className="size-4" />
            Criar liga focada em {name}
          </Button>
        )}
        {!isActive && (
          <div className="mt-5 px-3 py-2 rounded-md bg-background/60 border text-xs text-center text-muted-foreground">
            🔒 Apostas vão abrir quando a temporada começar
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-background/60 backdrop-blur rounded-lg px-2.5 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
        {icon}
      </div>
      <div className="font-mono font-bold text-sm sm:text-base">
        {formatPts(value)}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  )
}
