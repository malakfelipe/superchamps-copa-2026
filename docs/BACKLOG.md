# SuperChamps — Backlog

Última atualização: 2026-06-01

---

## 📊 Status atual

App em produção em `superchamps.com.br`. Mecânica completa, multi-competição ativa (Copa + Brasileirão A), social/sharing reformado, blog ativo, SEO foundation pronta. **Faltam ~10 dias** pro jogo de abertura da Copa (2026-06-11).

### Métricas técnicas
- **30+ migrations** aplicadas
- **4 Edge Functions** deployadas + cron rodando — sync de 1.212 matches em 4 competições
- **PWA** instalável
- **Custom domain** com SSL
- **Blog** ativo com 4 posts publicados, RSS, JSON-LD Article
- **SEO** com sitemap dinâmico, robots, Organization + WebSite + BreadcrumbList markup
- **Multi-competição**: 2 ativas grátis (Copa + Brasileirão A) + 7 PRO em breve
- **Liga Global** por competição (2 hoje, cresce conforme novas comp grátis)

---

## ✅ Concluído

### 🔌 Infraestrutura
- [x] Schema completo + RLS em todas as tabelas
- [x] RPCs transacionais (place_bet, settle_match, cancel_bet, mark_notifications_read, is_nickname_available)
- [x] Auto-settle via trigger SQL `on_match_finished`
- [x] Auto-settle backup via cron a cada 5 min
- [x] Sistema de notificações com triggers automáticos
- [x] Sync de fixtures + placares ao vivo otimizado
- [x] PWA + custom domain (`superchamps.com.br`)
- [x] Templates de email branded PT-BR (4 tipos)
- [x] Vault com secrets + cron jobs configurados

### 🔑 Auth
- [x] Cadastro com validação completa (passwordConfirm, nickname disponível, consents LGPD)
- [x] Login + logout
- [x] Reset de senha
- [x] Onboarding obrigatório
- [x] Email confirmation cross-browser (token_hash em vez de PKCE)
- [x] Detecção de email duplicado + auto-resend
- [x] Mensagens de erro traduzidas em PT-BR
- [x] AuthErrorBanner com mensagens amigáveis

### 🎲 Mecânica de bolão
- [x] Parimutuel funcional (place_bet, settle_market)
- [x] Cancel_bet até 5min antes do kickoff
- [x] Pool órfão (refund se ninguém acertou)
- [x] Cap de 50% do saldo por aposta
- [x] Boost diário de saldo baixo
- [x] Sistema de referral (5 × 50 pts)
- [x] Ranking de liga conta só apostas após `joined_at`
- [x] Mata-mata paga 2× + badge UI
- [x] Mata-mata sem empate (usa `winner_outcome`)
- [x] Apenas Liga Global é pública + auto-join

### 🤝 Sharing de ligas (v0.3 — esta janela)
- [x] **Fix RLS** — policy SELECT em `leagues` tinha bug `lm.league_id = lm.id`, agora corrigida
- [x] **`join_league_by_code` RPC** — SECURITY DEFINER, contorna RLS pra lookup do invite_code
- [x] **Auto-join no signup** — `auth/callback` lê `league_code` do user_metadata e adiciona à liga após confirmar email
- [x] **Tabela `league_join_requests`** — workflow pending/approved/rejected/withdrawn
- [x] **3 RPCs novas**: `search_leagues`, `request_to_join_league`, `decide_join_request`
- [x] **`members_visible` flag** — owner controla se ranking/lista de membros é visível pra não-membros
- [x] **`kick_member` RPC** — owner expulsa, marca `exit_reason='kicked'`, notifica
- [x] **`delete_league` RPC** — owner deleta liga (CASCADE limpa members/requests/notifications)
- [x] **`get_public_league_info` RPC** — preview público acessível a anon
- [x] **Public preview** — `/ligas/[slug]` renderiza versão limitada pra visitante não-logado
- [x] **Middleware fix** — `/ligas/[slug]` agora passa anon, mantém `/ligas` (lista) e `/ligas/criar`/`entrar` protegidos
- [x] **`<LeagueSearch>`** componente client com debounce 300ms + member count + ordenado por tamanho
- [x] **`<PendingRequestsSection>`** — owner panel no fim da página com toggle de visibilidade + aprovar/recusar
- [x] **`<RequestJoinButton>`** — botão de solicitar pra logado-não-membro
- [x] **3 novos tipos de notificação**: `league_join_request`, `league_join_approved`, `league_join_rejected`

