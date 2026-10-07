---
name: superchamps
description: Context bootstrap pro projeto SuperChamps — bolão virtual parimutuel da Copa do Mundo 2026 + Brasileirão Série A. Use SEMPRE que estiver trabalhando no projeto em C:\Users\malak\superchamps, ou quando o usuário mencionar SuperChamps, bolão da Copa, Brasileirão A, palpitar, /jogos, /ligas, /competicoes, ou pedir pra "retomar contexto", "atualizar memória" ou "continuar de onde paramos" depois de uma compactação. Carrega stack (Next.js 16 + Supabase + API-Sports.io), decisões fortes (sem dinheiro real, Copa usa bandeira não escudo, single-comp por liga), convenções PowerShell de deploy, estado atual das 9 competições, slugs, paths críticos e estilo de comunicação preferido pelo usuário. Use proativamente — esta skill foi criada justamente pra ser carregada cedo em sessões novas do projeto, não espere o usuário pedir explicitamente.
---

# SuperChamps — Project context

## 1. O que é o produto

SuperChamps é app web de **bolão virtual parimutuel** pra Copa do Mundo 2026 + Brasileirão A. Mecânica: odds emergem do **pool de palpites do grupo**, não da casa. Sem dinheiro real, sem casa, sem vig. Posicionamento: **anti-bet** — diferente de Bet365/Betano. Estilo visual: **Sofascore/FotMob** (denso, clean, mobile-first).

**Em produção:** `https://superchamps.com.br`
**Repo:** `https://github.com/malakfelipe/superchamps`
**Stack:** Next.js 16 (App Router, RSC), React 19, Tailwind 4, shadcn/ui, Supabase (Postgres 17, Auth, Edge Functions, pg_cron, pg_net), API-Sports.io Pro pra dados esportivos
**Path local:** `C:\Users\malak\superchamps` (Windows PowerShell)
**Supabase project_id:** `tzbqntsusiqslayyhugk`

---

## 2. Estado atual das competições (2026-06-01)

| Competição | Slug | Status |
|---|---|---|
| 🟢 Copa do Mundo 2026 | `copa-do-mundo-2026` | grátis, ativa |
| 🟢 Brasileirão Série A 2026 | `brasileirao-a-2026` | grátis, ativa |
| ⭐ Brasileirão Série B 2026 | `brasileirao-b-2026` | PRO em breve |
| ⭐ Premier League 2026/27 | `premier-league-2026-27` | PRO em breve |
| ⭐ La Liga 2026/27 | `la-liga-2026-27` | PRO em breve |
| ⭐ Bundesliga 2026/27 | `bundesliga-2026-27` | PRO em breve |
| ⭐ Serie A italiana 2026/27 | `serie-a-italia-2026-27` | PRO em breve |
| ⭐ Ligue 1 2026/27 | `ligue-1-2026-27` | PRO em breve |
| ⭐ Primeira Liga 2026/27 | `primeira-liga-2026-27` | PRO em breve |

**Liga Global por competição** (auto-join):
- `global` → Copa
- `global-brasileirao-a` → Brasileirão A

**1.212 matches sincronizados** com `home_team_logo`/`away_team_logo` populados.

---

## 3. Arquitetura essencial

**Hub unificado em `/jogos`** — `?comp=slug` filtra. Sem ?comp= = Copa default.

| Rota | Comportamento |
|---|---|
| `/jogos` | Copa (default) |
| `/jogos?comp=brasileirao-a-2026` | Filtra Brasileirão A |
| `/competicoes` | Redirect 301 → `/jogos` (legacy) |
| `/competicoes/[slug]` | Redirect 301 → `/jogos?comp=slug` (legacy) |
| `/ligas/criar?competition=slug` | Form pré-preenchido com competição |
| `/ligas/[slug]` | Detalhe da liga (inclui Liga Global) |

