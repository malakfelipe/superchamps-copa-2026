"use client"

import Link from "next/link"
import { useActionState } from "react"
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePasswordAction, type UpdatePasswordResult } from "../../(auth)/actions"

export default function NovaSenhaPage() {
  const [state, formAction, isPending] = useActionState<UpdatePasswordResult, FormData>(
    updatePasswordAction,
    {},
  )

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
          {state.success ? (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <div className="size-14 rounded-full bg-primary/10 grid place-items-center mx-auto">
                  <CheckCircle2 className="size-7 text-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-xl">Senha atualizada!</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Já pode usar a nova senha pra entrar.
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link href="/inicio">Ir pro app</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-1">
                <div className="size-12 rounded-full bg-primary/10 grid place-items-center mb-2">
                  <KeyRound className="size-5 text-primary" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">Definir nova senha</h1>
                <p className="text-sm text-muted-foreground">
                  Escolha uma senha que você consiga lembrar — ou salve no gerenciador.
                </p>
              </div>

              <Card>
                <CardContent className="p-5">
                  <form action={formAction} className="space-y-4">
                    {state.error && (
                      <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                        <AlertCircle className="size-4 mt-0.5 shrink-0" />
                        <span>{state.error}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="password">Nova senha</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                        minLength={8}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="passwordConfirm">Confirmar nova senha</Label>
                      <Input
                        id="passwordConfirm"
                        name="passwordConfirm"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Repita a mesma senha"
                        minLength={8}
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full h-11" disabled={isPending}>
                      {isPending ? "Atualizando..." : "Atualizar senha"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground">
                Não foi você que pediu?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Voltar pro login
                </Link>{" "}
                e cuide da segurança da conta.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
