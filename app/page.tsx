import { redirect } from "next/navigation"

/**
 * Raiz `/` → app público (`/inicio`). A landing de marketing virou uma LP
 * reutilizável em `/lp` (campanhas/anúncios). O app agora é navegável por
 * todos; o CTA de login/cadastro fica no header (topo-esquerdo) pra anônimos.
 */
export default function RootPage() {
  redirect("/inicio")
}
