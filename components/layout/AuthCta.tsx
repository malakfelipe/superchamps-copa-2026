"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

/**
 * CTA de login/cadastro pro visitante anônimo (app público / vitrine).
 * Anexa `?next=<rota atual>` pra reconduzir o visitante ao ponto exato após logar.
 */
export function AuthCta() {
  const pathname = usePathname()
  const next = pathname && pathname !== "/inicio" ? `?next=${encodeURIComponent(pathname)}` : ""
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="ghost" size="sm" className="h-8 px-2.5" asChild>
        <Link href={`/login${next}`}>Entrar</Link>
      </Button>
      <Button size="sm" className="h-8 px-2.5" asChild>
        <Link href={`/cadastro${next}`}>Criar conta</Link>
      </Button>
    </div>
  )
}
