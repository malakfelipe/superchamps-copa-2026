import Link from "next/link"
import { Shield, ChevronLeft } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Card, CardContent } from "@/components/ui/card"
import { AppShell } from "@/components/layout/AppShell"
import { getCurrentProfile } from "@/lib/data"

const LAST_UPDATED = "29 de maio de 2026"

function PolicyContent() {
  return (
    <Card>
      <CardContent className="p-6 space-y-5 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-bold text-base">1. Dados que coletamos</h2>
          <ul className="text-muted-foreground space-y-1 list-disc pl-5">
            <li><strong>E-mail e senha</strong> — para criar e acessar sua conta</li>
            <li><strong>Nickname e país</strong> — exibidos publicamente no app</li>
            <li><strong>Apostas, transações e atividades no app</strong> — necessários para funcionamento</li>
            <li><strong>Cookies de sessão</strong> — para manter você logado</li>
            <li><strong>Endereço IP e horário de login</strong> — para segurança e prevenção de fraudes</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">2. Como usamos seus dados</h2>
          <p className="text-muted-foreground">
            Os dados são usados exclusivamente para operar o SuperChamps: autenticar acesso,
            renderizar telas, calcular pools/odds, exibir rankings, enviar notificações que você
            configurou. <strong>Não vendemos seus dados para terceiros.</strong>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">3. O que é público</h2>
          <p className="text-muted-foreground">
            Você consente explicitamente, durante o cadastro, que seu{" "}
            <strong>histórico de apostas finalizadas</strong> e suas estatísticas básicas
            (saldo na Liga Global, posição, número de indicações) sejam exibidas publicamente
            no seu perfil em <code className="text-foreground bg-muted px-1 py-0.5 rounded">superchamps.com.br/u/seu-nickname</code>.
          </p>
          <p className="text-muted-foreground">
            Apostas em aberto (antes do kickoff) ficam <strong>privadas</strong> para
            preservar a mecânica do parimutuel.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">4. Compartilhamento com terceiros (processadores)</h2>
          <p className="text-muted-foreground">
            Usamos os seguintes provedores de infraestrutura, que processam dados em nosso nome:
          </p>
          <ul className="text-muted-foreground space-y-1 list-disc pl-5">
            <li><strong>Supabase</strong> — banco de dados e autenticação</li>
            <li><strong>Vercel</strong> — hospedagem da aplicação</li>
            <li><strong>Resend</strong> — envio de e-mails transacionais (confirmação, reset de senha)</li>
            <li><strong>football-data.org</strong> — dados esportivos (jogos, placares)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">5. Seus direitos (LGPD)</h2>
          <p className="text-muted-foreground">
            Você pode, a qualquer momento:
          </p>
          <ul className="text-muted-foreground space-y-1 list-disc pl-5">
            <li><strong>Acessar</strong> seus dados em Perfil → Privacidade e segurança</li>
            <li><strong>Corrigir</strong> nickname, avatar, país em Perfil → Editar perfil</li>
            <li><strong>Excluir</strong> sua conta integralmente em Perfil → Privacidade</li>
            <li><strong>Solicitar exportação</strong> dos seus dados via e-mail</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">6. Retenção de dados</h2>
          <p className="text-muted-foreground">
            Dados são mantidos enquanto sua conta estiver ativa. Após exclusão, apostas
            finalizadas podem ser anonimizadas (nickname trocado por &quot;usuário-deletado&quot;)
            para preservar a integridade dos rankings históricos das competições.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">7. Cookies</h2>
          <p className="text-muted-foreground">
            Usamos cookies essenciais para autenticação e sessão. Não usamos cookies de
            rastreamento de terceiros para publicidade.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-base">8. Contato</h2>
          <p className="text-muted-foreground">
            Para qualquer questão de privacidade, exercício de direitos LGPD ou denúncia
            de violação:{" "}
            <a href="mailto:privacidade@superchamps.com.br" className="text-primary hover:underline">
              privacidade@superchamps.com.br
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
        <Shield className="size-5 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Política de Privacidade</h1>
        <p className="text-xs text-muted-foreground">Última atualização: {LAST_UPDATED}</p>
      </div>
    </div>
  )
}

export default async function PrivacidadePoliticaPage() {
  const profile = await getCurrentProfile()

  if (profile) {
    return (
      <AppShell balance={profile.balance} nickname={profile.nickname} avatarUrl={profile.avatarUrl}>
        <div className="space-y-5">
          <PageHeader />
          <PolicyContent />
        </div>
      </AppShell>
    )
  }

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
        <PolicyContent />
      </main>
    </div>
  )
}
