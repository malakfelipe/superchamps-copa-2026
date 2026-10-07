"use client"

import { useState } from "react"
import { Copy, Share2, Check, KeyRound, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Props = {
  leagueName: string
  leagueSlug: string
  inviteCode: string | null | undefined
}

export function LeagueInviteActions({ leagueName, leagueSlug, inviteCode }: Props) {
  const [copied, setCopied] = useState<"url" | "code" | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const leagueUrl = `https://superchamps.com.br/ligas/${leagueSlug}`
  const shareMessage = encodeURIComponent(
    `Tô numa liga do SuperChamps pra Copa 2026 e quero te chamar.\n\n` +
    `*${leagueName}*\n\n` +
    `Dá um pulo aqui: ${leagueUrl}`,
  )
  const whatsappUrl = `https://wa.me/?text=${shareMessage}`

  async function copyText(text: string, kind: "url" | "code", successMsg: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      toast.success(successMsg)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error("Não consegui copiar. Copia manualmente.")
    }
  }

  return (
    <div className="space-y-2 w-full">
      {/* PRIMÁRIO: compartilhar URL da liga */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button size="sm" className="gap-1.5" asChild>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Share2 className="size-3.5" />
            Manda no zap
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => copyText(leagueUrl, "url", "Link copiado!")}
        >
          {copied === "url" ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : (
            <Copy className="size-3.5" />
          )}
          Copiar link
        </Button>
      </div>

      {/* SECUNDÁRIO: código de entrada direta (sem aprovação) */}
      {inviteCode && (
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
          >
            <ChevronDown className={`size-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            {showAdvanced ? "Esconder código" : "Convidar sem aprovação (código)"}
          </button>
          {showAdvanced && (
            <div className="mt-2 p-3 rounded-md bg-muted/40 border border-dashed space-y-2 text-left">
              <p className="text-[11px] text-muted-foreground leading-snug">
                Com o código abaixo, quem entrar pula a aprovação. Use só com pessoas de confiança.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 font-mono"
                onClick={() => copyText(inviteCode, "code", "Código copiado!")}
              >
                {copied === "code" ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <KeyRound className="size-3.5" />
                )}
                {inviteCode}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