### 🔔 Notificações
- [x] **Marcar como lida individual** — botão ✓ que aparece no hover/touch
- [x] **Marcar todas como lidas** — botão no topo da página
- [x] **Optimistic UI** — UI atualiza na hora, rollback se servidor falhar
- [x] **Refresh do badge** do sininho via `router.refresh()` após mark

### 📝 Blog (v0.3 — esta janela)
- [x] **Tabela `blog_posts`** com 3 pilares (bets/cultura/por_dentro), status workflow, RLS público pra published
- [x] **Trigger `updated_at`** automático
- [x] **`getPublishedPosts()`** + **`getPostBySlug()`** no data layer
- [x] **`/blog`** lista de posts + JSON-LD `Blog`
- [x] **`/blog/[slug]`** post individual + JSON-LD `Article` + `BreadcrumbList`
- [x] **`<MdxRender>`** server-side com `next-mdx-remote/rsc` + `remark-gfm`
- [x] **`<PillarBadge>`** colorido por pilar
- [x] **RSS feed** em `/blog/rss.xml` com cache 1h
- [x] **Plugin `@tailwindcss/typography`** instalado pra rendering do MDX
- [x] **Link "Blog" no header** da landing
- [x] **3 posts publicados**: #1 "Bolão x Bet", #2 "Sem dinheiro real", #4 "Matemática das bets" (#3 está em rascunho)

### 🔍 SEO Foundation (v0.3 — esta janela)
- [x] **`app/sitemap.ts`** — sitemap.xml dinâmico (rotas estáticas + ligas + blog posts)
- [x] **`app/robots.ts`** — robots.txt apontando pro sitemap, bloqueando rotas autenticadas
- [x] **`<JsonLd>` helper** — injeta JSON-LD com escape de XSS
- [x] **Organization + WebSite + SearchAction** na home (habilita sitelinks search box)
- [x] **BreadcrumbList** em `/ligas/[slug]` e `/blog/[slug]`
- [x] **Article** schema em posts do blog
- [x] **`metadataBase`** no root layout — canonicals automáticos
- [x] **`generateMetadata` dinâmico** em `/ligas/[slug]` e `/blog/[slug]` — title/desc/OG por entidade
- [x] **Favicon** corrigido (era arquivo antigo em `app/favicon.ico`)

### 🎨 Frontend (data layer real)
- [x] `/inicio` - dashboard com carousel, próximos, atalhos, WhatsApp share
- [x] `/jogos` - lista com GameRow (grupo, pool, bet count, bandeiras PT)
- [x] `/jogos` - aba Grupos com standings derivados
- [x] `/jogos` - aba Mata-mata com bracket renderizado
- [x] `/jogos?tab=` deep-link
- [x] `/ligas` - listagem + busca de descoberta
- [x] `/ligas/criar` - sempre privada
- [x] `/ligas/entrar` - via código
- [x] `/ligas/[slug]` - público p/ anon, limited p/ logado-não-membro, full p/ membro+owner
- [x] `/cadastro` - flow completo + `liga` param para auto-join
- [x] `/notificacoes` - lista + ações (marcar lida)
- [x] `/u/[nickname]` - perfil público + stats
- [x] `/blog` + `/blog/[slug]` - blog completo
- [x] Badge de notificações conectado ao count real

### 🖼 Visual base
- [x] Paleta emerald (verde-esmeralda) em vez de cinza
- [x] Fonte Geist corrigida
- [x] Bandeiras com TLA + nome PT/EN
- [x] localizeTeamName + localizeOutcomeLabel
- [x] Timezone fix (BRT em vez de UTC do Vercel)
- [x] PWA manifest + ícone dinâmico
- [x] Dark mode completo
- [x] Skeletons + animações
- [x] Toaster + ConfirmDialog + EmptyState centralizados

### ❓ FAQ
- [x] Pontuação (saldo, cap, ranking por liga, reset)
- [x] Knockout 2× e sem empate
- [x] Liga Global

