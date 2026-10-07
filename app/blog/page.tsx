import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PillarBadge } from "@/components/blog/PillarBadge"
import { JsonLd } from "@/components/JsonLd"
import { getPublishedPosts } from "@/lib/data"
import { formatLongDate } from "@/lib/format"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://superchamps.com.br"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Conteúdo sobre bolão, Copa do Mundo 2026 e por que jogar com amigos é diferente de apostar dinheiro em casa de bet.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog do SuperChamps",
    description: "Bolão, Copa, cultura e o lado escuro das bets.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
}

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Blog do SuperChamps",
  description: "Bolão da Copa, cultura e o lado escuro das bets.",
  url: `${SITE_URL}/blog`,
  inLanguage: "pt-BR",
  publisher: {
    "@type": "Organization",
    name: "SuperChamps",
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/icon-512.png`,
    },
  },
}

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts()

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={blogJsonLd} />

      {/* HEADER */}
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-bold tracking-tight text-sm">SuperChamps</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/cadastro">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        {/* HERO */}
        <div className="mb-10 space-y-3">
          <div className="size-12 rounded-2xl bg-primary/10 grid place-items-center mb-2">
            <BookOpen className="size-6 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Blog</h1>
          <p className="text-base text-muted-foreground max-w-xl">
            Bolão, Copa 2026, e por que jogar com amigos é diferente de apostar dinheiro em casa de bet.
          </p>
        </div>

        {/* LISTA */}
        {posts.length === 0 ? (
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="p-8 text-center space-y-2">
              <BookOpen className="size-6 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold">Sem posts ainda</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tá vindo. Primeiro post: <em>"Bolão x Bet: a diferença não é o dinheiro"</em>.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t mt-16">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
          SuperChamps © 2026 ·{" "}
          <Link href="/termos" className="hover:text-foreground">Termos</Link> ·{" "}
          <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link> ·{" "}
          <Link href="/blog/rss.xml" className="hover:text-foreground">RSS</Link>
        </div>
      </footer>
    </div>
  )
}

function PostCard({ post }: { post: Awaited<ReturnType<typeof getPublishedPosts>>[number] }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <Card className="overflow-hidden hover:border-primary/40 transition-colors">
        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt || post.title}
            className="w-full aspect-[16/9] object-cover"
            loading="lazy"
          />
        )}
        <CardContent className="p-5 space-y-2">
          <PillarBadge pillar={post.pillar} size="sm" />
          <h2 className="text-lg sm:text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          {post.subtitle && (
            <p className="text-sm text-muted-foreground italic">{post.subtitle}</p>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
          <div className="text-[11px] text-muted-foreground flex items-center gap-2 pt-1">
            <span>{formatLongDate(post.publishedAt)}</span>
            {post.readingTimeMinutes && (
              <>
                <span>·</span>
                <span>{post.readingTimeMinutes} min de leitura</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
