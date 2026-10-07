import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { CreateLeagueForm } from "./CreateLeagueForm"
import {
  getCurrentProfile, getAllCompetitions, getUnreadNotificationsCount,
} from "@/lib/data"

type SearchParams = Promise<{ competition?: string }>

export default async function CriarLigaPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  const [competitions, unreadCount, params] = await Promise.all([
    getAllCompetitions(),
    getUnreadNotificationsCount(),
    searchParams,
  ])

  // Se chegou via /ligas/criar?competition=slug (vindo do hub), pré-seleciona
  const prefillSlug = params.competition?.trim() || null
  const prefilledComp = prefillSlug
    ? competitions.find((c) => c.slug === prefillSlug && c.isActiveForBetting)
    : null

  return (
    <AppShell balance={profile.balance} nickname={profile.nickname} avatarUrl={profile.avatarUrl} unreadNotifications={unreadCount}>
      <CreateLeagueForm
        competitions={competitions.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          season: c.externalSeason ? String(c.externalSeason) : null,
          countryCode: c.countryCode,
          icon: c.icon,
          isActiveForBetting: c.isActiveForBetting,
          isProOnly: c.isProOnly,
        }))}
        initialCompetitionId={prefilledComp?.id || null}
      />
    </AppShell>
  )
}