---

## 🎯 Pendente

### 🟡 Polish visual (~2-4h restantes)

| Tela | Por quê | Estimativa |
|------|---------|------------|
| `/jogos/[id]` | Onde a aposta acontece | 1-2h |
| `/apostas` | Carteira + histórico | 30min |
| `/login`, `/recuperar-senha`, `/onboarding` | Placeholders pessoais | 30min |
| `/perfil/indicar` | Limpar MOCK_REFERRALS | 30min |

### 📝 Blog (próximas 8-12 semanas)

Posts pendentes da estratégia editorial (sequência alternando pilares):

| Ordem | Pilar | Título | Status |
|---|---|---|---|
| #3 | cultura | Como organizar bolão Copa 2026 | 📄 Draft pronto, falta publicar |
| #5 | bets | CPI das bets, dívida e abstinência | 💭 Outline |
| #6 | bets | 7 truques de UX que casas de aposta usam | 💭 Outline |
| #7 | cultura | O bolão do tio: por que toda família tem | 💭 Outline |
| #8 | por_dentro | Como funciona o parimutuel | 💭 Outline |
| #9 | por_dentro | Construindo SuperChamps: 6 decisões difíceis | 💭 Outline |

Cadência alvo: **1 post a cada 14 dias** = 6 posts em 12 semanas.

### 🔍 SEO (próximo)

- [ ] **Google Search Console verificado** + sitemap submetido (você faz, externo)
- [ ] **Capa OG dinâmica por post** via `next/og` (gera imagem com título + pilar)
- [ ] **`generateMetadata` em páginas estáticas** (`/ajuda`, `/termos`, `/privacidade`) com descrições específicas
- [ ] **`og:image` em `/ligas/[slug]`** — bom pro WhatsApp/Twitter compartilhar

### 🔵 G2 — AdSense (deferido)

Decisão tomada nesta janela: deferir. Razões:
- Conteúdo "bolão/aposta" pode disparar filtros automáticos
- Site novo precisa de tração antes de aplicar
- Plano: aplicar pós-Copa quando tiver tráfego comprovado

**Quando voltar a ativar:**
- Aplicar conta AdSense em https://www.google.com/adsense
- Pegar Publisher ID
- Adicionar `next/script` no layout (env var)
- Criar `<AdSlot>` component
- Banner LGPD/cookies obrigatório (Google CMP ou custom)
- ads.txt com publisher ID
- Atualizar `/privacidade` mencionando AdSense

### 🟣 G3 + PRO completo (8-12h dev)

#### G3 — Premium R$ 9,90/mês
- Schema: `subscription_tier`, `subscription_ends_at` em profiles
- Integração Mercado Pago (preferido pra Brasil) ou Stripe
- Webhook handler pra atualizar status
- Página `/upgrade` com sales pitch
- Página `/perfil/assinatura` (status + cancel)

#### PRO 1 — Limite de ligas privadas
- Free: 1 liga privada
- PRO: 10 ligas privadas
- Enforcement no `createLeagueAction`

#### PRO 2 — Ad-free (depende do G2 estar ativo)
- `<AdSlot>` retorna null se `tier === 'pro'`

#### PRO 3 — Convites extras
- Free: 5 × 50 pts (atual)
- PRO: 10 × 75 pts? Ou 5 × 100 pts? Decidir

#### PRO 4 — Liga Global PRO
- Liga separada só pra users PRO
- Auto-join ao virar PRO, auto-leave ao downgrade

#### PRO 5 — Badge "PRO"
- Visual sutil no nickname (estrela ⭐)
- Componente `<ProBadge user={...} />`

### 🌎 Multi-competição + multi-esporte

**Status: Fases A, B, C concluídas em 2026-05-31/2026-06-01. Fase D (NBA/NFL) deferida.**

### ✅ Fase A — Preparação (2026-05-31)
- [x] Tabela `sports` (futebol ativo, basquete/NFL dormentes)
- [x] Colunas em `competitions`: `sport_id`, `country_code`, `display_order`, `bet_markets[]`, `slug`, `icon`
- [x] 6 ligas europeias inseridas como `is_active_for_betting=false`

