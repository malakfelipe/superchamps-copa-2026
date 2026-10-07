import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Calendar, Clock } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PillarBadge } from "@/components/blog/PillarBadge"
import { MdxRender } from "@/components/blog/MdxRender"
import { JsonLd } from "@/components/JsonLd"
import { getPostBySlug } from "@/lib/data"
import { formatLongDate } from "@/lib/format"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://superchamps.com.br"

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: "Post não encontrado" }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${slug}`,
      type: "article",
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.authorName],
      images: post.coverImageUrl ? [{ url: post.coverImageUrl, alt: post.coverImageAlt || post.title }] : undefined,
    },
    twitter: {
      card: post.coverImageUrl ? "summary_large_image" : "summary",
      title: post.title,
      description: post.excerpt,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImageUrl || `${SITE_URL}/icon-512.png`,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "SuperChamps",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${slug}`,
    },
    inLanguage: "pt-BR",
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${slug}` },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />

      {/* HEADER */}
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-bold tracking-tight text-sm">SuperChamps</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/blog">
                <ChevronLeft className="size-3.5 mr-1" />
                Blog
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/cadastro">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <article className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        {/* META */}
        <div className="space-y-4 mb-8">
          <PillarBadge pillar={post.pillar} />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="text-lg text-muted-foreground italic leading-snug">
              {post.subtitle}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {formatLongDate(post.publishedAt)}
            </span>
            {post.readingTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {post.readingTimeMinutes} min de leitura
              </span>
            )}
            <span>· por {post.authorName}</span>
          </div>
        </div>

        {/* CAPA */}
        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt || post.title}
            className="w-full aspect-[16/9] object-cover rounded-xl mb-10"
          />
        )}

        {/* CONTEÚDO MDX */}
        <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h3:text-xl prose-h3:mt-8 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground">
          <MdxRender source={post.contentMdx} />
        </div>

        {/* CTA */}
        <Card className="mt-12 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
          <CardContent className="p-6 text-center space-y-3">
            <p className="font-bold text-base">
              Tá pronto pra montar o bolão da Copa 2026 com a galera?
            </p>
            <p className="text-sm text-muted-foreground">
              SuperChamps é grátis, sem dinheiro real, só palpite e zoeira.
            </p>
            <Button size="lg" asChild>
              <Link href="/cadastro">Criar conta grátis</Link>
            </Button>
          </CardContent>
        </Card>

        {/* TAGS */}
        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* FOOTER */}
      <footer className="border-t mt-16">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
          SuperChamps © 2026 ·{" "}
          <Link href="/blog" className="hover:text-foreground">Blog</Link> ·{" "}
          <Link href="/termos" className="hover:text-foreground">Termos</Link> ·{" "}
          <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
        </div>
      </footer>
    </div>
  )
}
