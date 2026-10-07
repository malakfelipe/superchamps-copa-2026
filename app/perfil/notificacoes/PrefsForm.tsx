"use client"

import { useState, useTransition } from "react"
import { Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { updateNotificationPrefsAction, type NotificationPrefs } from "./actions"

const TYPES: { id: keyof NotificationPrefs; label: string; desc: string }[] = [
  { id: "kickoff_reminder", label: "Lembrete antes do jogo", desc: "Recebe aviso 1h antes de jogos onde você apostou" },
  { id: "bet_settled", label: "Resultado das suas apostas", desc: "Logo após cada jogo encerrar" },
  { id: "league_activity", label: "Novidades nas suas ligas", desc: "Quando alguém entra/sai ou muda posição importante" },
  { id: "daily_summary", label: "Resumo diário (e-mail)", desc: "Manhãzinha com os jogos do dia" },
  { id: "marketing", label: "Anúncios e promoções", desc: "Novidades do SuperChamps, raros" },
]

type Props = {
  initialPrefs: NotificationPrefs
}

function Toggle({ value, onClick }: { value: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
        value ? "bg-primary" : "bg-muted"
      }`}
      aria-pressed={value}
    >
      <span
        className={`inline-block size-4 transform rounded-full bg-background transition-transform shadow ${
          value ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

export function PrefsForm({ initialPrefs }: Props) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs)
  const [pending, startTransition] = useTransition()
  const [savedFlash, setSavedFlash] = useState(false)

  function persist(next: NotificationPrefs) {
    startTransition(async () => {
      const res = await updateNotificationPrefsAction(next)
      if (res.ok) {
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 1500)
      } else {
        toast.error(res.error || "Erro ao salvar")
        // reverte
        setPrefs(initialPrefs)
      }
    })
  }

  function toggle(key: keyof NotificationPrefs) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    persist(next)
  }

  return (
    <>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm">Tipos de notificação</h2>
            {savedFlash && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                <Check className="size-3.5" />
                Salvo
              </span>
            )}
          </div>
          {TYPES.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <Separator className="mb-3" />}
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
                <Toggle value={prefs[p.id]} onClick={() => toggle(p.id)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center" aria-live="polite">
        {pending ? "Salvando…" : "Suas preferências são salvas automaticamente."}
      </p>
    </>
  )
}
