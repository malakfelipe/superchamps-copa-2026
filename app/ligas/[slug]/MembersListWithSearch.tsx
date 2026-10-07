"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Search, Crown, Clock, X, UserX, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Flag } from "@/components/Flag"
import { toast } from "sonner"
import { formatRelative, formatLongDate } from "@/lib/format"
import type { LeagueMember } from "@/lib/data/types"
import { kickMemberAction } from "../actions"

type Props = {
  members: LeagueMember[]
  currentUserId: string
  isOwner?: boolean
  leagueId?: string
}

function avatarColor(id: string): string {
  const palette = [
    "bg-emerald-100 text-emerald-700",
    "bg-blue-100 text-blue-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-purple-100 text-purple-700",
    "bg-cyan-100 text-cyan-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
    "bg-lime-100 text-lime-700",
    "bg-indigo-100 text-indigo-700",
  ]
  const idx = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length
  return palette[idx]
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("")
}

const TOP_RECENT = 50

export function MembersListWithSearch({ members, currentUserId, isOwner, leagueId }: Props) {
  const [query, setQuery] = useState("")
  const [kickingId, setKickingId] = useState<string | null>(null)
  const [localMembers, setLocalMembers] = useState(members)
  const normalized = query.trim().toLowerCase()
  const isSearching = normalized.length > 0

  async function handleKick(userId: string, nickname: string) {
    if (!leagueId) return
    setKickingId(userId)
    const res = await kickMemberAction(leagueId, userId)
    setKickingId(null)
    if (res.error) {
      toast.error(res.error)
      return
    }
    setLocalMembers((prev) => prev.filter((m) => m.userId !== userId))
    toast.success(`${nickname} foi removido da liga`)
  }

  // 50 mais recentes (por last_signed_in_at desc, fallback joined_at)
  const byRecency = useMemo(() => {
    return [...localMembers].sort((a, b) => {
      const aTime = (a.lastSignedInAt?.getTime() ?? a.joinedAt.getTime())
      const bTime = (b.lastSignedInAt?.getTime() ?? b.joinedAt.getTime())
      return bTime - aTime
    })
  }, [localMembers])

  const filtered = useMemo(() => {
    if (!isSearching) return byRecency.slice(0, TOP_RECENT)
    return byRecency.filter((m) =>
      m.nickname.toLowerCase().includes(normalized) ||
      m.fullName.toLowerCase().includes(normalized),
    )
  }, [byRecency, normalized, isSearching])

  const totalCount = localMembers.length
  const hiddenCount = isSearching ? 0 : Math.max(0, totalCount - TOP_RECENT)

  return (
    <div className="space-y-3">
      <div className="px-1 text-xs text-muted-foreground flex items-center justify-between flex-wrap gap-2">
        <span>
          {totalCount} {totalCount === 1 ? "membro" : "membros"} nesta liga
        </span>
        {hiddenCount > 0 && (
          <span className="text-[11px]">Mostrando os {TOP_RECENT} mais ativos</span>
        )}
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <Input
          type="text"
          placeholder="Buscar por nickname…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9 h-10"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-7 grid place-items-center text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
            aria-label="Limpar busca"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* LISTA */}
      {filtered.length === 0 ? (
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nenhum membro encontrado com &quot;{query}&quot;.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((m) => {
                const canKick = isOwner && m.role !== "owner" && m.userId !== currentUserId
                return (
                  <div
                    key={m.userId}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                      m.userId === currentUserId ? "bg-primary/5" : "hover:bg-accent"
                    }`}
                  >
                    <Link href={`/u/${m.nickname}`} className="flex-1 min-w-0 flex items-center gap-3">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className={`${avatarColor(m.userId)} text-xs font-bold`}>
                          {initials(m.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          {m.countryName && <Flag name={m.countryName} size={12} />}
                          <span className="truncate">{m.nickname}</span>
                          {m.userId === currentUserId && (
                            <span className="text-muted-foreground font-normal text-xs">(você)</span>
                          )}
                          {m.role === "owner" && (
                            <Crown className="size-3 text-amber-500 fill-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          {m.lastSignedInAt ? (
                            <span className="inline-flex items-center gap-0.5">
                              <Clock className="size-2.5" />
                              {formatRelative(m.lastSignedInAt)}
                            </span>
                          ) : (
                            <span className="italic">Sem login recente</span>
                          )}
                          <span>·</span>
                          <span>Entrou em {formatLongDate(m.joinedAt)}</span>
                        </div>
                      </div>
                    </Link>
                    {canKick && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            disabled={kickingId === m.userId}
                            aria-label={`Expulsar ${m.nickname}`}
                          >
                            {kickingId === m.userId ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <UserX className="size-3.5" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Expulsar {m.nickname}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esse user vai sair da liga imediatamente e receber uma notificação. Ele pode pedir pra voltar depois e você decide se aceita de novo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleKick(m.userId, m.nickname)}
                            >
                              Expulsar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {hiddenCount > 0 && (
        <p className="text-[11px] text-muted-foreground text-center px-2">
          {hiddenCount} {hiddenCount === 1 ? "membro inativo escondido" : "membros inativos escondidos"}. Use a busca pra encontrar.
        </p>
      )}
    </div>
  )
}
