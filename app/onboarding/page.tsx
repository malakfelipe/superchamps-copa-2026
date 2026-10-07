"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Trophy, ArrowRight, ArrowLeft, X, Check, Sparkles, Users, TrendingUp,
  Gift, ChevronRight, Lightbulb, Target, PartyPopper, Coins, Flame, Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Logo } from "@/components/Logo"
import { completeOnboardingAction } from "./actions"

const TUTORIAL_BALANCE_INITIAL = 100
const REAL_BALANCE = 1000

// ─── STEP PROGRESS BAR ─────────────────────────────────────────────────────

function StepProgress({ current, total, onSkip }: { current: number; total: number; onSkip: () => void }) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i + 1 === current
                ? "w-8 bg-primary"
                : i + 1 < current
                  ? "w-1.5 bg-primary"
                  : "w-1.5 bg-muted"
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2 font-medium tabular-nums">
          {current}/{total}
        </span>
      </div>
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={onSkip}>
        Pular tutorial
        <X className="size-3 ml-1" />
      </Button>
    </div>
  )
}

// ─── STEP 1: WELCOME ───────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-3">
        <div className="mx-auto inline-block shadow-lg rounded-2xl overflow-hidden">
          <Logo size={80} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
          Bem-vindo ao <span className="text-primary">SuperChamps</span>
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
          O bolão da Copa do Mundo onde sua odd depende de quem aposta <strong className="text-foreground">contra</strong> você.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2">
        {[
          { Icon: Trophy, label: "Palpite em jogos", sub: "104 partidas da Copa 2026" },
          { Icon: Users, label: "Ligas privadas", sub: "Com seus amigos" },
          { Icon: TrendingUp, label: "Odds dinâmicas", sub: "Quanto mais difícil, mais paga" },
        ].map(({ Icon, label, sub }) => (
          <div key={label} className="bg-muted/40 rounded-lg p-3 text-center">
            <Icon className="size-5 text-primary mx-auto mb-1.5" />
            <div className="font-semibold text-xs leading-tight">{label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{sub}</div>
          </div>
        ))}
      </div>

      <Button size="lg" className="w-full h-12 text-base" onClick={onNext}>
        Começar tutorial
        <ArrowRight className="size-4 ml-1.5" />
      </Button>
      <p className="text-xs text-muted-foreground">
        Leva ~1 minuto. Você ganha <strong>1.000 pts</strong> ao final.
      </p>
    </div>
  )
}

// ─── STEP 2: PARIMUTUEL EXPLAINED ──────────────────────────────────────────

