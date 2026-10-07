import { Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatSlot } from "@/lib/knockout"
import { formatKickoff } from "@/lib/format"
import type { Match } from "@/lib/data/types"

/**
 * Card do bracket pra jogo do mata-mata SEM times confirmados: mostra os slots
 * ("3º C/D/F/G/H", "Venc. jogo 73") + data/sede, sem bandeira e sem aposta.
 */
export function KnockoutPendingCard({ match }: { match: Match }) {
  return (
    <Card className="bg-muted/20 border-dashed">
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center justify-center gap-2 text-xs font-medium">
          <span className="flex-1 text-right truncate">{formatSlot(match.home.name)}</span>
          <span className="text-muted-foreground shrink-0">×</span>
          <span className="flex-1 text-left truncate">{formatSlot(match.away.name)}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Lock className="size-2.5 shrink-0" />
          aguardando times · {formatKickoff(match.startsAt)}{match.venue ? ` · ${match.venue}` : ""}
        </div>
      </CardContent>
    </Card>
  )
}
