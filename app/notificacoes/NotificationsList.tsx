"use client"

import { useState, useTransition, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CheckCircle2, XCircle, RotateCcw, Users, Gift, Zap, Clock, Trophy, Bell, ChevronRight,
  UserPlus, ThumbsUp, ThumbsDown, Check, CheckCheck, Loader2, Vote,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/EmptyState"
import { toast } from "sonner"
import { formatRelative } from "@/lib/format"
import type { NotificationType, Notification } from "@/lib/data/types"
import { markNotificationsReadAction } from "./actions"

const TYPE_META: Record<NotificationType, { Icon: typeof Bell; bg: string; color: string }> = {
  bet_won: { Icon: CheckCircle2, bg: "bg-emerald-100 dark:bg-emerald-950/40", color: "text-emerald-600 dark:text-emerald-500" },
  bet_lost: { Icon: XCircle, bg: "bg-rose-100 dark:bg-rose-950/40", color: "text-destructive" },
  bet_refunded: { Icon: RotateCcw, bg: "bg-blue-100 dark:bg-blue-950/40", color: "text-blue-600 dark:text-blue-500" },
  league_invite: { Icon: Users, bg: "bg-violet-100 dark:bg-violet-950/40", color: "text-violet-600 dark:text-violet-400" },
  league_join_request: { Icon: UserPlus, bg: "bg-violet-100 dark:bg-violet-950/40", color: "text-violet-600 dark:text-violet-400" },
  league_join_approved: { Icon: ThumbsUp, bg: "bg-emerald-100 dark:bg-emerald-950/40", color: "text-emerald-600 dark:text-emerald-500" },
  league_join_rejected: { Icon: ThumbsDown, bg: "bg-rose-100 dark:bg-rose-950/40", color: "text-destructive" },
  referral_joined: { Icon: Gift, bg: "bg-amber-100 dark:bg-amber-950/40", color: "text-amber-600 dark:text-amber-400" },
  low_balance_boost: { Icon: Zap, bg: "bg-cyan-100 dark:bg-cyan-950/40", color: "text-cyan-600 dark:text-cyan-400" },
  kickoff_reminder: { Icon: Clock, bg: "bg-primary/10", color: "text-primary" },
  competition_end: { Icon: Trophy, bg: "bg-amber-100 dark:bg-amber-950/40", color: "text-amber-600 dark:text-amber-400" },
  poll_open: { Icon: Vote, bg: "bg-primary/10", color: "text-primary" },
}

type Props = {
  initial: Notification[]
}

export function NotificationsList({ initial }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>(initial)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [isMarkingAll, startMarkAll] = useTransition()

  const unread = items.filter((n) => n.unread)
  const read = items.filter((n) => !n.unread)

  async function markOne(id: string) {
    // Optimistic update
    setPendingIds((prev) => new Set(prev).add(id))
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))

    const res = await markNotificationsReadAction([id])
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })

    if (res.error) {
      // Rollback
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: true } : n)))
      toast.error(res.error)
    } else {
      // Refresh do header (badge do sininho)
      router.refresh()
    }
  }

  function markAll() {
    if (unread.length === 0) return
    const unreadIds = unread.map((n) => n.id)

    startMarkAll(async () => {
      // Optimistic
      setItems((prev) => prev.map((n) => ({ ...n, unread: false })))

      const res = await markNotificationsReadAction(null)
      if (res.error) {
        // Rollback
        setItems((prev) =>
          prev.map((n) => (unreadIds.includes(n.id) ? { ...n, unread: true } : n)),
        )
        toast.error(res.error)
      } else {
        toast.success(`${res.marked} notifica${res.marked === 1 ? "ção" : "ções"} marcada${res.marked === 1 ? "" : "s"} como lida${res.marked === 1 ? "" : "s"}`)
        router.refresh()
      }
    })
  }

  if (items.length === 0) {
    return (
      <EmptyState
        Icon={Bell}
        title="Sem notificações ainda"
        description="Apostas, convites e avisos do sistema vão aparecer aqui."
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* CABEÇALHO COM AÇÃO "MARCAR TODAS" */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {unread.length > 0 ? (
            <>
              <strong className="text-foreground">{unread.length} não lida{unread.length !== 1 ? "s" : ""}</strong> · {items.length} total
            </>
          ) : (
            `${items.length} notificações · todas lidas`
          )}
        </p>
        {unread.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={markAll}
            disabled={isMarkingAll}
            className="gap-1.5 shrink-0"
          >
            {isMarkingAll ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            Marcar todas
          </Button>
        )}
      </div>

      {/* NÃO LIDAS */}
      {unread.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
            <Bell className="size-3.5" />
            Não lidas
            <Badge variant="default" className="text-[10px] h-4 px-1.5 ml-1">{unread.length}</Badge>
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {unread.map((n) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    isPending={pendingIds.has(n.id)}
                    onMarkRead={() => markOne(n.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* LIDAS */}
      {read.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground px-1">
            Lidas
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {read.map((n) => (
                  <NotificationRow key={n.id} n={n} isPending={false} />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}

function NotificationRow({
  n,
  isPending,
  onMarkRead,
}: {
  n: Notification
  isPending: boolean
  onMarkRead?: () => void
}) {
  const meta = TYPE_META[n.type]
  const Icon = meta.Icon

  // Conteúdo da linha (sem o botão de mark-as-read)
  const inner: ReactNode = (
    <div className={`flex items-start gap-3 px-3.5 py-3 transition-colors ${n.link ? "hover:bg-accent" : ""} ${n.unread ? "bg-primary/[0.02]" : ""}`}>
      <div className={`size-9 rounded-lg ${meta.bg} grid place-items-center shrink-0 relative`}>
        <Icon className={`size-4 ${meta.color}`} />
        {n.unread && (
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary ring-2 ring-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm leading-snug ${n.unread ? "font-semibold" : "font-medium"}`}>{n.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</div>
        <div className="text-[10px] text-muted-foreground mt-1">{formatRelative(n.createdAt)}</div>
      </div>
      {n.link && <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />}
    </div>
  )

  // Quando tem botão de mark-read, ele fica sobreposto à linha pra não interferir no link
  return (
    <div className="relative group">
      {n.link ? <Link href={n.link}>{inner}</Link> : <div>{inner}</div>}
      {n.unread && onMarkRead && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onMarkRead()
          }}
          disabled={isPending}
          aria-label="Marcar como lida"
          title="Marcar como lida"
          className="absolute top-2 right-2 size-7 rounded-md bg-background border border-border opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all grid place-items-center disabled:opacity-50"
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        </button>
      )}
    </div>
  )
}
