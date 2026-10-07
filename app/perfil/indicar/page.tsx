import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ChevronLeft, Gift, Users, CheckCircle2, MessageCircle, Copy, Share2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AppShell } from "@/components/layout/AppShell"
import { CopyButton } from "./CopyButton"
import { getCurrentProfile } from "@/lib/data"
import { formatRelative } from "@/lib/format"

const MAX_REFERRALS_PER_COMPETITION = 5
const REFERRAL_BONUS = 50

// Mock de indicações já feitas
const MOCK_REFERRALS = [
  { id: "r-1", nickname: "MariSCC", joinedAt: new Date("2026-05-21T10:14:00-03:00") },
  { id: "r-2", nickname: "Lipe_RJ", joinedAt: new Date("2026-04-22T15:30:00-03:00") },
  { id: "r-3", nickname: "pedrinhoF", joinedAt: new Date("2026-04-10T19:00:00-03:00") },
  { id: "r-4", nickname: "milainha", joinedAt: new Date("2026-03-28T11:00:00-03:00") },
  { id: "r-5", nickname: "ferFutebol", joinedAt: new Date("2026-03-15T20:00:00-03:00") },
  { id: "r-6", nickname: "thiagoChampz", joinedAt: new Date("2026-03-02T14:00:00-03:00") },
  { id: "r-7", nickname: "gugutorcida", joinedAt: new Date("2026-02-20T09:00:00-03:00") },
]

export default async function IndicarPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")

  const referralUrl = `superchamps.com.br/cadastro?ref=${profile.referralCode}`
  const referralsThisMonth = MOCK_REFERRALS.length
  const earnedPoints = referralsThisMonth * REFERRAL_BONUS

  const whatsappMessage = encodeURIComponent(
    `Tô com uma liga no SuperChamps pra Copa 2026, vai entrar?\n\n` +
    `Palpita nos jogos, compete comigo, sem grana de verdade — só ranking e zoeira.\n\n` +
    `Entra com meu código *${profile.referralCode}*:\n` +
    `https://${referralUrl}`,
  )
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`

  return (
    <AppShell balance={profile.balance} nickname={profile.nickname} avatarUrl={profile.avatarUrl}>
      <div className="space-y-5">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link href="/perfil">
            <ChevronLeft className="size-4 mr-1" />
            Voltar pro perfil
          </Link>
        </Button>

        {/* HERO */}
        <Card className="overflow-hidden border-2">
          <div className="bg-gradient-to-br from-amber-100/60 via-primary/10 to-rose-100/30 dark:from-amber-950/40 dark:via-primary/20 dark:to-rose-950/30 px-5 py-6">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shadow-lg mx-auto mb-3">
              <Gift className="size-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-center">
              Chama os amigos.
              <br />
              Quanto mais gente, mais graça.
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-2 max-w-md mx-auto">
              Cada amigo que entrar com seu código vale <strong className="text-foreground">+{REFERRAL_BONUS} pts</strong> pra você. Cap de 5. Foco não é o ponto: é ter com quem competir.
            </p>
          </div>
        </Card>

        {/* SEU CÓDIGO */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                Seu código de indicação
              </div>
              <div className="font-mono font-extrabold text-3xl tracking-wider text-primary">
                {profile.referralCode}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <CopyButton text={profile.referralCode} label="Copiar código" successMsg="Código copiado!" />
              <CopyButton text={`https://${referralUrl}`} label="Copiar link" successMsg="Link copiado!" variant="outline" />
            </div>

            <Button className="w-full gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white" asChild>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                Manda no zap
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* PROGRESSO DO MÊS */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm">Este mês</h2>
              <Badge variant="outline" className="text-[10px]">
                {referralsThisMonth}/{MAX_REFERRALS_PER_COMPETITION}
              </Badge>
            </div>
            <div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
                  style={{ width: `${(referralsThisMonth / MAX_REFERRALS_PER_COMPETITION) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {MAX_REFERRALS_PER_COMPETITION - referralsThisMonth > 0 ? (
                  <>
                    Faltam <strong className="text-foreground">{MAX_REFERRALS_PER_COMPETITION - referralsThisMonth}</strong> indicações premiadas neste mês.
                  </>
                ) : (
                  <strong className="text-emerald-600">Você atingiu o limite mensal!</strong>
                )}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Pontos ganhos</div>
                <div className="font-mono font-bold text-xl text-amber-600">+{earnedPoints}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Cap mensal</div>
                <div className="font-mono font-bold text-xl">+{MAX_REFERRALS_PER_COMPETITION * REFERRAL_BONUS}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LISTA DE QUEM ENTROU */}
        {MOCK_REFERRALS.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
              <Users className="size-3.5" />
              Quem entrou via você
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {MOCK_REFERRALS.map((r) => (
                    <Link
                      key={r.id}
                      href={`/u/${r.nickname}`}
                      className="flex items-center justify-between gap-2 px-3.5 py-3 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 grid place-items-center">
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{r.nickname}</div>
                          <div className="text-[11px] text-muted-foreground">
                            entrou {formatRelative(r.joinedAt)}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-sm text-amber-600">
                        +{REFERRAL_BONUS}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* REGRAS */}
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Share2 className="size-3.5" />
              Como funciona
            </p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Compartilhe seu código ou link</li>
              <li>Cada amigo que se cadastrar via seu código rende <strong className="text-foreground">+{REFERRAL_BONUS} pts</strong> pra você</li>
              <li>O amigo começa normal com 1.000 pts (sem bônus extra — previne auto-indicação)</li>
              <li>Cap de <strong className="text-foreground">{MAX_REFERRALS_PER_COMPETITION} indicações premiadas por competição</strong></li>
              <li>Pontos são creditados imediatamente quando o amigo confirma o e-mail</li>
            </ul>
            <p className="pt-2 text-foreground font-medium">
              Não é sobre os pontos. É sobre ter com quem zoar.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
