import Link from "next/link"
import { Beaker, ArrowLeft } from "lucide-react"

/**
 * Layout do sandbox de design. Visível em produção mas NÃO indexado
 * (ver app/robots.ts) e sem link de navegação no app principal.
 *
 * Quando componente sandbox estiver pronto, plug nas rotas reais
 * (`/jogos`, `/competicoes`, etc.).
 */
export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/design-system" className="flex items-center gap-2 font-bold text-sm">
            <Beaker className="size-4 text-primary" />
            Design Sandbox
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="size-3" />
            App
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
