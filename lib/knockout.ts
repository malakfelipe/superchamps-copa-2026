/**
 * Helpers do mata-mata: detecta e formata "slots" placeholder do bracket
 * (1A, 2C, 3:CDFGH, W73, L101) enquanto os times não foram confirmados.
 */

/** true se o nome ainda é um slot (não um time real). */
export function isPlaceholderTeam(name: string): boolean {
  return /^[12][A-L]$/.test(name) || /^3:[A-L]+$/.test(name) || /^[WL]\d+$/.test(name)
}

/** Rótulo amigável do slot. Time real passa direto. */
export function formatSlot(name: string): string {
  const third = name.match(/^3:([A-L]+)$/)
  if (third) return `3º ${third[1].split("").join("/")}`
  const place = name.match(/^([12])([A-L])$/)
  if (place) return `${place[1]}º Grupo ${place[2]}`
  const win = name.match(/^W(\d+)$/)
  if (win) return `Venc. jogo ${win[1]}`
  const lose = name.match(/^L(\d+)$/)
  if (lose) return `Perd. jogo ${lose[1]}`
  return name
}
