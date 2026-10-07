/**
 * Auth callback: handler para verificação de e-mail, magic links e reset de senha.
 * Supabase envia o usuário pra cá após clicar no link do e-mail.
 *
 * Suporta DOIS fluxos:
 *
 * 1. PKCE (?code=...) — fluxo seguro padrão Supabase. Requer cookie code_verifier
 *    no mesmo browser/aba do signup. Se o user abrir o email noutro browser,
 *    falha com "code challenge does not match".
 *
 * 2. Token hash (?token_hash=...&type=...) — fluxo sem PKCE. Funciona entre
 *    browsers. Usar em emails configurando o template Supabase com:
 *      {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
 *
 * Query params adicionais:
 *   ?next=/path  → onde redirecionar após sucesso (default: /inicio)
 *   ?error=...   → erro vindo do Supabase, redireciona pra login com aviso
 */
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { EmailOtpType } from "@supabase/supabase-js"

const VALID_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const rawType = searchParams.get("type") || ""
  const next = searchParams.get("next") || "/inicio"
  const errorParam = searchParams.get("error")

  // Erro vindo do Supabase
  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`)
  }

  const supabase = await createClient()

  // ─── Fluxo TOKEN HASH (sem PKCE — funciona entre browsers) ───────────────
  if (tokenHash && rawType) {
    if (!VALID_OTP_TYPES.includes(rawType as EmailOtpType)) {
      return NextResponse.redirect(`${origin}/login?error=invalid_otp_type`)
    }
    const { error } = await supabase.auth.verifyOtp({
      type: rawType as EmailOtpType,
      token_hash: tokenHash,
    })
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
    return finishAndRedirect(supabase, origin, next)
  }

  // ─── Fluxo PKCE (?code=...) ──────────────────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      // Erro comum: "code challenge does not match" quando o user abre o link
      // em browser/aba diferente do signup. Mostra mensagem amigável.
      const friendly = error.message.includes("code challenge")
        ? "pkce_browser_mismatch"
        : error.message
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(friendly)}`)
    }
    return finishAndRedirect(supabase, origin, next)
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`)
}

async function finishAndRedirect(
  supabase: Awaited<ReturnType<typeof createClient>>,
  origin: string,
  next: string,
): Promise<NextResponse> {
  // Marca email_verified_at no profile
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from("profiles")
      .update({ email_verified_at: new Date().toISOString() })
      .eq("id", user.id)

    const meta = (user.user_metadata as Record<string, unknown> | null) || {}

    // Caminho 1 — Convite via invite_code: auto-join (pula aprovação)
    const leagueCode = meta.league_code
    if (typeof leagueCode === "string" && leagueCode.trim().length >= 4) {
      const { data: joinData, error: joinError } = await supabase
        .rpc("join_league_by_code", { p_code: leagueCode.trim().toUpperCase() })
        .single()

      if (!joinError && joinData) {
        const result = joinData as unknown as { league_slug: string; league_name: string; already_member: boolean }
        return NextResponse.redirect(`${origin}/ligas/${result.league_slug}`)
      }
      console.warn("[auth/callback] auto-join via code falhou:", joinError?.message)
    }

    // Caminho 2 — Link de liga (slug): só redireciona pra página, não auto-junta
    // O user clica "Solicitar entrada" manualmente lá.
    const leagueSlug = meta.league_slug
    if (typeof leagueSlug === "string" && leagueSlug.trim().length > 0) {
      return NextResponse.redirect(`${origin}/ligas/${leagueSlug.trim()}`)
    }
  }
  return NextResponse.redirect(`${origin}${next}`)
}
