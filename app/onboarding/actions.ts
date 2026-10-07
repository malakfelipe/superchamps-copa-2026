"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { isDemoMode } from "@/lib/data"

/**
 * Marca o usuário como "onboarded" (onboarded_at = now()) e redireciona pro app.
 */
export async function completeOnboardingAction() {
  if (isDemoMode()) {
    redirect("/inicio")
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.id)

  revalidatePath("/", "layout")
  redirect("/inicio")
}
