import { type ReactNode } from "react"
import { AppHeader, type AppHeaderProps } from "./AppHeader"
import { BottomTabBar } from "./BottomTabBar"

export type AppShellProps = AppHeaderProps & {
  children: ReactNode
}

/**
 * Wrapper de layout pras rotas autenticadas:
 *   - Sticky header com saldo, notifs, avatar
 *   - Conteúdo no centro (max-w-3xl)
 *   - Bottom tab bar fixa
 */
export function AppShell({ children, ...headerProps }: AppShellProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader {...headerProps} />
      <main className="max-w-3xl mx-auto px-4 py-5 pb-24">{children}</main>
      <BottomTabBar authed={headerProps.authed ?? true} />
    </div>
  )
}
