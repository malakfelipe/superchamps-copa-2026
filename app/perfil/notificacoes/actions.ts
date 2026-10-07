"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type NotificationPrefs = {
  kickoff_reminder: boolean
  bet_settled: boolean
  league_activity: boolean
  daily_summary: boolean
  marketing: boolean
  channel_email: boolean
}

export async function updateNotificationPrefsAction(
  prefs: NotificationPrefs,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Sessão expirada" }

  const { error } = await supabase
    .from("profiles")
    .update({ notification_prefs: prefs })
    .eq("id", user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/perfil/notificacoes")
  return { ok: true }
}
