import Link from "next/link"
import { Bell, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/Logo"
import { formatPts } from "@/lib/format"
import { AuthCta } from "./AuthCta"

export type AppHeaderProps = {
  /** Logado? Quando false (ou sem nickname), mostra o CTA de login no topo-esquerdo. */
  authed?: boolean
  balance?: number
  nickname?: string
  avatarUrl?: string | null
  unreadNotifications?: number
}

function initials(nickname: string): string {
  return nickname.slice(0, 2).toUpperCase()
}

export function AppHeader({
  authed = true,
  balance,
  nickname,
  avatarUrl,
  unreadNotifications = 0,
}: AppHeaderProps) {
  const isAuthed = authed && nickname != null
  return (
    <header className="sticky top-0 z-10 bg-background border-b">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        {/* ESQUERDA: logo + (anônimo) CTA de login/cadastro */}
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/inicio" className="flex items-center gap-2 shrink-0">
            <Logo size={32} />
            <span className={`font-bold tracking-tight ${isAuthed ? "" : "hidden sm:inline"}`}>SuperChamps</span>
          </Link>
          {!isAuthed && <AuthCta />}
        </div>

        {/* DIREITA: só logado — saldo, notificações, avatar */}
        {isAuthed && (
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="font-mono gap-1 px-2.5 py-1 text-sm" title={`${(balance ?? 0).toLocaleString("pt-BR")} pts`}>
              <Coins className="size-3.5" />
              {formatPts(balance ?? 0)}
            </Badge>
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/notificacoes" aria-label="Notificações">
                <Bell className="size-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 size-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>
            </Button>
            <Link href="/perfil" aria-label="Meu perfil">
              <Avatar className="size-8">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={nickname ?? ""} /> : null}
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                  {initials(nickname ?? "?")}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
