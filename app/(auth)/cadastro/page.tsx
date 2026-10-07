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
import { Checkbox } from "@/components/ui/checkbox"
import { signUpAction, type SignUpResult } from "../actions"

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/30" />}>
      <CadastroContent />
    </Suspense>
  )
}

function CadastroContent() {
  const params = useSearchParams()
  const leagueCode = params.get("liga") || ""

  const [state, formAction, isPending] = useActionState<SignUpResult, FormData>(
    signUpAction,
    {},
  )

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* HEADER */}
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
            <h1 className="text-2xl font-extrabold tracking-tight">Criar conta</h1>
            <p className="text-sm text-muted-foreground">
              {leagueCode ? (
                <>
                  Você está sendo convidado pra liga{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">
                    {leagueCode}
                  </code>
                  . Cadastra e entra automaticamente.
                </>
              ) : (
                "Leva menos de 1 minuto. Você ganha 1.000 pts pra começar."
              )}
            </p>
          </div>

          <Card>
            <CardContent className="p-5">
              <form action={formAction} className="space-y-4">
                {leagueCode && <input type="hidden" name="leagueCode" value={leagueCode} />}

                {/* Erro geral */}
                {state.error && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    <AlertCircle className="size-4 mt-0.5 shrink-0" />
                    <span>{state.error}</span>
                  </div>
                )}

                {/* E-mail */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="voce@exemplo.com"
                    aria-invalid={!!state.fieldErrors?.email}
                  />
                  {state.fieldErrors?.email && (
                    <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
                  )}
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    aria-invalid={!!state.fieldErrors?.password}
                  />
                  {state.fieldErrors?.password && (
                    <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirmação de senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirm">Confirme a senha</Label>
                  <Input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Digite a senha de novo"
                    aria-invalid={!!state.fieldErrors?.passwordConfirm}
                  />
                  {state.fieldErrors?.passwordConfirm && (
                    <p className="text-xs text-destructive">{state.fieldErrors.passwordConfirm}</p>
                  )}
                </div>

                {/* Nickname */}
                <div className="space-y-1.5">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder=""
                    pattern="[a-zA-Z0-9_.\-]{3,20}"
                    aria-invalid={!!state.fieldErrors?.nickname}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    3-20 caracteres. Letras, números, ponto, hífen ou underline.
                  </p>
                  {state.fieldErrors?.nickname && (
                    <p className="text-xs text-destructive">{state.fieldErrors.nickname}</p>
                  )}
                </div>

                {/* Código de indicação (opcional) */}
                <div className="space-y-1.5">
                  <Label htmlFor="referralCode" className="text-muted-foreground">
                    Código de indicação <span className="text-[10px]">(opcional)</span>
                  </Label>
                  <Input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    placeholder="AMIGO-A8B3"
                    className="font-mono uppercase"
                  />
                </div>

                {/* Consentimentos LGPD */}
                <div className="space-y-2.5 pt-2 border-t">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Termos
                  </p>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-start gap-2.5">
                      <Checkbox id="ageConfirmed" name="ageConfirmed" required className="mt-0.5" />
                      <label htmlFor="ageConfirmed" className="font-normal leading-snug cursor-pointer text-sm">
                        Declaro ter <strong>18 anos ou mais</strong>.
                      </label>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Checkbox id="termsAccepted" name="termsAccepted" required className="mt-0.5" />
                      <label htmlFor="termsAccepted" className="font-normal leading-snug cursor-pointer text-sm">
                        Aceito os <Link href="/termos" target="_blank" className="text-primary hover:underline">termos de uso</Link> e a <Link href="/privacidade" target="_blank" className="text-primary hover:underline">política de privacidade</Link>.
                      </label>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Checkbox id="publicBetsConsent" name="publicBetsConsent" required className="mt-0.5" />
                      <label htmlFor="publicBetsConsent" className="font-normal leading-snug cursor-pointer text-sm">
                        Compreendo e concordo que meu <strong>histórico de apostas finalizadas</strong> será <strong>visível publicamente</strong> para outros usuários da plataforma.
                      </label>
                    </div>
                  </div>
                  {state.fieldErrors?.consents && (
                    <p className="text-xs text-destructive">{state.fieldErrors.consents}</p>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full h-11" disabled={isPending}>
                  {isPending ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
