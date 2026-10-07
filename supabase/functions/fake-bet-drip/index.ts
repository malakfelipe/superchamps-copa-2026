/**
 * Edge Function: fake-bet-drip — CONTROLADOR DE BALANÇO PARIMUTUEL
 *
 * Roda a cada ~20min via pg_cron. Pra cada jogo das competições configuradas:
 *   1. Participação FIEL À FREQUÊNCIA: entra quem passa no gate de bet_frequency; o nº
 *      de apostadores do jogo = total de fakes freq-elegíveis, preenchido pela escalada
 *      (abertura leve + intensificação 36h). Sem target_bettors.
 *   2. Lê o pool atual (reais+fakes) vs target_shares (override ?? odds ?? fallback).
 *   3. Aloca as novas apostas nos outcomes DEFICITÁRIOS (dentro da banda) pra
 *      puxar o pool ao equilíbrio — reage ao fluxo real sem cancelar nada.
 *   4. Stake = FRAÇÃO DO SALDO de cada fake, amostrada na FAIXA do próprio fake
 *      (stake_pct_min..stake_pct_max em fake_profiles) — A FAIXA MANDA: o único teto é o
 *      próprio saldo (sem clamp de pote). O pote vira EMERGENTE. bet_frequency define
 *      quem entra; risk a zebra.
 *   5. Dupla chance (can_hedge): reparte a banca em 2 resultados — grupos: vencedor +
 *      empate; mata-mata (2 opções): vencedor + o outro time. 1 apostador, 2 pernas.
 *
 * Só pré-kickoff (scheduled). Insere via bot_place_fake_bets (service_role).
 * Kill switch: fake_bot_config.enabled.
 */
import { adminClient } from "../_shared/supabase-admin.ts"

const OPEN_HORIZON_H = 120 // 5 dias: início da fase de abertura

// Força sintética por seleção (fallback Copa) — espelha seeds/generate-palpites.mjs
const STRENGTH: Record<string, number> = {
  "Brazil": 5, "Argentina": 5, "France": 5, "Spain": 5, "England": 5,
  "Germany": 4.5, "Portugal": 4.5, "Netherlands": 4.5,
  "Belgium": 4, "Uruguay": 4, "Croatia": 4, "Colombia": 4, "Morocco": 4, "Japan": 4, "Norway": 4,
  "Switzerland": 3.5, "USA": 3.5, "Mexico": 3.5, "Senegal": 3.5, "Türkiye": 3.5,
  "Austria": 3.5, "South Korea": 3.5, "Ecuador": 3.5, "Sweden": 3.5,
  "Canada": 3, "Czech Republic": 3, "Czechia": 3, "Paraguay": 3, "Egypt": 3, "Ivory Coast": 3,
  "Scotland": 3, "Tunisia": 3, "Algeria": 3, "Iran": 3, "Bosnia & Herzegovina": 3,
  "Australia": 2.5, "Ghana": 2.5, "Panama": 2.5, "Qatar": 2.5, "Saudi Arabia": 2.5,
  "Uzbekistan": 2.5, "South Africa": 2.5, "Iraq": 2.5, "Jordan": 2.5, "New Zealand": 2.5,
  "Haiti": 2, "Curaçao": 2, "Cape Verde Islands": 2, "Congo DR": 2,
}
const MIN_STAKE = 10        // aposta mínima crível

// arredonda pra número redondo crível conforme a magnitude (5, 10, 25, 50, 100…)
function roundStake(v: number): number {
  if (v <= 0) return 0
  const step = v < 50 ? 5 : v < 200 ? 10 : v < 500 ? 25 : v < 1000 ? 50 : 100
  return Math.round(v / step) * step
}

type Outcome = "home" | "draw" | "away"
const OUTCOMES: Outcome[] = ["home", "draw", "away"]
const KNOCKOUT_STAGES = new Set(["round_of_32", "round_of_16", "quarter", "semi", "third", "final"])

