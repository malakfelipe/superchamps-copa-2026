/**
 * Supabase client para uso em SERVER COMPONENTS / ROUTE HANDLERS / SERVER ACTIONS.
 * Gerencia cookies para auth session via Next.js cookies() API.
 *
 * Para chamadas com privilégios elevados (Edge Functions, jobs, settle de apostas),
 * use o SERVICE_ROLE_KEY — NUNCA expor ao browser.
 */
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // `setAll` chamado de Server Component — ignorado.
            // Em production, o middleware refresca a sessão.
          }
        },
      },
    },
  )
}
