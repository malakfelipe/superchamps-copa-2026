"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Inbox, Check, X, Loader2, Eye, EyeOff, Trash2, ShieldAlert } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  decideJoinRequestAction, toggleMembersVisibilityAction, deleteLeagueAction,
} from "../actions"
import type { PendingJoinRequest } from "@/lib/data/types"
import { formatRelative } from "@/lib/format"

type Props = {
  leagueId: string
  leagueName: string
  membersVisible: boolean
  requests: PendingJoinRequest[]
}

function avatarColor(id: string): string {
  const palette = [
    "bg-emerald-100 text-emerald-700",
    "bg-blue-100 text-blue-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-purple-100 text-purple-700",
  ]
  const idx = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length
  return palette[idx]
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("")
}

export function PendingRequestsSection({ leagueId, leagueName, membersVisible, requests }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(requests)
  const [visible, setVisible] = useState(membersVisible)
  const [pendingDecisionIds, setPendingDecisionIds] = useState<Set<string>>(new Set())
  const [isTogglePending, startToggle] = useTransition()
  const [isDeletePending, startDelete] = useTransition()
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("")

  async function decide(requestId: string, approve: boolean, nickname: string) {
    setPendingDecisionIds((prev) => new Set(prev).add(requestId))
    const res = await decideJoinRequestAction(requestId, approve)
    setPendingDecisionIds((prev) => {
      const next = new Set(prev)
      next.delete(requestId)
      return next
    })

    if (res.error) {
      toast.error(res.error)
      return
    }

    setItems((prev) => prev.filter((r) => r.id !== requestId))
    toast.success(approve ? `${nickname} entrou na liga` : `Solicitação de ${nickname} recusada`)
    router.refresh()
  }

  function handleToggleVisibility() {
    startToggle(async () => {
      const next = !visible
      const res = await toggleMembersVisibilityAction(leagueId, next)
      if (res.error) {
        toast.error(res.error)
        return
      }
      setVisible(next)
      toast.success(next ? "Membros agora visíveis" : "Membros agora escondidos")
    })
  }

  function handleDelete() {
    if (deleteConfirmInput !== leagueName) {
      toast.error("O nome digitado não confere")
      return
    }
    startDelete(async () => {
      const res = await deleteLeagueAction(leagueId)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(`Liga "${leagueName}" deletada`)
      router.push("/ligas")
      router.refresh()
    })
  }

  return (
    <section id="solicitacoes" className="space-y-3 scroll-mt-20">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Inbox className="size-3.5" />
          Painel do owner
        </h2>
        {items.length > 0 && (
          <Badge className="text-[10px] h-5 px-2 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">
            {items.length} pendente{items.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* TOGGLE MEMBROS VISÍVEIS */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm flex items-center gap-1.5">
                {visible ? (
                  <Eye className="size-4 text-primary" />
                ) : (
                  <EyeOff className="size-4 text-muted-foreground" />
                )}
                {visible ? "Membros visíveis" : "Membros escondidos"}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {visible
                  ? "Qualquer visitante vê o ranking e a lista de membros."
                  : "Visitantes só veem o nome e o número de membros. Ranking fica escondido."}
              </p>
            </div>
            <Button
              size="sm"
              variant={visible ? "outline" : "default"}
              onClick={handleToggleVisibility}
              disabled={isTogglePending}
              className="shrink-0"
            >
              {isTogglePending ? <Loader2 className="size-3.5 animate-spin" /> : visible ? "Esconder" : "Mostrar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SOLICITAÇÕES PENDENTES */}
      {items.length === 0 ? (
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-5 text-center space-y-1">
            <Inbox className="size-5 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold">Sem solicitações pendentes</p>
            <p className="text-xs text-muted-foreground">
              Quando alguém pedir pra entrar, aparece aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {items.map((req) => {
                const isDeciding = pendingDecisionIds.has(req.id)
                return (
                  <div key={req.id} className="p-3.5">
                    <div className="flex items-start gap-3">
                      <Link href={`/u/${req.nickname}`} className="shrink-0">
                        <Avatar className="size-10">
                          {req.avatarUrl && <AvatarImage src={req.avatarUrl} alt={req.nickname} />}
                          <AvatarFallback className={`${avatarColor(req.userId)} text-xs font-bold`}>
                            {initials(req.nickname)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/u/${req.nickname}`}
                          className="font-semibold text-sm hover:text-primary transition-colors"
                        >
                          {req.nickname}
                        </Link>
                        <div className="text-[11px] text-muted-foreground">
                          Solicitou {formatRelative(req.createdAt)}
                        </div>
                        {req.message && (
                          <p className="text-xs text-foreground/80 mt-1.5 leading-snug bg-muted/40 rounded px-2 py-1.5">
                            &quot;{req.message}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => decide(req.id, false, req.nickname)}
                        disabled={isDeciding}
                      >
                        {isDeciding ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                        Recusar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => decide(req.id, true, req.nickname)}
                        disabled={isDeciding}
                      >
                        {isDeciding ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                        Aceitar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ZONA PERIGOSA — Deletar liga */}
      <Card className="border-destructive/40 bg-destructive/[0.02]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-destructive" />
            <h3 className="font-bold text-sm text-destructive">Zona perigosa</h3>
          </div>
          <div className="text-xs text-muted-foreground leading-snug">
            Deletar a liga remove <strong className="text-foreground">todos os membros, solicitações e o histórico desta liga</strong>. Os palpites e pontos dos jogadores continuam (eles só perdem essa liga). <strong className="text-foreground">Não dá pra desfazer.</strong>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Deletar liga
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-destructive" />
                  Deletar &quot;{leagueName}&quot;?
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm">
                    <p>
                      Vai remover a liga, todos os membros e todas as solicitações pendentes. <strong>Não tem volta.</strong>
                    </p>
                    <div className="space-y-1.5">
                      <label htmlFor="confirmName" className="text-xs font-medium">
                        Pra confirmar, digite o nome da liga:
                      </label>
                      <input
                        id="confirmName"
                        type="text"
                        value={deleteConfirmInput}
                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                        placeholder={leagueName}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmInput("")}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  disabled={isDeletePending || deleteConfirmInput !== leagueName}
                >
                  {isDeletePending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Deletar pra sempre
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </section>
  )
}
