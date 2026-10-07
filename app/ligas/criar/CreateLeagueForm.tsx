"use client"

import { useState } from "react"
import Link from "next/link"
import { useActionState } from "react"
import { ChevronLeft, AlertCircle, Lock, Sparkles, EyeOff, Trophy, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Flag } from "@/components/Flag"
import { createLeagueAction, type CreateLeagueResult } from "../actions"
import { getCompetitionDesign } from "@/lib/competitions-design"
import { cn } from "@/lib/utils"

export type CompetitionOption = {
  id: string
  slug: string
  name: string
  season: string | null
  countryCode: string | null
  icon: string | null
  isActiveForBetting: boolean
  isProOnly: boolean
}

type Props = {
  competitions: CompetitionOption[]
  /** Pré-seleciona competição (vinda de ?competition=slug, ex: do hub) */
  initialCompetitionId?: string | null
}

export function CreateLeagueForm({ competitions, initialCompetitionId }: Props) {
  const [state, formAction, isPending] = useActionState<CreateLeagueResult, FormData>(
    createLeagueAction,
    {},
  )

  // Prioridade: prefill explícito → primeira competição ativa e grátis → null
  const defaultActive = competitions.find((c) => c.isActiveForBetting && !c.isProOnly)
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(
    initialCompetitionId || defaultActive?.id || null,
  )

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
        <Link href="/ligas">
          <ChevronLeft className="size-4 mr-1" />
          Voltar pras ligas
        </Link>
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Criar liga</h1>
        <p className="text-sm text-muted-foreground">
          Escolhe a competição e convide amigos. Você será o owner.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <form action={formAction} className="space-y-5">
            {state.error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            {/* COMPETIÇÃO — radio cards */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Trophy className="size-3.5 text-primary" />
                Competição
              </Label>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Sua liga vai acompanhar essa competição. Outras chegam logo após a Copa.
              </p>
              <input type="hidden" name="competitionId" value={selectedCompetitionId || ""} />
              <div className="grid grid-cols-1 gap-2">
                {competitions.map((c) => (
                  <CompetitionRadioCard
                    key={c.id}
                    competition={c}
                    isSelected={c.id === selectedCompetitionId}
                    onSelect={() => c.isActiveForBetting && setSelectedCompetitionId(c.id)}
                  />
                ))}
              </div>
              {state.fieldErrors?.competitionId && (
                <p className="text-xs text-destructive">{state.fieldErrors.competitionId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Nome da liga</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                maxLength={50}
                placeholder="Ex: Liga dos Amigos da Faculdade"
                aria-invalid={!!state.fieldErrors?.name}
              />
              {state.fieldErrors?.name && (
                <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                Descrição <span className="text-[10px] text-muted-foreground">(opcional)</span>
              </Label>
              <textarea
                id="description"
                name="description"
                rows={2}
                maxLength={200}
                placeholder="Liga dos amigos pra galera da família. Vencedor paga o churrasco."
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              />
            </div>

            <input type="hidden" name="visibility" value="private" />
            <Card className="bg-primary/[0.03] border-primary/20">
              <CardContent className="p-3 flex items-start gap-2.5">
                <Lock className="size-4 text-primary mt-0.5 shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-foreground mb-0.5">Liga privada</div>
                  <div className="text-muted-foreground">
                    Só entra com código de convite ou aprovação sua. Todos os usuários já participam automaticamente da{" "}
                    <Link href="/ligas/global" className="text-primary hover:underline font-medium">Liga Global</Link>.
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2 rounded-md border border-dashed p-3">
              <div className="flex items-start gap-2.5">
                <Checkbox id="hideMembers" name="hideMembers" className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <label htmlFor="hideMembers" className="font-medium text-sm cursor-pointer flex items-center gap-1.5">
                    <EyeOff className="size-3.5 text-muted-foreground" />
                    Esconder lista de membros de quem não tá na liga
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    Sua liga ainda aparece na busca, mas visitantes só veem o nome — não o ranking nem quem participa. Você pode mudar depois.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rulesText">
                Regras adicionais <span className="text-[10px] text-muted-foreground">(opcional)</span>
              </Label>
              <textarea
                id="rulesText"
                name="rulesText"
                rows={3}
                maxLength={500}
                placeholder="Ex: Vencedor paga o churrasco da semifinal. Quem ficar em último também."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Acordos extras entre o grupo (não interferem na mecânica de pontos).
              </p>
            </div>

            <Card className="bg-muted/40 border-dashed">
              <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
                <Sparkles className="size-3.5 mt-0.5 shrink-0" />
                <p>
                  Depois de criar, você recebe um código de convite e link único.
                  Compartilhe pelos seus canais (WhatsApp, e-mail) pra trazer amigos.
                </p>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full h-11" disabled={isPending || !selectedCompetitionId}>
              {isPending ? "Criando..." : "Criar liga"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function CompetitionRadioCard({
  competition: c, isSelected, onSelect,
}: { competition: CompetitionOption; isSelected: boolean; onSelect: () => void }) {
  const design = getCompetitionDesign(c.slug)
  // Bloqueia: inativa OU PRO-only (sem cobrança ainda)
  const disabled = !c.isActiveForBetting || c.isProOnly

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "text-left p-3 rounded-lg border transition-all flex items-center gap-3",
        isSelected && cn("ring-2", design.accentRing, design.accentBorder, design.accentBg),
        !isSelected && !disabled && "hover:bg-muted/40",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <div className={cn("size-10 rounded-lg grid place-items-center shrink-0", design.accentBg)}>
        {c.countryCode ? (
          <Flag iso={c.countryCode} size={24} />
        ) : (
          <span className="text-xl leading-none">{c.icon || "⚽"}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm flex items-center gap-1.5">
          {c.name}
          {c.isProOnly && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1 bg-amber-500/15 text-amber-700 dark:text-amber-400">
              ⭐ PRO em breve
            </Badge>
          )}
          {!c.isActiveForBetting && !c.isProOnly && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
              em breve
            </Badge>
          )}
        </div>
        {c.season && (
          <div className="text-[11px] text-muted-foreground">{c.season}</div>
        )}
      </div>
      {isSelected && <CheckCircle2 className={cn("size-5 shrink-0", design.accent)} />}
    </button>
  )
}
