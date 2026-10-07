"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShieldAlert, UserPlus, Repeat2, Bot, Scale, SlidersHorizontal, Play, Activity, X, ChevronDown, Check, Plus, Pencil, Users, Trash2, Crown, Swords } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { localizeTeamName } from "@/lib/teams"
import {
  placeFakeBetsBulkAction, listMatchEditorAction, editBetsAction, createFakesAction,
  setBotEnabledAction, runFakeDripAction, setFakeProfilesBulkAction, applyStakeBandAction, renameFakeAction,
  getMatchBalanceAction, setMatchBalanceAction, setMatchTargetsAction, listRecentFakeBetsAction,
  listFakeUserBetsAction,
  listFakeLeaguesAction, createFakeLeagueAction, updateLeagueAction, deleteLeagueAction,
  setLeagueOwnerAction, addLeagueMemberAction, removeLeagueMemberAction, decideJoinRequestAction,
  addLeagueMembersAction, setLeagueDatesAction,
  listKnockoutScheduleAction, updateKnockoutSlotAction, materializeKnockoutAction, setKnockoutConfirmedAction,
  type EditorBetRow, type FakeProfileRow, type MatchBalance, type RecentFakeBet,
  type FakeUserBet, type AdminLeague, type AdminActionResult, type KnockoutGame,
} from "./actions"

type BotConfig = {
  enabled: boolean; target_min: number; target_max: number
  ramp_hours: number; default_band: number; comp_slugs: string[]
  default_bettors: number; default_pool: number
  stake_pct_min: number; stake_pct_max: number
} | null

type Pool = { home: number; draw: number; away: number }
type FakeUser = { id: string; nickname: string; balance: number; rank: number | null; netPoints: number }
type Me = { id: string; nickname: string; balance: number }
type MatchOption = {
  id: string; market1x2Id: string; status: string; home: string; away: string; label: string
  kickoff: string; pool: Pool; bettorsCount: number; poolTotal: number
}
type CompetitionOption = { id: string; name: string }
const OUTCOMES = [
  { key: "home", label: (m: { home: string }) => `1 · ${m.home}` },
  { key: "draw", label: () => "X · Empate" },
  { key: "away", label: (m: { away: string }) => `2 · ${m.away}` },
] as const

// Abrevia valores grandes (economia inflada): 1.250.000 → "1,2MM", 45.000 → "45k".
function fmtMM(n: number): string {
  const a = Math.abs(n)
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace(".", ",")}MM`
  if (a >= 10_000) return `${Math.round(n / 1000)}k`
  if (a >= 1_000) return `${(n / 1000).toFixed(1).replace(".", ",")}k`
  return String(Math.round(n))
}

function FakeSelect({
  fakes, value, onChange, disabled,
}: { fakes: FakeUser[]; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <select
      className="w-full h-9 rounded-md border bg-background px-2 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">— escolhe o fake —</option>
      {fakes.map((f) => (
        <option key={f.id} value={f.id}>
          {f.rank ? `#${f.rank} · ` : ""}{f.nickname} ({fmtMM(f.balance)} pts)
        </option>
      ))}
    </select>
  )
}

// Seletor de jogo mobile-friendly: lista de botões (não <select> nativo) com
// kickoff + apostadores + pool. Toque grande, sem o dropdown feio do SO.
function MatchPicker({
  matches, value, onChange, disabled,
}: { matches: MatchOption[]; value: string; onChange: (id: string) => void; disabled?: boolean }) {
  const selected = matches.find((m) => m.id === value)
  return (
    <div className="rounded-md border max-h-56 overflow-y-auto divide-y">
      {matches.map((m) => {
        const active = m.id === value
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(active ? "" : m.id)}
            disabled={disabled}
            className={`w-full text-left px-2.5 py-2 flex items-center gap-2 transition-colors ${
              active ? "bg-primary/10" : "hover:bg-muted/40"
            } disabled:opacity-50`}
          >
            <span className={`size-2 rounded-full shrink-0 ${active ? "bg-primary" : "bg-muted-foreground/20"}`} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{m.home} × {m.away}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{m.kickoff}</div>
            </div>
            <div className="text-right shrink-0 text-[10px] font-mono text-muted-foreground leading-tight">
              <div><strong className="text-foreground">{m.bettorsCount}</strong> apost.</div>
              <div>{fmtMM(m.poolTotal)} pts</div>
            </div>
          </button>
        )
      })}
      {selected === undefined && matches.length === 0 && (
        <div className="px-2.5 py-3 text-xs text-muted-foreground text-center">Nenhum jogo disponível.</div>
      )}
    </div>
  )
}

