import Link from "next/link"
import { Users, TrendingUp, Sparkles, ArrowRight, CheckCircle2, Trophy, Heart } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { JsonLd } from "@/components/JsonLd"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://superchamps.com.br"

// Structured data: Organization + WebSite (SearchAction habilita sitelinks search box).
// Schema.org de cada um documenta o que o Google espera.
const homepageJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SuperChamps",
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description: "Plataforma de bolão virtual da Copa do Mundo 2026 com mecânica parimutuel. Sem dinheiro real.",
    sameAs: [],  // adicionar Instagram/Twitter/etc quando tiver
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SuperChamps",
    url: SITE_URL,
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/ligas?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <JsonLd data={homepageJsonLd} />
      {/* HEADER */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold tracking-tight">SuperChamps</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/blog">Blog</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/cadastro">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 sm:py-20 space-y-16">
        {/* HERO */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="size-3" />
            Pronto pra Copa 2026 · começa 11 de junho
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Junta a galera,
            <br />
            <span className="text-primary">palpita junto, torce junto.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Bolão da Copa do Mundo 2026 com seus amigos. Sem dinheiro de verdade. Sem casa querendo
            seu suado. Só palpite, ranking e provocação na mesa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/cadastro">
                Entrar e palpitar
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link href="/login">Já tô dentro</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            <CheckCircle2 className="size-3 inline mr-1" />
            Você ganha 1.000 pontos pra começar · zero dinheiro real envolvido · só pra maiores de 18
          </p>
        </section>

        {/* FEATURES */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 space-y-2">
              <Trophy className="size-8 text-primary" />
              <h3 className="font-bold">Copa do começo ao fim</h3>
              <p className="text-sm text-muted-foreground">
                Os 104 jogos, atualizados sozinhos. Você só precisa palpitar.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-2">
              <TrendingUp className="size-8 text-primary" />
              <h3 className="font-bold">Você define a odd, não a casa</h3>
              <p className="text-sm text-muted-foreground">
                Quanto menos gente apostar no mesmo que você, maior o prêmio. Coragem paga.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-2">
              <Users className="size-8 text-primary" />
              <h3 className="font-bold">Sua liga, sua tribo</h3>
              <p className="text-sm text-muted-foreground">
                Cria uma liga só dos seus amigos. Manda o código no WhatsApp. Quem ganhar, paga a
                próxima cerveja.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* MANIFESTO — por que SuperChamps existe */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-amber-50/40 dark:to-amber-950/20 border-2 border-primary/20 rounded-2xl p-6 sm:p-10 space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Heart className="size-5 text-primary fill-primary/30" />
            <Badge variant="default" className="bg-primary text-primary-foreground">
              Por que SuperChamps existe
            </Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Bolão é coisa séria. Aposta com dinheiro, nem tanto.
          </h2>
          <div className="text-muted-foreground leading-relaxed space-y-3">
            <p>
              Bolão tradicional é chato e a galera some no meio do campeonato. Bolão online com
              dinheiro de verdade é arriscado, e a casa sempre ganha no fim.
            </p>
            <p>
              A gente criou o SuperChamps porque queria juntar os amigos pra torcer juntos{" "}
              <strong className="text-foreground">sem ninguém perder grana</strong>. Pontos virtuais,
              ranking pra vida toda, transparência total — quer ver como o líder chegou lá? Olha os
              palpites dele e aprende.
            </p>
            <p className="text-foreground font-medium">
              Se você gosta de apostar dinheiro de verdade, doa pra quem precisa. Esse tipo de gente
              merece sua sorte. Aqui é só pra brincar.
            </p>
          </div>
        </section>

        {/* MECHANIC EXPLAIN — versão mais leve */}
        <section className="bg-muted/40 rounded-2xl p-6 sm:p-10 space-y-4 max-w-3xl mx-auto">
          <Badge variant="secondary">Como funciona</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Você palpita, a galera palpita, o saldo decide o prêmio.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Quanto mais gente apostar no mesmo que você, menos cada um leva. Quanto menos gente
            acreditar no que você acredita,{" "}
            <strong className="text-foreground">mais pontos você ganha se acertar.</strong>
            {" "}Simples assim. (Sim, é igual nos cassinos — só que aqui ninguém perde dinheiro real.)
          </p>
        </section>
      </main>

      <footer className="border-t mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-3">
          <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
            SuperChamps · Pontos virtuais, diversão real. Quer apostar dinheiro de verdade?
            {" "}<strong className="text-foreground">Doa pra quem precisa.</strong> A gente fica com sua torcida.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t">
            <span>© 2026 SuperChamps</span>
            <div className="flex gap-4">
              <Link href="/termos" className="hover:text-foreground">Termos</Link>
              <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
