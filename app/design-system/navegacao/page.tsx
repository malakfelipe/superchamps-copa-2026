import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { NavegacaoSandbox } from "./NavegacaoSandbox"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function DesignNavegacaoPage() {
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
          Parte 2 — Navegação multi-esporte
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Espelhando o padrão do Sofascore. Strip de favoritas + sheet com todas + estrela pra favoritar + date strip.
          Estado persistido em <code className="bg-muted px-1 rounded text-xs">localStorage</code>.
        </p>
      </div>

      <Card className="bg-amber-100/50 dark:bg-amber-950/30 border-amber-400/40">
        <CardContent className="p-3 text-xs text-amber-900 dark:text-amber-200">
          💡 <strong>Testa</strong>: clica nas estrelas pra favoritar/desfavoritar competições, abre o sheet
          "Todas" no botão do strip, navega entre datas. Atualiza a página — sua seleção fica.
        </CardContent>
      </Card>

      <NavegacaoSandbox />
    </div>
  )
}
