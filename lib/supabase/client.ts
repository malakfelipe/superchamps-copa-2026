/**
 * Supabase client para uso no BROWSER (React Client Components).
 * Lê chave anon pública — segura para expor no client-side.
 */
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
