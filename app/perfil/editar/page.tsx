import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppShell } from "@/components/layout/AppShell"
import { getCurrentProfile } from "@/lib/data"

export default async function EditarPerfilPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

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
          <h1 className="text-2xl font-extrabold tracking-tight">Editar perfil</h1>
          <p className="text-sm text-muted-foreground">Nickname, avatar e país favorito.</p>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nickname">Nickname</Label>
              <Input id="nickname" defaultValue={profile.nickname} maxLength={20} />
              <p className="text-[11px] text-muted-foreground">
                Limitado a 1 mudança por 30 dias.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country">País favorito</Label>
              <Input id="country" defaultValue={profile.countryCode || ""} placeholder="BR, AR, US..." maxLength={2} className="uppercase" />
              <p className="text-[11px] text-muted-foreground">
                Código ISO de 2 letras. Usado pra mostrar bandeira ao lado do seu nickname.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="avatar">Avatar</Label>
              <p className="text-xs text-muted-foreground">
                Upload de imagem em breve. Por enquanto usamos as iniciais do seu nickname.
              </p>
            </div>

            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50">
              <CardContent className="p-3 flex items-start gap-2 text-xs">
                <AlertCircle className="size-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-700 dark:text-amber-300">
                  Salvar mudanças funcionará quando o Supabase estiver conectado. Em breve.
                </span>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/perfil">Cancelar</Link>
              </Button>
              <Button className="flex-1" disabled>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
