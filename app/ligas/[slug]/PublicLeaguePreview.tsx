import Link from "next/link"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Lock, Crown, Sparkles, ArrowRight } from "lucide-react"
import { formatLongDate } from "@/lib/format"
import type { PublicLeagueInfo } from "@/lib/data/types"

type Props = {
  league: PublicLeagueInfo
}

/**
 * Tela vista por visitante NÃO LOGADO ao abrir um link de liga.
 * Mostra só metadados públicos + CTA pra cadastrar. Nada sensível.
 */
export function PublicLeaguePreview({ league }: Props) {
  const signupUrl = `/cadastro?liga=${encodeURIComponent(league.slug)}`
  const loginUrl = `/login?next=${encodeURIComponent(`/ligas/${league.slug}`)}`

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* HEADER MINIMALISTA */}
      <header className="border-b bg-background">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold tracking-tight">SuperChamps</span>
          </Link>
          <Button size="sm" variant="ghost" asChild>
            <Link href={loginUrl}>Entrar</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md space-y-5">
          {/* HERO DA LIGA */}
          <Card className="overflow-hidden border-2">
            <div className="bg-gradient-to-br from-primary/20 via-amber-100/30 to-rose-100/20 dark:from-primary/30 dark:via-amber-950/30 dark:to-rose-950/20 px-5 py-6">
              <div className="size-14 rounded-2xl bg-background/80 grid place-items-center shrink-0 shadow-sm mx-auto mb-3">
                <Users className="size-7 text-primary" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-center leading-tight">
                {league.name}
              </h1>
              <div className="text-xs text-muted-foreground text-center mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Crown className="size-3" />
                  {league.ownerNickname}
                </span>
                <span>·</span>
                <span>{league.memberCount} {league.memberCount === 1 ? "membro" : "membros"}</span>
                <span>·</span>
                <span>Desde {formatLongDate(league.createdAt)}</span>
              </div>
              {league.description && (
                <p className="text-sm text-foreground/80 mt-3 text-center leading-snug">
                  {league.description}
                </p>
              )}
            </div>
          </Card>

          {/* CTA PRINCIPAL */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="text-center space-y-1">
                <h2 className="font-extrabold text-lg">Bora palpitar junto?</h2>
                <p className="text-sm text-muted-foreground leading-snug">
                  Cria sua conta grátis pra solicitar entrada nessa liga e palpitar nos jogos da Copa 2026.
                </p>
              </div>
              <Button size="lg" className="w-full gap-1.5" asChild>
                <Link href={signupUrl}>
                  Cadastra grátis
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Já tem conta? <Link href={loginUrl} className="text-primary hover:underline font-medium">Entra aqui</Link>
              </p>
            </CardContent>
          </Card>

          {/* SOBRE PRIVACIDADE DOS MEMBROS */}
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="p-3 text-[11px] text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                <Sparkles className="size-3.5" />
                Como funciona
              </div>
              <p>• Você cadastra, confirma o e-mail, e cai na página da liga</p>
              <p>• Lá você solicita entrada — o owner decide se aceita</p>
              <p>• Quando aceito, começa com <strong className="text-foreground">1.000 pts</strong> pra palpitar</p>
              {!league.membersVisible && (
                <p className="pt-1 flex items-start gap-1">
                  <Lock className="size-3 mt-0.5 shrink-0" />
                  <span>O owner escondeu a lista de membros. Você só vai vê-la depois de entrar.</span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
