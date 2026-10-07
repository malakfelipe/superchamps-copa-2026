import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft, HelpCircle, Mail, Coins, Flame, Globe, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/components/layout/AppShell"
import { FAQList, type FAQItem } from "./FAQList"
import { getCurrentProfile } from "@/lib/data"

const FAQ: FAQItem[] = [
  // ─── MECÂNICA DE APOSTAS ─────────────────────────────────────────────
  {
    category: "mecanica",
    q: "Como funcionam as odds?",
    a: "É parimutuel: a odd de cada resultado vem do pool do grupo. Total de pontos apostados ÷ pontos apostados nesse resultado = odd. Quanto menos gente apostar no mesmo que você, maior o retorno.",
  },
  {
    category: "mecanica",
    q: "Quando a odd é congelada?",
    a: "No horário do kickoff oficial do jogo. Sua aposta paga: stake × odd no kickoff (se você acertar).",
  },
  {
    category: "mecanica",
    q: "Posso cancelar uma aposta?",
    a: "Sim, até 5 minutos antes do kickoff. Após esse horário a aposta vira compromisso definitivo.",
  },
  {
    category: "mecanica",
    q: "O que acontece se o jogo for cancelado?",
    a: "Todas as apostas são reembolsadas — você recebe o stake de volta integralmente.",
  },
  {
    category: "mecanica",
    q: "E se ninguém apostou no resultado real?",
    a: "Pool órfão: todas as apostas daquele mercado são reembolsadas (ninguém ganha, ninguém perde).",
  },
  {
    category: "mecanica",
    q: "Posso apostar em mais de um resultado do mesmo jogo?",
    a: "Sim, hedge é permitido. Você pode apostar 100 pts no Brasil e 30 pts no empate, por exemplo. O limite de 50% por aposta se aplica a cada uma individualmente.",
  },
  {
    category: "mecanica",
    q: "Quanto o mata-mata paga a mais?",
    a: "Pra deixar a fase eliminatória mais emocionante, as apostas vencedoras pagam multiplicado: 16-avos, oitavas, quartas, semifinal e disputa de 3° lugar pagam 3×, e a final paga 5× o que pagariam na fase de grupos. O stake é debitado normal — só o payout é multiplicado. Procura o selo 'PAGA 3×' (ou 'PAGA 5×') no jogo.",
  },
  {
    category: "mecanica",
    q: "O que é o Jogo do Dia 2×?",
    a: "Na fase de grupos, a comunidade vota na home em qual jogo do dia recebe multiplicador 2×. O jogo mais votado é escolhido e paga o dobro pra quem acertar (mesma mecânica do selo 'PAGA 2×'). Vale só na fase de grupos — no mata-mata não existe Jogo do Dia, porque lá já paga 3× ou 5×.",
  },
  {
    category: "mecanica",
    q: "Por que não tem opção de empate no mata-mata?",
    a: "Porque jogos de eliminatória SEMPRE têm vencedor — se empata em 90 minutos vai pra prorrogação, se empata na prorrogação vai pros pênaltis. Quem ganhar nos pênaltis vence o mercado. Você só aposta em qual time se classifica, não em placar de 90 minutos.",
  },

  // ─── PONTUAÇÃO E SALDO ───────────────────────────────────────────────
  {
    category: "pontuacao",
    q: "Como funciona meu saldo de pontos?",
    a: "Você começa com 1.000 pts no cadastro. Esse saldo é único e vale em TODAS as ligas que você participa — não é por liga. Apostas debitam, vitórias creditam, reembolsos devolvem.",
  },
  {
    category: "pontuacao",
    q: "Qual o limite máximo de stake por aposta?",
    a: "50% do seu saldo atual. Se você tem 800 pts, pode apostar no máximo 400 numa única jogada. Isso evita all-in suicida e força gestão de risco.",
  },
  {
    category: "pontuacao",
    q: "Como funciona o reset de saldo?",
    a: "Ao final de cada competição (Copa, Brasileirão...), seu saldo volta a 1.000 pts automaticamente. O ranking final daquela competição fica salvo no histórico. Na próxima competição todo mundo começa do zero novamente.",
  },
  {
    category: "pontuacao",
    q: "Recebi 50 pts hoje sem motivo, o que é?",
    a: "Boost diário de saldo baixo: quando seu saldo cai abaixo de 10 pts, você recebe +50 pts automaticamente uma vez por dia. Você nunca fica fora do jogo.",
  },
  {
    category: "pontuacao",
    q: "Como ganho mais pontos sem apostar?",
    a: "Convidando amigos. Cada amigo que se cadastra usando seu código rende +50 pts (cap de 5 indicações premiadas). Veja em Perfil → Indicar amigos.",
  },

  // ─── LIGAS ───────────────────────────────────────────────────────────
  {
    category: "ligas",
    q: "Se eu entrar numa liga no meio da competição, perco a história anterior?",
    a: "Sim — e isso é intencional. O ranking dentro de uma liga conta SOMENTE as apostas feitas depois que você entrou nela. Quem entra no meio começa do zero (0 pts líquidos no ranking daquela liga), mas o saldo geral de pontos continua o mesmo.",
  },
  {
    category: "ligas",
    q: "Posso estar em mais de uma liga ao mesmo tempo?",
    a: "Sim. O mesmo saldo de pontos serve pra todas, mas cada liga tem seu próprio ranking calculado a partir do seu joined_at em cada uma. Você pode estar bombando numa liga e patinando em outra simultaneamente.",
  },
  {
    category: "ligas",
    q: "O que é a Liga Global?",
    a: "É a única liga pública do app. Todo usuário cadastrado entra automaticamente nela ao criar a conta. É onde você compete contra TODA a comunidade. Não dá pra sair dela — é o ranking geral do SuperChamps.",
  },
  {
    category: "ligas",
    q: "Posso criar uma liga pública?",
    a: "Não. Só existem dois tipos: a Liga Global (única, automática) e ligas privadas (você cria, gera código de convite, e só quem tem o código entra). Quer juntar amigos? Cria privada e manda o link/código por WhatsApp.",
  },

  // ─── TRANSPARÊNCIA ───────────────────────────────────────────────────
  {
    category: "transparencia",
    q: "Posso ver as apostas de outros usuários?",
    a: "Sim — apostas finalizadas são públicas no perfil de cada usuário (/u/nickname). Apostas em aberto ficam privadas até o kickoff (proteção do parimutuel).",
  },
  {
    category: "transparencia",
    q: "Posso ocultar minhas apostas?",
    a: "Hoje não. A transparência é parte central do produto. Solicitações específicas de privacidade são tratadas caso a caso pelo suporte.",
  },

  // ─── CONTA E PERFIL ──────────────────────────────────────────────────
  {
    category: "conta",
    q: "Preciso confirmar meu e-mail?",
    a: "Sim, pra liberar o 1º saque de bônus e proteger sua conta. Você consegue navegar pelo app antes, mas confirme o e-mail antes da primeira aposta. Se não chegar, tenta a opção 'Reenviar' no Perfil.",
  },
  {
    category: "conta",
    q: "Esqueci minha senha, como recupero?",
    a: "Vai em /login e clica em 'Esqueci a senha'. Você recebe um e-mail com link pra redefinir. O link vale por 1 hora.",
  },
  {
    category: "conta",
    q: "Como mudo meu nickname/avatar/país?",
    a: "Em Perfil → Editar perfil. O nickname é único, então pode pedir um disponível.",
  },
  {
    category: "conta",
    q: "Quero excluir minha conta. Como faço?",
    a: "Em Perfil → Privacidade e segurança → Excluir conta. O processo é irreversível e apaga todos os seus dados (perfis, apostas, ligas que você é owner). Apostas em curso são canceladas com refund.",
  },
]

