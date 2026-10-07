import Link from "next/link"
import { Plus, KeyRound, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/layout/AppShell"
import { MyLeaguesList } from "@/components/dashboard/MyLeaguesList"
import { LeagueSearch } from "./LeagueSearch"
import { getCurrentProfile, getMyLeagues, searchLeagues } from "@/lib/data"

export default async function LigasPage() {
  const profile = await getCurrentProfile()  // null = visitante anônimo (app público)

  const [leagues, searchResults] = await Promise.all([
    getMyLeagues(),
    searchLeagues(null, 30),
  ])
  // Globais nunca aparecem como "owner" — são da casa (criadas pela conta admin)
  const owned = leagues.filter((l) => l.ownerId === profile?.id && l.visibility !== "global")
  const member = leagues.filter((l) => l.ownerId !== profile?.id && l.visibility !== "global")
  const global = leagues.filter((l) => l.visibility === "global")

  return (
    <AppShell authed={!!profile} balance={profile?.balance} nickname={profile?.nickname} avatarUrl={profile?.avatarUrl}>
      <div className="space-y-3.5 animate-in fade-in duration-300">
        {/* Header + ações na mesma linha */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-tight">{profile ? "Suas ligas" : "Ligas"}</h1>
            <p className="text-xs text-muted-foreground">
              {profile ? `${leagues.length}/10 ligas` : "Explore as ligas e entre pra competir"}
            </p>
          </div>
          {profile ? (
            <div className="flex gap-1.5 shrink-0">
              <Button size="sm" className="gap-1" asChild>
                <Link href="/ligas/criar">
                  <Plus className="size-3.5" />
                  Criar
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="gap-1" asChild>
                <Link href="/ligas/entrar">
                  <KeyRound className="size-3.5" />
                  Código
                </Link>
              </Button>
            </div>
          ) : (
            <Button size="sm" className="gap-1 shrink-0" asChild>
              <Link href="/cadastro?next=/ligas">Criar conta</Link>
            </Button>
          )}
        </div>

        {/* GLOBAIS — uma por competição grátis */}
        {global.length > 0 && (
          <section className="space-y-1.5">
            <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
              <Globe className="size-3" />
              {global.length === 1 ? "Liga global" : "Ligas globais"}
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">{global.length}</Badge>
            </h2>
            <MyLeaguesList leagues={global} />
          </section>
        )}

        {/* OWNED */}
        {owned.length > 0 && (
          <section className="space-y-1.5">
            <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
              Você é owner
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">{owned.length}</Badge>
            </h2>
            <MyLeaguesList leagues={owned} />
          </section>
        )}

        {/* MEMBER */}
        {member.length > 0 && (
          <section className="space-y-1.5">
            <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
              Você é membro
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">{member.length}</Badge>
            </h2>
            <MyLeaguesList leagues={member} />
          </section>
        )}

        {/* EXPLORAR — busca de ligas (todas privadas são buscáveis agora) */}
        <LeagueSearch initialResults={searchResults} />
      </div>
    </AppShell>
  )
}
