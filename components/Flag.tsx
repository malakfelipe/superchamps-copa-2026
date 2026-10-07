import { cn } from "@/lib/utils"

// ISO 3166-1 alpha-2 padrão (2 letras) usado pela flagcdn.com
// Mapeamento de nomes (PT + EN) → ISO 2 letras
const ISO_BY_NAME: Record<string, string> = {
  // CONMEBOL — PT + EN
  Brasil: "br", Brazil: "br",
  Argentina: "ar",
  Uruguai: "uy", Uruguay: "uy",
  Colômbia: "co", Colombia: "co",
  Chile: "cl",
  Equador: "ec", Ecuador: "ec",
  Paraguai: "py", Paraguay: "py",
  Peru: "pe",
  Bolívia: "bo", Bolivia: "bo",
  Venezuela: "ve",
  // UEFA
  Espanha: "es", Spain: "es",
  Alemanha: "de", Germany: "de",
  França: "fr", France: "fr",
  Itália: "it", Italy: "it",
  Portugal: "pt",
  Inglaterra: "gb-eng", England: "gb-eng",
  "Países Baixos": "nl", Holanda: "nl", Netherlands: "nl",
  Bélgica: "be", Belgium: "be",
  Croácia: "hr", Croatia: "hr",
  Sérvia: "rs", Serbia: "rs",
  Polônia: "pl", Poland: "pl",
  Suíça: "ch", Switzerland: "ch",
  Dinamarca: "dk", Denmark: "dk",
  Áustria: "at", Austria: "at",
  Turquia: "tr", Turkey: "tr", "Türkiye": "tr",
  Escócia: "gb-sct", Scotland: "gb-sct",
  "País de Gales": "gb-wls", Wales: "gb-wls",
  "Tchéquia": "cz", "República Tcheca": "cz", Czechia: "cz", "Czech Republic": "cz",
  "Bósnia e Herzegovina": "ba", Bósnia: "ba", "Bosnia-Herzegovina": "ba",
  "Bosnia and Herzegovina": "ba", "Bosnia & Herzegovina": "ba",
  Noruega: "no", Norway: "no",
  Suécia: "se", Sweden: "se",
  Hungria: "hu", Hungary: "hu",
  Romênia: "ro", Romania: "ro",
  Grécia: "gr", Greece: "gr",
  Ucrânia: "ua", Ukraine: "ua",
  // CONCACAF
  "Estados Unidos": "us", "United States": "us", USA: "us", EUA: "us",
  México: "mx", Mexico: "mx",
  Canadá: "ca", Canada: "ca",
  "Costa Rica": "cr",
  Panamá: "pa", Panama: "pa",
  Jamaica: "jm",
  Honduras: "hn",
  Haiti: "ht",
  "Curaçao": "cw", Curacao: "cw",
  // CAF
  Marrocos: "ma", Morocco: "ma",
  Senegal: "sn",
  Egito: "eg", Egypt: "eg",
  Tunísia: "tn", Tunisia: "tn",
  Argélia: "dz", Algeria: "dz",
  Nigéria: "ng", Nigeria: "ng",
  Gana: "gh", Ghana: "gh",
  Camarões: "cm", Cameroon: "cm",
  "Costa do Marfim": "ci", "Ivory Coast": "ci", "Côte d'Ivoire": "ci",
  "África do Sul": "za", "South Africa": "za",
  Mali: "ml",
  "Cabo Verde": "cv", "Cape Verde Islands": "cv", "Cape Verde": "cv",
  "RD Congo": "cd", "Congo DR": "cd", "DR Congo": "cd",
  // AFC
  Japão: "jp", Japan: "jp",
  "Coreia do Sul": "kr", "Korea Republic": "kr", "South Korea": "kr",
  "Arábia Saudita": "sa", "Saudi Arabia": "sa",
  Irã: "ir", "IR Iran": "ir", Iran: "ir",
  Catar: "qa", Qatar: "qa",
  Austrália: "au", Australia: "au",
  "Nova Zelândia": "nz", "New Zealand": "nz",
  Uzbequistão: "uz", Uzbekistan: "uz",
  Jordânia: "jo", Jordan: "jo",
  Iraque: "iq", Iraq: "iq",
}

