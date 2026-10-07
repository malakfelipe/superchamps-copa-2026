import Link from "next/link"
import { FileText, ChevronLeft } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Card, CardContent } from "@/components/ui/card"
import { AppShell } from "@/components/layout/AppShell"
import { getCurrentProfile } from "@/lib/data"

const LAST_UPDATED = "29 de maio de 2026"

function TermsContent() {
  return (
    <Card>
      <CardContent className="p-6 space-y-5 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-bold text-base">1. Sobre o SuperChamps</h2>
          <p className="text-muted-foreground">
            SuperChamps é uma plataforma de bolão virtual com mecânica parimutuel.
            As apostas são feitas exclusivamente com moeda virtual interna (pontos),
            sem qualquer envolvimento de dinheiro real, prêmios em dinheiro ou conversibilidade.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">2. Cadastro e elegibilidade</h2>
          <p className="text-muted-foreground">
            Para usar a plataforma você precisa ter <strong>18 anos ou mais</strong>,
            aceitar estes termos, a política de privacidade e o consentimento de transparência
            pública do histórico de apostas. Cada e-mail pode criar apenas uma conta.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">3. Pontos virtuais</h2>
          <p className="text-muted-foreground">
            Pontos não têm valor monetário e não são convertíveis em dinheiro ou bens.
            Cada usuário começa com 1.000 pts e o saldo reseta ao final de cada competição.
            O cap por aposta é de 50% do saldo atual.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">4. Transparência pública</h2>
          <p className="text-muted-foreground">
            Ao se cadastrar, você consente que seu <strong>histórico de apostas finalizadas</strong>
            seja exibido publicamente no seu perfil (em <code className="text-foreground bg-muted px-1 py-0.5 rounded">superchamps.com.br/u/seu-nickname</code>).
            Apostas em aberto (antes do kickoff) permanecem privadas para preservar a mecânica
            do parimutuel.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">5. Liga Global e ligas privadas</h2>
          <p className="text-muted-foreground">
            Todo usuário entra automaticamente na Liga Global. Você pode criar ligas privadas
            adicionais e convidar amigos por código. Apenas a Liga Global é pública —
            ligas privadas são acessíveis somente por convite.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">6. Comportamento esperado</h2>
          <p className="text-muted-foreground">
            Não é permitido criar múltiplas contas, manipular pools coordenadamente
            com outros usuários, ou usar o sistema para fraudes (ex: criar contas falsas
            pra ganhar bônus de indicação). Violações podem resultar em suspensão ou
            exclusão da conta.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">7. Limitação de responsabilidade</h2>
          <p className="text-muted-foreground">
            Os dados esportivos vêm de fontes terceiras (football-data.org). Em caso
            de divergência com o resultado oficial, podemos reprocessar resultados.
            O SuperChamps não se responsabiliza por interrupções dos provedores externos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">8. Mudanças nos termos</h2>
          <p className="text-muted-foreground">
            Podemos atualizar estes termos com aviso prévio por e-mail. Continuar usando
            o app após uma atualização significa concordância com a nova versão.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">9. Contato</h2>
          <p className="text-muted-foreground">
            Dúvidas sobre estes termos:{" "}
            <a href="mailto:contato@superchamps.com.br" className="text-primary hover:underline">
              contato@superchamps.com.br
            </a>
          </p>
        </section>
      </CardContent>
    </Card>
  )
}

function PageHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-lg bg-primary/10 grid place-items-center">
        <FileText className="size-5 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Termos de uso</h1>
        <p className="text-xs text-muted-foreground">Última atualização: {LAST_UPDATED}</p>
      </div>
    </div>
  )
}

export default async function TermosPage() {
  const profile = await getCurrentProfile()

  // Usuário logado → AppShell completo
  if (profile) {
    return (
      <AppShell balance={profile.balance} nickname={profile.nickname} avatarUrl={profile.avatarUrl}>
        <div className="space-y-5">
          <PageHeader />
          <TermsContent />
        </div>
      </AppShell>
    )
  }

  // Usuário deslogado → header standalone
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold tracking-tight">SuperChamps</span>
          </Link>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ChevronLeft className="size-3" /> Voltar
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <PageHeader />
        <TermsContent />
      </main>
    </div>
  )
}
