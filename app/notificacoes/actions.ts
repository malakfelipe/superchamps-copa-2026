"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

/**
 * Marca notificações como lidas. Se ids vier vazio/null, marca TODAS as não lidas.
 * Retorna o número de notificações marcadas.
 */
export async function markNotificationsReadAction(
  ids?: string[] | null,
): Promise<{ marked: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { marked: 0, error: "Sessão expirada" }

  const { data, error } = await supabase.rpc("mark_notifications_read", {
    p_notification_ids: ids && ids.length > 0 ? ids : null,
  })

  if (error) return { marked: 0, error: error.message }

  revalidatePath("/notificacoes")
  revalidatePath("/inicio")

  return { marked: Number(data) || 0 }
}