### ✅ Fase B — Backend multi-comp (2026-05-31/2026-06-01)
- [x] Coluna `leagues.competition_id` (FK nullable, com unique parcial)
- [x] RPC `get_league_rankings(p_league_id)` filtra bets por competição focada
- [x] RPC `search_leagues` aceita `p_competition_id` opcional
- [x] `place_bet` valida `is_active_for_betting=true AND is_pro_only=false`
- [x] Liga Global por competição (constraint trocada de "max 1 global" pra "max 1 por competição")
- [x] Backfill: todas ligas existentes apontam pra Copa; criada Global Brasileirão A
- [x] Trigger `handle_new_user` auto-join em todas Globais grátis

### ✅ Fase C — Frontend multi-esporte (2026-05-31/2026-06-01)
- [x] **Sistema visual de competições** em `lib/competitions-design.ts` (9 paletas accent emerald-base + identidade própria)
- [x] **`<CompetitionLockup>`** em 3 variantes (chip / row / hero)
- [x] **`<CompetitionsProvider>`** global no root layout (state persistido em localStorage)
- [x] **`<SportSwitcher>`** + **`<CompetitionPinnedStrip>`** + **`<CompetitionSelectorSheet>`** + **`<DateStrip>`** + **`<CompetitionFavoriteStar>`**
- [x] **`/competicoes` consolidado em `/jogos`** — redirect 301 das URLs legacy
- [x] **`/jogos?comp=slug`** — query string filtra a competição selecionada
- [x] **`<CompetitionHubHero>`** com identidade visual + stats reais (`getCompetitionStats`)
- [x] **Tabs adaptativas**: Copa tem Grupos/Mata-mata, ponto corrido tem Tabela única
- [x] **Tab "Ligas focadas"** na competição — botão Solicitar/Pendente/Membro
- [x] **`<JogosNavStrip>`** sticky, navegação interna via `router.push`
- [x] **`/ligas/criar`** ganhou seletor de competição (radio cards, prefill via `?competition=`)
- [x] **`MyLeaguesList`** mostra chip da competição focada com cor da identidade
- [x] **`MatchCardProd`** enriquecido: form últimos 5 + rank + pts + escudos
- [x] **`<StandingsTable>`** + helper `computeStandings()` (ponto corrido)
- [x] **`<TeamCrest>`** decide entre escudo (clube) ou bandeira (Copa)
- [x] **Team logos** populados via sync — 1.212 matches em 4 competições
- [x] **`next/image`** otimização de escudos (resize + WebP automático)

### ✅ Estado das competições (2026-06-01)
- 🟢 **Copa do Mundo 2026** — grátis, ativa, com `getStandings()` por grupo
- 🟢 **Brasileirão Série A 2026** — grátis (novo!), ativa
- ⭐ **Brasileirão B + 6 europeias** — `is_pro_only=true`, sync rodando mas apostar bloqueado

### 🟣 Fase D — NBA / NFL (deferida)
Quando tração justificar +$38/mês de API.

- [ ] Conta API-Sports NBA + NFL Pro
- [ ] Adapter `_shared/api-sports-nba.ts`
- [ ] Adapter `_shared/api-sports-nfl.ts`
- [ ] Schema: tipos de market `h_a`, `spread`, `total_points`
- [ ] RPC `place_bet` aprende spread/total
- [ ] UI: `<SportSwitcher>` libera NBA/NFL (já preparado)
- [ ] Sports: UPDATE `is_active=true` em basquete + futebol-americano

### 💰 Módulo PRO (deferido — gating real das competições PRO)

Hoje competições PRO são bloqueadas tipo "em breve". Pra ativar de verdade:
- [ ] Schema: `subscription_tier`, `subscription_ends_at` em profiles
- [ ] Integração Mercado Pago ou Stripe
- [ ] Webhook handler
- [ ] Página `/upgrade` com sales pitch
- [ ] Página `/perfil/assinatura`
- [ ] `place_bet` deixa de bloquear PRO se user tem assinatura ativa
- [ ] Atualizar trigger `handle_new_user` pra incluir PRO globais quando user upgrar

### 🌎 Adicionar competições novas

Quando quiser adicionar mais competições no API-Football:

