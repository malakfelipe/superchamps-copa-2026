"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

type ParsedError = {
  code: string
  description: string
}

/**
 * Quando o Supabase rejeita um link de auth (expirado/inválido), ele redireciona
 * pra cá com erro no URL hash:
 *   /login?error=access_denied#error_code=otp_expired&error_description=...
 *
 * Hash não é enviado ao servidor, então precisamos ler do browser.
 */
function parseError(): ParsedError | null {
  if (typeof window === "undefined") return null

  // Tenta hash primeiro (Supabase põe info detalhada lá)
  const hash = window.location.hash.slice(1)
  if (hash) {
    const params = new URLSearchParams(hash)
    const code = params.get("error_code") || params.get("error") || ""
    const description = params.get("error_description") || ""
    if (code) {
      return { code, description: decodeURIComponent(description.replace(/\+/g, " ")) }
    }
  }

  // Fallback: query param ?error=...
  const query = new URLSearchParams(window.location.search)
  const queryError = query.get("error")
  if (queryError) {
    return { code: queryError, description: "" }
  }

  return null
}

function friendlyMessage(err: ParsedError): { title: string; message: string; recoveryFlow: boolean } {
  switch (err.code) {
    case "otp_expired":
      return {
        title: "Link expirado ou já usado",
        message:
          "O link de recuperação do e-mail só funciona uma vez e expira em ~1h. " +
          "Solicite um novo abaixo.",
        recoveryFlow: true,
      }
    case "access_denied":
      return {
        title: "Acesso negado",
        message: err.description || "Sua sessão foi invalidada. Faça login de novo.",
        recoveryFlow: false,
      }
    case "invalid_request":
    case "bad_oauth_callback":
      return {
        title: "Requisição inválida",
        message: err.description || "Algo deu errado na confirmação. Tenta de novo.",
        recoveryFlow: false,
      }
    case "pkce_browser_mismatch":
      return {
        title: "Abre o link no mesmo navegador",
        message:
          "Você fez o cadastro num navegador (ou aba anônima) e clicou no link de confirmação em outro. " +
          "Por segurança, o link só funciona no mesmo navegador onde você se cadastrou. " +
          "Solicite um novo link e abre nesse navegador atual.",
        recoveryFlow: true,
      }
    case "invalid_otp_type":
      return {
        title: "Link inválido",
        message: "O formato do link de confirmação está incorreto. Solicite um novo.",
        recoveryFlow: true,
      }
    case "missing_code":
      return {
        title: "Link incompleto",
        message: "O link veio sem o código de confirmação. Solicite um novo abaixo.",
        recoveryFlow: true,
      }
    default:
      return {
        title: "Erro de autenticação",
        message: err.description || `Código: ${err.code}`,
        recoveryFlow: false,
      }
  }
}

export function AuthErrorBanner() {
  const [error, setError] = useState<ParsedError | null>(null)

  useEffect(() => {
    const parsed = parseError()
    if (parsed) {
      setError(parsed)
      // Limpa hash + ?error da URL pra não exibir de novo num refresh
      const cleanQuery = new URLSearchParams(window.location.search)
      cleanQuery.delete("error")
      const newSearch = cleanQuery.toString()
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "")
      window.history.replaceState(null, "", newUrl)
    }
  }, [])

  if (!error) return null

  const { title, message, recoveryFlow } = friendlyMessage(error)

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 space-y-2.5">
      <div className="flex items-start gap-2">
        <AlertCircle className="size-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="text-sm flex-1">
          <div className="font-semibold text-amber-900 dark:text-amber-200">{title}</div>
          <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{message}</div>
        </div>
      </div>
      {recoveryFlow && (
        <Button size="sm" variant="outline" className="w-full gap-1.5" asChild>
          <Link href="/recuperar-senha">
            <RotateCcw className="size-3.5" />
            Solicitar novo link
          </Link>
        </Button>
      )}
    </div>
  )
}