// hash determinístico string → [0,1) (FNV-1a)
function hash01(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

// fração-alvo do volume conforme horas até o kickoff
function rampFraction(h: number, rampHours: number, early: number): number {
  if (h >= OPEN_HORIZON_H) return 0
  if (h > rampHours) {
    // abertura: linear de 0 (horizon) a `early` (rampHours)
    return early * (OPEN_HORIZON_H - h) / (OPEN_HORIZON_H - rampHours)
  }
  // intensificação: ease-in concentrando perto do kickoff
  const base = 1 - h / rampHours
  return early + (1 - early) * Math.pow(base, 1.8)
}

function fallbackProbs(home: string, away: string): { home: number; draw: number; away: number } {
  const sh = STRENGTH[home], sa = STRENGTH[away]
  if (sh === undefined || sa === undefined) {
    return { home: 0.45, draw: 0.27, away: 0.28 } // viés de mando (Brasileirão/sem rating)
  }
  const k = 1.1
  const wH = Math.exp(k * (sh + 0.25))
  const wA = Math.exp(k * sa)
  const wD = Math.exp(k * ((sh + sa) / 2 - 0.35))
  const t = wH + wD + wA
  return { home: wH / t, draw: wD / t, away: wA / t }
}

Deno.serve(async () => {
  try {
    const supabase = adminClient()
    const now = Date.now()

    // 1. Config + kill switch
    const { data: cfg } = await supabase.from("fake_bot_config").select("*").eq("id", 1).maybeSingle()
    if (!cfg) return Response.json({ ok: true, skipped: "no_config" })
    if (!cfg.enabled) return Response.json({ ok: true, skipped: "disabled" })
    const { ramp_hours, early_fraction, default_band, comp_slugs } = cfg

    // 2. Competições alvo
    const { data: comps } = await supabase
      .from("competitions").select("id, slug").in("slug", comp_slugs)
    const compIds = (comps ?? []).map((c: { id: string }) => c.id)
    if (compIds.length === 0) return Response.json({ ok: true, skipped: "no_comps" })

    // 3. Jogos na janela (mercado 1x2 aberto, scheduled, kickoff em [now, now+horizon])
    const horizonIso = new Date(now + OPEN_HORIZON_H * 3600_000).toISOString()
    const { data: marketRows } = await supabase
      .from("bet_markets")
      .select("id, closes_at, matches!inner(id, home_team, away_team, status, competition_id, prematch_probs, target_override, balance_band, target_bettors, target_pool, stage, teams_confirmed)")
      .eq("market_type", "1x2")
      .eq("is_settled", false)
      .gt("closes_at", new Date(now).toISOString())
      .lte("closes_at", horizonIso)
    type MarketRow = {
      id: string; closes_at: string
      matches: { id: string; home_team: string; away_team: string; status: string; competition_id: string;
                 prematch_probs: Record<string, number> | null; target_override: Record<string, number> | null; balance_band: number | null;
                 target_bettors: number | null; target_pool: number | null; stage: string; teams_confirmed: boolean }
    }
    // Só joga em jogo agendado, da competição alvo, E com times confirmados (mata-mata fechado até confirmar)
    const games = ((marketRows ?? []) as unknown as MarketRow[])
      .filter((r) => r.matches.status === "scheduled" && r.matches.teams_confirmed && compIds.includes(r.matches.competition_id))
    if (games.length === 0) return Response.json({ ok: true, games: 0, placed: 0 })

    // 4. Fakes + perfis + saldo
    const { data: fakeRows } = await supabase
      .from("fake_profiles")
      .select("user_id, bet_frequency, risk_appetite, stake_pct_min, stake_pct_max, can_hedge, profiles!inner(balance)")
    type FakeRow = { user_id: string; bet_frequency: number; risk_appetite: number; stake_pct_min: number; stake_pct_max: number; can_hedge: boolean; profiles: { balance: number } }
    const fakes = ((fakeRows ?? []) as unknown as FakeRow[]).map((f) => ({
      id: f.user_id, freq: f.bet_frequency, risk: f.risk_appetite,
      pctLo: Number(f.stake_pct_min), pctHi: Number(f.stake_pct_max), canHedge: f.can_hedge, balance: f.profiles.balance,
    }))
    const fakeIds = new Set(fakes.map((f) => f.id))

    // 5. Apostas abertas dos mercados em jogo (pool por outcome + quem já apostou)
    const marketIds = games.map((g) => g.id)
    const { data: openBets } = await supabase
      .from("bets").select("market_id, user_id, outcome, stake").eq("status", "open").in("market_id", marketIds)
    type Bet = { market_id: string; user_id: string; outcome: string; stake: number }
    const poolByMarket = new Map<string, { home: number; draw: number; away: number }>()
    const fakeBettorsByMarket = new Map<string, Set<string>>()
    for (const b of (openBets ?? []) as Bet[]) {
      const p = poolByMarket.get(b.market_id) ?? { home: 0, draw: 0, away: 0 }
      if (b.outcome === "home" || b.outcome === "draw" || b.outcome === "away") p[b.outcome] += b.stake
      poolByMarket.set(b.market_id, p)
      if (fakeIds.has(b.user_id)) {
        const set = fakeBettorsByMarket.get(b.market_id) ?? new Set<string>()
        set.add(b.user_id)
        fakeBettorsByMarket.set(b.market_id, set)
      }
    }

    // 6. Monta o lote
    const payload: Array<{ fake_id: string; market_id: string; outcome: Outcome; stake: number }> = []

    for (const g of games) {
      const m = g.matches
      const hoursToKickoff = (new Date(g.closes_at).getTime() - now) / 3600_000

      // PARTICIPAÇÃO FIEL À FREQUÊNCIA: entra quem passa no gate de freq (hash < freq).
      // O nº de apostadores do jogo = total de fakes freq-elegíveis, preenchido pela
      // escalada. Sem target_bettors — a config de frequência de cada fake é que manda.
      const frac = rampFraction(hoursToKickoff, ramp_hours, early_fraction)
      const already = fakeBettorsByMarket.get(g.id) ?? new Set<string>()
      const candidates = fakes
        .filter((f) => !already.has(f.id) && f.balance >= MIN_STAKE && hash01(`${m.id}:${f.id}`) < f.freq)
      const existing = already.size
      const eligibleTotal = existing + candidates.length        // fakes que a freq mandaria apostar aqui
      const bettorsNow = Math.round(eligibleTotal * frac)        // fração já "entrada" pela escalada
      let delta = bettorsNow - existing
      if (delta <= 0) continue
      // cap por tick pra espalhar (evita bloco quando o jogo entra na janela)
      const capPerTick = Math.max(2, Math.ceil(eligibleTotal * 0.2))
      delta = Math.min(delta, capPerTick, candidates.length)

      // alvo de equilíbrio
      const ts = m.target_override ?? m.prematch_probs ?? fallbackProbs(m.home_team, m.away_team)
      const target = { home: ts.home, draw: ts.draw, away: ts.away }
      const isKnockout = KNOCKOUT_STAGES.has(m.stage)
      // mata-mata NÃO tem empate: zera o draw e renormaliza home/away
      if (isKnockout) {
        target.draw = 0
        const hw = target.home + target.away
        if (hw > 0) { target.home = target.home / hw; target.away = target.away / hw }
        else { target.home = 0.5; target.away = 0.5 }
      }
      const band = m.balance_band ?? default_band

      // shares atuais
      const pool = poolByMarket.get(g.id) ?? { home: 0, draw: 0, away: 0 }
      const poolTotal = pool.home + pool.draw + pool.away
      const cur = poolTotal > 0
        ? { home: pool.home / poolTotal, draw: pool.draw / poolTotal, away: pool.away / poolTotal }
        : { home: 0, draw: 0, away: 0 }

      // déficit por outcome (zera quem está acima de target+band → anti-fluxo)
      const deficit: Record<Outcome, number> = { home: 0, draw: 0, away: 0 }
      for (const o of OUTCOMES) {
        if (poolTotal > 0 && cur[o] > target[o] + band) deficit[o] = 0
        else deficit[o] = Math.max(0, target[o] - (poolTotal > 0 ? cur[o] : 0))
      }
      let sumDef = deficit.home + deficit.draw + deficit.away
      const allocBasis = sumDef > 0 ? deficit : target // pool no alvo → mantém proporção
      sumDef = allocBasis.home + allocBasis.draw + allocBasis.away

      // distribui `delta` apostas entre outcomes (maior resto)
      const exact = OUTCOMES.map((o) => ({ o, v: delta * allocBasis[o] / sumDef }))
      const counts: Record<Outcome, number> = { home: 0, draw: 0, away: 0 }
      let assigned = 0
      for (const e of exact) { counts[e.o] = Math.floor(e.v); assigned += counts[e.o] }
      exact.sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)))
      for (let i = 0; assigned < delta; i++, assigned++) counts[exact[i % 3].o]++

      // Slots na ordem dos outcomes MENOS prováveis primeiro (zebra → favorito).
      // O agregado = counts (= alvo), sem inflar nada.
      const outcomesAsc = [...OUTCOMES].sort((a, b) => target[a] - target[b])
      const queue: Outcome[] = []
      for (const o of outcomesAsc) for (let i = 0; i < counts[o]; i++) queue.push(o)

      // risco vira CRITÉRIO DE ATRIBUIÇÃO: zebreiros (risk alto) pegam os slots
      // de zebra; conservadores pegam o favorito. Não adiciona volume à zebra —
      // mantém o pool no alvo. Pequeno jitter no risk pra não ser determinístico.
      candidates.sort((a, b) =>
        (b.risk + hash01(`${m.id}:${b.id}:j`) * 0.2) - (a.risk + hash01(`${m.id}:${a.id}:j`) * 0.2),
      )

      let ci = 0
      for (const outcome of queue) {
        if (ci >= candidates.length) break
        const f = candidates[ci++]
        // MODELO % DO SALDO POR FAKE (A FAIXA MANDA): stake = fração do PRÓPRIO saldo,
        // amostrada dentro da faixa do fake [pctLo, pctHi]. Sem teto de pote — o único
        // limite é o próprio saldo. O hash dá a variação bet-a-bet.
        const hiPct = Math.max(f.pctLo, f.pctHi)
        const pct = f.pctLo + hash01(`${m.id}:${f.id}:stk`) * (hiPct - f.pctLo)
        let total = roundStake(pct * f.balance)
        if (total < MIN_STAKE) total = MIN_STAKE
        if (total > f.balance) total = Math.floor(f.balance / MIN_STAKE) * MIN_STAKE // nunca mais que o saldo
        if (total < MIN_STAKE) continue                                    // saldo insuficiente

        // DUPLA CHANCE: hedgers repartem a MESMA banca em 2 resultados (vencedor + empate).
        // Reduz variância sem inflar o pool (primary+hedge = total) nem a contagem de apostadores
        // (continua 1 apostador distinto). A 2ª perna só desloca um pouco de share → o controlador
        // de equilíbrio se auto-corrige no tick seguinte.
        if (f.canHedge && total >= 2 * MIN_STAKE) {
          const primaryStake = roundStake(total * 0.6)
          const hedgeStake = total - primaryStake
          // perna de cobertura:
          //  · mata-mata (2 opções): cobre o OUTRO time (vencedor + perdedor)
          //  · grupos (3 opções): cobre com o empate (ou o favorito, se o principal já é empate)
          const hedgeOutcome: Outcome = isKnockout
            ? (outcome === "home" ? "away" : "home")
            : (outcome !== "draw" ? "draw" : (target.home >= target.away ? "home" : "away"))
          if (primaryStake >= MIN_STAKE && hedgeStake >= MIN_STAKE) {
            f.balance -= total
            payload.push({ fake_id: f.id, market_id: g.id, outcome, stake: primaryStake })
            payload.push({ fake_id: f.id, market_id: g.id, outcome: hedgeOutcome, stake: hedgeStake })
            continue
          }
        }

        f.balance -= total // reserva local (mesma execução)
        payload.push({ fake_id: f.id, market_id: g.id, outcome, stake: total })
      }
    }

    if (payload.length === 0) return Response.json({ ok: true, games: games.length, placed: 0 })

    const { data: res, error } = await supabase.rpc("bot_place_fake_bets", { p_bets: payload })
    if (error) throw new Error(`bot_place_fake_bets: ${error.message}`)

    return Response.json({
      ok: true, games: games.length, attempted: payload.length, result: res, timestamp: new Date(now).toISOString(),
    })
  } catch (err) {
    console.error("fake-bet-drip error:", err)
    return Response.json({ ok: false, error: err instanceof Error ? err.message : "Unknown" }, { status: 500 })
  }
})