**Tabs adaptativas em `/jogos`:**
- Copa (hasGroupsAndKnockout): Próximos / Live / Encerr / **Grupos** / **Mata-mata** / Ligas (6 cols)
- Ponto corrido: Próximos / Live / Encerr / **Tabela** / Ligas (5 cols)

**`<TeamCrest>`** decide entre bandeira (Copa: `preferFlag=true`) e escudo (clubes: `logoUrl`).

---

## 4. Decisões fortes (a respeitar SEMPRE)

| Decisão | Por quê |
|---|---|
| **NUNCA dinheiro real** | Princípio fundador do produto. Vire bet se entrar grana. |
| **Copa usa bandeira de país**, não escudo de seleção | Escudos de federação (CBF etc.) são feios e perdem identidade do país. Flag fica via `preferFlag={hasGroupsAndKnockout}` |
| **Single-comp por liga** | Liga foca em UMA competição. Multi-comp foi deferido. Schema: `leagues.competition_id` (FK nullable; NULL = legacy/Liga Global) |
| **PowerShell deploy commands em UM bloco** | User pediu explicitamente. PowerShell 5.1 não aceita `&&` — usar uma linha por comando |
| **Posicionamento anti-bet** | Tom: sem moralismo, com dados. Posts e copy enfatizam isso |
| **Sem grupos/mata-mata em ponto corrido** | Brasileirão tem tabela única. Copa tem grupos + bracket |
| **`is_pro_only`** competições PRO bloqueiam apostas mas mostram preview | Hoje sem cobrança implementada. Lib `place_bet` bloqueia |

---

## 5. Convenções de comando (CRÍTICO — user é exigente aqui)

### Deploy / git em PowerShell

Sempre **um único bloco**, começando com `cd`, uma linha por comando:

```powershell
cd "C:\Users\malak\superchamps"
git add path/to/file.tsx other/file.ts
git commit -m "tipo: mensagem curta no infinitivo"
git push
```

Nunca use `&&` (PowerShell 5.1 quebra). Não fragmentar em vários blocos.

### Antes de declarar "pronto"

Sempre rodar typecheck:
```bash
cd C:/Users/malak/superchamps && npx tsc --noEmit 2>&1 | head -10
```

Se output vazio = OK. Se aparecer erro, conserta antes de mostrar pro user.

### Verificar visualmente

Após deploy do Vercel completar (~1-2 min), abrir `https://superchamps.com.br/[rota]` pra confirmar.

---

## 6. Tarefas comuns (com comandos)

### Aplicar migration SQL no Supabase
Usar MCP tool `mcp__397602b0-...__apply_migration` com `project_id: tzbqntsusiqslayyhugk` e nome em snake_case.

### Rodar SQL ad-hoc
MCP tool `mcp__397602b0-...__execute_sql` (mesma project_id).

### Disparar Edge Function via SQL
Usa `pg_net` + secrets do vault:
```sql
SELECT net.http_post(
  url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/sync-competition-fixtures',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
  ),
  body := '{}'::jsonb
) AS request_id;
```
Espera ~30s, depois confere a resposta:
```sql
SELECT status_code, LEFT(content::text, 800) FROM net._http_response WHERE id = <request_id>;
```

### Deploy Edge Function (user faz)
```powershell
cd "C:\Users\malak\superchamps"
supabase functions deploy sync-competition-fixtures --project-ref tzbqntsusiqslayyhugk
```

### Publicar post de blog
Usar `mcp__397602b0-...__execute_sql` com INSERT idempotente (`ON CONFLICT (slug) DO UPDATE`). Template em `docs/blog-drafts/*.sql`.

---

## 7. Arquivos críticos pra reler quando precisar de mais contexto

