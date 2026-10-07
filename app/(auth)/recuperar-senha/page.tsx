"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, AlertCircle, Mail } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordResetAction } from "../actions"

export default function RecuperarSenhaPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await requestPasswordResetAction(formData)
    setLoading(false)
    if (result.error) setError(result.error)
    else if (result.success) setSuccess(true)
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b bg-background">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold tracking-tight">SuperChamps</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md space-y-5">
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="size-3" /> Voltar pro login
          </Link>

          {success ? (
            <Card>
              <CardContent className="p-6 text-center space-y-3">
                <div className="size-12 rounded-full bg-primary/10 grid place-items-center mx-auto">
                  <Mail className="size-6 text-primary" />
                </div>
                <h1 className="font-bold text-xl">Cheque seu e-mail</h1>
                <p className="text-sm text-muted-foreground">
                  Se a conta existe, mandamos um link pra redefinir a senha. O link expira em 1 hora.
                </p>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">Voltar pro login</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold tracking-tight">Recuperar senha</h1>
                <p className="text-sm text-muted-foreground">
                  Digita seu e-mail. Vamos mandar um link pra redefinir.
                </p>
              </div>

              <Card>
                <CardContent className="p-5">
                  <form action={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                        <AlertCircle className="size-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="voce@exemplo.com"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full h-11" disabled={loading}>
                      {loading ? "Enviando..." : "Enviar link de recuperação"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
