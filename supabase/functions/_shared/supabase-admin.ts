/**
 * Cliente Supabase com privilégio service_role.
 * Usado SOMENTE em Edge Functions (server-side). NUNCA exportar pro browser.
 */
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

export function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios")
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
