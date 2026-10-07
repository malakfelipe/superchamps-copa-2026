"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"

type Props = {
  code: string
}

export function CopyReferralButton({ code }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success("Código copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Não consegui copiar")
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="font-mono font-bold text-sm flex items-center gap-1.5 hover:text-primary transition-colors group"
    >
      {code}
      {copied ? (
        <Check className="size-3 text-emerald-600" />
      ) : (
        <Copy className="size-3 text-muted-foreground group-hover:text-primary" />
      )}
    </button>
  )
}
