/**
 * Helper de middleware do Supabase.
 * Roda em TODA request — refresca a sessão (se necessário) e propaga
 * cookies de auth pro browser e pro next response.
 *
 * Padrão recomendado pelo time do Supabase para Next.js App Router:
 *   https://supabase.com/docs/guides/auth/server-side/nextjs
 */
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Modo demo (snapshot de portfólio, sem backend): não há sessão a validar —
  // libera a navegação em todas as rotas com dados mock.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANTE: getUser() valida o JWT no servidor — não usar getSession() aqui
  // (getSession lê do cookie diretamente, sem verificar se token foi revogado)
  const { data: { user } } = await supabase.auth.getUser()

  // Rotas protegidas: redireciona pra /login se não autenticado
  const path = request.nextUrl.pathname

  // Páginas de liga individuais /ligas/{slug} são PÚBLICAS (preview pra visitantes).
  // A page renderiza versão pública ou logada baseada no profile.
  // As exceções abaixo continuam protegidas:
  const isLigasIndividual =
    path.startsWith("/ligas/") &&
    path !== "/ligas/criar" &&
    path !== "/ligas/entrar"

  const isProtected =
    !isLigasIndividual && (
      path === "/ligas" ||
      path === "/ligas/criar" ||
      path === "/ligas/entrar" ||
      path.startsWith("/inicio") ||
      path.startsWith("/jogos") ||
      path.startsWith("/apostas") ||
      path.startsWith("/perfil") ||
      path.startsWith("/carteira") ||
      path.startsWith("/notificacoes") ||
      path.startsWith("/onboarding") ||
      path.startsWith("/competicoes") ||
      path.startsWith("/u/")
    )

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", path)
    return NextResponse.redirect(url)
  }

  // Já logado tentando acessar /login ou /cadastro → manda pro /inicio
  if (user && (path === "/login" || path === "/cadastro")) {
    const url = request.nextUrl.clone()
    url.pathname = "/inicio"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
