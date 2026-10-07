import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft, Bell, Mail, Smartphone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AppShell } from "@/components/layout/AppShell"
import { PrefsForm } from "./PrefsForm"
import type { NotificationPrefs } from "./actions"
import { getCurrentProfile, isDemoMode } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_PREFS: NotificationPrefs = {
  kickoff_reminder: true,
  bet_settled: true,
  league_activity: true,
  daily_summary: false,
  marketing: false,
  channel_email: true,
}

export default async function PrefsNotificacoesPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  // Carrega prefs do DB (ou usa defaults em demo mode)
  let prefs: NotificationPrefs = DEFAULT_PREFS
  if (!isDemoMode()) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("profiles")
      .select("notification_prefs")
      .eq("id", profile.id)
      .single()
    if (data && (data as { notification_prefs: NotificationPrefs | null }).notification_prefs) {
      prefs = (data as { notification_prefs: NotificationPrefs }).notification_prefs
    }
  }

  return (
    <AppShell balance={profile.balance} nickname={profile.nickname} avatarUrl={profile.avatarUrl}>
      <div className="space-y-5">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link href="/perfil">
            <ChevronLeft className="size-4 mr-1" />
            Voltar pro perfil
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            O que você quer ser avisado e por qual canal.
          </p>
        </div>

        {/* CANAIS */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-bold text-sm">Canais</h2>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary/10 grid place-items-center">
                <Bell className="size-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">No app</div>
                <div className="text-xs text-muted-foreground">Sino do header + página /notificacoes</div>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Ativo</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-muted grid place-items-center">
                <Mail className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Por e-mail</div>
                <div className="text-xs text-muted-foreground">Pra eventos importantes e resumos</div>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Ativo</span>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-muted grid place-items-center">
                <Smartphone className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Push (PWA)</div>
                <div className="text-xs text-muted-foreground">Em breve · ainda não disponível</div>
              </div>
              <span className="text-xs text-muted-foreground">Desabilitado</span>
            </div>
          </CardContent>
        </Card>

        {/* TIPOS — client island com persistência */}
        <PrefsForm initialPrefs={prefs} />
      </div>
    </AppShell>
  )
}
