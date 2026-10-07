import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { getPublishedPosts } from "@/lib/data"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://superchamps.com.br"

/**
 * Sitemap dinâmico. Inclui:
 *   - rotas estáticas públicas (landing, termos, privacidade, ajuda, login, cadastro)
 *   - ligas marcadas como discoverable (têm preview público)
 *   - posts do blog (quando a tabela existir)
 *
 * Google Search Console: submeter `https://superchamps.com.br/sitemap.xml`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/cadastro`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/ajuda`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/termos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  // Hubs de competição (anon não tem acesso por middleware, mas a tabela é
  // referenciada como navegação interna — manter no sitemap pra autenticados
  // ajuda crawlers a entender estrutura). Pra ocultar de não-logados, basta
  // mover pra disallow no robots.ts.

  // Ligas discoverable + posts publicados
  const [dynamicLeagues, blogPosts] = await Promise.all([
    fetchDiscoverableLeagues(),
    fetchBlogPosts(),
  ])

  return [...staticPages, ...blogPosts, ...dynamicLeagues]
}

async function fetchBlogPosts(): Promise<MetadataRoute.Sitemap> {
  try {
    const posts = await getPublishedPosts(undefined, 1000)
    return posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  } catch {
    return []
  }
}

async function fetchDiscoverableLeagues(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("leagues")
      .select("slug, created_at")
      .eq("is_discoverable", true)
      .eq("visibility", "private")
      .limit(1000)

    if (error || !data) return []

    return (data as Array<{ slug: string; created_at: string }>).map((l) => ({
      url: `${SITE_URL}/ligas/${l.slug}`,
      lastModified: new Date(l.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }))
  } catch {
    // Falha de conexão ao Supabase não derruba o sitemap inteiro
    return []
  }
}