function StepParimutuel({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [scenario, setScenario] = useState<"balanced" | "obvious" | "underdog">("balanced")

  const data = useMemo(() => {
    if (scenario === "balanced") return { home: 1000, draw: 1000, away: 1000 }
    if (scenario === "obvious") return { home: 4500, draw: 600, away: 400 }
    return { home: 300, draw: 700, away: 4500 }
  }, [scenario])

  const total = data.home + data.draw + data.away
  const odds = {
    home: +(total / data.home).toFixed(2),
    draw: +(total / data.draw).toFixed(2),
    away: +(total / data.away).toFixed(2),
  }
  const shares = {
    home: Math.round((data.home / total) * 100),
    draw: Math.round((data.draw / total) * 100),
    away: Math.round((data.away / total) * 100),
  }

  useEffect(() => {
    const id = setInterval(() => {
      setScenario((s) => (s === "balanced" ? "obvious" : s === "obvious" ? "underdog" : "balanced"))
    }, 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="gap-1">
          <Lightbulb className="size-3" />
          Como funciona
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight">A odd vem do <span className="text-primary">grupo</span>, não da casa.</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Cada apostador deposita pontos num resultado. A odd de cada resultado é
          o <strong className="text-foreground">pool total dividido pelo pool desse resultado</strong>.
        </p>
      </div>

      <Card className="border-2">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Exemplo: <strong className="text-foreground">Lobos × Águias</strong>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Coins className="size-3" />
              Pool: {total.toLocaleString("pt-BR")} pts
            </span>
          </div>

          <div className="space-y-2">
            {[
              { key: "home", label: "🐺 Lobos vence", pool: data.home, odd: odds.home, share: shares.home, color: "bg-blue-500" },
              { key: "draw", label: "Empate", pool: data.draw, odd: odds.draw, share: shares.draw, color: "bg-amber-500" },
              { key: "away", label: "🦅 Águias vence", pool: data.away, odd: odds.away, share: shares.away, color: "bg-rose-500" },
            ].map((row) => (
              <div key={row.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.label}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-xs text-muted-foreground">{row.pool.toLocaleString("pt-BR")} pts</span>
                    <span className="font-bold text-primary tabular-nums w-12 text-right">{row.odd.toFixed(2)}x</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${row.color} transition-all duration-700 ease-out`}
                    style={{ width: `${row.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {([
              { k: "balanced", l: "Equilibrado" },
              { k: "obvious", l: "Favorito óbvio" },
              { k: "underdog", l: "Azarão" },
            ] as const).map((s) => (
              <Button
                key={s.k}
                size="sm"
                variant={scenario === s.k ? "default" : "outline"}
                onClick={() => setScenario(s.k)}
                className="text-xs h-7"
              >
                {s.l}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/30">
        <CardContent className="p-3.5 flex items-start gap-2.5">
          <Flame className="size-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">
            <strong>Regra de ouro:</strong> quanto menos gente acreditar no mesmo resultado que você,
            <strong className="text-primary"> mais pontos você leva</strong> se acertar.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1.5" />
          Voltar
        </Button>
        <Button className="flex-[2]" onClick={onNext}>
          Vou treinar agora
          <ArrowRight className="size-4 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── STEP 3: TUTORIAL BET ──────────────────────────────────────────────────

type TutorialPool = { home: number; draw: number; away: number }
const TUTORIAL_POOL_INITIAL: TutorialPool = { home: 2400, draw: 800, away: 600 }
type TutorialOutcome = keyof TutorialPool

function StepTutorialBet({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [pool, setPool] = useState<TutorialPool>(TUTORIAL_POOL_INITIAL)
  const [selectedOutcome, setSelectedOutcome] = useState<TutorialOutcome | null>(null)
  const [stake, setStake] = useState(30)
  const [confirmed, setConfirmed] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const total = pool.home + pool.draw + pool.away
  const oddFor = (k: TutorialOutcome) => +(total / pool[k]).toFixed(2)
  const outcomes = [
    { key: "home" as const, label: "🐺 Lobos vence", short: "1" },
    { key: "draw" as const, label: "Empate", short: "X" },
    { key: "away" as const, label: "🦅 Águias vence", short: "2" },
  ]
  const selectedOdd = selectedOutcome ? oddFor(selectedOutcome) : 0
  const potentialWin = Math.floor(stake * selectedOdd)

  const handleConfirm = () => {
    if (!selectedOutcome) return
    setPool((p) => ({ ...p, [selectedOutcome]: p[selectedOutcome] + stake }))
    setConfirmed(true)
  }

  // Águias sempre vence (didático: cobre 3 cenários sem random)
  const winnerOutcome: TutorialOutcome = "away"
  const didWin = selectedOutcome === winnerOutcome
  const payout = didWin ? potentialWin : 0
  const netChange = didWin ? potentialWin - stake : -stake

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <Badge variant="secondary" className="gap-1">
          <Target className="size-3" />
          Aposta-tutorial
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight">
          {!confirmed ? "Faça uma aposta" : revealed ? "Veja o resultado" : "Aposta confirmada!"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {!confirmed
            ? "Esses pontos são só do tutorial — seu saldo real não é afetado."
            : !revealed
              ? "Agora vamos simular o resultado."
              : "Note como a odd era a do momento que você apostou."}
        </p>
      </div>

      <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Saldo-tutorial
        </span>
        <span className="font-mono font-bold tabular-nums">{TUTORIAL_BALANCE_INITIAL} pts</span>
      </div>

      <Card className="border-2">
        <CardContent className="p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 text-center">
              <div className="text-3xl">🐺</div>
              <div className="font-bold text-sm mt-0.5">Lobos</div>
            </div>
            <div className="text-lg text-muted-foreground">×</div>
            <div className="flex-1 text-center">
              <div className="text-3xl">🦅</div>
              <div className="font-bold text-sm mt-0.5">Águias</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Mercado 1X2</span>
            <span className="font-mono">Pool: {total.toLocaleString("pt-BR")} pts</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {outcomes.map((opt) => {
              const odd = oddFor(opt.key)
              const isSelected = selectedOutcome === opt.key
              const isWinner = revealed && winnerOutcome === opt.key
              const isLoser = revealed && selectedOutcome === opt.key && !didWin
              return (
                <button
                  key={opt.key}
                  disabled={confirmed}
                  onClick={() => setSelectedOutcome(opt.key)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    isWinner
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30"
                      : isLoser
                        ? "border-destructive/40 bg-destructive/5 opacity-70"
                        : isSelected
                          ? "border-primary bg-primary/10"
                          : "bg-card hover:bg-accent border-border"
                  } ${confirmed ? "cursor-default" : "cursor-pointer active:scale-[0.97]"}`}
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded">
                      {opt.short}
                    </span>
                    <span className="font-mono font-bold text-primary">{odd.toFixed(2)}</span>
                  </div>
                  <div className="text-xs font-semibold leading-tight">{opt.label}</div>
                  {isWinner && (
                    <div className="mt-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                      <Crown className="size-3" /> RESULTADO
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {!confirmed && selectedOutcome && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                Quanto você quer apostar?
              </p>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[10, 30, 50, 100].map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={stake === v ? "default" : "outline"}
                    onClick={() => setStake(v)}
                  >
                    {v}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={stake}
                onChange={(e) => setStake(Math.min(TUTORIAL_BALANCE_INITIAL, Math.max(10, parseInt(e.target.value) || 0)))}
                className="text-xl font-bold h-12 font-mono"
              />
            </div>
            <div className="flex items-baseline justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">Se acertar, ganha</span>
              <span className="font-mono text-2xl font-bold text-primary">
                {potentialWin} <span className="text-base font-normal">pts</span>
              </span>
            </div>
            <Button className="w-full h-11" onClick={handleConfirm} disabled={stake < 10}>
              <Check className="size-4 mr-1.5" />
              Apostar {stake} pts em {outcomes.find((o) => o.key === selectedOutcome)?.label}
            </Button>
          </CardContent>
        </Card>
      )}

      {confirmed && !revealed && (
        <Card className="border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/50">
          <CardContent className="p-4 space-y-3 text-center">
            <div className="size-12 rounded-full bg-amber-200 dark:bg-amber-900/40 grid place-items-center mx-auto">
              <Check className="size-6 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <div className="font-bold">Aposta colocada</div>
              <p className="text-sm text-muted-foreground mt-0.5">
                <span className="font-mono font-semibold">{stake} pts</span> em{" "}
                <strong>{outcomes.find((o) => o.key === selectedOutcome)?.label}</strong>
                <br />
                Odd: <span className="font-mono font-semibold">{selectedOdd.toFixed(2)}</span> · potencial <span className="font-mono font-semibold text-primary">+{potentialWin} pts</span>
              </p>
            </div>
            <Button className="w-full" onClick={() => setRevealed(true)}>
              Ver resultado simulado
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {revealed && (
        <Card className={`border-2 ${didWin ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20" : "border-destructive/40 bg-destructive/5"}`}>
          <CardContent className="p-4 space-y-3">
            <div className="text-center">
              <div className="text-4xl mb-1">{didWin ? "🎉" : "💪"}</div>
              <div className="font-bold text-lg">
                {didWin ? "Você acertou! +" + payout + " pts" : "Não foi dessa vez"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Resultado simulado: <strong>Águias vence</strong>
              </p>
            </div>
            <div className="bg-background rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sua aposta</span>
                <span className="font-mono">{stake} pts em {outcomes.find((o) => o.key === selectedOutcome)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Odd no kickoff</span>
                <span className="font-mono">{selectedOdd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Resultado</span>
                <span className={`font-mono font-bold ${netChange >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {netChange >= 0 ? "+" : ""}{netChange} pts
                </span>
              </div>
            </div>
            <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p>
                <strong className="text-foreground">Lembre:</strong> seu saldo real de 1.000 pts continua intacto.
                Isso aqui foi só uma simulação.
              </p>
              <p>
                Na vida real, perdedores deixam seus stakes no pool — e isso é dividido entre os vencedores proporcionalmente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1.5" />
          Voltar
        </Button>
        <Button
          className="flex-[2]"
          onClick={onNext}
          disabled={!confirmed || !revealed}
        >
          Próximo
          <ArrowRight className="size-4 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── STEP 4: READY ─────────────────────────────────────────────────────────

function StepReady({ onFinish, onBack, finishing }: { onFinish: () => void; onBack: () => void; finishing: boolean }) {
  return (
    <div className="space-y-5 text-center">
      <div className="space-y-3">
        <div className="size-20 rounded-full bg-gradient-to-br from-primary to-emerald-500 grid place-items-center mx-auto shadow-lg">
          <PartyPopper className="size-10 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">Você tá pronto!</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Seu saldo inicial está esperando.
        </p>
      </div>

      <Card className="bg-gradient-to-br from-primary/20 via-amber-100/30 to-rose-100/20 dark:from-primary/30 dark:via-amber-950/30 dark:to-rose-950/20 border-2">
        <CardContent className="p-5 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Saldo real liberado
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-mono text-5xl font-extrabold tracking-tighter">
              {REAL_BALANCE.toLocaleString("pt-BR")}
            </span>
            <span className="text-lg text-muted-foreground">pts</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2 text-left">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium px-1">
          O que fazer agora
        </p>
        <Card>
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
              <Trophy className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-sm">Ver jogos da Copa</div>
              <div className="text-xs text-muted-foreground">104 partidas. Começa em junho.</div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 grid place-items-center shrink-0">
              <Gift className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-sm">Convide amigos pra liga privada</div>
              <div className="text-xs text-muted-foreground">+50 pts por amigo que se cadastrar · até 5 indicações.</div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-violet-100 dark:bg-violet-950/40 grid place-items-center shrink-0">
              <Users className="size-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-sm">Criar liga privada</div>
              <div className="text-xs text-muted-foreground">Família, amigos, trabalho. Sem limite de membros.</div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} disabled={finishing}>
          <ArrowLeft className="size-4" />
        </Button>
        <Button size="lg" className="flex-1 h-12 text-base" onClick={onFinish} disabled={finishing}>
          {finishing ? "Liberando..." : "Bora apostar!"}
          {!finishing && <ArrowRight className="size-4 ml-1.5" />}
        </Button>
      </div>
    </div>
  )
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [finishing, setFinishing] = useState(false)

  const finish = async () => {
    setFinishing(true)
    try {
      await completeOnboardingAction()
    } catch (err) {
      // redirect() lança NEXT_REDIRECT — não é erro real
      if (err instanceof Error && err.message !== "NEXT_REDIRECT") {
        toast.error("Erro ao salvar. Tente de novo.")
        setFinishing(false)
      }
    }
  }

  const skip = async () => {
    toast("Tutorial pulado", { description: "Você pode rever em Perfil → Ajuda." })
    await finish()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="max-w-md mx-auto px-4 py-6 sm:py-10 space-y-5">
        <StepProgress current={step} total={4} onSkip={skip} />
        {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
        {step === 2 && <StepParimutuel onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <StepTutorialBet onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <StepReady onFinish={finish} onBack={() => setStep(3)} finishing={finishing} />}
      </div>
    </div>
  )
}

// Link de retorno pra quem tá em desenvolvimento (mas comentado no produto real)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _DevLink() {
  return (
    <Link href="/inicio" className="fixed top-2 right-2 text-[10px] text-muted-foreground hover:underline">
      [dev] pular pro inicio
    </Link>
  )
}