| Competição | API-Football league_id | Status no DB |
|---|---|---|
| Copa do Mundo 2026 | 1 | ✅ ativa pra apostas |
| Brasileirão Série A | 71 | ✅ sincronizada, escondida (Fase 2) |
| Brasileirão Série B | 72 | ✅ sincronizada, escondida (Fase 2) |
| Copa Libertadores | 13 | ❌ adicionar quando quiser |
| Premier League | 39 | ❌ adicionar quando quiser |
| La Liga | 140 | ❌ adicionar quando quiser |
| Bundesliga | 78 | ❌ adicionar quando quiser |
| Serie A (Itália) | 135 | ❌ adicionar quando quiser |
| Ligue 1 | 61 | ❌ adicionar quando quiser |
| Champions League | 2 | ❌ adicionar quando quiser |

---

## 🐛 Dívidas técnicas pequenas

- **MOCK_REFERRALS** em `/perfil/indicar` ainda mostra lista mockada
- **Edge Function `settle-match`** virou redundante (trigger SQL faz tudo) — pode remover do deploy
- **`localizeOutcomeLabel`** ainda não aplicado em `/apostas` e `/u/[nickname]`
- **Console.log de debug** no `signUpAction` — remover quando confiante
- **Capa de blog posts sem og:image** — gerar dinamicamente via `next/og`
- **`is_discoverable` rastros** em comentários/docs antigos (migration `league_sharing_overhaul` removeu o conceito mas pode ter ruído residual)

---

## 🧪 Não-código

- **Smoke test com 3-5 amigos** — validação real do flow E2E
- **Limpeza dos fakes do DB** — `delete from matches where external_id like 'fake-%'`
- **Monitorar quota football-data.org** — durante a Copa, ver se o cron a cada 2min tá no orçamento
- **Hall of Fame** — pós-Copa, exibir ranking final dos torneios passados
- **Google Search Console** — verificar propriedade + submeter sitemap (você faz)
- **Plan One football-data.org** — ativar ~7 dias antes da Copa começar (€30 × 1-2 meses)

---

## 📅 Roadmap revisado

### **Curto prazo (10 dias até a Copa — agora → 11 jun)**
1. 🟡 Polish visual `/jogos/[id]` + `/apostas` (~3h)
2. 🟡 Limpar fakes + smoke test com 3-5 amigos
3. 📝 Publicar Post #3 "Organizar bolão da Copa"
4. 🔍 Verificar Google Search Console + submeter sitemap
5. 🎨 Polish da home `/inicio` agora que tem 2 competições grátis ativas
6. ⚡ Smoke test E2E: criar liga focada Brasileirão A, palpitar, ver ranking

### **Durante a Copa (11 jun → 19 jul)**
7. 📝 Publicar Post #5 ou #7 (1 post a cada 14d)
8. 📊 Monitorar quota API-Sports + uso real do produto
9. 🐛 Resposta rápida a bugs reportados
10. 🔍 Monitorar Search Console / rankings
11. 📊 Observar uso comparativo Copa vs Brasileirão A

### **Pós-Copa (ago 2026+)**
12. 💰 Módulo PRO completo (Mercado Pago + cobrança real) — libera 7 competições PRO
13. 🔵 Reavaliar AdSense (com tráfego pra mostrar)
14. 🌎 Adicionar Libertadores + outras competições continentais
15. 📊 Hall of Fame da Copa 2026
16. 📈 Métricas de retenção, churn, NPS
17. 🏀 Avaliar NBA/NFL (Fase D) — só se tração justificar

---

## 🎉 Marcos importantes

- **2026-05-27**: B1 fechado, signup funcional cross-browser
- **2026-05-28**: G4, G5, G6, G1 fechados
- **2026-05-29**: League sharing overhaul (busca + request-to-join + public preview)
- **2026-05-30**: Blog ativo + SEO foundation + notif mark-as-read
- **2026-05-31**: Multi-esporte Fase A (sports table + 9 competições no schema)
- **2026-06-01**: Multi-comp Fases B+C completas — `/competicoes` consolidado em `/jogos`, Brasileirão A grátis, team logos via API, ranking filtrado por competição, Liga Global por competição
- **2026-06-11**: Copa começa — momento da verdade
- **2026-07-19**: Final da Copa — primeira competição completa
