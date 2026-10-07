"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Mail, ArrowRight, Check, AlertCircle, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { resendConfirmationAction } from "../../actions"

export function ConfirmeEmailContent() {
  const params = useSearchParams()
  const email = params.get("email") || ""
  const initiallyResent = params.get("resent") === "1"

  const [isPending, startTransition] = useTransition()
  const [resent, setResent] = useState(initiallyResent)
  const [error, setError] = useState<string | null>(null)

  function handleResend() {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.append("email", email)
      const res = await resendConfirmationAction(formData)
      if (res.error) {
        setError(res.error)
      } else {
        setResent(true)
      }
    })
  }

  return (
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <div className="size-16 rounded-full bg-primary/10 grid place-items-center mx-auto">
          <Mail className="size-8 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="font-bold text-2xl">Confirme seu e-mail</h1>
          {email ? (
            <p className="text-sm text-muted-foreground">
              Mandamos um link de confirmação para
              <br />
              <strong className="text-foreground font-mono break-all">{email}</strong>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Mandamos um link pra você confirmar a conta.
            </p>
          )}
        </div>

        {initiallyResent && !resent && (
          <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md p-3 text-left">
            <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
            <span>
              Este e-mail já tem cadastro. Reenviamos a confirmação. Se já confirmou antes, vá em{" "}
              <Link href="/login" className="text-primary hover:underline">Entrar</Link>.
            </span>
          </div>
        )}

        {resent && (
          <div className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-md p-3 text-left">
            <Check className="size-3.5 mt-0.5 shrink-0" />
            <span>E-mail reenviado. Cheque sua caixa (e o spam).</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 text-left">
            <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground space-y-1.5">
          <p>📥 Cheque a pasta de <strong>spam</strong> se não chegar em 2 min.</p>
          <p>⏰ O link vale por <strong>24h</strong>.</p>
          <p>🔁 Se mandar de novo, o link antigo deixa de funcionar.</p>
        </div>

        {email && (
          <Button
            variant="outline"
            className="w-full gap-1.5"
            onClick={handleResend}
            disabled={isPending}
          >
            <RotateCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Reenviando…" : "Reenviar e-mail"}
          </Button>
        )}

        <Button asChild className="w-full">
          <Link href="/inicio">
            Ir pro app
            <ArrowRight className="size-4 ml-1.5" />
          </Link>
        </Button>

        <p className="text-xs text-muted-foreground">
          Já confirmou?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
