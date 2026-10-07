"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function CopyButton({
  text,
  label,
  successMsg,
  variant = "default",
}: {
  text: string
  label: string
  successMsg: string
  variant?: "default" | "outline"
}) {
  const [copied, setCopied] = useState(false)

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(successMsg)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Não consegui copiar. Copie manualmente.")
    }
  }

  return (
    <Button variant={variant} className="gap-1.5" onClick={handle}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {label}
    </Button>
  )
}
