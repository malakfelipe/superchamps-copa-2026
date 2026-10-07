import Image from "next/image"
import { Flag } from "@/components/Flag"
import { cn } from "@/lib/utils"

type Props = {
  /** Nome do time (passa pro Flag como fallback de resolução). */
  name: string
  /** ISO code (TLA 3 letras ou ISO2 lowercase). */
  iso?: string
  /** URL do escudo do clube (vem da API). */
  logoUrl?: string | null
  /** Tamanho em px (default 24). */
  size?: number
  /**
   * Se true, força usar a bandeira mesmo se logoUrl existir.
   * Use pra Copa do Mundo e outros torneios de seleção — escudos de seleção
   * são logos de federação, ficam feios + perdem a identidade do país.
   */
  preferFlag?: boolean
  className?: string
}

/**
 * Renderiza o "crest" (escudo/bandeira) de um time. Decide automaticamente:
 *   - Se `preferFlag` ou sem `logoUrl`: usa `<Flag>` (resolve por iso ou nome)
 *   - Caso contrário: renderiza o escudo do clube via Next/Image (otimizado:
 *     resize automático, conversão pra WebP/AVIF, lazy loading)
 *
 * Usa container com fundo sutil pra logos com transparência não sumirem
 * em backgrounds claros.
 */
export function TeamCrest({ name, iso, logoUrl, size = 24, preferFlag = false, className }: Props) {
  const showLogo = logoUrl && !preferFlag

  if (showLogo) {
    return (
      <div
        className={cn(
          "shrink-0 rounded-md bg-card border border-border/30 grid place-items-center overflow-hidden",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src={logoUrl!}
          alt={name}
          width={size * 2}
          height={size * 2}
          loading="lazy"
          unoptimized={false}
          className="object-contain"
          style={{ width: size - 4, height: size - 4 }}
        />
      </div>
    )
  }

  return <Flag iso={iso} name={name} size={size} className={className} />
}
