/**
 * Mapeia nomes de seleções vindos da football-data.org (inglês) para PT-BR.
 * Se não encontrar tradução, retorna o nome original.
 */
const TEAM_NAME_PT: Record<string, string> = {
  // CONMEBOL
  Brazil: "Brasil",
  Argentina: "Argentina",
  Uruguay: "Uruguai",
  Colombia: "Colômbia",
  Chile: "Chile",
  Ecuador: "Equador",
  Paraguay: "Paraguai",
  Peru: "Peru",
  Bolivia: "Bolívia",
  Venezuela: "Venezuela",
  // UEFA
  Spain: "Espanha",
  Germany: "Alemanha",
  France: "França",
  Italy: "Itália",
  Portugal: "Portugal",
  England: "Inglaterra",
  Netherlands: "Holanda",
  Belgium: "Bélgica",
  Croatia: "Croácia",
  Serbia: "Sérvia",
  Poland: "Polônia",
  Switzerland: "Suíça",
  Denmark: "Dinamarca",
  Austria: "Áustria",
  Turkey: "Turquia",
  "Türkiye": "Turquia",
  Scotland: "Escócia",
  Wales: "País de Gales",
  Czechia: "Tchéquia",
  "Czech Republic": "Tchéquia",
  "Bosnia-Herzegovina": "Bósnia",
  "Bosnia and Herzegovina": "Bósnia",
  "Bosnia & Herzegovina": "Bósnia",
  Norway: "Noruega",
  Sweden: "Suécia",
  Hungary: "Hungria",
  Romania: "Romênia",
  Greece: "Grécia",
  Ukraine: "Ucrânia",
  Russia: "Rússia",
  Iceland: "Islândia",
  Ireland: "Irlanda",
  "Northern Ireland": "Irlanda do Norte",
  Finland: "Finlândia",
  // CONCACAF
  "United States": "EUA",
  USA: "EUA",
  Mexico: "México",
  Canada: "Canadá",
  "Costa Rica": "Costa Rica",
  Panama: "Panamá",
  Jamaica: "Jamaica",
  Honduras: "Honduras",
  Haiti: "Haiti",
  "Curaçao": "Curaçao",
  // CONMEBOL extras
  // CAF
  Morocco: "Marrocos",
  Senegal: "Senegal",
  Egypt: "Egito",
  Tunisia: "Tunísia",
  Algeria: "Argélia",
  Nigeria: "Nigéria",
  Ghana: "Gana",
  Cameroon: "Camarões",
  "Ivory Coast": "Costa do Marfim",
  "Côte d'Ivoire": "Costa do Marfim",
  "South Africa": "África do Sul",
  Mali: "Mali",
  "Cape Verde Islands": "Cabo Verde",
  "Cape Verde": "Cabo Verde",
  "Congo DR": "RD Congo",
  "DR Congo": "RD Congo",
  // AFC
  Japan: "Japão",
  "Korea Republic": "Coreia do Sul",
  "South Korea": "Coreia do Sul",
  "Saudi Arabia": "Arábia Saudita",
  "IR Iran": "Irã",
  Iran: "Irã",
  Qatar: "Catar",
  Australia: "Austrália",
  "New Zealand": "Nova Zelândia",
  Uzbekistan: "Uzbequistão",
  Jordan: "Jordânia",
  Iraq: "Iraque",
}

export function localizeTeamName(name?: string | null): string {
  if (!name) return ""
  const trimmed = name.trim()
  return TEAM_NAME_PT[trimmed] || trimmed
}

/**
 * Traduz nome de time dentro de labels de outcome.
 * Ex: "Brazil vence" → "Brasil vence"; "Empate" → "Empate" (sem mudança)
 */
export function localizeOutcomeLabel(
  label: string,
  homeName?: string,
  awayName?: string,
): string {
  let out = label
  if (homeName) {
    const ptHome = localizeTeamName(homeName)
    if (ptHome !== homeName) out = out.replace(homeName, ptHome)
  }
  if (awayName) {
    const ptAway = localizeTeamName(awayName)
    if (ptAway !== awayName) out = out.replace(awayName, ptAway)
  }
  return out
}
