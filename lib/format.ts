/**
 * Funções de formatação compartilhadas (datas, números, durações).
 *
 * IMPORTANTE: TODOS os formatadores de data usam o fuso de São Paulo
 * (America/Sao_Paulo). Sem isso, a Vercel (UTC) e o dev local (BRT)
 * mostrariam horários diferentes.
 */

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const BRT_TZ = "America/Sao_Paulo"

type BRTParts = {
  year: number
  month: number          // 0-11
  day: number
  weekday: number        // 0=Dom, 6=Sáb
  hours: number          // 0-23
  minutes: number
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

/** Extrai partes de uma data já convertidas pro fuso de Brasília. */
export function getBRTParts(d: Date): BRTParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: BRT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  const parts = fmt.formatToParts(d)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value

  // Edge case: alguns runtimes retornam "24" pra meia-noite
  const hourStr = map.hour === "24" ? "00" : map.hour

  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10) - 1,
    day: parseInt(map.day, 10),
    weekday: WEEKDAY_MAP[map.weekday] ?? 0,
    hours: parseInt(hourStr, 10),
    minutes: parseInt(map.minute, 10),
  }
}

// ─── Diff entre datas (não muda com fuso) ─────────────────────────────────

export function formatCountdown(target: Date, now: Date = new Date()): string {
  const ms = target.getTime() - now.getTime()
  if (ms <= 0) return "Encerrado"
  const totalMin = Math.floor(ms / 60000)
  const days = Math.floor(totalMin / 1440)
  const hours = Math.floor((totalMin % 1440) / 60)
  const minutes = totalMin % 60
  if (days > 0) return `em ${days}d ${hours}h`
  if (hours > 0) return `em ${hours}h ${minutes}min`
  if (minutes > 0) return `em ${minutes}min`
  return "agora"
}

export function formatRelative(d: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)
  if (diffMin < 1) return "agora"
  if (diffMin < 60) return `há ${diffMin}min`
  if (diffH < 24) return `há ${diffH}h`
  if (diffD < 7) return `há ${diffD}d`
  return formatShortDate(d)
}

// ─── Formatação calendário (timezone-aware) ────────────────────────────────

export function formatTime(d: Date): string {
  const p = getBRTParts(d)
  return `${String(p.hours).padStart(2, "0")}:${String(p.minutes).padStart(2, "0")}`
}

export function formatShortDate(d: Date): string {
  const p = getBRTParts(d)
  return `${p.day} ${MONTHS[p.month]}`
}

export function formatLongDate(d: Date): string {
  const p = getBRTParts(d)
  return `${p.day} ${MONTHS[p.month]} ${p.year}`
}

export function formatKickoff(d: Date): string {
  return `${formatShortDate(d)} · ${formatTime(d)} BRT`
}

export function isSameDay(a: Date, b: Date): boolean {
  const pa = getBRTParts(a)
  const pb = getBRTParts(b)
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day
}

export function dayLabel(d: Date, now: Date = new Date()): string {
  if (isSameDay(d, now)) return "Hoje"
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  if (isSameDay(d, tomorrow)) return "Amanhã"
  const p = getBRTParts(d)
  return `${WEEKDAYS[p.weekday]}, ${p.day} ${MONTHS[p.month]}`
}

/** Chave estável de "dia em Brasília" — usar pra agrupar jogos por data. */
export function brtDayKey(d: Date): string {
  const p = getBRTParts(d)
  return `${p.year}-${p.month}-${p.day}`
}

// ─── Números ──────────────────────────────────────────────────────────────

/**
 * Abrevia pontos/saldos grandes: milhar (k), milhão (MM) e bilhão (bi).
 * Ex.: 1.500 → "1,5k" · 3.200.000 → "3,2MM" · 2.454.004.358 → "2,5 bi".
 * Economia inflacionada → sem isso os saldos (na casa do bilhão) ficam ilegíveis.
 */
export function formatPts(n: number): string {
  const a = Math.abs(n)
  if (a >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".0", "").replace(".", ",")} bi`
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "").replace(".", ",")}MM`
  if (a >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "").replace(".", ",")}k`
  return n.toString()
}
