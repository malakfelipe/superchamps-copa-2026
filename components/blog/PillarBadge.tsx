import { ShieldAlert, Heart, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { BlogPillar } from "@/lib/data/types"

const META: Record<BlogPillar, { label: string; Icon: typeof ShieldAlert; className: string }> = {
  bets: {
    label: "Lado escuro das bets",
    Icon: ShieldAlert,
    className: "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  },
  cultura: {
    label: "Bolão é cultura",
    Icon: Heart,
    className: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  },
  por_dentro: {
    label: "Por dentro",
    Icon: Eye,
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
}

export function PillarBadge({ pillar, size = "default" }: { pillar: BlogPillar; size?: "sm" | "default" }) {
  const { label, Icon, className } = META[pillar]
  const sizing = size === "sm" ? "text-[10px] h-5 px-1.5 gap-0.5" : "text-xs h-6 px-2 gap-1"
  return (
    <Badge variant="secondary" className={`${className} ${sizing} font-medium`}>
      <Icon className={size === "sm" ? "size-2.5" : "size-3"} />
      {label}
    </Badge>
  )
}
