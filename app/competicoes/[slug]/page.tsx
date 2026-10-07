import { redirect } from "next/navigation"

/**
 * Legacy URL: /competicoes/[slug] foi consolidado em /jogos?comp=slug.
 * Mantido apenas como redirect — preserva links externos (blog, share, etc.).
 *
 * Os componentes do hub (hero, nav strip, leagues list) foram portados pro
 * próprio /jogos. As páginas dependentes (CompetitionNavStrip, etc.) podem ser
 * removidas quando confiantes que ninguém mais bate aqui.
 */
export default async function CompeticaoSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Copa é o default em /jogos sem ?comp=
  if (slug === "copa-do-mundo-2026") {
    redirect("/jogos")
  }
  redirect(`/jogos?comp=${slug}`)
}
