"use client"

import { useState } from "react"
import { Share2, Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Props = {
  nickname: string
}

export function ShareProfileButton({ nickname }: Props) {
  const [copied, setCopied] = useState(false)
  const url = `https://superchamps.com.br/u/${nickname}`
  const waMessage = encodeURIComponent(
    `Olha o perfil do @${nickname} no SuperChamps:\n${url}`,
  )

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Não consegui copiar")
    }
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" asChild>
        <a
          href={`https://wa.me/?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Share2 className="size-3.5" />
          Compartilhar no WhatsApp
        </a>
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCopy}>
        {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        Copiar link
      </Button>
    </>
  )
}
