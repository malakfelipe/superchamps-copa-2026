import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Pencil, Gift, Bell, HelpCircle, FileText, ShieldCheck, LogOut, ChevronRight,
  BadgeCheck, AlertCircle, Palette, Eye, Globe, Coins, Target,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Flag } from "@/components/Flag"
import { AppShell } from "@/components/layout/AppShell"
import { ThemeToggle } from "@/components/ThemeToggle"
import { CopyReferralButton } from "./CopyReferralButton"
import { formatPts } from "@/lib/format"
import { ResendConfirmButton } from "./ResendConfirmButton"
import { getCurrentProfile, getProfileByNickname, isDemoMode } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { logoutAction } from "../(auth)/actions"

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

export default async function PerfilPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  // Pega email do auth pra reenviar confirmação se precisar
  let userEmail: string | null = null
  if (!isDemoMode()) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userEmail = user?.email || null
  }

  // Stats públicos (Liga Global, indicações, etc) — reusa o público
  const publicData = !isDemoMode() ? await getProfileByNickname(profile.nickname) : null

  const items: { Icon: typeof Pencil; label: string; href: string; description?: string }[] = [
    { Icon: Pencil, label: "Editar perfil", href: "/perfil/editar", description: "Nickname, avatar, país" },
    { Icon: Gift, label: "Indicar amigos", href: "/perfil/indicar", description: `+50 pts por convidado · até 5 amigos` },
    { Icon: Bell, label: "Notificações", href: "/perfil/notificacoes", description: "Frequência de e-mails e alertas" },
    { Icon: ShieldCheck, label: "Privacidade e segurança", href: "/perfil/privacidade", description: "Senha, sessões, exclusão de conta" },
    { Icon: HelpCircle, label: "Ajuda / FAQ", href: "/ajuda" },
    { Icon: FileText, label: "Termos de uso", href: "/termos" },
    { Icon: FileText, label: "Política de privacidade", href: "/privacidade" },
  ]

  const refStats = publicData?.referralStats
  const globalStats = publicData?.globalLeagueStats

  return (
    <AppShell balance={profile.balance} nickname={profile.nickname} avatarUrl={profile.avatarUrl}>
      <div className="space-y-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Perfil</h1>

        {/* PROFILE CARD */}
        <Card className="overflow-hidden border-2">
          <div className="bg-gradient-to-br from-primary/15 via-amber-100/20 to-rose-100/20 dark:from-primary/25 dark:via-amber-950/30 dark:to-rose-950/20 p-5">
            <div className="flex items-start gap-4">
              <Avatar className="size-16 ring-4 ring-background shadow-md">
                <AvatarFallback className="bg-primary/10 text-primary font-extrabold text-xl">
                  {initials(profile.nickname)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h2 className="font-extrabold text-xl truncate">{profile.nickname}</h2>
                  {profile.emailVerifiedAt && (
                    <BadgeCheck className="size-4 text-primary shrink-0" aria-label="E-mail verificado" />
                  )}
                </div>
                {(profile.fullName || profile.countryCode) && (
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                    {profile.countryCode && <Flag iso={profile.countryCode.toLowerCase()} size={14} />}
                    {profile.fullName || profile.countryCode}
                  </p>
                )}
                <Link
                  href={`/u/${profile.nickname}`}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                >
                  <Eye className="size-3" />
                  Ver perfil público
                </Link>
              </div>
            </div>
          </div>
          <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Saldo</div>
              <div className="font-mono font-bold text-lg text-primary" title={`${profile.balance.toLocaleString("pt-BR")} pts`}>
                {formatPts(profile.balance)} pts
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Código de indicação</div>
              <CopyReferralButton code={profile.referralCode} />
            </div>
          </CardContent>
        </Card>

        {/* E-MAIL NOT VERIFIED WARNING */}
        {!profile.emailVerifiedAt && !isDemoMode() && (
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50">
            <CardContent className="p-3.5 flex items-start gap-2.5">
              <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-semibold text-amber-900 dark:text-amber-200">E-mail não confirmado</div>
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  Confirma pra liberar o 1º saque de bônus. Cheque sua caixa de entrada e spam.
                </div>
              </div>
              {userEmail && <ResendConfirmButton email={userEmail} />}
            </CardContent>
          </Card>
        )}

        {/* QUICK STATS (Saldo, Global, Indicações) */}
        {(globalStats || refStats?.count) && (
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/apostas?tab=wallet"
              className="block rounded-lg border bg-card p-3 hover:bg-accent transition-colors space-y-0.5"
            >
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
                <Coins className="size-3" />
                Saldo
              </div>
              <div className="font-mono font-bold text-lg text-primary leading-tight" title={`${profile.balance.toLocaleString("pt-BR")} pts`}>
                {formatPts(profile.balance)}
              </div>
              <div className="text-[10px] text-muted-foreground">ver carteira</div>
            </Link>

            {globalStats && globalStats.total > 0 && (
              <Link
                href="/ligas/global"
                className="block rounded-lg border bg-card p-3 hover:bg-accent transition-colors space-y-0.5"
              >
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
                  <Globe className="size-3" />
                  Global
                </div>
                <div className="font-mono font-bold text-lg leading-tight">
                  #{globalStats.rank}<span className="text-xs text-muted-foreground font-normal">/{globalStats.total}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">{globalStats.betsWon} acertos</div>
              </Link>
            )}

            {refStats && refStats.count > 0 && (
              <Link
                href="/perfil/indicar"
                className="block rounded-lg border bg-card p-3 hover:bg-accent transition-colors space-y-0.5"
              >
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
                  <Gift className="size-3" />
                  Indicações
                </div>
                <div className="font-mono font-bold text-lg text-amber-600 dark:text-amber-400 leading-tight">
                  {refStats.count}<span className="text-xs text-muted-foreground font-normal">/5</span>
                </div>
                <div className="text-[10px] text-muted-foreground">+{refStats.totalPoints} pts</div>
              </Link>
            )}

            {/* Quando não tem indicações mas tem global, mostra Apostas como placeholder */}
            {!refStats?.count && globalStats && globalStats.betsTotal > 0 && (
              <Link
                href="/apostas"
                className="block rounded-lg border bg-card p-3 hover:bg-accent transition-colors space-y-0.5"
              >
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
                  <Target className="size-3" />
                  Apostas
                </div>
                <div className="font-mono font-bold text-lg leading-tight">
                  {globalStats.betsWon}<span className="text-xs text-muted-foreground font-normal">/{globalStats.betsTotal}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">acertos</div>
              </Link>
            )}
          </div>
        )}

        {/* THEME TOGGLE */}
        <Card>
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-muted grid place-items-center shrink-0">
              <Palette className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">Aparência</div>
              <div className="text-xs text-muted-foreground">Tema claro, escuro ou do sistema</div>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>

        {/* MENU */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {items.map(({ Icon, label, href, description }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-3.5 py-3 hover:bg-accent transition-colors">
                  <div className="size-9 rounded-lg bg-muted grid place-items-center shrink-0">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{label}</div>
                    {description && (
                      <div className="text-xs text-muted-foreground truncate">{description}</div>
                    )}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SAIR */}
        <form action={logoutAction}>
          <Button type="submit" variant="outline" className="w-full gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="size-4" />
            Sair da conta
          </Button>
        </form>

        <Separator />

        <div className="text-center text-[10px] text-muted-foreground space-y-0.5">
          <p>SuperChamps · Bolão da Copa do Mundo 2026</p>
          <p>
            <Link href="/termos" className="hover:underline">Termos</Link>
            {" · "}
            <Link href="/privacidade" className="hover:underline">Privacidade</Link>
          </p>
          {isDemoMode() && (
            <p className="text-amber-600 dark:text-amber-400">⚠ Modo demo · sem Supabase conectado</p>
          )}
        </div>
      </div>
    </AppShell>
  )
}
