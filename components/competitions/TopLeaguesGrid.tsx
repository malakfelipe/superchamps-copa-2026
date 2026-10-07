import { Users, Crown, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type TopLeague = {
  slug: string
  name: string
  ownerNickname: string
  memberCount: number
  description?: string
  isFavorite?: boolean
}

type Props = {
  leagues: TopLeague[]
  competitionName: string
  className?: string
}

/**
 * Lista as principais ligas (bolão) que estão jogando essa competição.
 * Discovery hook: usuário pode pedir pra entrar ou criar a própria.
 */
export function TopLeaguesGrid({ leagues, competitionName, className }: Props) {
  if (leagues.length === 0) {
    return (
      <Card className={cn("border-dashed bg-muted/30", className)}>
        <CardContent className="p-6 text-center space-y-2">
          <Users className="size-6 text-muted-foreground mx-auto" />
          <p className="text-sm font-semibold">Sem ligas ainda</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Seja o primeiro a criar uma liga focada em {competitionName}. Chama a galera.
          </p>
          <Button size="sm" className="mt-2">Criar a primeira liga</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {leagues.map((league) => (
        <Card key={league.slug} className="hover:border-primary/40 transition-colors group">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
              <Users className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="font-bold text-sm truncate">{league.name}</div>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-0.5 shrink-0">
                  <Users className="size-2.5" />
                  {league.memberCount}
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                <Crown className="size-3 shrink-0" />
                {league.ownerNickname}
                {league.description && (
                  <>
                    <span>·</span>
                    <span className="truncate">{league.description}</span>
                  </>
                )}
              </div>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 gap-1 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
              Solicitar
              <ArrowRight className="size-3" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
