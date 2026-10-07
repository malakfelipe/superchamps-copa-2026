import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/ThemeProvider"
import { CompetitionsProvider } from "@/lib/competitions-context"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://superchamps.com.br"),
  title: {
    default: "SuperChamps — Bolão da Copa do Mundo 2026",
    template: "%s · SuperChamps",
  },
  description:
    "Bolão virtual da Copa do Mundo 2026 com seus amigos. Sem dinheiro de verdade, só palpite, ranking e zoeira.",
  applicationName: "SuperChamps",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
  },
  appleWebApp: {
    capable: true,
    title: "SuperChamps",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "SuperChamps — Junta a galera, palpita junto",
    description: "Bolão da Copa 2026 com seus amigos. Sem dinheiro real, só zoeira.",
    siteName: "SuperChamps",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "SuperChamps — Bolão da Copa 2026",
    description: "Junta a galera, palpita junto, torce junto.",
    images: ["/icon-512.png"],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00BC7E" },
    { media: "(prefers-color-scheme: dark)", color: "#00BC7E" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CompetitionsProvider>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </CompetitionsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
