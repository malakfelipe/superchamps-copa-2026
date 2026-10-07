"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// ─── SIGN UP ───────────────────────────────────────────────────────────────

export type SignUpResult = {
  error?: string
  fieldErrors?: Partial<Record<"email" | "password" | "passwordConfirm" | "nickname" | "consents", string>>
}

/** Mapeia mensagens da API do Supabase pra PT-BR amigável. */
function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("already registered") || m.includes("user already")) {
    return "Este e-mail já tem conta. Vá em Entrar."
  }
  if (m.includes("invalid email")) return "E-mail inválido"
  if (m.includes("password should be") || m.includes("weak password")) {
    return "Senha muito fraca. Use 8+ caracteres com letras e números."
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Muitas tentativas. Aguarde alguns minutos e tente de novo."
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Problema de conexão. Tenta de novo."
  }
  return message
}

export async function signUpAction(_prev: SignUpResult, formData: FormData): Promise<SignUpResult> {
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")
  const passwordConfirm = String(formData.get("passwordConfirm") || "")
  const nickname = String(formData.get("nickname") || "").trim()
  const referralCode = String(formData.get("referralCode") || "").trim() || null

  // O form passa `leagueCode` pra qualquer valor de `?liga=`. Diferenciamos por formato:
  //   - Invite code: maiúsculas + traço + curto (ex: AMIGOS-K8T2) → auto-join via RPC
  //   - Slug: minúsculas + traços (ex: liessin08-aszj) → só redireciona pra liga após confirmar
  const rawLeague = String(formData.get("leagueCode") || "").trim()
  const looksLikeCode = /^[A-Z][A-Z0-9]*-[A-Z0-9]+$/.test(rawLeague) && rawLeague.length <= 14
  const leagueCode = looksLikeCode ? rawLeague : null
  const leagueSlug = !looksLikeCode && rawLeague.length > 0 ? rawLeague : null

  const ageOk = formData.get("ageConfirmed") === "on"
  const termsOk = formData.get("termsAccepted") === "on"
  const publicBetsOk = formData.get("publicBetsConsent") === "on"

  // ─── Validações client-side replicadas server-side ───
  const fieldErrors: SignUpResult["fieldErrors"] = {}

  if (!email || !email.includes("@")) {
    fieldErrors.email = "E-mail inválido"
  }
  if (password.length < 8) {
    fieldErrors.password = "Senha precisa ter pelo menos 8 caracteres"
  }
  if (password !== passwordConfirm) {
    fieldErrors.passwordConfirm = "As senhas não coincidem"
  }
  if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(nickname)) {
    fieldErrors.nickname = "Nickname: 3-20 caracteres, letras/números/. - _"
  }
  if (!ageOk || !termsOk || !publicBetsOk) {
    fieldErrors.consents = "Você precisa aceitar todos os 3 termos para se cadastrar"
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors }
  }

  const supabase = await createClient()

  // ─── Verifica se nickname já está em uso ANTES do signUp ───
  // Se duplicado, o trigger SQL falha com 23505 e o user vê erro genérico.
  // Checar antes dá feedback preciso no campo específico (case-insensitive).
  const { data: isAvailable } = await supabase.rpc("is_nickname_available", {
    p_nickname: nickname,
  })

  if (isAvailable === false) {
    return {
      fieldErrors: {
        nickname: "Este nickname já está em uso. Escolha outro.",
      },
    }
  }

  // ─── Cria usuário no Supabase Auth ───
  // O trigger SQL `on_auth_user_created` cria automaticamente o profile com
  // nickname/referral_code/consents preenchidos. Não precisamos inserir aqui.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: {
        nickname,
        referral_code: referralCode,
        league_code: leagueCode,
        league_slug: leagueSlug,
      },
    },
  })

  // Log pra debug — visível nos Vercel Function Logs
  console.log("[signUpAction]", {
    email,
    hasAuthError: !!authError,
    authErrorMessage: authError?.message,
    hasUser: !!authData?.user,
    userId: authData?.user?.id,
    identitiesCount: authData?.user?.identities?.length ?? null,
    hasSession: !!authData?.session,
  })

  if (authError) {
    return { error: translateAuthError(authError.message) }
  }

  if (!authData?.user) {
    // Não deveria acontecer (signUp sem error nem user), mas log + redirect
    // pra confirme-email assumindo sucesso é melhor que mostrar erro genérico
    console.warn("[signUpAction] signUp returned no user and no error — assuming success")
    revalidatePath("/", "layout")
    redirect(`/cadastro/confirme-email?email=${encodeURIComponent(email)}`)
  }

  // Supabase tem um comportamento traiçoeiro: pra prevenir "email enumeration",
  // quando o email JÁ EXISTE (não-confirmado) ele retorna um user "fake" com
  // identities[] vazio e SEM erro. Detectamos pra reenviar confirmação.
  const identitiesCount = authData.user.identities?.length ?? 0
  const isExistingEmail = identitiesCount === 0

  if (isExistingEmail) {
    // Tenta reenviar a confirmação. Se falhar (rate limit etc), apenas loga;
    // ainda redireciona pra UX correta.
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    })
    if (resendError) {
      console.warn("[signUpAction] resend falhou:", resendError.message)
    }
    revalidatePath("/", "layout")
    redirect(`/cadastro/confirme-email?email=${encodeURIComponent(email)}&resent=1`)
  }

  revalidatePath("/", "layout")
  redirect(`/cadastro/confirme-email?email=${encodeURIComponent(email)}`)
}

// ─── RESEND CONFIRMATION EMAIL ─────────────────────────────────────────────

export type ResendResult = {
  error?: string
  success?: boolean
}

export async function resendConfirmationAction(formData: FormData): Promise<ResendResult> {
  const email = String(formData.get("email") || "").trim().toLowerCase()

  if (!email || !email.includes("@")) {
    return { error: "E-mail inválido" }
  }

  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  })

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  return { success: true }
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────

export type LoginResult = {
  error?: string
}

export async function loginAction(_prev: LoginResult, formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")
  const nextUrl = String(formData.get("next") || "/inicio")

  if (!email || !password) {
    return { error: "Preencha e-mail e senha" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message }
  }

  revalidatePath("/", "layout")
  redirect(nextUrl)
}

// ─── LOGOUT ────────────────────────────────────────────────────────────────

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}

// ─── PASSWORD RESET ────────────────────────────────────────────────────────

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase()

  if (!email || !email.includes("@")) {
    return { error: "E-mail inválido" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/perfil/nova-senha`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// ─── UPDATE PASSWORD (após clicar no link do e-mail) ──────────────────────

export type UpdatePasswordResult = {
  error?: string
  success?: boolean
}

export async function updatePasswordAction(
  _prev: UpdatePasswordResult,
  formData: FormData,
): Promise<UpdatePasswordResult> {
  const password = String(formData.get("password") || "")
  const passwordConfirm = String(formData.get("passwordConfirm") || "")

  if (password.length < 8) {
    return { error: "Senha precisa ter pelo menos 8 caracteres" }
  }
  if (password !== passwordConfirm) {
    return { error: "As senhas não coincidem" }
  }

  const supabase = await createClient()

  // Verifica sessão ativa (usuário só chega aqui via auth/callback após clicar no link)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Sessão inválida ou expirada. Solicite novo link de recuperação." }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}