| Arquivo | Pra quê |
|---|---|
| `docs/SPEC.md` (§0 snapshot v0.4) | **Origem da verdade** sobre estado atual + decisões |
| `docs/BACKLOG.md` | Pendentes + roadmap (curto/durante Copa/pós) |
| `docs/PATTERNS.md` | 8 padrões reusáveis (RLS bypass, optimistic UI, public preview, etc.) |
| `lib/competitions-design.ts` | Tokens visuais (gradient, accent, border) por slug de competição |
| `lib/standings.ts` | Helpers `computeStandings`, `computeRecentFormByTeam`, `buildRankLookupFromTable`/`FromGroups` |
| `lib/data/index.ts` | Data layer (queries Supabase, demo mode detection) |
| `lib/data/types.ts` | Tipos `Match`, `Competition`, `League`, etc. |
| `supabase/functions/_shared/api-sports.ts` | Adapter API-Football v3 (normalizeFixture) |
| `app/jogos/page.tsx` | Hub principal — onde 80% do trabalho recente foi |
| `components/competitions/MatchCardWithOdds.tsx` | Card de partida (variants: boxes/pool/minimal) |
| `components/games/MatchCardProd.tsx` | Wrapper de produção do MatchCardWithOdds |
| `components/TeamCrest.tsx` | Decide entre escudo e bandeira |

---

## 8. Padrões de código

- **Server Components por padrão** (App Router). Adicionar `"use client"` só quando precisar de interatividade.
- **Server Actions** pra mutações (declaradas com `"use server"`)
- **shadcn/ui** componentes (Button, Card, Tabs, Dialog, Sheet, etc.) — não criar componentes UI from scratch
- **Tailwind 4** (não 3) — config via `@theme` em globals.css, não `tailwind.config.js`
- **TypeScript estrito** — sem `any` jogado, sem `// @ts-ignore`. Sempre tipa props e returns
- **RLS bypass via SECURITY DEFINER RPC** quando precisa contornar RLS de forma controlada (ex: `join_league_by_code`)
- **Optimistic UI** pra ações rápidas (mark notification, request join) — useState local + rollback se erro
- **`metaFor(originalName, localizedName)`** padrão pra enriquecer cards com form+rank+pts

---

## 9. Estilo de comunicação preferido pelo user

- **PT-BR informal mas técnico** — "bora", "tá", "vou de X porque Y"
- **Listas + tabelas pra densidade** — não escrever parágrafos longos
- **Markdown** com headers `##`, separadores `---`, emoji discreto pra marcadores (`🚀`, `✅`, `📦`, `🧪`)
- **Propostas decisivas** — "vou de X porque Y" em vez de pedir confirmação demais. Só pergunta quando tem decisão de produto real.
- **Recap após mudanças** — tabela mostrando o que ficou, arquivos tocados
- **Comandos de deploy SEMPRE ao fim** de uma rodada, formato seção 5
- **Recursos visuais quando ajudam** — diagramas ASCII, tabelas comparativas
- **Sem floreios** — direto ao ponto. User valoriza concisão.

---

## 10. Quando o user pede "atualizar memória" / "compactar" / similar

1. Atualizar `docs/BACKLOG.md` com o que foi feito (data + tipo)
2. Atualizar `docs/SPEC.md` §0 (Implementation Status) — adicionar entradas nas tabelas relevantes
3. Considerar se algum padrão novo merece ir pra `docs/PATTERNS.md`
4. Esta skill (SKILL.md) deve refletir mudanças estruturais (novas decisões fortes, novas convenções, mudanças de slug, etc.)

---

## 11. Histórico recente importante (jun/2026)

- **Migrado de football-data.org pra API-Sports.io Pro** ($19/mo)
- **`/competicoes` consolidado em `/jogos?comp=`** — UX simplificada
- **Brasileirão A liberado grátis** + 7 marcadas como PRO em breve
- **Liga Global por competição** (constraint trocada de "max 1" pra "max 1 por comp")
- **Team logos via API** populados; Copa mantém bandeira
- **Form 5 últimos + rank+pts** no MatchCard
- **`<TeamCrest>` + next/image** otimização
- **Fix EUA** (faltava mapping no Flag.tsx)
- **Fix timezone BRT** (componentes design-system usavam local TZ do servidor)
