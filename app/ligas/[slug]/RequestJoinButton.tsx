"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { requestJoinLeagueAction } from "../actions"

type Props = {
  leagueId: string
  leagueName: string
  initialPending?: boolean
}

export function RequestJoinButton({ leagueId, leagueName, initialPending = false }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [hasRequested, setHasRequested] = useState(initialPending)

  async function handleClick() {
    setIsPending(true)
    const res = await requestJoinLeagueAction(leagueId)
    setIsPending(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    setHasRequested(true)
    toast.success(`Solicitação enviada pra ${leagueName}`, {
      description: "O owner vai receber a notificação. Você é avisado quando ele decidir.",
    })
    router.refresh()
  }

  if (hasRequested) {
    return (
      <Button size="lg" variant="outline" disabled className="w-full gap-1.5 text-amber-700">
        <Check className="size-4" />
        Solicitação enviada
      </Button>
    )
  }

  return (
    <Button size="lg" onClick={handleClick} disabled={isPending} className="w-full gap-1.5">
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      Solicitar entrada
    </Button>
  )
}
