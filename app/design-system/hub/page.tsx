import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Flag } from "@/components/Flag"
import { ALL_MOCKS } from "./mock-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function DesignHubIndex() {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link href="/design-system">
          <ChevronLeft className="size-4 mr-1" />
          Voltar
        </Link>
      </Button>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Parte 3 — Hub de competição
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Página dedicada por competição. Hero com identidade + tabs sticky (Jogos / Classificação /
          Mata-mata / Ligas do bolão). Adapta automaticamente conforme o formato da competição
          (com grupos vs ponto corrido).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.values(ALL_MOCKS).map((mock) => (
          <Link key={mock.slug} href={`/design-system/hub/${mock.slug}`}>
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {mock.countryCode ? (
                    <Flag iso={mock.countryCode} size={20} />
                  ) : (
                    <span className="text-xl leading-none">{mock.icon}</span>
                  )}
                  <div>
                    <div className="font-bold text-sm">{mock.name}</div>
                    <div className="text-[11px] text-muted-foreground">{mock.season}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{mock.description}</p>
                <div className="flex gap-1.5 pt-1 flex-wrap">
                  {mock.hasGroups && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">com grupos</span>}
                  {mock.hasKnockout && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">mata-mata</span>}
                  {!mock.hasGroups && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">ponto corrido</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
