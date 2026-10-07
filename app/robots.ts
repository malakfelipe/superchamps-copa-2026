import type { MetadataRoute } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://superchamps.com.br"

/**
 * robots.txt dinâmico. Disponível em /robots.txt automaticamente.
 *
 * Política:
 *   - Tudo público por padrão (boa pra descoberta)
 *   - Bloqueia rotas privadas/autenticadas (sem valor pro Google indexar)
 *   - API e auth callback nunca devem ser crawleados
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/admin",
          "/admin/",
          "/design-system",
          "/design-system/",
          "/competicoes",
          "/competicoes/",
          "/inicio",
          "/jogos",       // dashboard de jogos (precisa login)
          "/apostas",
          "/perfil",
          "/perfil/",
          "/notificacoes",
          "/onboarding",
          "/carteira",
          "/u/",          // perfis de usuário
          "/ligas$",      // listagem (precisa login); páginas /ligas/{slug} ficam livres
          "/ligas/criar",
          "/ligas/entrar",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