export function AdminFakesPanel({
  me, fakes, viewMatches, fakeBets, botConfig, fakeProfiles, recentBets, leagues, competitions, knockout,
  selectedCompSlug, comps,
}: {
  me: Me
  fakes: FakeUser[]
  viewMatches: MatchOption[]
  fakeBets: Array<{ fakeId: string; matchId: string }>
  botConfig: BotConfig
  fakeProfiles: FakeProfileRow[]
  recentBets: RecentFakeBet[]
  leagues: AdminLeague[]
  competitions: CompetitionOption[]
  knockout: KnockoutGame[]
  selectedCompSlug: string
  comps: { slug: string; name: string }[]
}) {
  // matchId → fakes que JÁ têm palpite aberto nesse jogo
  const takenByMatch = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const { fakeId, matchId } of fakeBets) {
      const set = map.get(matchId) || new Set<string>()
      set.add(fakeId)
      map.set(matchId, set)
    }
    return map
  }, [fakeBets])

  const isCopa = selectedCompSlug === "copa-do-mundo-2026"

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-10">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-5 text-amber-500" />
        <h1 className="text-xl font-extrabold tracking-tight">Admin · Fakes</h1>
        <Badge variant="outline" className="text-[10px]">escondida · só super admin</Badge>
      </div>

      {/* SELETOR DE COMPETIÇÃO — as cartas de jogo abaixo seguem o escolhido */}
      {comps.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-muted-foreground">Competição:</span>
          {comps.map((c) => (
            <Link
              key={c.slug}
              href={`/admin/fakes?comp=${c.slug}`}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                c.slug === selectedCompSlug ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <BotControlCard config={botConfig} />
      <RecentBetsCard initial={recentBets} />
      <CreateFakesCard />
      <MatchManagerCard me={me} fakes={fakes} matches={viewMatches} takenByMatch={takenByMatch} />
      <FakeBetsCard fakes={fakes} matches={viewMatches} />
      <FakeProfilesCard profiles={fakeProfiles} />
      <FakeLeaguesCard initial={leagues} fakes={fakes} competitions={competitions} />
      {isCopa && <KnockoutScheduleCard initial={knockout} />}
    </div>
  )
}

// ─── ROBÔ: liga/desliga + rodar agora ────────────────────────────────────────

function BotControlCard({ config }: { config: BotConfig }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(config?.enabled ?? false)

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      const r = await setBotEnabledAction(next)
      if (r.ok) toast.success(next ? "Robô ligado" : "Robô desligado")
      else { setEnabled(!next); toast.error(r.error || "Erro") }
    })
  }

  const runNow = () => {
    startTransition(async () => {
      const r = await runFakeDripAction()
      if (r.ok) { toast.success("Drip disparado — apostas entram em alguns segundos"); setTimeout(() => router.refresh(), 4000) }
      else toast.error(r.error || "Erro")
    })
  }

  return (
    <Card className={enabled ? "border-primary/40" : undefined}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-sm flex items-center gap-1.5">
            <Bot className="size-4 text-primary" />
            Robô de apostas
            <Badge variant={enabled ? "default" : "outline"} className="text-[10px]">
              {enabled ? "ligado" : "desligado"}
            </Badge>
          </h2>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={pending} onClick={runNow}>
              <Play className="size-3" /> Rodar agora
            </Button>
            <Button size="sm" className="h-7 text-xs" disabled={pending} onClick={toggle}>
              {enabled ? "Desligar" : "Ligar"}
            </Button>
          </div>
        </div>
        {config && (
          <p className="text-[11px] text-muted-foreground">
            Participação por frequência · stake = % do saldo de cada fake ·
            escalada {config.ramp_hours}h · banda ±{Math.round(config.default_band * 100)}pp ·
            {config.comp_slugs.length} competições · drip 20min
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── FEED: ÚLTIMOS PALPITES DO ROBÔ ──────────────────────────────────────────

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}min`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function RecentBetsCard({ initial }: { initial: RecentFakeBet[] }) {
  const [rows, setRows] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [auto, setAuto] = useState(false)

  const refresh = () => {
    startTransition(async () => {
      const r = await listRecentFakeBetsAction(40)
      if (r.rows) setRows(r.rows)
      else if (r.error) toast.error(r.error)
    })
  }

  useEffect(() => {
    if (!auto) return
    const t = setInterval(refresh, 20000) // a cada 20s, igual ao ritmo do drip
    return () => clearInterval(t)
  }, [auto])

  const label = (b: RecentFakeBet) =>
    b.outcome === "home" ? localizeTeamName(b.homeTeam)
    : b.outcome === "away" ? localizeTeamName(b.awayTeam)
    : "Empate"
  const oc = (o: string) => (o === "home" ? "1" : o === "draw" ? "X" : "2")

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm flex items-center gap-1.5">
            <Activity className="size-4 text-primary" />
            Últimos palpites do robô
            <Badge variant="outline" className="text-[10px]">{rows.length}</Badge>
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAuto((a) => !a)}
              className={`text-[10px] px-1.5 py-0.5 rounded ${auto ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
            >
              {auto ? "● ao vivo" : "ao vivo?"}
            </button>
            <Button size="sm" variant="outline" className="h-6 text-[11px]" disabled={pending} onClick={refresh}>
              atualizar
            </Button>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y">
          {rows.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum palpite ainda. Liga o robô e clica em &quot;rodar agora&quot;.
            </p>
          ) : (
            rows.map((b, i) => (
              <div key={i} className="py-1.5 flex items-center gap-2 text-[11px]">
                <span className="text-muted-foreground font-mono w-9 shrink-0">{timeAgo(b.placedAt)}</span>
                <span className="font-medium truncate w-20 shrink-0">{b.nickname}</span>
                <span className="flex-1 truncate text-muted-foreground">
                  {localizeTeamName(b.homeTeam)} × {localizeTeamName(b.awayTeam)}
                </span>
                <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">
                  {oc(b.outcome)} {label(b)}
                </Badge>
                <span className="font-mono font-semibold w-10 text-right shrink-0">{fmtMM(b.stake)}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── PERFIS DOS FAKES ────────────────────────────────────────────────────────

function FakeProfilesCard({ profiles }: { profiles: FakeProfileRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState("")
  const [draft, setDraft] = useState<Record<string, { f: number; r: number; lo: number; hi: number; h: boolean }>>({})
  const [nick, setNick] = useState<Record<string, string>>({})  // userId → nickname editado (rename isolado)
  // faixa pro bulk "aplicar a todos/filtrados" (pontos percentuais)
  const [bandLo, setBandLo] = useState(2)
  const [bandHi, setBandHi] = useState(8)

  const filtered = profiles.filter((p) => p.nickname.toLowerCase().includes(q.toLowerCase()))

  const valOf = (p: FakeProfileRow) =>
    draft[p.userId] ?? {
      f: p.betFrequency, r: p.riskAppetite,
      lo: Math.round(p.stakePctMin * 100), hi: Math.round(p.stakePctMax * 100), h: p.canHedge,
    }
  const patch = (p: FakeProfileRow, k: Partial<{ f: number; r: number; lo: number; hi: number; h: boolean }>) =>
    setDraft((d) => ({ ...d, [p.userId]: { ...valOf(p), ...k } }))

  const isDirty = (p: FakeProfileRow) => {
    const v = draft[p.userId]
    return !!v && (
      v.f !== p.betFrequency || v.r !== p.riskAppetite || v.h !== p.canHedge ||
      v.lo !== Math.round(p.stakePctMin * 100) || v.hi !== Math.round(p.stakePctMax * 100)
    )
  }
  const dirtyRows = profiles.filter(isDirty)

  const saveAll = () => {
    if (dirtyRows.length === 0) return
    const payload = dirtyRows.map((p) => {
      const v = valOf(p)
      const lo = Math.min(v.lo, v.hi), hi = Math.max(v.lo, v.hi)
      return { user_id: p.userId, freq: v.f, risk: v.r, pct_min: lo / 100, pct_max: hi / 100, can_hedge: v.h }
    })
    startTransition(async () => {
      const r = await setFakeProfilesBulkAction(payload)
      if (r.ok) { toast.success(`${dirtyRows.length} perfil(is) salvo(s)`); setDraft({}); router.refresh() }
      else toast.error(r.error || "Erro")
    })
  }
  const discard = () => setDraft({})

  const applyBand = (ids: string[] | null) => {
    const lo = Math.min(bandLo, bandHi), hi = Math.max(bandLo, bandHi)
    startTransition(async () => {
      const r = await applyStakeBandAction(ids, lo / 100, hi / 100)
      if (r.ok) { toast.success(`Faixa ${lo}%–${hi}% aplicada a ${r.affected ?? "?"} fake(s)`); setDraft({}); router.refresh() }
      else toast.error(r.error || "Erro")
    })
  }

  const nickOf = (p: FakeProfileRow) => nick[p.userId] ?? p.nickname
  const nickChanged = (p: FakeProfileRow) => {
    const t = nickOf(p).trim()
    return t !== "" && t !== p.nickname
  }
  const renameFake = (p: FakeProfileRow) => {
    const newNick = nickOf(p).trim()
    if (newNick === "" || newNick === p.nickname) return
    startTransition(async () => {
      const r = await renameFakeAction(p.userId, newNick)
      if (r.ok) {
        toast.success(`Renomeado p/ ${newNick}`)
        setNick((d) => { const n = { ...d }; delete n[p.userId]; return n })
        router.refresh()
      } else toast.error(r.error || "Erro")
    })
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div>
          <h2 className="font-bold text-sm flex items-center gap-1.5">
            <SlidersHorizontal className="size-4 text-primary" />
            Perfis dos fakes
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            freq = % de jogos · risco = favorito↔zebra · stake = faixa % do saldo por aposta · dupla chance = reparte a banca em vencedor + empate.
          </p>
        </div>
        <Input placeholder="filtrar por nickname..." value={q} onChange={(e) => setQ(e.target.value)} className="h-8 text-xs" />

        {/* BULK — aplica uma faixa de stake a todos ou só aos filtrados */}
        <div className="rounded-md border bg-muted/30 p-2 space-y-1.5">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Aplicar faixa de stake (% do saldo)
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Input type="number" min={0} max={100} value={bandLo} disabled={pending}
              onChange={(e) => setBandLo(Math.max(0, parseInt(e.target.value) || 0))} className="h-7 w-14 text-xs" />
            <span className="text-xs text-muted-foreground">–</span>
            <Input type="number" min={0} max={100} value={bandHi} disabled={pending}
              onChange={(e) => setBandHi(Math.max(0, parseInt(e.target.value) || 0))} className="h-7 w-14 text-xs" />
            <span className="text-[10px] text-muted-foreground mr-auto">%</span>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={pending || filtered.length === 0}
              onClick={() => applyBand(filtered.map((p) => p.userId))}>
              aos filtrados ({filtered.length})
            </Button>
            <Button size="sm" className="h-7 text-[11px]" disabled={pending} onClick={() => applyBand(null)}>
              a todos
            </Button>
          </div>
        </div>

        {/* BARRA DE SALVAR TODOS — uma chamada pra todas as alterações manuais */}
        {dirtyRows.length > 0 && (
          <div className="flex items-center justify-between gap-2 rounded-md border bg-primary/5 px-2 py-1.5">
            <span className="text-[11px] text-muted-foreground">
              <strong className="text-foreground">{dirtyRows.length}</strong> com alterações não salvas
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button size="sm" variant="ghost" className="h-6 text-[11px]" disabled={pending} onClick={discard}>descartar</Button>
              <Button size="sm" className="h-6 text-[11px]" disabled={pending} onClick={saveAll}>
                salvar todos ({dirtyRows.length})
              </Button>
            </div>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto divide-y">
          {filtered.map((p) => {
            const v = valOf(p)
            const dirty = isDirty(p)
            return (
              <div key={p.userId} className="py-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs">
                  {dirty && <span className="size-1.5 rounded-full bg-amber-500 shrink-0" title="alterado (não salvo)" />}
                  <Input value={nickOf(p)} disabled={pending}
                    onChange={(e) => setNick((d) => ({ ...d, [p.userId]: e.target.value }))}
                    className="h-6 text-xs font-medium flex-1 min-w-0" />
                  {nickChanged(p) && (
                    <Button size="sm" className="h-6 px-1.5 shrink-0" disabled={pending} onClick={() => renameFake(p)} title="renomear">
                      <Check className="size-3" />
                    </Button>
                  )}
                  {v.h && <Badge variant="secondary" className="h-4 px-1 text-[9px] font-normal shrink-0">2×</Badge>}
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">{fmtMM(p.balance)} pts</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([["f", "freq"], ["r", "risco"]] as const).map(([key, label]) => (
                    <label key={key} className="text-[10px] text-muted-foreground">
                      {label} {Math.round(v[key] * 100)}%
                      <input
                        type="range" min={0} max={100} value={Math.round(v[key] * 100)}
                        onChange={(e) => patch(p, key === "f" ? { f: parseInt(e.target.value) / 100 } : { r: parseInt(e.target.value) / 100 })}
                        disabled={pending} className="w-full"
                      />
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground shrink-0">stake</span>
                  <Input type="number" min={0} max={100} value={v.lo} disabled={pending}
                    onChange={(e) => patch(p, { lo: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="h-6 w-14 text-xs" />
                  <span className="text-[10px] text-muted-foreground">–</span>
                  <Input type="number" min={0} max={100} value={v.hi} disabled={pending}
                    onChange={(e) => patch(p, { hi: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="h-6 w-14 text-xs" />
                  <span className="text-[10px] text-muted-foreground">% do saldo</span>
                </div>
                <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={v.h} disabled={pending}
                    onChange={(e) => patch(p, { h: e.target.checked })} className="size-3.5 accent-primary" />
                  Dupla chance <span className="text-muted-foreground/70">(vencedor + empate)</span>
                </label>
              </div>
            )
          })}
          {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Nenhum fake.</p>}
        </div>

        {/* rodapé: salvar também embaixo, pra listas longas */}
        {dirtyRows.length > 0 && (
          <div className="flex justify-end">
            <Button size="sm" className="h-7 text-xs" disabled={pending} onClick={saveAll}>
              salvar todos ({dirtyRows.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── 0. CRIAR FAKES ──────────────────────────────────────────────────────────

function CreateFakesCard() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [text, setText] = useState("")

  const nicknames = text.split("\n").map((l) => l.trim()).filter(Boolean)

  const submit = () => {
    if (nicknames.length === 0) return
    startTransition(async () => {
      const r = await createFakesAction(nicknames)
      if (r.error) {
        toast.error(r.error)
        return
      }
      if (r.created > 0) toast.success(`${r.created} fake${r.created > 1 ? "s" : ""} criado${r.created > 1 ? "s" : ""} (saldo 1.000 pts, nas Ligas Globais)`)
      if (r.skipped.length > 0) toast.warning(`${r.skipped.length} pulado(s): ${r.skipped[0].nickname} (${r.skipped[0].reason})`)
      if (r.created > 0) { setText(""); router.refresh() }
    })
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h2 className="font-bold text-sm flex items-center gap-1.5">
          <UserPlus className="size-4 text-primary" />
          Criar novos fakes
        </h2>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Um nickname por linha. Cada um nasce com 1.000 pts e entra nas Ligas Globais grátis.
        </p>
        <textarea
          className="w-full min-h-[88px] rounded-md border bg-background px-2.5 py-2 text-sm font-mono"
          placeholder={"carlossp\nduda_rj\nzecabala10"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={pending}
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {nicknames.length} nickname{nicknames.length === 1 ? "" : "s"}
          </span>
          <Button size="sm" disabled={nicknames.length === 0 || pending} onClick={submit}>
            {pending ? "Criando..." : `Criar ${nicknames.length || ""}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── GERENCIADOR DO JOGO (seletor único: subir palpites + editar apostas) ─────

function calcOdd(total: number, slice: number): string {
  return slice > 0 ? (total / slice).toFixed(2) : "—"
}

function MatchManagerCard({
  me, fakes, matches, takenByMatch,
}: { me: Me; fakes: FakeUser[]; matches: MatchOption[]; takenByMatch: Map<string, Set<string>> }) {
  const [matchId, setMatchId] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const match = matches.find((m) => m.id === matchId)

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <h2 className="font-bold text-sm flex items-center gap-1.5">
            <Repeat2 className="size-4 text-primary" />
            Gerenciar jogo
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Escolhe o jogo → sobe palpites de fakes e edita as apostas (suas ou de fakes).
          </p>
        </div>

        <MatchPicker matches={matches} value={matchId} onChange={setMatchId} />

        {match && match.status !== "finished" && (
          <EquilibrioSection match={match} />
        )}
        {match && match.status !== "finished" && (
          <PlaceFakeSection
            match={match} fakes={fakes} takenByMatch={takenByMatch}
            onPlaced={() => setReloadKey((k) => k + 1)}
          />
        )}
        {match && (
          <BetEditorSection
            key={`${match.id}-${reloadKey}`}
            match={match} me={me} fakes={fakes}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ─── Equilíbrio do jogo (alvo + banda + override manual) ──────────────────────

function EquilibrioSection({ match }: { match: MatchOption }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [bal, setBal] = useState<MatchBalance | null>(null)
  const [pct, setPct] = useState({ home: 33, draw: 33, away: 34 })
  const [band, setBand] = useState(5)
  const [bettors, setBettors] = useState("")  // meta de apostadores ("" = default global)
  const [pool, setPool] = useState("")        // meta de pote ("" = default global)

  useEffect(() => {
    let alive = true
    startTransition(async () => {
      const r = await getMatchBalanceAction(match.id)
      if (!alive || !r.data) return
      setBal(r.data)
      const t = r.data.override ?? r.data.prematch
      const poolTotal = r.data.pool.home + r.data.pool.draw + r.data.pool.away
      const fromPool = poolTotal > 0
        ? { home: r.data.pool.home / poolTotal, draw: r.data.pool.draw / poolTotal, away: r.data.pool.away / poolTotal }
        : null
      const src = t ?? fromPool ?? { home: 0.33, draw: 0.33, away: 0.34 }
      setPct({ home: Math.round(src.home * 100), draw: Math.round(src.draw * 100), away: Math.round(src.away * 100) })
      setBand(Math.round(r.data.band * 100))
      setBettors(r.data.targetBettors != null ? String(r.data.targetBettors) : "")
      setPool(r.data.targetPool != null ? String(r.data.targetPool) : "")
    })
    return () => { alive = false }
  }, [match.id])

  const saveTargets = (reset: boolean) => {
    startTransition(async () => {
      const b = reset || bettors.trim() === "" ? null : Math.max(0, parseInt(bettors) || 0)
      const p = reset || pool.trim() === "" ? null : Math.max(0, parseInt(pool) || 0)
      const r = await setMatchTargetsAction(match.id, b, p)
      if (r.ok) {
        toast.success(reset ? "Metas no padrão global" : "Metas salvas")
        if (reset) { setBettors(""); setPool("") }
        router.refresh()
      } else toast.error(r.error || "Erro")
    })
  }

  const sum = pct.home + pct.draw + pct.away
  const target = bal?.override ?? bal?.prematch
  const poolTotal = (bal?.pool.home ?? 0) + (bal?.pool.draw ?? 0) + (bal?.pool.away ?? 0)
  const curShare = (o: "home" | "draw" | "away") => (poolTotal > 0 ? (bal!.pool[o] / poolTotal) : 0)
  const curOdd = (o: "home" | "draw" | "away") => (bal && bal.pool[o] > 0 ? (poolTotal / bal.pool[o]).toFixed(2) : "—")

  const apply = (reset: boolean) => {
    startTransition(async () => {
      const r = reset
        ? await setMatchBalanceAction(match.id, null, null)
        : await setMatchBalanceAction(match.id, { home: pct.home / 100, draw: pct.draw / 100, away: pct.away / 100 }, band / 100)
      if (r.ok) { toast.success(reset ? "Voltou pro alvo da API" : "Reequilíbrio aplicado"); router.refresh() }
      else toast.error(r.error || "Erro")
    })
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <h3 className="font-semibold text-xs flex items-center gap-1.5">
        <Scale className="size-3.5 text-primary" />
        Equilíbrio do jogo
      </h3>

      {/* alvo vs pool atual */}
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {(["home", "draw", "away"] as const).map((o) => {
          const tgt = target?.[o] ?? null
          const cs = curShare(o)
          const out = tgt != null && poolTotal > 0 && Math.abs(cs - tgt) > (bal?.band ?? 0.05)
          return (
            <div key={o} className="rounded border p-1.5 text-center">
              <div className="text-muted-foreground uppercase">{o === "home" ? "1" : o === "draw" ? "X" : "2"}</div>
              <div className="font-mono">alvo {tgt != null ? `${Math.round(tgt * 100)}%` : "—"}</div>
              <div className={`font-mono ${out ? "text-rose-500" : "text-emerald-600"}`}>
                pool {poolTotal > 0 ? `${Math.round(cs * 100)}%` : "—"} · {curOdd(o)}x
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Fonte do alvo: {bal?.override ? "override manual" : bal?.prematch ? `odds API (source: ${(bal.prematch as unknown as { source?: string }).source ?? "api"})` : "fallback (sem odds ainda)"}.
      </p>

      {/* override manual */}
      <div className="grid grid-cols-3 gap-2">
        {(["home", "draw", "away"] as const).map((o) => (
          <label key={o} className="text-[10px] text-muted-foreground">
            {o === "home" ? "1" : o === "draw" ? "X" : "2"} {pct[o]}%
            <input type="range" min={0} max={100} value={pct[o]}
              onChange={(e) => setPct((p) => ({ ...p, [o]: parseInt(e.target.value) }))}
              disabled={pending} className="w-full" />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[10px] text-muted-foreground flex-1">
          banda ±{band}pp
          <input type="range" min={1} max={20} value={band}
            onChange={(e) => setBand(parseInt(e.target.value))} disabled={pending} className="w-full" />
        </label>
        <span className={`text-[10px] font-mono ${sum === 100 ? "text-muted-foreground" : "text-rose-500"}`}>Σ {sum}%</span>
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" className="h-7 text-xs flex-1" disabled={pending || sum !== 100} onClick={() => apply(false)}>
          Reequilibrar
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={pending} onClick={() => apply(true)}>
          Resetar p/ API
        </Button>
      </div>

      {/* metas de volume de fakes: atual × desejado (vazio = padrão global) */}
      <div className="rounded border p-2 space-y-2 bg-muted/30">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          Metas de volume (fakes)
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] text-muted-foreground space-y-1">
            <span>Apostadores — atual <b className="text-foreground font-mono">{bal?.fakeBettors ?? 0}</b></span>
            <Input type="number" min={0} value={bettors} disabled={pending}
              onChange={(e) => setBettors(e.target.value)}
              placeholder={`padrão ${bal?.defBettors ?? 70}`} className="h-7 text-xs" />
          </label>
          <label className="text-[10px] text-muted-foreground space-y-1">
            <span>Pote — atual <b className="text-foreground font-mono">{fmtMM(bal?.fakePool ?? 0)}</b></span>
            <Input type="number" min={0} step={100} value={pool} disabled={pending}
              onChange={(e) => setPool(e.target.value)}
              placeholder={`padrão ${(bal?.defPool ?? 3500).toLocaleString("pt-BR")}`} className="h-7 text-xs" />
          </label>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" className="h-7 text-xs flex-1" disabled={pending} onClick={() => saveTargets(false)}>
            Salvar metas
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={pending} onClick={() => saveTargets(true)}>
            Usar padrão
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          O robô preenche até a meta conforme a escalada (drip 20min). Em branco = padrão global
          ({bal?.defBettors ?? 70} fakes · {(bal?.defPool ?? 3500).toLocaleString("pt-BR")} pts).
        </p>
      </div>
    </div>
  )
}

// ─── Subir palpites de fakes (seção dentro do gerenciador) ────────────────────

function PlaceFakeSection({
  match, fakes, takenByMatch, onPlaced,
}: { match: MatchOption; fakes: FakeUser[]; takenByMatch: Map<string, Set<string>>; onPlaced: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selectedFakes, setSelectedFakes] = useState<Set<string>>(new Set())
  const [outcome, setOutcome] = useState<"home" | "draw" | "away">("home")
  const [stake, setStake] = useState(50)

  // Só fakes SEM palpite no jogo selecionado — cada aposta soma +1 apostador.
  const taken = takenByMatch.get(match.id)
  const availableFakes = fakes.filter((f) => !taken?.has(f.id))
  const chosen = availableFakes.filter((f) => selectedFakes.has(f.id))
  const addedTotal = chosen.length * stake
  const valid = chosen.length > 0 && stake >= 10 && chosen.every((f) => f.balance >= stake)

  // ── Simulação de odds: pool atual + (n fakes × stake) no outcome escolhido ──
  const pool = match.pool
  const totalNow = pool.home + pool.draw + pool.away
  const poolAfter = { ...pool, [outcome]: pool[outcome] + addedTotal }
  const totalAfter = totalNow + addedTotal

  const toggleFake = (id: string) => {
    setSelectedFakes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submit = () => {
    if (chosen.length === 0) return
    startTransition(async () => {
      const r = await placeFakeBetsBulkAction(chosen.map((f) => f.id), match.market1x2Id, outcome, stake)
      if (r.placed > 0) {
        toast.success(`${r.placed} palpite${r.placed > 1 ? "s" : ""} de ${stake} pts em ${OUTCOMES.find((o) => o.key === outcome)!.label(match)}`)
      }
      if (r.failed.length > 0) {
        toast.error(`${r.failed.length} falharam: ${r.failed[0].error}`)
      }
      setSelectedFakes(new Set())
      router.refresh()
      onPlaced()
    })
  }

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <h3 className="font-semibold text-xs flex items-center gap-1.5">
        <UserPlus className="size-3.5 text-primary" />
        Subir palpites de fakes
      </h3>
      {(
          <>
            <div className="grid grid-cols-3 gap-1.5">
              {OUTCOMES.map((o) => (
                <Button
                  key={o.key}
                  size="sm"
                  variant={outcome === o.key ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => setOutcome(o.key)}
                  disabled={pending}
                >
                  {o.label(match)}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={stake}
                onChange={(e) => setStake(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-9 w-24 font-mono"
                disabled={pending}
              />
              <span className="text-xs text-muted-foreground">pts por fake</span>
              {chosen.length > 0 && (
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {chosen.length} × {fmtMM(stake)} = {fmtMM(addedTotal)} pts
                </Badge>
              )}
            </div>

            {/* MULTI-SELEÇÃO — ordenada pelo ranking global */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-muted-foreground">
                  <strong className="text-foreground font-mono">{availableFakes.length}</strong>/{fakes.length} fakes
                  sem palpite nesse jogo · ordem = ranking global
                </p>
                {selectedFakes.size > 0 && (
                  <button
                    type="button"
                    className="text-[11px] text-primary hover:underline"
                    onClick={() => setSelectedFakes(new Set())}
                    disabled={pending}
                  >
                    limpar ({selectedFakes.size})
                  </button>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
                {availableFakes.map((f) => {
                  const semSaldo = f.balance < stake
                  return (
                    <label
                      key={f.id}
                      className={`flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/40 ${semSaldo ? "opacity-40" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFakes.has(f.id)}
                        onChange={() => toggleFake(f.id)}
                        disabled={pending || semSaldo}
                      />
                      <span className="font-mono text-[10px] text-muted-foreground w-9">
                        {f.rank ? `#${f.rank}` : "—"}
                      </span>
                      <span className="flex-1 truncate">{f.nickname}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {fmtMM(f.balance)} pts{semSaldo && " ⚠"}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* SIMULADOR DE ODDS */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Odds — antes → depois ({chosen.length} palpite{chosen.length === 1 ? "" : "s"} no {OUTCOMES.find((o) => o.key === outcome)!.label(match)})
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {OUTCOMES.map((o) => (
                  <div key={o.key} className={outcome === o.key ? "font-semibold" : ""}>
                    <div className="text-[10px] text-muted-foreground truncate">{o.label(match)}</div>
                    <div className="font-mono text-sm">
                      {calcOdd(totalNow, pool[o.key])}
                      <span className="text-muted-foreground/60 mx-1">→</span>
                      <span className={outcome === o.key ? "text-primary font-bold" : ""}>
                        {calcOdd(totalAfter, poolAfter[o.key])}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground text-center">
                pool {fmtMM(totalNow)} → {fmtMM(totalAfter)} pts
              </div>
            </div>

            <Button size="sm" className="w-full" disabled={!valid || pending} onClick={submit}>
              {pending
                ? "Enviando..."
                : `Subir ${chosen.length} palpite${chosen.length === 1 ? "" : "s"} (${addedTotal} pts)`}
            </Button>
          </>
        )}
    </div>
  )
}

// ─── Editar apostas do jogo (seção dentro do gerenciador) ─────────────────────

const OUTCOME_LABEL: Record<string, (m: MatchOption) => string> = {
  home: (m) => `1 · ${m.home}`,
  draw: () => "X · Empate",
  away: (m) => `2 · ${m.away}`,
}

function BetEditorSection({
  match, me, fakes,
}: { match: MatchOption; me: Me; fakes: FakeUser[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rows, setRows] = useState<EditorBetRow[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [destUser, setDestUser] = useState("")

  // Carrega/recarrega as apostas do jogo. key no pai remonta após "subir palpite".
  useEffect(() => {
    let alive = true
    startTransition(async () => {
      const r = await listMatchEditorAction(match.id)
      if (alive && r.rows) setRows(r.rows)
      else if (alive && r.error) toast.error(r.error)
    })
    return () => { alive = false }
  }, [match.id])

  const reload = () => {
    startTransition(async () => {
      const r = await listMatchEditorAction(match.id)
      if (r.rows) setRows(r.rows)
    })
    router.refresh()
  }

  const all = rows || []
  const total = all.reduce((acc, r) => acc + r.stake, 0)
  const isFinished = match.status === "finished"
  const isLive = match.status === "live"
  const poolSafeOnly = isLive          // em andamento: só troca de dono (odd-safe)
  const selectedRows = all.filter((r) => selected.has(r.betId))
  const selectedTotal = selectedRows.reduce((acc, r) => acc + r.stake, 0)

  // Quem já apostou nesse jogo (pra sinalizar no destino da troca)
  const bettorIds = new Set(all.map((r) => r.userId))
  // Destinos da troca: eu + fakes, ordenados por saldo desc
  const destOptions = [
    { id: me.id, nickname: me.nickname, balance: me.balance, isMe: true },
    ...fakes.map((f) => ({ id: f.id, nickname: f.nickname, balance: f.balance, isMe: false })),
  ].sort((a, b) => b.balance - a.balance)

  const toggle = (betId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(betId)) next.delete(betId)
      else next.add(betId)
      return next
    })
  }

  const apply = (action: "move" | "cancel" | "reassign", opts?: { newOutcome?: "home" | "draw" | "away"; newUserId?: string }) => {
    if (selected.size === 0) return
    startTransition(async () => {
      const r = await editBetsAction([...selected], action, opts)
      if (r.ok) {
        toast.success(
          action === "move" ? `${r.affected} aposta(s) movida(s)`
          : action === "cancel" ? `${r.affected} aposta(s) cancelada(s) · estornado`
          : `${r.affected} aposta(s) transferida(s)`)
        setSelected(new Set())
        setDestUser("")
        reload()
      } else {
        toast.error(r.error || "Erro")
      }
    })
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <h3 className="font-semibold text-xs flex items-center gap-1.5">
        <Repeat2 className="size-3.5 text-primary" />
        Apostas do jogo
      </h3>
      <p className="text-[11px] text-muted-foreground">
        Seleciona apostas <strong>suas ou de fakes</strong>. Reais de terceiros 🔒.
        {isLive && " Jogo em andamento: só troca de dono (preserva as odds)."}
        {isFinished && " Jogo liquidado: só leitura. ✓/✗ = acertou/errou."}
      </p>

      {pending && !rows && <p className="text-xs text-muted-foreground text-center py-2">Carregando...</p>}

      {rows && (
        all.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">Nenhuma aposta nesse jogo ainda.</p>
        ) : (
          <div className="space-y-2">
            {(["home", "draw", "away"] as const).map((o) => {
              const group = all.filter((r) => r.outcome === o)
              const pool = group.reduce((acc, r) => acc + r.stake, 0)
              return (
                <div key={o} className="rounded-md border overflow-hidden">
                  <div className="px-2 py-1.5 bg-muted/40 flex items-center justify-between text-[11px]">
                    <span className="font-semibold truncate">{OUTCOME_LABEL[o](match)}</span>
                    <span className="font-mono text-muted-foreground shrink-0">
                      {group.length} · {fmtMM(pool)} pts{pool > 0 && ` @${(total / pool).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="divide-y max-h-52 overflow-y-auto">
                    {group.length === 0 ? (
                      <div className="px-2 py-1.5 text-[11px] text-muted-foreground">—</div>
                    ) : (
                      group.map((r) => (
                        <label
                          key={r.betId}
                          className={`px-2 py-1.5 flex items-center gap-2 text-[11px] ${
                            r.editable && !isFinished ? "cursor-pointer hover:bg-muted/40" : ""
                          } ${selected.has(r.betId) ? "bg-primary/10" : ""}`}
                        >
                          {r.editable && !isFinished ? (
                            <input
                              type="checkbox"
                              checked={selected.has(r.betId)}
                              onChange={() => toggle(r.betId)}
                              disabled={pending}
                            />
                          ) : (
                            <span className="text-muted-foreground/50 text-[10px]">🔒</span>
                          )}
                          {r.status === "won" && <span className="text-emerald-500">✓</span>}
                          {r.status === "lost" && <span className="text-rose-500">✗</span>}
                          <span className="truncate flex-1">{r.nickname}</span>
                          {r.isMine && <Badge variant="default" className="text-[8px] h-3.5 px-1">você</Badge>}
                          {r.isFake && <Badge variant="outline" className="text-[8px] h-3.5 px-1">fake</Badge>}
                          <span className="text-muted-foreground font-mono shrink-0" title="acertos do apostador">
                            {r.userWins}✓
                          </span>
                          <span className="font-mono shrink-0 w-10 text-right">{fmtMM(r.stake)}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )
            })}

            {/* AÇÕES — quando há seleção e jogo não liquidado */}
            {selected.size > 0 && !isFinished && (
              <div className="rounded-lg border bg-muted/30 p-2.5 space-y-2">
                <div className="text-[11px] font-medium">
                  {selected.size} aposta(s) · {fmtMM(selectedTotal)} pts selecionados
                </div>

                {/* Trocar dono — sempre disponível (não iniciado E em andamento) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground shrink-0">trocar dono p/:</span>
                  <select
                    className="h-7 rounded-md border bg-background px-1.5 text-xs flex-1 min-w-0"
                    value={destUser}
                    onChange={(e) => setDestUser(e.target.value)}
                    disabled={pending}
                  >
                    <option value="">— escolhe —</option>
                    {destOptions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.isMe ? "★ você" : d.nickname} · {fmtMM(d.balance)}pts{bettorIds.has(d.id) ? " · já apostou" : ""}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" className="h-7 text-xs shrink-0"
                    disabled={pending || !destUser}
                    onClick={() => apply("reassign", { newUserId: destUser })}>
                    Trocar
                  </Button>
                </div>

                {/* Mover resultado + cancelar — só jogo NÃO INICIADO (mexem no pool) */}
                {!poolSafeOnly ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">mover p/:</span>
                    {(["home", "draw", "away"] as const).map((o) => (
                      <Button key={o} size="sm" variant="outline" className="h-7 text-xs"
                        disabled={pending} onClick={() => apply("move", { newOutcome: o })}>
                        {o === "home" ? "1" : o === "draw" ? "X" : "2"}
                      </Button>
                    ))}
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive ml-auto"
                      disabled={pending} onClick={() => apply("cancel")}>
                      Cancelar apostas
                    </Button>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    Mover resultado e cancelar ficam bloqueados em jogo em andamento (mexeria nas odds).
                  </p>
                )}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-right">
              {all.length} apostas · {fmtMM(total)} pts no jogo
            </p>
          </div>
        )
      )}
    </div>
  )
}

// ─── PALPITES POR FAKE (editar/selecionar por usuário) ───────────────────────

const OUTCOME_BADGE: Record<"home" | "draw" | "away", string> = { home: "1", draw: "X", away: "2" }

function FakeBetsCard({ fakes, matches }: { fakes: FakeUser[]; matches: MatchOption[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [fakeId, setFakeId] = useState("")
  const [rows, setRows] = useState<FakeUserBet[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [addMatch, setAddMatch] = useState("")
  const [addOutcome, setAddOutcome] = useState<"home" | "draw" | "away">("home")
  const [addStake, setAddStake] = useState(50)

  const fmtKick = (iso: string) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso))

  const load = (id: string) => {
    setSelected(new Set())
    if (!id) { setRows(null); return }
    startTransition(async () => {
      const r = await listFakeUserBetsAction(id)
      if (r.rows) setRows(r.rows)
      else { setRows(null); toast.error(r.error || "Erro") }
    })
  }
  const onSelectFake = (id: string) => { setFakeId(id); setShowAdd(false); setAddMatch(""); load(id) }

  const toggle = (betId: string) =>
    setSelected((p) => { const n = new Set(p); if (n.has(betId)) n.delete(betId); else n.add(betId); return n })

  const apply = (action: "move" | "cancel", opts?: { newOutcome?: "home" | "draw" | "away" }) => {
    if (selected.size === 0) return
    startTransition(async () => {
      const r = await editBetsAction([...selected], action, opts)
      if (r.ok) {
        toast.success(action === "move" ? `${r.affected} movida(s)` : `${r.affected} cancelada(s) · estornado`)
        setSelected(new Set()); load(fakeId); router.refresh()
      } else toast.error(r.error || "Erro")
    })
  }

  const addBet = () => {
    const m = matches.find((x) => x.id === addMatch)
    if (!m) return
    startTransition(async () => {
      const r = await placeFakeBetsBulkAction([fakeId], m.market1x2Id, addOutcome, addStake)
      if (r.placed > 0) { toast.success("Palpite adicionado"); setAddMatch(""); setShowAdd(false); load(fakeId); router.refresh() }
      else toast.error(r.failed[0]?.error || "Erro ao adicionar")
    })
  }

  const selFake = fakes.find((f) => f.id === fakeId)
  const all = rows || []
  const total = all.reduce((a, r) => a + r.stake, 0)
  const addableMatches = matches.filter((m) => m.status === "scheduled")
  const addMatchObj = matches.find((m) => m.id === addMatch)

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div>
          <h2 className="font-bold text-sm flex items-center gap-1.5">
            <Pencil className="size-4 text-primary" />
            Palpites por fake
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Escolhe um fake, vê os palpites dele, edita (mover/cancelar) ou adiciona novos. 🔒 = jogo já começou/liquidado.
          </p>
        </div>

        <FakeSelect fakes={fakes} value={fakeId} onChange={onSelectFake} disabled={pending} />

        {pending && !rows && fakeId && <p className="text-xs text-muted-foreground text-center py-2">Carregando...</p>}

        {fakeId && rows && (
          <>
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span><strong className="text-foreground">{all.length}</strong> palpites · <strong className="text-foreground">{fmtMM(total)}</strong> pts · saldo {selFake ? fmtMM(selFake.balance) : "—"}</span>
              <Button size="sm" variant="outline" className="h-6 text-[11px] shrink-0" disabled={pending} onClick={() => setShowAdd((s) => !s)}>
                <Plus className="size-3" /> palpite
              </Button>
            </div>

            {showAdd && (
              <div className="rounded-lg border bg-muted/30 p-2.5 space-y-2">
                <div className="text-[11px] font-medium">Adicionar palpite pra {selFake?.nickname}</div>
                <MatchPicker matches={addableMatches} value={addMatch} onChange={setAddMatch} disabled={pending} />
                {addMatchObj && (
                  <>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["home", "draw", "away"] as const).map((o) => (
                        <Button key={o} size="sm" variant={addOutcome === o ? "default" : "outline"} className="h-7 text-[11px] truncate"
                          disabled={pending} onClick={() => setAddOutcome(o)}>
                          {o === "home" ? `1 · ${addMatchObj.home}` : o === "draw" ? "X" : `2 · ${addMatchObj.away}`}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">stake</span>
                      <Input type="number" min={10} value={addStake} disabled={pending}
                        onChange={(e) => setAddStake(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-7 w-20 text-xs" />
                      <Button size="sm" className="h-7 text-xs ml-auto" disabled={pending || addStake < 10} onClick={addBet}>
                        Adicionar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {all.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Esse fake não tem palpites.</p>
            ) : (
              <div className="rounded-md border divide-y max-h-80 overflow-y-auto">
                {all.map((b) => (
                  <label key={b.betId} className={`flex items-center gap-2 px-2 py-1.5 text-[11px] ${b.editable ? "cursor-pointer hover:bg-muted/40" : ""} ${selected.has(b.betId) ? "bg-primary/10" : ""}`}>
                    {b.editable ? (
                      <input type="checkbox" checked={selected.has(b.betId)} onChange={() => toggle(b.betId)} disabled={pending} />
                    ) : (
                      <span className="text-muted-foreground/50 text-[10px] w-3.5 text-center">🔒</span>
                    )}
                    {b.status === "won" && <span className="text-emerald-500">✓</span>}
                    {b.status === "lost" && <span className="text-rose-500">✗</span>}
                    <Badge variant="outline" className="h-4 px-1 text-[9px] font-mono shrink-0">{OUTCOME_BADGE[b.outcome]}</Badge>
                    <span className="truncate flex-1">{localizeTeamName(b.home)} × {localizeTeamName(b.away)}</span>
                    <span className="text-muted-foreground font-mono shrink-0">{fmtKick(b.startsAt)}</span>
                    <span className="font-mono shrink-0 w-10 text-right">{fmtMM(b.stake)}</span>
                  </label>
                ))}
              </div>
            )}

            {selected.size > 0 && (
              <div className="rounded-lg border bg-muted/30 p-2.5 space-y-2">
                <div className="text-[11px] font-medium">{selected.size} palpite(s) selecionado(s)</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">mover p/:</span>
                  {(["home", "draw", "away"] as const).map((o) => (
                    <Button key={o} size="sm" variant="outline" className="h-7 text-xs" disabled={pending} onClick={() => apply("move", { newOutcome: o })}>
                      {o === "home" ? "1" : o === "draw" ? "X" : "2"}
                    </Button>
                  ))}
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive ml-auto" disabled={pending} onClick={() => apply("cancel")}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── LIGAS DE FAKES (criar/editar/excluir · membros · owner · solicitações) ───

// data (YYYY-MM-DD) → ISO em BRT meia-noite (pra backdatar created_at/joined_at)
function brtDateToISO(d: string): string | null {
  if (!d) return null
  const t = new Date(`${d}T00:00:00-03:00`)
  return isNaN(t.getTime()) ? null : t.toISOString()
}
// ISO → YYYY-MM-DD em BRT (pra preencher o <input type=date>)
function isoToBrtDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso))
}
// ISO → HH:MM em BRT (pra preencher o <input type=time>)
function isoToBrtTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso))
}
const DEFAULT_LEAGUE_START = "2026-06-01" // antes da Copa → conta todo o histórico

function FakeLeaguesCard({
  initial, fakes, competitions,
}: { initial: AdminLeague[]; fakes: FakeUser[]; competitions: CompetitionOption[] }) {
  const [leagues, setLeagues] = useState(initial)
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [pending, startTransition] = useTransition()
  const [cName, setCName] = useState("")
  const [cOwner, setCOwner] = useState("")
  const [cComp, setCComp] = useState("")
  const [cVisible, setCVisible] = useState(true)
  const [cStart, setCStart] = useState(DEFAULT_LEAGUE_START)

  const reload = async () => {
    const r = await listFakeLeaguesAction()
    if (r.rows) setLeagues(r.rows)
    else if (r.error) toast.error(r.error)
  }

  const create = () => startTransition(async () => {
    const r = await createFakeLeagueAction(cName, cOwner, cComp || null, cVisible, "", brtDateToISO(cStart))
    if (r.ok) {
      toast.success("Liga criada")
      setCName(""); setCOwner(""); setCComp("")
      setShowCreate(false)
      await reload()
    } else toast.error(r.error || "Erro")
  })

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 w-full text-left">
          <Users className="size-4 text-primary shrink-0" />
          <span className="font-bold text-sm shrink-0">Ligas de fakes</span>
          <span className="text-[11px] text-muted-foreground truncate">{leagues.length} privada(s)</span>
          <ChevronDown className={`size-4 text-muted-foreground ml-auto shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">Ligas privadas com owner fake. Tudo aqui é manual.</p>
              <Button size="sm" variant="outline" className="h-7 text-[11px] shrink-0" disabled={pending} onClick={() => setShowCreate((s) => !s)}>
                <Plus className="size-3" /> nova liga
              </Button>
            </div>

            {showCreate && (
              <div className="rounded-lg border bg-muted/30 p-2.5 space-y-2">
                <Input placeholder="nome da liga" value={cName} onChange={(e) => setCName(e.target.value)} disabled={pending} className="h-8 text-xs" />
                <FakeSelect fakes={fakes} value={cOwner} onChange={setCOwner} disabled={pending} />
                <div className="flex items-center gap-2">
                  <select className="h-8 rounded-md border bg-background px-2 text-xs flex-1 min-w-0" value={cComp} onChange={(e) => setCComp(e.target.value)} disabled={pending}>
                    <option value="">— sem competição —</option>
                    {competitions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <label className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                    <input type="checkbox" checked={cVisible} onChange={(e) => setCVisible(e.target.checked)} className="accent-primary" /> membros visíveis
                  </label>
                </div>
                <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="shrink-0">computar saldo desde</span>
                  <Input type="date" value={cStart} onChange={(e) => setCStart(e.target.value)} disabled={pending} className="h-7 text-xs" />
                </label>
                <Button size="sm" className="h-7 text-xs w-full" disabled={pending || !cName.trim() || !cOwner} onClick={create}>
                  Criar liga
                </Button>
              </div>
            )}

            {leagues.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhuma liga de fake.</p>}
            {leagues.map((l) => <FakeLeagueRow key={l.id} league={l} fakes={fakes} onChanged={reload} />)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FakeLeagueRow({
  league, fakes, onChanged,
}: { league: AdminLeague; fakes: FakeUser[]; onChanged: () => Promise<void> | void }) {
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(league.name)
  const [addUser, setAddUser] = useState("")
  const [newOwner, setNewOwner] = useState("")
  const [confirmDel, setConfirmDel] = useState(false)
  const [bulkN, setBulkN] = useState(20)
  const [startDate, setStartDate] = useState(isoToBrtDate(league.createdAt))

  const act = (thunk: () => Promise<AdminActionResult>, okMsg: string) =>
    startTransition(async () => {
      const r = await thunk()
      if (r.ok) { toast.success(okMsg); await onChanged() }
      else toast.error(r.error || "Erro")
    })

  const addMember = () => {
    if (!addUser) return
    startTransition(async () => {
      const r = await addLeagueMemberAction(league.id, addUser)
      if (r.ok) { toast.success("Membro adicionado"); setAddUser(""); await onChanged() }
      else toast.error(r.error || "Erro")
    })
  }

  // Bulk: novos membros entram com joined_at = data de criação da liga (saldo conta desde aí)
  const addBulk = (ids: string[]) => {
    if (ids.length === 0) return
    startTransition(async () => {
      const r = await addLeagueMembersAction(league.id, ids, league.createdAt)
      if (r.ok) { toast.success(`${r.added} adicionado(s)`); await onChanged() }
      else toast.error(r.error || "Erro")
    })
  }
  const pickRandom = (n: number) => {
    const pool = [...availableFakes]
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
    return pool.slice(0, n).map((f) => f.id)
  }
  const applyDates = () => {
    const iso = brtDateToISO(startDate)
    if (!iso) return
    act(() => setLeagueDatesAction(league.id, iso, true), "Datas ajustadas")
  }
  const changeOwner = () => {
    if (!newOwner) return
    const id = newOwner
    setNewOwner("")
    act(() => setLeagueOwnerAction(league.id, id), "Owner trocado")
  }

  const memberIds = new Set(league.members.map((m) => m.userId))
  const availableFakes = fakes.filter((f) => !memberIds.has(f.id))

  return (
    <div className="rounded-lg border p-2 space-y-2">
      {/* nome + excluir */}
      <div className="flex items-center gap-1.5">
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={pending} className="h-7 text-xs font-semibold flex-1" />
        {name.trim() !== league.name && name.trim() !== "" && (
          <Button size="sm" className="h-7 px-1.5 shrink-0" disabled={pending}
            onClick={() => act(() => updateLeagueAction(league.id, name, league.description ?? "", league.membersVisible), "Nome salvo")}>
            <Check className="size-3" />
          </Button>
        )}
        {confirmDel ? (
          <Button size="sm" variant="ghost" className="h-7 px-1.5 text-[11px] text-rose-500 shrink-0" disabled={pending}
            onClick={() => act(() => deleteLeagueAction(league.id), "Liga excluída")}>
            confirmar
          </Button>
        ) : (
          <Button size="sm" variant="ghost" className="h-7 px-1.5 text-muted-foreground shrink-0" disabled={pending} onClick={() => setConfirmDel(true)}>
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      {/* meta */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Crown className="size-3 text-amber-500" /> {league.ownerNickname}</span>
        <span>· código <span className="font-mono text-foreground">{league.inviteCode}</span></span>
        {league.competitionName && <span>· {league.competitionName}</span>}
        <button type="button" disabled={pending} className="underline hover:text-foreground"
          onClick={() => act(() => updateLeagueAction(league.id, league.name, league.description ?? "", !league.membersVisible), "Visibilidade atualizada")}>
          {league.membersVisible ? "membros visíveis" : "membros ocultos"}
        </button>
      </div>

      {/* trocar owner */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground shrink-0">owner →</span>
        <select className="h-7 rounded-md border bg-background px-1.5 text-xs flex-1 min-w-0" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} disabled={pending}>
          <option value="">— trocar p/ fake —</option>
          {fakes.map((f) => <option key={f.id} value={f.id}>{f.nickname}</option>)}
        </select>
        <Button size="sm" className="h-7 px-2 text-[11px] shrink-0" disabled={pending || !newOwner} onClick={changeOwner}>trocar</Button>
      </div>

      {/* data de início → backdata created_at + joined_at de todos (saldo conta desde aí) */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground shrink-0">saldo desde</span>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={pending} className="h-7 text-xs flex-1 min-w-0" />
        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] shrink-0" disabled={pending} onClick={applyDates}>aplicar a todos</Button>
      </div>

      {/* membros */}
      <div className="space-y-1">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Membros ({league.members.length})</div>
        <div className="max-h-44 overflow-y-auto divide-y">
          {league.members.map((m) => (
            <div key={m.userId} className="flex items-center gap-1.5 text-[11px] py-1">
              {m.role === "owner" ? <Crown className="size-3 text-amber-500 shrink-0" /> : <span className="size-3 shrink-0" />}
              <span className="truncate flex-1">{m.nickname}</span>
              {!m.isFake && <Badge variant="outline" className="h-3.5 px-1 text-[8px]">real</Badge>}
              {m.role !== "owner" && (
                <Button size="sm" variant="ghost" className="h-5 px-1 text-rose-500" disabled={pending}
                  onClick={() => act(() => removeLeagueMemberAction(league.id, m.userId), "Membro removido")}>
                  <X className="size-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {/* add em massa — entram com joined_at = data de criação da liga */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Input type="number" min={1} value={bulkN} onChange={(e) => setBulkN(Math.max(1, parseInt(e.target.value) || 1))} disabled={pending} className="h-7 w-14 text-xs" />
          <Button size="sm" className="h-7 px-2 text-[11px]" disabled={pending || availableFakes.length === 0} onClick={() => addBulk(pickRandom(bulkN))}>
            <Plus className="size-3" /> {bulkN} fakes
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={pending || availableFakes.length === 0} onClick={() => addBulk(availableFakes.map((f) => f.id))}>
            todos ({availableFakes.length})
          </Button>
        </div>
        {/* add unitário (preciso) */}
        <div className="flex items-center gap-1.5">
          <select className="h-7 rounded-md border bg-background px-1.5 text-xs flex-1 min-w-0" value={addUser} onChange={(e) => setAddUser(e.target.value)} disabled={pending}>
            <option value="">— add fake específico —</option>
            {availableFakes.map((f) => <option key={f.id} value={f.id}>{f.nickname}</option>)}
          </select>
          <Button size="sm" className="h-7 px-2 text-[11px] shrink-0" disabled={pending || !addUser} onClick={addMember}>
            <Plus className="size-3" />
          </Button>
        </div>
      </div>

      {/* solicitações pendentes */}
      {league.pending.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            Solicitações ({league.pending.length})
          </div>
          {league.pending.map((p) => (
            <div key={p.requestId} className="flex items-center gap-1.5 text-[11px]">
              <span className="truncate flex-1">{p.nickname}</span>
              <Button size="sm" variant="ghost" className="h-5 px-1 text-emerald-600 dark:text-emerald-400" disabled={pending}
                onClick={() => act(() => decideJoinRequestAction(p.requestId, true), "Aprovado")}>
                <Check className="size-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-5 px-1 text-rose-500" disabled={pending}
                onClick={() => act(() => decideJoinRequestAction(p.requestId, false), "Rejeitado")}>
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MATA-MATA · agenda editável (tabela de apoio) ───────────────────────────

const KO_STAGE_LABEL: Record<string, string> = {
  round_of_32: "16-avos", round_of_16: "Oitavas", quarter: "Quartas",
  semi: "Semis", third: "3º lugar", final: "Final",
}
const KO_STAGE_ORDER = ["round_of_32", "round_of_16", "quarter", "semi", "third", "final"]

function KnockoutScheduleCard({ initial }: { initial: KnockoutGame[] }) {
  const [games, setGames] = useState(initial)
  const [open, setOpen] = useState(false)

  const reload = async () => {
    const r = await listKnockoutScheduleAction()
    if (r.rows) setGames(r.rows)
    else if (r.error) toast.error(r.error)
  }

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 w-full text-left">
          <Swords className="size-4 text-primary shrink-0" />
          <span className="font-bold text-sm shrink-0">Mata-mata · agenda</span>
          <span className="text-[11px] text-muted-foreground truncate">{games.length} jogos · editável</span>
          <ChevronDown className={`size-4 text-muted-foreground ml-auto shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] text-muted-foreground">
              Slots: <span className="font-mono">1A/2A</span> = 1º/2º grupo · <span className="font-mono">3:CDFGH</span> = melhor 3º entre esses grupos ·
              <span className="font-mono">W73</span>/<span className="font-mono">L101</span> = venc./perd. da partida · ou nome do time. Horários em BRT.
            </p>
            {games.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Agenda vazia.</p>}
            {KO_STAGE_ORDER.map((st) => {
              const gs = games.filter((g) => g.stage === st)
              if (gs.length === 0) return null
              return (
                <div key={st} className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{KO_STAGE_LABEL[st]}</div>
                  {gs.map((g) => <KnockoutRow key={g.matchNo} game={g} onChanged={reload} />)}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function KnockoutRow({ game, onChanged }: { game: KnockoutGame; onChanged: () => Promise<void> | void }) {
  const [pending, startTransition] = useTransition()
  const [home, setHome] = useState(game.homeSlot)
  const [away, setAway] = useState(game.awaySlot)
  const [date, setDate] = useState(isoToBrtDate(game.kickoff))
  const [time, setTime] = useState(isoToBrtTime(game.kickoff))
  const [venue, setVenue] = useState(game.venue)

  const dirty =
    home !== game.homeSlot || away !== game.awaySlot || venue !== game.venue ||
    date !== isoToBrtDate(game.kickoff) || time !== isoToBrtTime(game.kickoff)

  const save = () => {
    const dt = new Date(`${date}T${time}:00-03:00`)
    if (isNaN(dt.getTime())) { toast.error("Data/hora inválida"); return }
    startTransition(async () => {
      const r = await updateKnockoutSlotAction(game.matchNo, home, away, dt.toISOString(), venue)
      if (r.ok) { toast.success(`Jogo ${game.matchNo} salvo`); await onChanged() }
      else toast.error(r.error || "Erro")
    })
  }

  const materialize = () => startTransition(async () => {
    const r = await materializeKnockoutAction(game.matchNo)
    if (r.ok) { toast.success(`${r.home} × ${r.away} ${game.materialized ? "atualizado" : "criado"} no app`); await onChanged() }
    else toast.error(r.error || "Erro")
  })

  const confirm = (v: boolean) => startTransition(async () => {
    const r = await setKnockoutConfirmedAction(game.matchNo, v)
    if (r.ok) { toast.success(v ? "Apostas abertas" : "Apostas fechadas"); await onChanged() }
    else toast.error(r.error || "Erro")
  })

  return (
    <div className="rounded-md border p-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] font-semibold text-muted-foreground shrink-0 w-7">#{game.matchNo}</span>
        <Input value={home} onChange={(e) => setHome(e.target.value)} disabled={pending} className="h-6 text-xs" />
        <span className="text-muted-foreground text-xs shrink-0">×</span>
        <Input value={away} onChange={(e) => setAway(e.target.value)} disabled={pending} className="h-6 text-xs" />
      </div>
      <div className="flex items-center gap-1.5">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={pending} className="h-6 text-xs w-[120px] shrink-0" />
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={pending} className="h-6 text-xs w-[80px] shrink-0" />
        <Input value={venue} onChange={(e) => setVenue(e.target.value)} disabled={pending} className="h-6 text-xs" placeholder="sede" />
        {dirty && (
          <Button size="sm" className="h-6 px-1.5 shrink-0" disabled={pending} onClick={save}>
            <Check className="size-3" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {!game.materialized
          ? <span className="text-[9px] text-muted-foreground">não criado</span>
          : game.confirmed
            ? <Badge variant="outline" className="h-4 px-1 text-[9px] gap-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40"><Check className="size-2.5" /> apostas abertas</Badge>
            : <Badge variant="outline" className="h-4 px-1 text-[9px] text-amber-600 dark:text-amber-400 border-amber-400/40">aposta fechada</Badge>}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {game.materialized && (
            <Button size="sm" variant={game.confirmed ? "ghost" : "default"} className="h-5 px-1.5 text-[10px]" disabled={pending} onClick={() => confirm(!game.confirmed)}>
              {game.confirmed ? "fechar apostas" : "confirmar times"}
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-5 px-1.5 text-[10px]" disabled={pending || dirty} onClick={materialize}>
            {game.materialized ? "atualizar" : "materializar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
