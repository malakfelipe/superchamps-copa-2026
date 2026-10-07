"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CalendarDays, Users, Wallet, User, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"

type TabKey = "home" | "games" | "leagues" | "bets" | "profile"

const TABS: { k: TabKey; label: string; href: string; Icon: typeof Home }[] = [
  { k: "home", label: "Início", href: "/inicio", Icon: Home },
  { k: "games", label: "Jogos", href: "/jogos", Icon: CalendarDays },
  { k: "leagues", label: "Ligas", href: "/ligas", Icon: Users },
  { k: "bets", label: "Apostas", href: "/apostas", Icon: Wallet },
  { k: "profile", label: "Perfil", href: "/perfil", Icon: User },
]

// Tabs que exigem login. Pro visitante anônimo, apontam pro /login (com next).
const GATED: TabKey[] = ["bets", "profile"]

function activeFromPath(pathname: string): TabKey {
  if (pathname.startsWith("/jogos")) return "games"
  if (pathname.startsWith("/ligas")) return "leagues"
  if (pathname.startsWith("/apostas") || pathname.startsWith("/carteira")) return "bets"
  if (pathname.startsWith("/perfil") || pathname.startsWith("/u/")) return "profile"
  return "home"
}

export function BottomTabBar({ authed = true }: { authed?: boolean }) {
  const pathname = usePathname()
  const active = activeFromPath(pathname)

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t z-20">
      <div className="max-w-3xl mx-auto px-2">
        <div className="grid grid-cols-5 h-16">
          {TABS.map((tab) => {
            const gated = !authed && GATED.includes(tab.k)
            // Anônimo: "Perfil" vira "Entrar"; tabs restritas mandam pro login.
            const isLogin = gated && tab.k === "profile"
            const label = isLogin ? "Entrar" : tab.label
            const Icon = isLogin ? LogIn : tab.Icon
            const href = gated ? `/login?next=${encodeURIComponent(tab.href)}` : tab.href
            const k = tab.k
            const isActive = k === active && !gated
            return (
              <Link
                key={k}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className={cn(
                    "text-[10px]",
                    isActive ? "font-bold" : "font-medium",
                  )}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
