"use client"

import Link from "next/link"
import { useActionState } from "react"
import { ChevronLeft, AlertCircle, KeyRound, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppShell } from "@/components/layout/AppShell"
import { joinLeagueAction, type JoinLeagueResult } from "../actions"

export default function EntrarLigaPage() {
  const [state, formAction, isPending] = useActionState<JoinLeagueResult, FormData>(
    joinLeagueAction,
    {},
  )

  return (
    <AppShell balance={850} nickname="joaomalak">
      <div className="space-y-5">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link href="/ligas">
            <ChevronLeft className="size-4 mr-1" />
            Voltar pras ligas
          </Link>
        </Button>

        <div className="space-y-1">
          <div className="size-12 rounded-full bg-primary/10 grid place-items-center mb-2">
            <KeyRound className="size-5 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Entrar em liga</h1>
          <p className="text-sm text-muted-foreground">
            Recebeu um código de convite? Cola aqui pra entrar.
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
                <Label htmlFor="code">Código de convite</Label>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  required
                  placeholder="AMIGOS-K8T2"
                  className="font-mono uppercase text-lg h-12 tracking-wider text-center"
                  aria-invalid={!!state.fieldErrors?.code}
                  autoComplete="off"
                />
                {state.fieldErrors?.code ? (
                  <p className="text-xs text-destructive">{state.fieldErrors.code}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Formato: 6 letras + - + 4 caracteres. Ex:{" "}
                    <code className="bg-muted px-1 py-0.5 rounded font-mono">AMIGOS-K8T2</code>
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full h-11" disabled={isPending}>
                {isPending ? "Entrando..." : "Entrar na liga"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-2 pt-2">
          <p className="text-sm text-muted-foreground">
            Sem código? Você ainda pode <strong className="text-foreground">criar sua própria liga</strong>.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/ligas/criar">
              <Plus className="size-3.5 mr-1" />
              Criar liga
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
