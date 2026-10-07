"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CompetitionPinnedStrip } from "@/components/competitions/CompetitionPinnedStrip"
import { useCompetitions, type CompetitionMeta } from "@/lib/competitions-context"

type Props = {
  competitions: CompetitionMeta[]
  activeSlug?: string | null
}

/**
 * Nav strip em /jogos. Tudo agora roda dentro de /jogos — clicar numa pill
 * troca o filtro de competição via ?comp=slug. URL fica shareable.
 *
 * Sincroniza URL → context (define a competição ativa como "selecionada").
 */
export function JogosNavStrip({ competitions, activeSlug }: Props) {
  const router = useRouter()
  const { setCompetition } = useCompetitions()

  useEffect(() => {
    if (activeSlug) setCompetition(activeSlug)
  }, [activeSlug, setCompetition])

  return (
    <div className="sticky top-14 z-10 -mx-4 px-4 bg-background/95 backdrop-blur border-b">
      <CompetitionPinnedStrip
        competitions={competitions}
        onSelect={(slug) => {
          if (slug !== activeSlug) {
            // Default = limpa o ?comp (volta pra Copa, que é o default)
            const url = slug === "copa-do-mundo-2026" ? "/jogos" : `/jogos?comp=${slug}`
            router.push(url)
          }
        }}
      />
    </div>
  )
}
