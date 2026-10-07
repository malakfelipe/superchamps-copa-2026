import Link from "next/link"
import { redirect } from "next/navigation"
import { Bell } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AppShell } from "@/components/layout/AppShell"
import { NotificationsList } from "./NotificationsList"
import { getCurrentProfile, getMyNotifications } from "@/lib/data"

export default async function NotificacoesPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  const notifications = await getMyNotifications()
  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <AppShell balance={profile.balance} nickname={profile.nickname} avatarUrl={profile.avatarUrl} unreadNotifications={unreadCount}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Notificações</h1>
        </div>

        <NotificationsList initial={notifications} />

        {/* PREFERENCES SHORTCUT */}
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-muted grid place-items-center shrink-0">
              <Bell className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 text-sm">
              <div className="font-medium">Receber menos avisos?</div>
              <div className="text-xs text-muted-foreground">
                Ajuste tipos de notificação e frequência de e-mail
              </div>
            </div>
            <Link href="/perfil/notificacoes" className="text-primary text-sm font-medium">
              Configurar
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