export default async function AjudaPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  return (
    <AppShell balance={profile.balance} nickname={profile.nickname} avatarUrl={profile.avatarUrl}>
      <div className="space-y-5">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link href="/perfil">
            <ChevronLeft className="size-4 mr-1" />
            Voltar
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 grid place-items-center">
            <HelpCircle className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Ajuda</h1>
            <p className="text-sm text-muted-foreground">Como tudo funciona no SuperChamps.</p>
          </div>
        </div>

        {/* INÍCIO RÁPIDO — destaques visuais */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 mb-2">
            Início rápido
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Card className="bg-primary/[0.04] border-primary/20">
              <CardContent className="p-3 space-y-1.5">
                <div className="size-8 rounded-lg bg-primary/15 grid place-items-center">
                  <Coins className="size-4 text-primary" />
                </div>
                <div className="font-semibold text-sm leading-tight">1.000 pts grátis</div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Você começa com saldo. Cap de 50% por aposta.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50/40 border-amber-200/40 dark:bg-amber-950/20 dark:border-amber-900/30">
              <CardContent className="p-3 space-y-1.5">
                <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 grid place-items-center">
                  <Flame className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="font-semibold text-sm leading-tight">Mata-mata 3× e 5×</div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Eliminatórias pagam 3×; a final, 5×.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50/40 border-blue-200/40 dark:bg-blue-950/20 dark:border-blue-900/30">
              <CardContent className="p-3 space-y-1.5">
                <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 grid place-items-center">
                  <Globe className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="font-semibold text-sm leading-tight">Liga Global</div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Auto-join. Compete contra toda comunidade.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-violet-50/40 border-violet-200/40 dark:bg-violet-950/20 dark:border-violet-900/30">
              <CardContent className="p-3 space-y-1.5">
                <div className="size-8 rounded-lg bg-violet-100 dark:bg-violet-950/40 grid place-items-center">
                  <Eye className="size-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="font-semibold text-sm leading-tight">Transparência</div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Apostas finalizadas são públicas (/u/nick).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ COM BUSCA + CATEGORIAS */}
        <FAQList faq={FAQ} />

        {/* CONTATO */}
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-4 flex items-start gap-3">
            <Mail className="size-5 text-foreground shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold">Não achou o que procurava?</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manda um e-mail pra{" "}
                <a href="mailto:ajuda@superchamps.com.br" className="text-primary hover:underline">
                  ajuda@superchamps.com.br
                </a>
                {" "}que a gente responde rápido.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
