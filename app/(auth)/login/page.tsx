"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useActionState } from "react"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction, type LoginResult } from "../actions"
import { AuthErrorBanner } from "./AuthErrorBanner"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/30" />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const params = useSearchParams()
  const next = params.get("next") || "/inicio"

  const [state, formAction, isPending] = useActionState<LoginResult, FormData>(
    loginAction,
    {},
  )

  // AuthErrorBanner cuida de erros vindos por URL (hash ou query).
  // Aqui só mostramos erros de submit do form.
  const errorMsg = state.error

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
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="size-3" /> Voltar
          </Link>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight">Entrar</h1>
            <p className="text-sm text-muted-foreground">Bom te ver de novo.</p>
          </div>

          <AuthErrorBanner />

          <Card>
            <CardContent className="p-5">
              <form action={formAction} className="space-y-4">
                <input type="hidden" name="next" value={next} />

                {errorMsg && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    <AlertCircle className="size-4 mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
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

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link
                      href="/recuperar-senha"
                      className="text-xs text-primary hover:underline"
                    >
                      Esqueci
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full h-11" disabled={isPending}>
                  {isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="text-primary hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
