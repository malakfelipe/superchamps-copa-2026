"use client"

import { useTransition } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { resendConfirmationAction } from "../(auth)/actions"

type Props = {
  email: string
}

export function ResendConfirmButton({ email }: Props) {
  const [pending, startTransition] = useTransition()

  function handleResend() {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("email", email)
      const result = await resendConfirmationAction(formData)
      if (result.success) {
        toast.success("E-mail reenviado! Cheque sua caixa (e o spam).")
      } else {
        toast.error(result.error || "Não foi possível reenviar")
      }
    })
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleResend}
      disabled={pending}
      className="gap-1.5 border-amber-300 hover:bg-amber-100 text-amber-800 dark:border-amber-900 dark:hover:bg-amber-950/50 dark:text-amber-300 shrink-0"
    >
      <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Reenviando…" : "Reenviar"}
    </Button>
  )
}
