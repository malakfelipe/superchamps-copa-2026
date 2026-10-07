import Link from "next/link"
import { Logo } from "@/components/Logo"
import { ConfirmeEmailContent } from "./ConfirmeEmailContent"
import { Suspense } from "react"

export default function ConfirmeEmailPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b bg-background">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold tracking-tight">SuperChamps</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Carregando…</div>}>
            <ConfirmeEmailContent />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