// TLA (3 letras, padrão FIFA/football-data) → ISO 2 letras
const ISO_BY_TLA: Record<string, string> = {
  BRA: "br", ARG: "ar", URU: "uy", COL: "co", CHI: "cl", ECU: "ec",
  PAR: "py", PER: "pe", BOL: "bo", VEN: "ve",
  ESP: "es", GER: "de", FRA: "fr", ITA: "it", POR: "pt",
  ENG: "gb-eng", NED: "nl", BEL: "be", CRO: "hr", SRB: "rs", POL: "pl",
  SUI: "ch", DEN: "dk", AUT: "at", TUR: "tr", SCO: "gb-sct", WAL: "gb-wls",
  CZE: "cz", BIH: "ba", NOR: "no", SWE: "se", HUN: "hu", ROU: "ro",
  GRE: "gr", UKR: "ua",
  USA: "us", MEX: "mx", CAN: "ca", CRC: "cr", PAN: "pa", JAM: "jm", HON: "hn",
  MAR: "ma", SEN: "sn", EGY: "eg", TUN: "tn", ALG: "dz", NGA: "ng",
  GHA: "gh", CMR: "cm", CIV: "ci", RSA: "za", MLI: "ml",
  JPN: "jp", KOR: "kr", KSA: "sa", IRN: "ir", QAT: "qa", AUS: "au",
  NZL: "nz", UZB: "uz", JOR: "jo",
}

// Reconhece já-é-ISO: "br" (2 letras) ou "gb-eng" / "gb-sct" / "gb-wls"
// (NÃO confundir com nomes que têm hífen tipo "Bosnia-Herzegovina")
const ISO_REGEX = /^[a-z]{2}(-[a-z]{2,3})?$/i

function resolveIsoCode(input?: string): string | undefined {
  if (!input) return undefined
  const trimmed = input.trim()
  // Já é ISO2 ou ISO regional
  if (ISO_REGEX.test(trimmed)) return trimmed.toLowerCase()
  // É TLA (3 letras só, sem hífen)
  if (trimmed.length === 3 && /^[a-z]+$/i.test(trimmed)) {
    const tla = trimmed.toUpperCase()
    if (ISO_BY_TLA[tla]) return ISO_BY_TLA[tla]
  }
  // É um nome — busca exata + case-insensitive
  if (ISO_BY_NAME[trimmed]) return ISO_BY_NAME[trimmed]
  const found = Object.keys(ISO_BY_NAME).find(
    (k) => k.toLowerCase() === trimmed.toLowerCase(),
  )
  return found ? ISO_BY_NAME[found] : undefined
}

export type FlagProps = {
  name?: string
  iso?: string
  size?: number
  className?: string
  rounded?: boolean
}

/**
 * Renderiza a bandeira de um país (ou seleção).
 * Usa flagcdn.com como CDN público — para produção considerar baixar
 * para /public/flags/ ou usar um service local.
 *
 * @example
 *   <Flag name="Brasil" size={32} />
 *   <Flag iso="br" size={16} />
 */
export function Flag({ name, iso, size = 24, className, rounded = true }: FlagProps) {
  // Tenta resolver na ordem: iso prop (TLA ou ISO2) → name (PT ou EN) → "un"
  const code = resolveIsoCode(iso) || resolveIsoCode(name) || "un"
  const variant =
    size <= 16 ? "w20" : size <= 32 ? "w40" : size <= 64 ? "w80" : size <= 120 ? "w160" : "w320"
  const variant2x =
    variant === "w20" ? "w40" : variant === "w40" ? "w80" : variant === "w80" ? "w160" : "w320"
  return (
    <img
      src={`https://flagcdn.com/${variant}/${code}.png`}
      srcSet={`https://flagcdn.com/${variant2x}/${code}.png 2x`}
      width={size}
      alt={name || iso || code}
      className={cn(
        "inline-block align-middle object-cover shadow-sm shrink-0",
        rounded && "rounded-sm",
        className,
      )}
      loading="lazy"
      style={{ height: "auto" }}
    />
  )
}
