import Link from "next/link"
import { type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Action = {
  label: string
  href: string
  variant?: "default" | "outline"
}

type Props = {
  Icon?: LucideIcon
  title: string
  description?: string
  actions?: Action[]
  className?: string
  compact?: boolean
}

/**
 * Estado vazio reutilizável.
 *
 *   <EmptyState
 *     Icon={Target}
 *     title="Sem apostas em aberto"
 *     description="Tá esperando o quê? Bora palpitar."
 *     actions={[{ label: "Ver jogos", href: "/jogos" }]}
 *   />
 */
export function EmptyState({
  Icon, title, description, actions, className, compact = false,
}: Props) {
  return (
    <Card className={className}>
      <CardContent className={cn("text-center", compact ? "py-8 space-y-2.5" : "py-12 space-y-3")}>
        {Icon && (
          <div className={cn(
            "rounded-full bg-muted grid place-items-center mx-auto",
            compact ? "size-10" : "size-14",
          )}>
            <Icon className={cn(compact ? "size-5" : "size-6", "text-muted-foreground")} />
          </div>
        )}
        <div className="space-y-1">
          <h3 className={cn("font-semibold", compact ? "text-sm" : "text-base")}>{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-snug">
              {description}
            </p>
          )}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {actions.map((a) => (
              <Button key={a.href} size="sm" variant={a.variant || "default"} asChild>
                <Link href={a.href}>{a.label}</Link>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
