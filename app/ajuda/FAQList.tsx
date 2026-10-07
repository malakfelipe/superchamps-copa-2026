"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export type FAQItem = {
  category: "mecanica" | "pontuacao" | "ligas" | "transparencia" | "conta"
  q: string
  a: string
}

const CATEGORIES: { key: FAQItem["category"]; label: string; emoji: string }[] = [
  { key: "mecanica", label: "Mecânica de apostas", emoji: "🎲" },
  { key: "pontuacao", label: "Pontuação e saldo", emoji: "💰" },
  { key: "ligas", label: "Ligas", emoji: "👥" },
  { key: "transparencia", label: "Transparência", emoji: "👁️" },
  { key: "conta", label: "Conta e perfil", emoji: "🔐" },
]

type Props = {
  faq: FAQItem[]
}

export function FAQList({ faq }: Props) {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<FAQItem["category"] | "all">("all")

  const normalized = query.trim().toLowerCase()
  const isSearching = normalized.length > 0

  const filtered = useMemo(() => {
    return faq.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory
      const matchesQuery = !isSearching ||
        item.q.toLowerCase().includes(normalized) ||
        item.a.toLowerCase().includes(normalized)
      return matchesCategory && matchesQuery
    })
  }, [faq, activeCategory, isSearching, normalized])

  // Agrupa por categoria (só importa quando não está buscando)
  const grouped = useMemo(() => {
    const map = new Map<FAQItem["category"], FAQItem[]>()
    for (const item of filtered) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category)!.push(item)
    }
    return map
  }, [filtered])

  const totalCount = faq.length
  const visibleCount = filtered.length

  return (
    <div className="space-y-4">
      {/* SEARCH */}
      <div className="relative">
        <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <Input
          type="text"
          placeholder="Buscar na ajuda…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9 h-10"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-7 grid place-items-center text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
            aria-label="Limpar busca"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* CATEGORIAS — chips clicáveis */}
      {!isSearching && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory("all")}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-accent border-border"
            }`}
          >
            Todas
            <span className="ml-1 font-mono opacity-70">{totalCount}</span>
          </button>
          {CATEGORIES.map((cat) => {
            const count = faq.filter((i) => i.category === cat.key).length
            if (count === 0) return null
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-accent border-border"
                }`}
              >
                {cat.emoji} {cat.label}
                <span className="ml-1 font-mono opacity-70">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* RESULT COUNT quando buscando */}
      {isSearching && (
        <div className="text-xs text-muted-foreground px-1">
          {visibleCount === 0
            ? `Nada encontrado pra "${query}"`
            : `${visibleCount} ${visibleCount === 1 ? "resultado" : "resultados"} pra "${query}"`}
        </div>
      )}

      {/* LISTA */}
      {visibleCount === 0 && isSearching ? (
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Tenta termos diferentes ou{" "}
            <button onClick={() => setQuery("")} className="text-primary hover:underline">
              limpa a busca
            </button>
            {" "}pra ver tudo.
          </CardContent>
        </Card>
      ) : isSearching ? (
        // Buscando: lista flat sem categorias
        <div className="space-y-2">
          {filtered.map((item, i) => (
            <FAQEntry key={i} item={item} showCategory />
          ))}
        </div>
      ) : (
        // Não buscando: agrupado por categoria
        <div className="space-y-5">
          {CATEGORIES.map((cat) => {
            const items = grouped.get(cat.key) || []
            if (items.length === 0) return null
            return (
              <div key={cat.key} className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
                  <span>{cat.emoji}</span>
                  {cat.label}
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal ml-1">
                    {items.length}
                  </Badge>
                </h2>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <FAQEntry key={i} item={item} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FAQEntry({ item, showCategory = false }: { item: FAQItem; showCategory?: boolean }) {
  const cat = CATEGORIES.find((c) => c.key === item.category)
  return (
    <details className="group bg-card border rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <summary className="list-none cursor-pointer p-3.5 flex items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div className="flex-1 min-w-0">
          {showCategory && cat && (
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
              {cat.emoji} {cat.label}
            </div>
          )}
          <span className="font-semibold text-sm">{item.q}</span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 group-open:rotate-180 transition-transform">
          ▾
        </span>
      </summary>
      <div className="px-3.5 pb-3.5 -mt-1">
        <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
      </div>
    </details>
  )
}
