"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

/** Registra/troca o voto da enquete "jogo do dia x2". Autorização na RPC (auth.uid). */
export async function castPollVoteAction(
  pollId: string,
  matchId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.rpc("cast_poll_vote", {
    p_poll_id: pollId,
    p_match_id: matchId,
  })
  if (error) {
    const code = error.message.split(/[\s(]/)[0].toLowerCase()
    const map: Record<string, string> = {
      unauthenticated: "Você precisa estar logado pra votar.",
      poll_not_found: "Enquete não encontrada.",
      poll_closed: "Essa enquete já fechou.",
      not_a_candidate: "Jogo inválido pra essa enquete.",
    }
    return { error: map[code] || "Não deu pra registrar o voto." }
  }
  revalidatePath("/inicio")
  return { ok: true }
}
