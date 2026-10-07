import { cn } from "@/lib/utils"

type LogoProps = {
  /** Tamanho do logo em px (será aplicado em width e height) */
  size?: number
  /** Variante: "icon" (com bg verde), "mark-green" (só troféu verde), "mark-white" (só troféu branco) */
  variant?: "icon" | "mark-green" | "mark-white"
  className?: string
}

/**
 * Logo do SuperChamps. Use:
 *   <Logo size={32} />                       → ícone completo (verde + troféu branco)
 *   <Logo size={20} variant="mark-white" />  → só o troféu branco (pra colocar sobre fundo verde)
 *   <Logo size={20} variant="mark-green" />  → só o troféu verde (pra colocar sobre fundo claro)
 */
export function Logo({ size = 32, variant = "icon", className }: LogoProps) {
  const src =
    variant === "icon" ? "/icon.svg" :
    variant === "mark-green" ? "/mark-green.svg" :
    "/mark-white.svg"

  return (
    <img
      src={src}
      alt="SuperChamps"
      width={size}
      height={size}
      className={cn("inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    />
  )
}
