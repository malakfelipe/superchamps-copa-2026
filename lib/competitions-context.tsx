"use client"

/**
 * Context global de competição "em foco" + favoritas, com persistência em
 * localStorage. Inspirado no comportamento do Sofascore: você marca suas ligas
 * favoritas, elas aparecem como pills no topo, e a navegação lembra qual você
 * estava vendo entre páginas.
 *
 * Em Fase B/C, o provider envolve o app inteiro (em app/layout.tsx ou layout
 * de seção). Por enquanto, vive no sandbox /design-system/navegacao.
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react"

export type CompetitionMeta = {
  slug: string
  name: string
  season?: string
  countryCode?: string | null
  icon?: string | null
  /** Aparece na UI. Se false, fica escondida do user (não recomendado pra novos usos). */
  active: boolean
  /** Requer assinatura PRO. UI mostra badge "PRO em breve" e bloqueia palpite. */
  requiresPro?: boolean
  /** Quantos usuários estão jogando essa competição (pra ordenar/display). */
  memberCount?: number
}

export type SportMeta = {
  slug: "futebol" | "basquete" | "futebol-americano"
  name: string
  icon: string
  /** Se false: pill aparece desabilitada com badge "Em breve". */
  active: boolean
}

type CompetitionsContextValue = {
  // Estado
  selectedSport: string
  selectedCompetitionSlug: string | null
  favorites: string[]
  selectedDate: Date

  // Ações
  setSport: (sport: string) => void
  setCompetition: (slug: string | null) => void
  setDate: (date: Date) => void
  toggleFavorite: (slug: string) => void
  isFavorite: (slug: string) => boolean
}

const STORAGE_KEY = "superchamps:competitions-state"
const DEFAULT_SPORT = "futebol"
const DEFAULT_COMPETITION = "copa-do-mundo-2026"
const DEFAULT_FAVORITES: string[] = ["copa-do-mundo-2026"]

const CompetitionsContext = createContext<CompetitionsContextValue | null>(null)

type StoredState = {
  selectedSport: string
  selectedCompetitionSlug: string | null
  favorites: string[]
}

function loadState(): StoredState {
  if (typeof window === "undefined") {
    return {
      selectedSport: DEFAULT_SPORT,
      selectedCompetitionSlug: DEFAULT_COMPETITION,
      favorites: DEFAULT_FAVORITES,
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        selectedSport: DEFAULT_SPORT,
        selectedCompetitionSlug: DEFAULT_COMPETITION,
        favorites: DEFAULT_FAVORITES,
      }
    }
    const parsed = JSON.parse(raw) as Partial<StoredState>
    return {
      selectedSport: parsed.selectedSport || DEFAULT_SPORT,
      selectedCompetitionSlug: parsed.selectedCompetitionSlug ?? DEFAULT_COMPETITION,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : DEFAULT_FAVORITES,
    }
  } catch {
    return {
      selectedSport: DEFAULT_SPORT,
      selectedCompetitionSlug: DEFAULT_COMPETITION,
      favorites: DEFAULT_FAVORITES,
    }
  }
}

function saveState(state: StoredState) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota cheia ou modo privado — ignora
  }
}

export function CompetitionsProvider({ children }: { children: ReactNode }) {
  // Inicia com defaults pra SSR — useEffect hidrata do localStorage
  const [selectedSport, setSelectedSport] = useState<string>(DEFAULT_SPORT)
  const [selectedCompetitionSlug, setSelectedCompetitionSlug] = useState<string | null>(DEFAULT_COMPETITION)
  const [favorites, setFavorites] = useState<string[]>(DEFAULT_FAVORITES)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())

  // Hidrata do localStorage no mount
  useEffect(() => {
    const stored = loadState()
    setSelectedSport(stored.selectedSport)
    setSelectedCompetitionSlug(stored.selectedCompetitionSlug)
    setFavorites(stored.favorites)
  }, [])

  // Persiste em qualquer mudança
  useEffect(() => {
    saveState({ selectedSport, selectedCompetitionSlug, favorites })
  }, [selectedSport, selectedCompetitionSlug, favorites])

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }, [])

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  )

  const value = useMemo<CompetitionsContextValue>(
    () => ({
      selectedSport,
      selectedCompetitionSlug,
      favorites,
      selectedDate,
      setSport: setSelectedSport,
      setCompetition: setSelectedCompetitionSlug,
      setDate: setSelectedDate,
      toggleFavorite,
      isFavorite,
    }),
    [selectedSport, selectedCompetitionSlug, favorites, selectedDate, toggleFavorite, isFavorite],
  )

  return (
    <CompetitionsContext.Provider value={value}>
      {children}
    </CompetitionsContext.Provider>
  )
}

export function useCompetitions(): CompetitionsContextValue {
  const ctx = useContext(CompetitionsContext)
  if (!ctx) {
    throw new Error("useCompetitions deve estar dentro de <CompetitionsProvider>")
  }
  return ctx
}
