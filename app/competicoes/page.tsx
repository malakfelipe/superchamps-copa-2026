import { redirect } from "next/navigation"

/**
 * Legacy: /competicoes index foi consolidado em /jogos.
 * Mantido apenas como redirect pra preservar links antigos.
 */
export default function CompeticoesIndexRedirect() {
  redirect("/jogos")
}
