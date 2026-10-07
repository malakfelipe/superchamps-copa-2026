import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ChevronLeft, KeyRound, LogOut, AlertTriangle, Trash2, Eye, ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/layout/AppShell"
import { getCurrentProfile } from "@/lib/data"

export default async function PrivacidadePage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  return (
    <AppShell balance={profile.balance} nickname={profile.nickname} avatarUrl={profile.avatarUrl}>
      <div className="space-y-5">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link href="/perfil">
            <ChevronLeft className="size-4 mr-1" />
            Voltar pro perfil
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Privacidade e segurança</h1>
          <p className="text-sm text-muted-foreground">Senha, sessões e dados pessoais.</p>
        </div>

        {/* SENHA */}
        <Card>
          <CardContent className="p-0">
            <Link href="/recuperar-senha" className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-colors">
              <div className="size-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                <KeyRound className="size-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Alterar senha</div>
                <div className="text-xs text-muted-foreground">Envia link de redefinição pro seu e-mail</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* TRANSPARÊNCIA */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Eye className="size-4 text-foreground shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="font-bold text-sm">Visibilidade do seu histórico</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No SuperChamps, o histórico de <strong>apostas finalizadas</strong> é{" "}
                  <strong className="text-foreground">sempre público</strong> — outros usuários
                  podem ver no seu perfil <code className="font-mono text-foreground">/u/{profile.nickname}</code>.
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Apostas em aberto (antes do kickoff) ficam privadas até o jogo começar.
                </p>
                <Badge variant="outline" className="mt-2 gap-1 text-[10px]">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Público
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SESSÕES */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-bold text-sm">Sessões ativas</h2>
            <div className="flex items-center gap-3 text-sm">
              <div className="size-9 rounded-lg bg-muted grid place-items-center">
                <LogOut className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Sessão atual</div>
                <div className="text-xs text-muted-foreground">Windows · Chrome · ativa agora</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Gerenciamento de sessões múltiplas vem em uma atualização futura.
            </p>
          </CardContent>
        </Card>

        {/* LGPD — EXCLUSÃO */}
        <Card className="border-destructive/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="font-bold text-sm text-destructive">Zona perigosa</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Excluir sua conta apaga seu perfil, apostas em aberto (revertendo stakes) e remove
                  você das ligas. O histórico de apostas finalizadas pode ser anonimizado
                  (conforme exigência LGPD).
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 gap-1.5" disabled>
              <Trash2 className="size-4" />
              Excluir minha conta
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Função ativada após validação por advogado do fluxo LGPD.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
