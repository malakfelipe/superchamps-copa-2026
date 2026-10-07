"use server"

import { searchMatchBettors } from "@/lib/data"
import type { TransparencyBettor } from "@/lib/data/types"

/** Busca apostadores públicos por nickname num jogo (conferência de transparência). */
export async function searchMatchBettorsAction(
  matchId: string,
  query: string,
): Promise<TransparencyBettor[]> {
  if (!query.trim()) return []
  return searchMatchBettors(matchId, query)
}
