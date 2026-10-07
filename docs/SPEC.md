# SuperChamps — Copa do Mundo 2026
## Documento de Especificação e Plano de Execução

**Versão:** 0.4 (Multi-competição completa)
**Data inicial:** 2026-05-23
**Última atualização:** 2026-06-01
**Nome do produto:** SuperChamps
**Janela alvo de lançamento:** Soft launch até 2026-04-15 / Go-live até 2026-05-25 (jogo de abertura: 2026-06-11)
**Estágio:** **Em produção** — `https://superchamps.com.br`

---

## 0. Implementation Status (snapshot 2026-06-01)

Esta seção é um snapshot do estado atual em produção. O resto do documento (§1-§9) é o spec original v0.2 (2026-05-23) — preservado como histórico de decisões de produto. Quando houver divergência, **esta seção §0 prevalece**.

### 0.1. O que está LIVE em produção

**🔌 Infraestrutura**
- Next.js 16 + React 19 + Tailwind 4 + shadcn/ui na Vercel, custom domain `superchamps.com.br` com SSL
- Supabase (Postgres 17, Auth, Edge Functions, pg_cron, pg_net, pg_trgm)
- 30+ migrations aplicadas via `apply_migration`
- 4 Edge Functions deployadas (sync-competition-fixtures, sync-live-scores, settle-match, low-balance-boost)
- Cron jobs: sync diário 06:00 BRT, live polling 60s, low-balance boost diário
- PWA instalável, manifest + ícone dinâmico
- **Provider de dados esportivos: API-Sports.io Pro** ($19/mo, 7.500 req/dia) — migrado de football-data.org
- **1.212 matches sincronizados** em 4 competições (Copa 72 + Brasileirão A 380 + Brasileirão B 380 + Serie A italiana 380) com `home_team_logo`/`away_team_logo` populados

**🔑 Auth**
- Cadastro com 3 checkboxes LGPD obrigatórios (idade 18+, termos, transparência apostas)
- Email confirmation via token_hash (cross-browser, sem PKCE)
- Detecção de email duplicado + auto-resend
- Login + logout + reset de senha
- Onboarding obrigatório (4 etapas) com gate em `/inicio`
- Auto-join em liga via `?liga=CODE` no signup (consome `league_code` em `auth/callback`)

**🎲 Mecânica de bolão (parimutuel)**
- `place_bet`, `cancel_bet`, `settle_market`, `settle_match` como RPCs SECURITY DEFINER
- Pool órfão refunda automaticamente
- Cap de 50% do saldo por aposta
- Cancel até 5min antes do kickoff
- Mata-mata paga 2× sem empate
- Ranking de liga conta só apostas após `joined_at`
- Reset por competição (1.000 pts) via `reset_competition_balances`

**🤝 Ligas e sharing** (reformado em 2026-05-29)
- Toda liga privada por padrão (Liga Global é singular, todos auto-juntos)
- Invite code formato `NOME-XXXX` para entrada direta
- **Busca de ligas privadas** em `/ligas` (todas, sem opt-in) ordenada por nº de membros
- **Request-to-join + owner approval** flow completo com notificações
- **Public preview** em `/ligas/[slug]` acessível a anon (sem expor membros)
- **`members_visible`** flag — owner controla se ranking aparece pra não-membros
- **`kick_member`** + **`delete_league`** RPCs (owner-only)
- Soft delete em `league_members` (`left_at` + `exit_reason`)

**🔔 Notificações**
- 11 tipos: bet_won, bet_lost, bet_refunded, league_invite, league_join_request, league_join_approved, league_join_rejected, referral_joined, low_balance_boost, kickoff_reminder, competition_end
- Triggers automáticos no DB pra eventos relevantes
- Mark-as-read individual + bulk com optimistic UI
- Badge no sininho atualiza automaticamente

**📝 Blog**
- Tabela `blog_posts` com 3 pilares (bets/cultura/por_dentro), status workflow (draft/scheduled/published/archived), RLS público pra published
- Rotas `/blog` (lista) e `/blog/[slug]` (post)
- MDX rendering server-side via `next-mdx-remote/rsc` + `remark-gfm`
- RSS 2.0 em `/blog/rss.xml` com cache 1h
- Posts são editáveis via Supabase dashboard ou SQL INSERT (script `docs/blog-drafts/*.sql`)

**🔍 SEO**
- `sitemap.xml` dinâmico (rotas estáticas + ligas + posts)
- `robots.txt` dinâmico bloqueando rotas autenticadas
- JSON-LD: Organization + WebSite + SearchAction (homepage), BreadcrumbList + Article (posts), BreadcrumbList (ligas)
- `metadataBase` global + `generateMetadata` dinâmico em rotas dinâmicas
- OpenGraph + Twitter Card configurados

**🎨 Visual**
- Dark mode completo (next-themes + system preference)
- Skeletons + animações + Toaster + ConfirmDialog + EmptyState centralizados
- Paleta emerald base + accent sutil por competição (`lib/competitions-design.ts`)
- Fonte Geist, bandeiras via flagcdn, escudos via API-Sports CDN (otimizados com `next/image`)
- `<TeamCrest>` componente novo decide escudo (clube) vs bandeira (Copa) via `preferFlag`

**🌎 Multi-competição (Fases A+B+C concluídas — 2026-05-31/2026-06-01)**
- 2 competições grátis ativas (Copa + Brasileirão A) + 7 marcadas como "PRO em breve" (`is_pro_only=true`)
- **`/competicoes` consolidado em `/jogos?comp=slug`** — redirects 301 das URLs legacy
- **`<JogosNavStrip>`** sticky pra trocar competição 1-click
- **`<CompetitionHubHero>`** com identidade visual + stats reais (participantes, palpites, próximos)
- Tabs adaptativas: Copa tem Grupos + Mata-mata; ponto corrido tem Tabela única (`computeStandings()`)
- Tab "Ligas focadas" filtra `search_leagues(comp_id)` + botão Solicitar inline
- **Liga focada em UMA competição** — `leagues.competition_id` + RPC `get_league_rankings` filtra apostas
- **Liga Global por competição** — 2 hoje (Copa + Brasileirão A); trigger `handle_new_user` auto-join em todas grátis
- **MatchCardProd enriquecido**: form últimos 5 (verde/cinza/vermelho) + rank na competição + pts + escudo/bandeira

### 0.2. Tabelas vs spec original

Spec original (§6.2) previu 9 tabelas. Hoje em produção:

| Tabela | Status | Mudança vs spec |
|---|---|---|
| `profiles` | ✅ | +`is_banned`, `notification_prefs`, `email_verified_at`, `nickname_last_changed_at` |
| `leagues` | ✅ | +`members_visible`, +`competition_id` (FK), unique parcial pra max 1 Global por competição |
| `league_members` | ✅ | +`exit_reason`, `kicked_by_user_id` |
| `competitions` | ✅ | +`sport_id`, `country_code`, `display_order`, `bet_markets[]`, `slug`, `icon`, `is_active_for_betting`, `is_pro_only`, `external_season` |
| `matches` | ✅ | +`home_team_logo`, `away_team_logo` |
| `bet_markets` | ✅ | inalterada |
| `bets` | ✅ | inalterada |
| `bet_market_snapshots` | ✅ | inalterada |
| `wallet_transactions` | ✅ | inalterada |
| **`notifications`** | ✅ | nova vs spec original |
| **`league_join_requests`** | ✅ | nova vs spec original |
| **`blog_posts`** | ✅ | nova vs spec original |
| **`sports`** | ✅ | nova vs spec original (futebol ativo, NBA/NFL dormentes) |

### 0.3. Features adicionadas além do spec original

| Feature | Por que foi adicionada |
|---|---|
| **Sharing de ligas (busca + request-to-join)** | Spec original previa só invite_code. Validação com usuários reais mostrou que muita gente quer descobrir ligas sem ter o código. |
| **Public preview de liga** | Compartilhamento social via WhatsApp precisava de página acessível a anon, com CTA pra cadastro. |
| **Notificações com mark-as-read UI** | Spec previa apenas o backend; a UI ficou pendente até esta janela. |
| **Blog + SEO foundation** | Estratégia de conteúdo emergiu como diferencial vs casas de aposta — posicionamento anti-bet ganhou tração. |
| **`kick_member` + `delete_league`** | Suporte a moderação básica que owner precisa pra gerenciar liga. |
| **`members_visible` toggle** | Privacidade individual: alguns owners querem expor ranking pra atração, outros não. |
| **Multi-competição** (Copa + Brasileirão A grátis) | Original era WC-only. Estender ampliou base de usuários sem refactor — Brasileirão tem temporada anual. |
| **PRO tier (em breve)** | Demanda por Premier/La Liga/etc. justifica monetização. Por agora bloqueia palpite mas mostra preview. |
| **Liga Global por competição** | Original tinha 1 Global cobrindo tudo. Bagunçava ranking quando multi-comp. Agora cada Global tem competição específica. |
| **MatchCard com form/rank/pts** | Visualmente alinha com Sofascore/FotMob. Computado localmente, sem call extra à API. |
| **Team logos** | Brasileirão/Europa exigem escudo do clube pra reconhecimento. Copa mantém bandeira (escudos de seleção são logos de federação, feios). |

### 0.4. Decisões de produto tomadas nesta janela

| Decisão | Quando | Por quê |
|---|---|---|
| Liga Global removida da listagem geral em `/ligas` | 2026-05-28 | Confundia usuário; auto-join visível só no perfil |
| Mata-mata paga 2× sem empate | 2026-05-28 | Engagement maior em fase eliminatória |
| `is_discoverable` opt-in → todas privadas buscáveis | 2026-05-29 | Friction desnecessária; owner agora controla visibilidade dos membros |
| AdSense **deferido** pra pós-Copa | 2026-05-30 | Conteúdo "bolão/aposta" pode disparar filtros automáticos; melhor ter tráfego comprovado primeiro |
| Importar competições além de WC **deferido** | 2026-05-30 | Foco total na Copa pra MVP; Brasileirão entra logo após |
| Plan One football-data.org **deferido** até pré-Copa | 2026-05-30 | Pagar €30/mês por 2-3 amistosos não vale; ativar ~7d antes da Copa começar |
| 3 pilares de conteúdo no blog: bets / cultura / por_dentro | 2026-05-30 | Cortou "técnico" porque soava como tipster, contra o posicionamento |
| Migrar de football-data.org pra **API-Sports.io** Pro ($19/mo) | 2026-05-31 | Cobertura maior (Brasileirão A/B + 6 europeias), 7.500 req/dia |
| Liga focada em **uma** competição (single-comp) | 2026-05-31 | Multi-select fica pra quando tração justificar; single é mais simples |
| **Liga Global por competição** (não uma só global) | 2026-06-01 | Ranking por escopo, não polui saldo entre comps |
| `/competicoes` index **eliminado** (consolidado em `/jogos`) | 2026-06-01 | UX mais simples; `/jogos?comp=slug` filtra direto |
| **Brasileirão A grátis** + outras como "PRO em breve" | 2026-06-01 | Gating sem cobrança real ainda — `is_pro_only` na DB |
| Copa mantém **bandeira de país** (não escudo de seleção) | 2026-06-01 | Escudos de federação são feios; bandeira tem identidade |
| Form (5 últimos) + rank/pts no MatchCard | 2026-06-01 | Sofascore-style; computado localmente dos matches do DB |

### 0.5. Padrões reusáveis extraídos

Ver `docs/PATTERNS.md` — 8 padrões arquiteturais cristalizados durante esta janela, portáveis pra outros projetos Next.js + Supabase.

### 0.6. Arquitetura multi-esporte (concluída — Fases A+B+C)

A spec original v0.2 (§3.1) era futebol-only, World Cup-only. Em 2026-05-31 / 2026-06-01 a fundação foi construída pra suportar múltiplos esportes + múltiplas competições simultâneas. **Estado atual: 2 competições ativas grátis, 7 PRO em breve.**

**Modelo de dados:**

```
sports (id, slug, name, icon, has_draw, is_active)
  └── 1:N
competitions (id, sport_id, external_id, external_source, external_season,
              country_code, slug, icon, display_order, bet_markets[],
              is_active_for_betting, is_pro_only, status)
  └── 1:N
matches (id, competition_id, external_id, home_team_logo, away_team_logo, ...)
  └── 1:N
bet_markets (id, match_id, market_type)

leagues (id, ..., visibility, competition_id)  -- single-comp por liga
  └── unique partial: (competition_id) WHERE visibility='global'  -- max 1 Global por comp
```

**Esportes suportados:**

| Esporte | Status | Mercados | Has draw |
|---|---|---|---|
| Futebol | ✅ ativo | `1x2`, `exact_score`, `group_winner` | ✅ |
| Basquete (NBA) | 💤 dormente | `h_a`, `spread`, `total_points` | ❌ |
| Futebol Americano (NFL) | 💤 dormente | `h_a`, `spread`, `total_points` | ❌ |

**Competições registradas (estado atual):**

| Competição | Status | Liga ID API | Liga Global? |
|---|---|---|---|
| 🟢 Copa do Mundo 2026 | grátis, ativa | 1 | ✅ "Liga Global Copa do Mundo 2026" |
| 🟢 Brasileirão Série A 2026 | **grátis (NOVO)**, ativa | 71 | ✅ "Liga Global Brasileirão A 2026" |
| ⭐ Brasileirão Série B 2026 | PRO em breve | 72 | — |
| ⭐ Premier League 2026/27 | PRO em breve | 39 | — |
| ⭐ La Liga 2026/27 | PRO em breve | 140 | — |
| ⭐ Bundesliga 2026/27 | PRO em breve | 78 | — |
| ⭐ Serie A italiana 2026/27 | PRO em breve | 135 | — |
| ⭐ Ligue 1 2026/27 | PRO em breve | 61 | — |
| ⭐ Primeira Liga 2026/27 | PRO em breve | 94 | — |

**Princípios arquiteturais (consolidados):**

1. **Adapter pattern** — `supabase/functions/_shared/api-sports.ts` normaliza fixture pra `NormalizedMatch`. Edge functions despacham por `competition.external_source` (hoje só "api-sports").
2. **Stage é TEXT** — cada esporte usa seu vocabulário (`group_a`, `regular`, etc.)
3. **bet_markets é array por competição** — Copa permite `1x2`, NBA permitiria `h_a/spread/total`
4. **Liga focada em UMA competição** (single-comp) — `leagues.competition_id`. RPC `get_league_rankings` filtra apostas por essa comp.
5. **Liga Global por competição** — constraint parcial `WHERE visibility='global'` em `competition_id`. Trigger `handle_new_user` auto-join em todas as Globais grátis.
6. **Identidade visual por competição** — `lib/competitions-design.ts` define accent/border/gradient por slug. `<CompetitionLockup>` consome isso.
7. **Hub unificado em `/jogos`** — `?comp=slug` filtra. `/competicoes/[slug]` redireciona pra `/jogos?comp=`. NavStrip sticky pra trocar 1-click.
8. **Tabs adaptativas** — Copa mostra Grupos + Mata-mata. Ponto corrido mostra Tabela única (helper `computeStandings` em `lib/standings.ts`).
9. **Tab "Ligas focadas"** em `/jogos` — `search_leagues(query, limit, competition_id)` filtrada.
10. **Team logos via API** — `matches.home_team_logo`/`away_team_logo` populados pelo sync. `<TeamCrest>` decide entre escudo (clube) ou bandeira (`preferFlag={hasGroupsAndKnockout}`).
11. **Form (5 últimos) + rank/pts** no MatchCard — computado localmente.

### 0.7. Próximas fases (deferidas)

| Fase | O que | Quando |
|---|---|---|
| **PRO** | Módulo de assinatura (Mercado Pago/Stripe) — destrava 7 competições PRO | Pós-Copa |
| **D — NBA/NFL** | Adapters + APIs pagas + mercados spread/total | Quando tração justificar +$38/mês |

Ver `docs/BACKLOG.md` pro plano detalhado.

---

## 1. Visão do Produto

Plataforma web onde usuários participam de bolões coletivos apostando moeda virtual em jogos de futebol. O diferencial é o modelo **parimutuel**: a odd de cada resultado é dinâmica e reflete o consenso (ou divergência) do grupo — quanto menos gente acreditou no resultado, maior o retorno de quem acertou.

**Princípios de produto:**
- **Social-first**: o bolão é mais divertido em grupo. Ligas privadas (amigos, família, trabalho) são o caso de uso primário.
- **Mecânica transparente**: o usuário sempre vê o pool, a odd atual e o que ganharia se acertar.
- **Janela curta de validação**: a Copa de 2026 (jun-jul) é o evento de aquisição. Tudo deve estar estável antes.
- **Crescimento orgânico**: começar com círculo próximo, validar mecânica, expandir.

**Não-objetivos (explicitamente fora de escopo no MVP):**
- Apostas com dinheiro real (evita licenciamento SPA/MF, KYC, AML).
- Apostas ao vivo durante o jogo (in-play).
- App mobile nativo (PWA atende).
- Outros esportes além de futebol.
- Mercados complexos (handicap asiático, escanteios, cartões). Apenas 1X2 + placar exato no MVP.

---

## 2. Personas

| Persona | Descrição | Necessidade central |
|---|---|---|
| **Organizador** | Cria liga privada para amigos/trabalho, convida participantes, define regras secundárias (ex: prêmio simbólico fora da plataforma) | Criar liga rápido, convidar fácil, acompanhar ranking |
| **Apostador casual** | Entra para se divertir na Copa, aposta pequenas quantias, quer "encher o saco" do grupo | UX simples, palpitar em poucos cliques, ver-se no ranking |
| **Apostador analítico** | Estuda jogos, busca odds favoráveis, otimiza stakes | Ver pool/odds em tempo real, histórico de performance, estatísticas |
| **Admin da plataforma** | Você + equipe. Cuida de jogos, ajustes manuais, suporte | Painel para resolver disputas, reprocessar jogos, banir abusos |

---

## 3. Escopo do MVP

### 3.1. Features incluídas (MVP — alvo abril/2026)

**Autenticação e conta**
- Cadastro via e-mail/senha (Supabase Auth)
- Login com Google (OAuth) — reduz fricção, e-mail já vem verificado
- Recuperação de senha
- **Verificação de e-mail:** obrigatória antes da **primeira aposta** (não bloqueia navegação). Cadastro com Google passa direto. Cadastros com e-mail/senha podem explorar listagem de jogos, ranking, ligas — mas tela de "Apostar" exibe banner pra confirmar e-mail.
- **Idade mínima: 18 anos**, declarada via checkbox obrigatório no cadastro ("declaro ter 18 anos ou mais e aceito os termos de uso"). Sem verificação documental no MVP — é declaração de boa-fé.
- **Anti-multi-conta (MVP):** restrição mínima de **1 e-mail = 1 conta**. Sem checagem de IP, device fingerprint, ou outros sinais. *Trade-off conhecido:* usuário com múltiplos e-mails pode criar várias contas. Aceitável no MVP porque moeda é virtual; re-avaliar caso surjam padrões abusivos (ligas públicas dominadas por uma só pessoa, etc.).
- **Termos de uso e Política de privacidade:** redigidos por advogado antes do soft launch. Devem cobrir: natureza não-monetária do bolão, tratamento de dados pessoais (LGPD), regras de moderação, condições de banimento, propriedade intelectual de marcas de times/jogadores, e **a publicidade obrigatória do histórico de apostas finalizadas** (ver subseção "Transparência").
- **Consentimentos no cadastro (checkboxes separados, todos obrigatórios):**
  1. ✅ "Declaro ter 18 anos ou mais"
  2. ✅ "Aceito os termos de uso e a política de privacidade"
  3. ✅ "Compreendo e concordo que meu histórico de apostas finalizadas será visível publicamente para outros usuários da plataforma" *(LGPD: consentimento específico e informado)*
- Perfil com nickname (único, alterável até 1x/30 dias), avatar (upload Supabase Storage), país favorito (afinidade torcedora), código de indicação único auto-gerado.

**Onboarding (primeira sessão)**

A maioria dos usuários **nunca viu parimutuel**. Onboarding bem-feito é a diferença entre engajamento e churn imediato.

Fluxo de 4 etapas após primeiro login:
1. **Tela 1 — Boas-vindas e propósito**: "Bem-vindo ao [Nome]. Aqui você palpita em jogos da Copa contra seus amigos." Botão "Começar".
2. **Tela 2 — O que é parimutuel (visual)**: ilustração simples de um jogo com 3 resultados, mostrando como a odd muda conforme o pool cresce. Frase-chave: "*Quanto menos gente acreditar no mesmo resultado que você, mais pontos você ganha se acertar.*"
3. **Tela 3 — Aposta-tutorial (jogo fictício)**: usuário coloca uma aposta simulada em um "jogo demo" com pool pré-populado. Pontos usados não vêm do saldo real (são "pontos-tutorial"). Mostra confirmação + cenários ("se você acertar, ganha X. se errar, perde Y.").
4. **Tela 4 — Próximos passos**: "Você está pronto! Saldo: 1.000 pts. Próximos jogos da Copa em destaque. Convide amigos pra liga privada e ganhe +100 pts." Botão "Ver jogos da Copa".

Onboarding pode ser pulado a qualquer momento (botão "Pular tutorial"), mas é o default. Reapresentável via menu de ajuda. Estado armazenado em `profiles.onboarded_at` (timestamp do conclusão; null = não terminou ainda).

**Carteira virtual e economia de pontos**

*Princípio:* o sistema busca o equilíbrio entre **escassez** (pra cada palpite ter peso) e **continuidade** (pra ninguém ficar fora do jogo no meio da Copa).

- **Saldo inicial:** todo usuário começa com **1.000 pontos** ao se cadastrar e a cada nova competição.
- **Stake mínimo:** 10 pontos. **Stake máximo:** 50% do saldo atual por aposta (definido em §4).
- **Reset por competição (Copa, Brasileirão, etc.):** ao final de cada competição, o saldo de todos é restaurado para **1.000 pontos**.
  - Reset é executado por job automático (`pg_cron`) **24h após a final** da competição (margem para correções tardias de placar).
  - O histórico de pontos ganhos/perdidos é preservado em `wallet_transactions` e alimenta o **ranking all-time**.
  - Auditável: cada reset gera transação com `reason='competition_end_reset'`.
- **Programa de indicação:** cada usuário recebe um código único (ex: `JOAO-A8B3`). Quando um novo usuário se cadastra usando o código:
  - O indicador recebe **+100 pontos** (creditados imediatamente, `reason='referral_bonus'`).
  - O indicado começa normalmente com 1.000 pts (sem bônus extra — previne auto-indicação).
  - Limite anti-fraude: **máximo 20 indicações premiadas por usuário por competição**.
- **Boost de saldo baixo:** job diário (06:00 BRT) verifica usuários com saldo `< 10` e credita **+50 pontos** automaticamente (`reason='low_balance_boost'`).
  - Garante que ninguém saia "morto" do jogo, sem anular a consequência de perder.
  - Em uma semana: ~350 pts de recuperação se o usuário continuar zerado.
- **Histórico de transações:** extrato completo visível ao usuário (data, motivo, valor, saldo resultante).
- **Ranking all-time:** soma de pontos líquidos ganhos por competição. Resets não contam.
- **Sem compra/recarga de pontos no MVP:** zero risco regulatório (Lei 14.790/2023). Premiação real fica a cargo do organizador da liga, fora da plataforma (campo "regras adicionais" da liga).

**Ligas**

*Tipos de liga:*
- **Liga global**: todos os usuários da plataforma, ranking público, criada pela equipe.
- **Ligas públicas**: qualquer usuário cria, qualquer um entra (descobríveis via busca).
- **Ligas privadas**: criadas por usuário, entrada apenas por código de convite ou link.

*Atributos da liga:* nome, descrição, banner, regras adicionais (texto livre, ex: "vencedor paga o churrasco"), owner.

*Membros e moderação:*
- **Sem limite de tamanho** de liga (limite social natural). Performance preparada para milhares de membros.
- Usuário pode estar em até **10 ligas simultaneamente** (anti-poluição de UX).
- **Membro pode sair** de uma liga a qualquer momento (durante ou fora de competição). Apostas já feitas permanecem no histórico do usuário, mas ele some do ranking ativo daquela liga.
- **Owner pode expulsar** qualquer membro a qualquer momento. Mesma lógica: histórico preservado, ranking ativo perde a entrada.
- **Reentrada permitida**: usuário pode entrar de novo numa liga da qual saiu/foi expulso (a menos que owner tenha banido — futuro).
- **Apenas 1 owner** no MVP (sem co-owners). Para transferir liga: futuro, pós-MVP.

*Entrada tardia:*
- Usuário **pode entrar em uma liga a qualquer momento**, mesmo com a competição em andamento.
- **Ranking conta apenas a partir do momento da entrada** (apostas anteriores à entrada não contam para o ranking daquela liga, mesmo que tenham sido feitas pelo mesmo usuário em outra liga).
- Desvantagem natural de quem entra tarde (menos jogos) é considerada aceitável.

*Ranking dentro da liga:*
- Métrica primária: **saldo líquido de pontos ganhos no período** (soma de `bets.payout - bets.stake` para apostas dentro da janela de pertencimento à liga).
- **Critério de desempate: maior número de acertos** (`COUNT(*) WHERE bets.status = 'won'`). Em caso de novo empate, o usuário com `joined_at` mais antigo aparece primeiro.
- Filtros: jogo único, fase de grupos, mata-mata, geral.
- Top 3 destacados visualmente, paginação dos demais.

**Transparência de apostas (perfil público)**

*Princípio do produto:* o bolão fica mais interessante quando todos podem **estudar o adversário** — não basta saber que alguém está liderando, é preciso entender *como* lidera. Esta feature transforma cada usuário em uma "carteira de palpites" aberta.

- **Toda aposta com `status` em (`won`, `lost`, `refunded`, `cancelled`) é pública.**
- Apostas em aberto (`status='open'`) **continuam privadas até o kickoff do jogo** — proteção crítica do parimutuel (evita copy-trading que colapsaria as odds).
- Após o kickoff, a aposta deixa de ser editável e, no momento em que o jogo encerra e ela é liquidada, vira pública automaticamente.
- **Granularidade total visível:** stake, resultado escolhido, odd no settle, payout, lucro/prejuízo. Não há ofuscação de valores.
- **Default = sempre público.** Não há opção UI para o usuário ocultar.
- **Kill switch administrativo:** existe campo `profiles.bets_publicly_visible boolean default true` no schema. Admin pode flipar manualmente se houver demanda LGPD legítima (ex: solicitação judicial, advogado pedindo opção de privacidade pré-launch). UI pública não expõe esse toggle.
- **Página de perfil público:** rota `/u/{nickname}` (acessível mesmo sem login? a definir — provavelmente login obrigatório). Mostra:
  - Cabeçalho: avatar, nickname, país, "membro desde", indicador de "verificado" se confirmou e-mail
  - Estatísticas resumidas: total de apostas finalizadas, taxa de acerto, odd média acertada, lucro líquido na competição atual, ranking all-time
  - Lista paginada de apostas finalizadas (mais recentes primeiro), com filtros (por competição, por status won/lost/refunded)
  - CTA "Convidar para liga" se você é owner de alguma liga compatível (futuro)
- **Onde clicar para chegar lá:** nickname clicável em qualquer lugar da plataforma (ranking de liga, ranking global, lista de membros de liga, pool de apostadores de um jogo já encerrado).
- **Risco LGPD a mitigar antes do launch:** consentimento separado no cadastro (já descrito em "Autenticação e conta"); revisão obrigatória do texto pelo advogado antes do soft launch.

**Jogos**
- Calendário completo da Copa do Mundo Masculina 2026 (FIFA)
- Para cada jogo: data/hora, times, grupo/fase, estádio, status (agendado / em andamento / encerrado / cancelado)
- Sincronização automática via API paga (api-football recomendada — ver §7)
- Após o jogo, placar final disparado pela API → settle automático

**Mercados de aposta (MVP)**
- **1X2**: vitória mandante, empate, vitória visitante. Mercado por jogo.
- **Placar exato**: usuário pode apostar em **qualquer combinação 0-10 × 0-10** (121 placares possíveis). UI usa stepper de 0-10 para cada time + sugestão de "placares mais apostados" (top 8 por pool) como atalho de seleção. Sem opção "Outro". Mercado por jogo.
- **Vencedor do grupo (`group_winner`)**: para cada um dos 12 grupos da Copa 2026, mercado com 4 opções (uma por seleção). Abre no início da competição; **cutoff = horário do primeiro jogo do grupo**. Settle quando o último jogo do grupo é finalizado e a classificação fica definida.
  - **Propósito:** engajamento pré-Copa — usuário cadastra em abril/maio mas pode apostar logo, sem esperar a Copa começar. Reduz churn entre cadastro e jogo de abertura.
  - Funciona com a mesma mecânica parimutuel: pool dividido entre acertadores no momento do settle.
- *Futuro:* over/under gols, ambas marcam, primeiro a marcar, classificação dos 32 (knockout).

**Mecânica de aposta (parimutuel)**
- Usuário escolhe jogo → escolhe mercado → escolhe resultado → define stake (pontos)
- **Stake mínimo:** 10 pontos / **máximo:** 50% do saldo atual por aposta individual
- Aposta confirmada subtrai stake do saldo imediatamente
- Pool e odd implícita são atualizados em tempo real (Supabase Realtime)
- **Hedging permitido:** usuário pode apostar em múltiplos resultados do mesmo mercado (ex: 100 pts em "Brasil vence" + 30 pts em "empate"). Cada aposta é uma linha independente em `bets`. O limite de 50% do saldo se aplica a cada aposta individual no momento em que é colocada → limite cumulativo natural fica ~75% do saldo original (50% + 50%×50%).
- **Cancelamento antes do kickoff:** usuário pode cancelar uma aposta **até 5 minutos antes do kickoff** (`matches.starts_at - 5 min`). Cancelamento retorna o stake integral via `wallet_transactions(+stake, 'bet_refunded')` e marca a aposta como `status='cancelled'`. Pool e odds são recalculados em tempo real (Realtime propaga). Após o cutoff de 5 min, aposta vira compromisso definitivo.
- **Editar = cancelar + nova aposta:** não há "editar aposta". Para mudar de ideia, usuário cancela (se janela permite) e faz nova aposta.
- **Cutoff de novas apostas:** novas apostas fecham no horário oficial de kickoff (`matches.starts_at`).
- **Odds congeladas no kickoff:** a odd usada na liquidação é a do momento exato do início do jogo (snapshot em `bet_market_snapshots`).
- **Liquidação:** vencedores recebem `stake_próprio × odd_kickoff`; perdedores não recebem nada (stake já foi debitado).
- **Margem da casa: 0% no MVP** — todo o pool dos perdedores é distribuído aos vencedores. Sem comissão.

**Ranking**
- Por liga: ranking por **saldo de pontos ganhos no período** (não saldo total)
- Filtros: jogo único, fase de grupos, mata-mata, geral
- Top 3 destacados, paginação dos demais

**Notificações**
- E-mail transacional (Supabase Auth + Resend):
  - Convite para liga privada
  - Resumo diário durante a Copa (jogos do dia, suas apostas)
  - Resultado das suas apostas após o jogo encerrar
- *Futuro:* push notifications via PWA

**Painel admin (interno)**
- Listar usuários, banir/desbloquear, ajustar saldo manualmente
- Listar jogos, forçar resync com API, lançar placar manual (fallback)
- Reprocessar settle de um jogo (em caso de erro)
- Métricas básicas: total de usuários, apostas, volume, ligas ativas

### 3.2. Features adiadas (pós-MVP)

- Compra de pontos (com Pix) — exige análise jurídica
- Mercados adicionais (over/under, BTTS, handicap, primeiro a marcar)
- Apostas combinadas (acumuladas)
- Apostas ao vivo (in-play) durante o jogo
- App mobile nativo (Capacitor ou RN)
- Outras competições (Brasileirão, Champions, NBA, etc.)
- Chat por liga, comentários em jogos
- Conquistas / badges
- Login diário com claim de pontos
- Transferência de propriedade de liga (co-owners)
- Toggle UI para tornar histórico privado (kill switch existe no banco, só não exposto)
- Notificações push (PWA usa apenas e-mail no MVP)
- i18n (inglês, espanhol)
- Convite direto via Pix/WhatsApp/SMS (apenas link/código no MVP)

### 3.3. Inventário de telas do MVP

Total: **18 telas** + painel admin.

**Públicas (sem login):**
| # | Tela | Função |
|---|---|---|
| 1 | Landing | Explicação do produto, CTAs de cadastro/login, prova social |
| 2 | Login / Signup | Tela única com toggle. Inclui 3 checkboxes de consentimento no signup. |
| 3 | Recuperar senha | Fluxo padrão Supabase Auth |
| 4 | Termos de uso | Estática, vinculada do cadastro |
| 5 | Política de privacidade | Estática, vinculada do cadastro |

**Autenticadas — fluxo principal:**
| # | Tela | Função |
|---|---|---|
| 6 | Onboarding | 4 etapas: boas-vindas, parimutuel visual, aposta-tutorial, próximos passos |
| 7 | Início / Dashboard | Próximos jogos, minhas apostas em aberto, atalho pras ligas, saldo |
| 8 | Calendário de jogos | Lista completa da Copa com filtros (fase, status, time, "minhas apostas") |
| 9 | Detalhe do jogo | Info do jogo, pool/odds em tempo real, formulário de aposta inline (drawer/modal) |
| 10 | Minhas apostas | Abas: em aberto, em jogo, finalizadas. Permite cancelar (se janela permite). |
| 11 | Carteira | Saldo atual, extrato paginado de `wallet_transactions` com filtros por razão |
| 12 | Liga (multi-função) | Lista das minhas ligas → entra → vê ranking, membros, regras, jogos. Inclui ações: criar, entrar via código, sair, expulsar. |
| 13 | Perfil e configurações | Editar perfil, alterar senha, indicar amigos (referral_code), preferências de notificação, sair, deletar conta. Inclui aba "estatísticas pessoais". |

**Autenticadas — social / transparência:**
| # | Tela | Função |
|---|---|---|
| 14 | Perfil público de outro usuário | `/u/{nickname}` — stats + histórico paginado de apostas finalizadas. Acessada por nickname clicável em qualquer lugar. |
| 15 | Ranking global da plataforma | Top usuários da plataforma por competição ou all-time. Acessada via menu ou Liga "Global". |
| 16 | Standings da Copa | Classificação dos grupos da Copa (vinda de football-data.org). Acessada via Calendário de jogos ou tela independente. |
| 17 | Central de notificações | Tela própria + ícone no header com badge. Lista: convites, resultados de aposta, avisos do sistema. |
| 18 | Ajuda / FAQ | Conteúdo estático com perguntas frequentes. Acessada via menu de Perfil. |

**Restrita (admin):**
- Painel `/admin` — dashboard único com abas: Usuários (banir/ajustar saldo/flip `bets_publicly_visible`), Jogos (resync/lançamento manual), Ligas (banir/deletar), Transações (busca/auditoria), Métricas (DAU, volume, conversão).

**Decisões implícitas:**
- *Detalhe do jogo é inline:* aposta feita via drawer/modal dentro da tela, sem navegar para tela separada. Reduz cliques, melhor mobile.
- *Confirmação de aposta:* dialogo de confirmação dentro do mesmo drawer ("você está apostando 100 pts em Brasil vence. Confirmar?"). Sem tela cheia separada.
- *FAQ pode ser página estática hospedada na própria Vercel*, sem precisar do app principal renderizar.

### 3.4. Navegação principal e fluxos críticos

**Estrutura de navegação:**
- **Mobile (default):** bottom tab bar com 5 ícones: `Início`, `Jogos`, `Ligas`, `Apostas`, `Perfil`.
- **Desktop:** mesma estrutura como top nav (header sticky) ou left sidebar.
- **Sub-itens internos por tab:**
  - *Jogos:* sub-abas `Próximos`, `Ao vivo`, `Finalizados`, `Standings da Copa`.
  - *Ligas:* sub-abas `Minhas ligas`, `Liga global`, `Ranking global da plataforma`. Botões fixos: `+ Criar liga` e `Entrar com código`.
  - *Apostas:* sub-abas `Em aberto`, `Em jogo`, `Finalizadas`, `Carteira (extrato)`.
  - *Perfil:* sub-itens `Editar perfil`, `Estatísticas pessoais`, `Indicar amigos`, `Notificações (preferências)`, `Ajuda/FAQ`, `Termos e privacidade`, `Sair`.
- **Header global (todas as telas autenticadas):**
  - Logo (volta pro Início)
  - Saldo atual de pontos
  - Ícone de notificações com badge (abre tela #17)
  - Avatar (abre menu rápido do perfil)
- **Telas auxiliares e como chegar:**
  - *#14 Perfil público de outro usuário:* clicar em qualquer nickname (ranking, membros da liga, pool de aposta de jogo encerrado).
  - *#17 Central de notificações:* ícone do header em qualquer tela.
  - *#18 Ajuda/FAQ:* menu de Perfil, ou link no rodapé.

**Estrutura de URLs (deep linking):**
```
/                       → Landing (não logado) ou redireciona pra /inicio
/login, /cadastro, /recuperar-senha
/inicio                 → Dashboard
/jogos                  → Calendário (sub-rotas: /jogos/ao-vivo, /jogos/standings)
/jogos/:id              → Detalhe do jogo
/ligas                  → Minhas ligas
/ligas/criar            → Form de criação
/ligas/:slug            → Detalhe da liga
/entrar/:codigo         → Entrada via convite (deep link compartilhável)
/apostas                → Minhas apostas (sub-rotas: /apostas/finalizadas, /apostas/carteira)
/u/:nickname            → Perfil público de usuário
/ranking                → Ranking global da plataforma
/notificacoes           → Central de notificações
/perfil                 → Meu perfil e configurações
/ajuda                  → FAQ
/admin/*                → Painel admin (gated por role)
```

**Fluxo crítico 1 — Cadastro do novo usuário (até a primeira aposta):**
1. Landing (`/`) → CTA "Criar conta grátis"
2. `/cadastro` — form single-page com: e-mail, senha (validação de força mínima), nickname (validação de disponibilidade em tempo real), 3 checkboxes obrigatórios (18+, termos, transparência), campo opcional "código de indicação".
3. Submit → cria conta no Supabase Auth, insere `profiles`, envia e-mail de verificação, credita bônus de referral (se aplicável).
4. Redireciona para onboarding (4 etapas — §3.1).
5. Final do onboarding → `/inicio` (Dashboard).
6. Usuário escolhe jogo → tenta apostar → se e-mail ainda não verificado, modal "Confirme seu e-mail antes da 1ª aposta. [Reenviar] [Já confirmei]".
7. Após verificação: aposta liberada. Saldo debita, aposta aparece em "Apostas em aberto".

**Fluxo crítico 2 — Convite para liga privada (link + código):**
- **Geração:** owner abre a liga → botão "Convidar" → exibe link `bolao.com/entrar/{codigo}` + código separado. Botões "Copiar link" e "Copiar código".
- **Aceitação via link (já logado):** clica → abre `/entrar/{codigo}` → modal "Entrar em [Liga]? [Sim] [Não]" → confirma → vira membro → redireciona pra `/ligas/:slug`.
- **Aceitação via link (não logado):** clica → vai pra `/cadastro?liga={codigo}` → form de cadastro com indicação visual "Você está sendo convidado para [Liga]". Após signup + verificação de e-mail, entra automaticamente na liga (modal de confete).
- **Aceitação manual via código:** tab Ligas → botão "Entrar com código" → input → submit → vira membro.
- **Revogação:** owner pode regenerar o código (botão "Gerar novo código"), invalidando o anterior. Quem já entrou continua dentro.

**Fluxo crítico 3 — Apostar em um jogo:**
1. `/jogos` → escolhe jogo → `/jogos/:id`
2. Vê: cabeçalho (times, kickoff, status), pool/odds em tempo real do mercado 1X2 e placar exato, lista de apostadores já visíveis (apostas finalizadas em jogos anteriores entre esses times, se relevante).
3. Toca em um resultado (ex: "Brasil vence") → drawer/bottom-sheet sobe com:
   - Input de stake (com presets: 10, 50, 100, 25%, 50%)
   - Cálculo dinâmico: "Se acertar, ganha X pts (odd atual: Y)"
   - Aviso: "A odd final será congelada no kickoff. Pode mudar até lá."
   - Botão "Confirmar aposta"
4. Confirma → toast "Aposta colocada! [Ver apostas]" → drawer fecha → pool/odds atualizam visualmente.

**Estados vazios e erros (convenções):**
- *Sem ligas:* card grande no `/ligas` "Você ainda não está em nenhuma liga. [Criar liga] ou [Entrar via código]".
- *Sem apostas:* `/apostas` mostra "Você ainda não fez apostas. Veja os próximos jogos." + CTA pra `/jogos`.
- *Saldo baixo (< 10):* banner persistente no header "Saldo baixo. Você receberá +50 pts no próximo boost diário (06h BRT)." Form de aposta bloqueado com tooltip explicativo.
- *Fora do cutoff:* tela de jogo bloqueia form com mensagem "Apostas encerradas. Pool congelado em [valor]. Bom jogo!"
- *E-mail não verificado tentou apostar:* modal "Confirme seu e-mail antes da 1ª aposta. [Reenviar] [Já confirmei, recarregar]".
- *Sem conexão / Realtime caiu:* banner amarelo "Sem conexão. Reconectando..." Tenta reconectar em background.
- *Erro 5xx:* tela com mascote/ilustração + "Algo deu errado. Tentar de novo." + link "Reportar".

---

## 4. Mecânica Parimutuel — Detalhamento

> Esta seção é crítica. A mecânica financeira do bolão precisa ser inequívoca antes do código existir.

### 4.1. Cálculo da odd implícita

Para um mercado com `n` resultados possíveis (ex: 1X2 tem n=3):

```
pool_total       = soma de todos os stakes apostados naquele mercado
pool_resultado_i = soma dos stakes apostados no resultado i
odd_resultado_i  = pool_total / pool_resultado_i
```

Caso o pool de um resultado seja zero, exibimos odd como "—" e tratamos como aposta isolada (ver 4.3).

### 4.2. Snapshot no kickoff

No instante exato do kickoff (T = horário oficial do jogo), o sistema:
1. **Fecha** o mercado (rejeita novas apostas).
2. **Calcula** `odd_kickoff` para cada resultado a partir dos pools finais.
3. **Persiste** o snapshot em `bet_market_snapshots` (audit trail).
4. Cada aposta individual recebe sua `odd_at_settle = odd_kickoff[resultado_apostado]`.

### 4.3. Liquidação (settle)

Quando o jogo é encerrado e o placar oficial chega via API:
1. Identifica o resultado vencedor de cada mercado.
2. Para cada aposta:
   - Se acertou: credita `stake × odd_at_settle` no saldo do usuário.
   - Se errou: não credita (stake já foi debitado no momento da aposta).
3. **Caso especial — pool órfão**: se nenhuma aposta acertou um mercado (ex: ninguém apostou no placar exato 4x2), todas as apostas daquele mercado são **revertidas (refund)** — cada apostador recebe seu stake de volta integralmente. As apostas recebem `status='refunded'` e o mercado é encerrado sem ganhadores. *Racional:* preserva percepção de justiça (ninguém perde pontos quando o resultado real estava fora do leque de palpites do grupo) e mantém os mercados independentes (1X2 e placar exato não se misturam financeiramente).
4. **Jogo cancelado/adiado**: todas as apostas daquele jogo são revertidas (refund de stake).

### 4.4. Anti-gaming

- Saldo nunca pode ficar negativo (constraint dura no banco: `balance >= 0`).
- Stake mínimo de 10 pontos evita spam de stakes microscópicos para inflar pool.
- Stake máximo de 50% do saldo por aposta individual evita "all-in" trivial que distorce odds.
- Cooldown de **1 segundo** entre apostas do mesmo usuário no mesmo mercado (anti double-click). Concorrência real é resolvida via transações Postgres na Edge Function `place-bet`.
- Cancelamento bloqueado a partir de `matches.starts_at - 5 min` (validação server-side, não confia em horário do cliente).
- Limite de 20 bônus de indicação por usuário por competição (anti-esquema).
- Restrição de 1 e-mail = 1 conta (validada pelo Supabase Auth). Sem checagem de IP/device no MVP (re-avaliar se surgir abuso).

---

## 5. Requisitos Não-Funcionais

| Requisito | Alvo MVP |
|---|---|
| **Disponibilidade em dia de jogo** | 99.5% (Vercel + Supabase têm SLA suficiente) |
| **Latência de UI para apostar** | < 800ms p95 do clique ao "aposta confirmada" |
| **Atualização de pool/odds** | Realtime (websocket Supabase), latência < 2s |
| **Sincronização de placar** | Atualização do placar final em até 60s após encerramento do jogo |
| **Cutoff de apostas** | Precisão de ± 1 segundo em relação ao kickoff oficial |
| **Concorrência esperada (pico)** | ~500 usuários simultâneos, ~50 apostas/min nos minutos antes de jogos do Brasil |
| **Segurança** | RLS (Row Level Security) em todas as tabelas Supabase. Validação server-side de stakes. Audit log de ajustes admin. |
| **LGPD** | Política de privacidade clara, opção de exclusão de conta, dados criptografados em repouso (default Supabase) |
| **Acessibilidade** | WCAG 2.1 AA básico (contraste, navegação por teclado, alt em imagens) |
| **Idioma** | Português (Brasil) no MVP. i18n preparado para inglês/espanhol em fase 2. |

---

## 6. Arquitetura Técnica

### 6.1. Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + React 19 + TypeScript** | SSR/RSC, ótima DX, ecossistema |
| UI | **Tailwind CSS + shadcn/ui** | Componentes acessíveis, customizáveis, sem lock-in |
| Estado cliente | **TanStack Query + Zustand** | Cache de queries + estado UI leve |
| Auth | **Supabase Auth** | Já integrado, suporta OAuth (Google) |
| DB | **Supabase Postgres** | Postgres gerenciado, RLS, extensões |
| Realtime | **Supabase Realtime (Postgres changes)** | Atualiza pool/odds via websocket |
| Storage | **Supabase Storage** | Avatares, banners de liga |
| Edge | **Supabase Edge Functions (Deno)** | Settle de jogos, cutoff scheduler, webhooks da API esportiva |
| Cron | **Supabase pg_cron** | Verificação periódica de jogos prestes a iniciar |
| E-mail | **Resend** | Transacional, integra fácil com Edge Functions |
| Hosting | **Vercel** | Deploy do Next.js, edge network, preview deploys |
| Monitoramento | **Sentry + Vercel Analytics** | Erros + métricas de uso |
| API esportiva | **football-data.org** (acesso direto) | Free tier cobre a Copa 2026; upgrade para Plan One (€30) na fase pré-Copa para reduzir atraso de dados ao vivo |

**Estimativa de custos mensais (durante a Copa):**
- Supabase Pro: $25
- Vercel Pro: $20
- API esportiva (football-data.org Plan One): €30 ≈ $33
- Resend: $0 (free tier até 3.000 e-mails/mês — provável ultrapassar; ~$20)
- Domínio + SSL: $1–2
- **Total estimado: $99–100/mês durante a Copa** (sensivelmente mais barato que api-football graças ao free tier nas fases iniciais)

### 6.2. Modelo de dados (esboço inicial)

```sql
-- Tabelas principais (simplificado)

profiles (
  id uuid PK references auth.users,
  nickname text unique,
  avatar_url text,
  country_code text,
  balance int default 1000 check (balance >= 0),
  referral_code text unique not null,                  -- ex: 'JOAO-A8B3', gerado no signup
  referred_by_user_id uuid references profiles,        -- nullable; quem trouxe esse usuário
  age_confirmed_at timestamptz not null,               -- checkbox 18+ no cadastro
  terms_accepted_at timestamptz not null,              -- checkbox termos no cadastro
  public_bets_consent_at timestamptz not null,         -- checkbox LGPD-específico (transparência)
  onboarded_at timestamptz,                            -- null = ainda não terminou o tutorial
  email_verified_at timestamptz,                       -- sync com Supabase Auth
  nickname_last_changed_at timestamptz,                -- limite de 1x/30 dias
  bets_publicly_visible boolean not null default true, -- kill switch admin (LGPD)
  created_at timestamptz default now(),
  is_banned boolean default false
)

leagues (
  id uuid PK,
  name text,
  slug text unique,
  description text,
  banner_url text,
  visibility text check (visibility in ('public','private','global')),
  invite_code text unique,
  owner_id uuid references profiles,
  created_at timestamptz
)

league_members (
  id uuid PK,
  league_id uuid references leagues,
  user_id uuid references profiles,
  role text check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,                                   -- null = membership ativa
  exit_reason text check (exit_reason in ('voluntary','kicked','banned')),
  kicked_by_user_id uuid references profiles             -- audit trail
)
-- Índice partial para garantir apenas 1 membership ativa por (liga, user):
--   CREATE UNIQUE INDEX one_active_membership_per_user
--     ON league_members(league_id, user_id) WHERE left_at IS NULL;
-- Ranking-per-liga filtra bets por: bets.placed_at >= joined_at
--   AND bets.placed_at <= COALESCE(left_at, NOW())

competitions (
  id uuid PK,
  name text,                        -- 'Copa do Mundo 2026'
  external_id text,                 -- id na API esportiva
  starts_at timestamptz,
  ends_at timestamptz
)

matches (
  id uuid PK,
  competition_id uuid references competitions,
  external_id text unique,
  home_team text,
  away_team text,
  starts_at timestamptz,            -- horário oficial de kickoff
  status text check (status in ('scheduled','live','finished','cancelled','postponed')),
  stage text,                       -- 'group_a', 'round_of_16', etc.
  home_score int,
  away_score int,
  settled_at timestamptz
)

bet_markets (
  id uuid PK,
  competition_id uuid references competitions not null,
  match_id uuid references matches,                    -- nullable: null para mercados de grupo
  market_type text check (market_type in ('1x2','exact_score','group_winner')),
  market_scope text not null,                          -- 'match:{match_id}' ou 'group:GROUP_A'
  closes_at timestamptz not null,                      -- kickoff do jogo OU 1º jogo do grupo
  is_settled boolean default false,
  winning_outcome text,                                -- 'home'/'draw'/'away'; '2-1' (qualquer placar 0-10 × 0-10); ou team_external_id
  settled_at timestamptz
)
-- Mercados de jogo: match_id preenchido, market_scope = 'match:{match_id}'
-- Mercados de grupo: match_id = null, market_scope = 'group:GROUP_A', closes_at = starts_at do 1º jogo do grupo
-- settle de group_winner: trigger quando todos os jogos do grupo têm status='finished'

bets (
  id uuid PK,
  user_id uuid references profiles,
  market_id uuid references bet_markets,
  outcome text,
  stake int check (stake >= 10),
  odd_at_settle numeric(8,4),       -- preenchido no kickoff
  status text check (status in ('open','won','lost','refunded','cancelled')),
  payout int,                        -- preenchido no settle
  placed_at timestamptz,
  cancelled_at timestamptz           -- preenchido se usuário cancelou antes do cutoff
)
-- Nota: hedging permitido → não há unique constraint em (user_id, market_id, outcome).
-- Múltiplas apostas do mesmo usuário no mesmo resultado são linhas separadas.

bet_market_snapshots (
  id uuid PK,
  market_id uuid references bet_markets,
  taken_at timestamptz,             -- = matches.starts_at
  pools jsonb,                      -- { 'home': 1200, 'draw': 800, 'away': 500 }
  odds jsonb                        -- { 'home': 2.08, 'draw': 3.12, 'away': 5.00 }
)

wallet_transactions (
  id uuid PK,
  user_id uuid references profiles,
  amount int,                        -- positivo ou negativo
  reason text check (reason in (
    'signup_bonus',                  -- +1000 no cadastro
    'bet_placed',                    -- débito ao apostar
    'bet_won',                       -- crédito ao acertar
    'bet_refunded',                  -- refund (jogo cancelado / pool órfão)
    'referral_bonus',                -- +100 ao indicar amigo
    'low_balance_boost',             -- +50 daily se saldo < 10
    'competition_end_reset',         -- ajuste para voltar a 1000
    'admin_adjust'                   -- ajuste manual via painel admin
  )),
  related_bet_id uuid references bets,
  related_competition_id uuid references competitions,
  created_at timestamptz,
  balance_after int
)
```

**RLS** (alguns exemplos):
- `bets`: usuário só lê/insere as próprias; admin lê tudo.
- `profiles`: leitura pública (apenas campos públicos via view); update só do próprio.
- `leagues`: privadas só visíveis a membros; públicas a todos.
- `wallet_transactions`: usuário só lê as próprias; insert apenas via Edge Function (service_role).

### 6.3. Fluxos críticos

**A. Sincronização de jogos**
1. Cron diário (06:00 BRT) busca calendário da Copa via API esportiva.
2. Upsert em `matches`. Cria `bet_markets` para mercados ativos.
3. 5 min antes de cada kickoff, cron específico verifica e prepara snapshot.
4. No kickoff: Edge Function fecha mercado, salva snapshot, atualiza `bets.odd_at_settle`.

**B. Posting de aposta**
1. Cliente chama Edge Function `place-bet(market_id, outcome, stake)`.
2. Function valida: mercado aberto? saldo suficiente? stake ≥ 10 e ≤ 50% do saldo? cooldown de 1s respeitado?
3. Em transação Postgres: debita saldo, insere `bets`, insere `wallet_transactions(-stake, 'bet_placed')`.
4. Hedging: se já houver aposta do mesmo usuário no mesmo mercado, simplesmente cria nova linha (sem substituir).
5. Realtime propaga update do pool/odds para todos os clientes na tela do jogo.

**B.2. Cancelamento de aposta**
1. Cliente chama Edge Function `cancel-bet(bet_id)`.
2. Function valida: aposta pertence ao usuário? status `'open'`? `now() <= matches.starts_at - 5 min`? (validação 100% server-side com `now()` do banco).
3. Em transação: credita saldo com stake, atualiza `bets.status='cancelled'` e `cancelled_at=now()`, insere `wallet_transactions(+stake, 'bet_refunded')`.
4. Realtime propaga novo pool/odds (recálculo automático ao reduzir pool do resultado cancelado).

**C. Liquidação**
1. API esportiva notifica fim do jogo (webhook ou polling a cada 60s para jogos `live`).
2. Edge Function `settle-match(match_id)` carrega placar oficial.
3. Para cada `bet_market` do jogo: define `winning_outcome`, marca `is_settled=true`.
4. Para cada `bet`: define `status` (`won`/`lost`), calcula `payout`, atualiza saldo do usuário.
5. Dispara e-mail "Resultado das suas apostas".

**D. Cancelamento de jogo**
- Admin marca jogo como `cancelled` → Edge Function `refund-match` reverte todas as apostas (stake de volta ao saldo, status `refunded`).

**E. Economia de pontos (jobs automáticos)**
- **E.1 Bônus de indicação:** trigger no signup. Se o novo usuário se cadastrou com `referral_code` válido, insere `wallet_transactions(+100, 'referral_bonus')` para o indicador. Edge Function verifica o limite de 20 bônus por competição antes de creditar.
- **E.2 Boost de saldo baixo:** cron `pg_cron` diário às 06:00 BRT. SQL único: para cada `profiles` com `balance < 10`, insere `wallet_transactions(+50, 'low_balance_boost')` e atualiza `balance`.
- **E.3 Reset de competição:** cron `pg_cron` programado para `competitions.ends_at + 24h`. Para cada usuário que participou da competição, insere `wallet_transactions(1000 - current_balance, 'competition_end_reset')` e zera/restaura para 1000. Pré-condição: todos os jogos da competição devem ter `status='finished'` ou `'cancelled'`. Se houver jogo pendente, o reset é adiado até resolução manual pelo admin.

---

## 7. API esportiva: football-data.org

**Decisão (2026-05-23):** usar **football-data.org** com acesso direto (não via RapidAPI ou agregador).

**Configuração técnica:**
- Base URL: `https://api.football-data.org/v4`
- Auth header: `X-Auth-Token: <token>`
- Token gerado em `football-data.org/client/register`, enviado por e-mail
- Identificador da Copa 2026 na API: `competition code = WC` (ou id numérico `2000`)
- Armazenamento do token: **Supabase secrets** (`supabase secrets set FOOTBALL_DATA_TOKEN=...`), nunca no Vercel/Next.js

**Endpoints relevantes:**
| Necessidade | Endpoint |
|---|---|
| Calendário da Copa | `GET /v4/competitions/WC/matches` |
| Detalhes de um jogo | `GET /v4/matches/{id}` |
| Jogos ao vivo (filtrado) | `GET /v4/matches?status=LIVE` |
| Classificação dos grupos | `GET /v4/competitions/WC/standings` |
| Times participantes | `GET /v4/competitions/WC/teams` |

**Planos e estratégia de upgrade:**
| Fase | Plano | Custo | Limite | Atraso ao vivo |
|---|---|---|---|---|
| Discovery → Vertical slice → Funcionalidades | **Free Tier** | €0 | 10 req/min | ~1 min |
| Hardening + Soft launch | **Free Tier** ou **Plan One** | €0–30 | 30 req/min no Plan One | <30s no Plan One |
| Pré-Copa + Copa | **Plan One** (obrigatório) | €30/mês | 30 req/min | <30s |

**Análise de consumo na Copa:** com 4 jogos simultâneos máx (fase de grupos início) e polling de 60s por jogo `live`, gera ~4 req/min — cabe no free tier, mas Plan One é recomendado pelo menor atraso e folga operacional.

**Alternativas descartadas (e por quê):**
- **api-football** ($19–79/mês): mais caro nas fases iniciais; latência marginalmente melhor não justifica o custo no MVP.
- **SportsDataIO** ($100+/mês): caro demais para o estágio do produto; reservar como contingência se football-data.org apresentar instabilidade.
- **TheSportsDB** (grátis): qualidade e SLA insuficientes para dia de jogo.

**Limitações conhecidas a planejar:**
- Sem lineups/escalações no Plan One (precisa Plan Three €100+) → mercados de "primeiro a marcar" ficam fora do roadmap até considerar upgrade.
- Sem webhooks → polling obrigatório para detectar fim de jogo. Mitigação: cron `pg_cron` rodando a cada 60s durante janela de jogos `live`.
- Atraso de ~1 min no free tier afeta UX durante jogo do Brasil → upgrade para Plan One antes do soft launch.

**Resiliência arquitetural:** o schema usa `external_id` genérico em `matches` e `competitions`. Troca de provedor (se necessário) requer apenas reescrita das Edge Functions de sync — sem migração de dados.

**Ação imediata:** registrar conta em `football-data.org/client/register`, validar token via `curl` no endpoint `/v4/competitions/WC`, confirmar cobertura completa do calendário da Copa antes de iniciar Fase 1.

---

## 8. Cronograma Proposto

> Janela total: hoje (2026-05-23) até soft launch (2026-04-15) ≈ **~11 meses úteis**.
> Recomendação: usar os primeiros 3 meses para validar premissas e fazer um vertical slice end-to-end antes de construir toda a feature list.

| Fase | Período | Entregáveis |
|---|---|---|
| **0. Discovery e setup** | 2026-05-26 → 2026-06-15 (3 sem) | Spec aprovada, escolha final da API, conta Supabase/Vercel, repo Git, CI/CD, design system básico (cores, tipografia, componentes), wireframes de baixa fidelidade |
| **1. Vertical slice (MVP-zero)** | 2026-06-16 → 2026-08-15 (2 meses) | Auth + 1 liga global + 1 jogo hardcoded + apostar em 1X2 + liquidar manualmente. Objetivo: validar mecânica parimutuel end-to-end com 5–10 amigos. |
| **2. Funcionalidades de liga** | 2026-08-16 → 2026-10-15 (2 meses) | Ligas públicas/privadas, convites, ranking, perfil, carteira, extrato, e-mails transacionais |
| **3. Integração esportiva** | 2026-10-16 → 2026-12-15 (2 meses) | Sync automático de jogos via API, cutoff automático, settle automático, mercado placar exato, painel admin |
| **4. Hardening + load test** | 2026-12-16 → 2026-02-15 (2 meses) | Realtime estável, RLS auditado, observabilidade (Sentry, métricas), load test simulando 1.000 usuários, fix de bugs |
| **5. Soft launch** | 2026-02-16 → 2026-04-15 (2 meses) | Beta privado com 50–100 usuários, iteração rápida sobre feedback, ajustes de copy/UX |
| **6. Pré-Copa** | 2026-04-16 → 2026-06-10 | Marketing leve (redes pessoais), preparação de infra (escalar planos), monitoramento intensivo |
| **7. Copa** | 2026-06-11 → 2026-07-19 | Operação, suporte, hotfixes. Plantão durante jogos do Brasil. |

**Marco crítico:** ao final da Fase 1, fazer um *go/no-go* honesto. Se a mecânica parimutuel não estiver clara e divertida para o grupo piloto, pivotar antes de investir nas fases pesadas.

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| API esportiva indisponível em dia de jogo | Média | Alto | Fallback manual no painel admin para lançar placar; testar troca de provedor antes da Copa |
| Pool muito pequeno → odds irrealistas (1.01 ou ∞) | Alta no início | Médio | Bot/admin pode "seedar" pool inicial; usar margem mínima; comunicar nas regras |
| Usuário descobre exploit (ex: criar contas múltiplas para inflar pool) | Média | Alto | Limitar 1 conta por e-mail+IP no MVP; monitorar padrões anômalos; CAPTCHA no cadastro |
| Race condition: aposta entra após kickoff | Baixa | Médio | Verificação dupla (cliente + Edge Function); usar `now()` do banco como fonte de verdade |
| Crescimento orgânico não acontece | Alta | Médio | Foco em ligas privadas (viralidade por convite); preparar campanha de aquisição em redes do fundador |
| Custo da API esportiva escala mal | Baixa | Médio | Cachear agressivamente; só consultar dados em tempo real durante jogos `live` |
| Mudança de regulamentação durante a Copa (LGPD, MF) | Baixa | Alto | Operar 100% com moeda virtual, sem premiação real; consultar advogado antes do go-live |
| LGPD: questionamento sobre transparência sempre-pública das apostas | Média | Alto | Consentimento específico no cadastro (3 checkboxes); kill switch via `profiles.bets_publicly_visible` permite reverter para opt-in sem migração de schema; revisão obrigatória do texto pelo advogado antes do soft launch |
| Cronograma estourar | Média | Alto | Vertical slice cedo (Fase 1) força decisão de escopo; lista clara de "adiáveis" no §3.2 |

---

## 10. Premissas

- O fundador atuará como product owner, designer e primeiro testador.
- Desenvolvimento será feito principalmente por 1 dev (eventualmente com apoio pontual). Cronograma reflete isso.
- O círculo próximo (família, amigos, colegas) servirá como base inicial de usuários — não há plano de marketing pago para o MVP.
- A FIFA não impedirá uso de nomes de times/jogadores em contexto de bolão sem dinheiro real (validar com advogado se o produto crescer).
- A Copa de 2026 ocorrerá conforme calendário oficial (jun-jul 2026) sem cancelamento.

---

## 11. Métricas de Sucesso e Instrumentação

### 11.1. North Star Metric

**"Match Coverage"** *(nome interno / analytics)* — percentual médio de jogos da Copa em que cada usuário ativo fez ao menos uma aposta.

**Label visível ao usuário:** `"X% jogos apostados"`. Aparece em rankings de liga, perfil público de usuário, e na lista de membros. Evita o termo "cobertura" (interno/técnico) na UI.

```
match_coverage = AVG(
  (# de jogos com aposta do usuário) / (# de jogos disponíveis na janela em que o usuário está ativo)
)
```

**Meta MVP:** 50%+ de match coverage entre usuários ativos durante a Copa.

**Por que esta métrica:** captura a essência do bolão — o produto só tem valor se o usuário palpita em cada jogo. DAU sobe naturalmente nos dias do Brasil, retenção D7 não captura intensidade. Coverage mede engajamento *com a mecânica*, não só presença.

### 11.2. Metas quantitativas do MVP (jun-jul 2026)

| Métrica | Meta | Por que importa |
|---|---|---|
| **Cadastros totais até o início da Copa** | 500 | Volume gerenciável para suporte manual; dentro do Supabase Pro sem upgrade emergencial |
| **Usuários ativos (≥1 aposta na Copa)** | 200 | 40% de ativação sobre cadastros — bom proxy de produto-mercado fit |
| **Ativação na 1ª sessão** | 70% dos cadastrados fazem 1ª aposta | Funil saudável; abaixo de 50% sinaliza fricção |
| **Match coverage médio (north star)** | ≥50% | Engajamento sustentado |
| **Ligas privadas criadas** | ≥50 (média 4 membros/liga) | Indica que viralidade social funciona; ligas privadas = uso pretendido |
| **K-factor (viralidade)** | ≥0.5 (cada usuário ativo traz ≥0.5 novo) | Crescimento orgânico sem marketing pago |
| **Retenção D7** | ≥40% dos ativos da semana 1 ainda ativos na semana 2 | Bolão "gruda" durante a Copa |
| **Disponibilidade durante jogos** | 99.5% uptime nas janelas de kickoff ±90min | NFR (§5), aqui virado em métrica observável |

### 11.3. Instrumentação

**Stack:**
- **Vercel Analytics** — page views, Core Web Vitals, geo (incluído no plano Pro)
- **PostHog Cloud (free tier)** — eventos custom, funis, retenção, session recording opcional (1M eventos/mês grátis, ~suficiente pra 500-1.000 usuários)
- **Tabela `events` no Supabase** — backup auditável de eventos críticos (apostas, transações), independente do PostHog

**Eventos críticos a rastrear:**

| Evento | Properties principais |
|---|---|
| `signup_started` | `referral_code?`, `league_invite_code?` |
| `signup_completed` | `via` ('email' / 'google') |
| `email_verified` | — |
| `onboarding_step_viewed` | `step_number` (1-4) |
| `onboarding_completed` | `total_time_ms` |
| `onboarding_skipped` | `step_skipped_at` |
| `match_viewed` | `match_id`, `stage` |
| `bet_placed` | `market_id`, `market_type`, `outcome`, `stake`, `odd_at_placement`, `time_to_kickoff_ms` |
| `bet_cancelled` | `bet_id`, `time_to_kickoff_ms` |
| `bet_settled` | `bet_id`, `status` ('won'/'lost'/'refunded'), `payout` |
| `league_created` | `visibility` ('public'/'private') |
| `league_joined` | `league_id`, `via` ('link'/'code'/'browse'/'global_default') |
| `league_left` | `league_id`, `exit_reason` |
| `referral_link_copied` | — (proxy de intenção de convite) |
| `profile_viewed` | `is_self` (true/false), `visited_user_id` |
| `error_encountered` | `error_type`, `context` |

**Funis críticos pra construir no PostHog:**

1. **Aquisição → Ativação:** `landing_view` → `signup_started` → `signup_completed` → `email_verified` → `onboarding_completed` → `bet_placed` *(primeira)*
2. **Recorrência:** `app_opened` → `match_viewed` → `bet_placed` *(por sessão)*
3. **Viralidade:** `referral_link_copied` → `signup_started` *(com referral_code)* → `signup_completed` → `bet_placed` *(do convidado)* → `league_joined` *(se aplicável)*

**Dashboards prioritários:**

- *North star (atualizado diariamente):* match coverage médio + distribuição de coverage por usuário (histograma)
- *Funil de ativação semanal*
- *Retenção D1/D7/D30* (cohort weekly)
- *Distribuição de stakes* (quantil 50/75/90/99 — entender se as pessoas estão all-in ou conservadoras)
- *Saúde da viralidade*: convites enviados, conversões, k-factor

### 11.4. Sinais de alerta (red flags)

Definir limites pra revisão imediata da estratégia:

- *Match coverage < 30%:* mecânica parimutuel não está engajando; revisitar UX de aposta ou regras
- *Ativação na 1ª sessão < 40%:* fricção no funil (provavelmente e-mail/onboarding); medir cada step
- *K-factor < 0.2:* viralidade quebrada; copy de convite ou mecanismo de share não funciona
- *Retenção D7 < 25%:* produto não gruda; preocupar-se com churn pré-Copa

---

## 12. Próximos Passos Imediatos

1. **Revisar e aprovar esta spec** (você + eventuais sócios/conselheiros).
2. **Criar contas:** Supabase, Vercel, GitHub, Resend, football-data.org (free tier).
3. **Wireframes de baixa fidelidade** das 5 telas principais: lista de jogos, detalhe do jogo (com pool/odds), minha carteira/apostas, liga (ranking), criar/entrar em liga.
4. **Setup do repositório:** Next.js 15 + TypeScript + Tailwind + shadcn/ui + Supabase client.
5. **Schema inicial no Supabase** (a partir do §6.2) + RLS policies.
6. **Vertical slice:** uma rota `/jogo-piloto` com mecânica completa testada com 3–5 amigos.

---

## 13. Estratégia de Lançamento

### 13.1. Visão geral — 3 ondas progressivas

O lançamento segue lógica de **anéis de confiança expandindo**: começamos no círculo mais íntimo (onde feedback é honesto e a tolerância a bugs é alta) e expandimos para anéis mais distantes (mais volume, menos paciência, menos feedback profundo).

```
                  Onda 3 — Soft launch (mai/26)
                ┌─────────────────────────────────┐
                │   200-500 usuários              │
                │   Canais: Instagram + grupos    │
                │ ┌─────────────────────────────┐ │
                │ │ Onda 2 — Beta (mar-abr/26)  │ │
                │ │   50-100 usuários           │ │
                │ │   Grupos WhatsApp + LinkedIn│ │
                │ │ ┌─────────────────────────┐ │ │
                │ │ │ Onda 1 — Alfa (fev/26)  │ │ │
                │ │ │   10-15 usuários        │ │ │
                │ │ │   WhatsApp 1-on-1       │ │ │
                │ │ │   Família + amigos      │ │ │
                │ │ └─────────────────────────┘ │ │
                │ └─────────────────────────────┘ │
                └─────────────────────────────────┘
                    ↓
                    Onda 4 — Público (jun/26, durante a Copa)
                    Expansão orgânica via viralidade dos primeiros
```

### 13.2. Onda 1 — Alfa íntimo (fev/26)

- **Quem:** 10-15 pessoas — família próxima (pais, irmãos, cônjuge), 3-5 amigos próximos com afinidade por futebol, 1-2 amigos com perfil "early adopter" técnico.
- **Como:** WhatsApp **1-on-1** (não em grupo). Conversa pessoal, explicando que está construindo um bolão e gostaria de input direto.
- **Onboarding:** convidar pra uma chamada de vídeo de 15min ANTES do uso pra apresentar o produto, e depois acompanhar a 1ª sessão deles juntos. Isso parece exagerado mas é o que separa alfa íntimo de beta. Você captura: confusão sobre parimutuel, fricções de UX invisíveis, expectativas incorretas.
- **Objetivo de aprendizado:** validar a **mecânica parimutuel** com gente real. Match coverage, ativação, drop-offs no onboarding.
- **Critério de sucesso desta onda:** todos os 10-15 conseguem fazer ao menos 3 apostas reais sem ajuda. Se < 70%, há fricção sistemática que precisa ser corrigida antes da onda 2.
- **Duração:** 4-6 semanas.

### 13.3. Onda 2 — Beta privado (mar-abr/26)

- **Quem:** 50-100 pessoas. Convidados pessoalmente pela onda 1 (alavancar referral) + ex-colegas profissionais selecionados.
- **Como:**
  - **Grupos de WhatsApp** existentes: turma da faculdade, grupo de futebol, grupo de família amplo (não só nuclear).
  - **LinkedIn:** post pessoal explicando o produto e abrindo beta. Resposta no privado pra controlar o fluxo.
  - **Referral nativo:** o sistema já dá +100 pts por convite, então os alfas começam a chamar outros naturalmente.
- **Objetivo de aprendizado:** validar **mecânica social** (ligas privadas, ranking, transparência de apostas). Métricas de viralidade (k-factor).
- **Critério de sucesso:** ≥50% dos convidados completam onboarding e apostam pelo menos 3x. Ao menos 10 ligas privadas criadas espontaneamente.
- **Duração:** 6-8 semanas.

### 13.4. Onda 3 — Soft launch público (mai/26)

- **Quem:** 200-500 pessoas. Beta + qualquer um que descubra organicamente.
- **Como:**
  - **Instagram stories** pessoais (seu, dos alfas, dos betas que toparam compartilhar).
  - **Grupos de WhatsApp ampliados:** grupos temáticos de futebol/bolão que você participa.
  - **Possível:** 1-2 microinfluencers de futebol (10k-50k seguidores) parceiros — combinar revenue share ou apenas brinde simbólico.
  - **Sem marketing pago ainda.**
- **Objetivo de aprendizado:** validar **escala operacional** (uptime, latência, suporte). Atrair perfis de usuário fora do círculo direto.
- **Critério de sucesso:** ativação ≥70% (north star do MVP); zero incidentes maiores; suporte gerenciável.
- **Duração:** 2 semanas antes do início da Copa.

### 13.5. Onda 4 — Público durante a Copa (jun-jul/26)

- **Quem:** quem chegar via viralidade dos primeiros.
- **Como:** convites espontâneos via referral + presença orgânica nas redes durante a Copa.
- **Objetivo:** crescimento de cadastros, retenção alta entre os ativos. Marketing pago só se ROI claro.
- **Foco operacional:** plantão durante jogos do Brasil, monitoramento intensivo, hotfixes.

### 13.6. Engajamento pré-Copa (cadastro → jogo de abertura)

O gap entre cadastro e primeiro jogo (potencialmente 2 meses) é o maior risco de churn. Estratégia:

- **Mercados de "bolão de grupo" disponíveis desde o início:** usuário pode apostar imediatamente em "quem vence o grupo X?", "vai chegar nas oitavas?" (futuro). Reduz a sensação de "cadastrei pra esperar 2 meses".
- **Comunicação cadenciada por e-mail (Resend):**
  - Imediato após signup: boas-vindas + tutorial de parimutuel
  - 7 dias: "Você ainda não apostou no grupo X. Olha as odds atuais."
  - 14 dias: "5 amigos seus já estão na sua liga — você está em qual posição?"
  - Semanal: ranking da liga + jogos da semana
  - 24h antes do 1º jogo do grupo: lembrete de cutoff
- **Notificações de cutoff:** 24h, 1h, e 5min antes do fechamento de cada mercado em que o usuário ainda não apostou.

### 13.7. Copy de convite (esqueleto inicial — refinar por onda)

**Alfa (WhatsApp 1-on-1):**
> "E aí, [nome]! Tô construindo um bolão da Copa diferente — em vez de cada um dar um palpite isolado, o app funciona tipo parimutuel: a odd de cada resultado vai mudando conforme o grupo aposta. Topa testar comigo antes do lançamento? Vou te explicar em 5min e a gente joga junto na fase de testes."

**Beta (WhatsApp em grupo):**
> "Galera, abri um beta privado do bolão da Copa 2026 que tô construindo. Mecânica nova (parimutuel — odd muda conforme o pool), liga privada pra grupo, ranking. Tem 1.000 pts grátis pra começar e premiação pra quem topar testar. Link: [URL]"

**Soft launch (Instagram story):**
> "🏆 Lançando o [Nome] — bolão da Copa 2026 com mecânica nova: as odds mudam conforme o grupo aposta. Crie sua liga privada, chame os amigos, e veja quem entende mais de futebol. Link na bio."

### 13.8. Métricas por onda

| Onda | Métricas principais | Decisão de promover pra próxima onda |
|---|---|---|
| 1 — Alfa | Match coverage individual, % que completou onboarding sem ajuda, qualidade do feedback escrito | ≥70% engajados, mecânica clara, sem bug bloqueador |
| 2 — Beta | K-factor, ligas criadas, ativação ≥50%, retenção D7 ≥30% | Viralidade > 0.3 e ativação ≥50% |
| 3 — Soft launch | Ativação ≥70%, north star ≥40%, zero incidentes | Sistema estável + UX validada |
| 4 — Público | Curva de crescimento, retenção, custo de aquisição (se houver) | Continuar monitorando, decidir investimento em marketing pago |

---

## 14. Glossário

- **Parimutuel**: sistema de apostas em que o pool de todas as apostas perdedoras é dividido entre os ganhadores proporcionalmente ao stake. Originalmente popularizado em corridas de cavalo.
- **Pool**: soma de stakes apostados em determinado mercado/resultado.
- **Odd implícita**: razão entre pool total e pool do resultado escolhido. Indica o multiplicador potencial.
- **Stake**: valor (em pontos) que o usuário decide arriscar em uma aposta.
- **Kickoff**: horário oficial do início do jogo. Momento de fechamento das apostas.
- **Settle / liquidação**: processo de pagar os ganhadores e finalizar o mercado após o jogo.
- **1X2**: mercado clássico — vitória mandante (1), empate (X), vitória visitante (2).
- **Mercado órfão**: mercado em que nenhuma aposta acertou o resultado. Política: refund integral.
- **RLS (Row Level Security)**: política de segurança no Postgres que filtra linhas visíveis por usuário autenticado.
- **Hedging**: apostar em múltiplos resultados do mesmo mercado para reduzir risco (ex: 100 pts no Brasil + 30 no empate).
- **Cutoff**: instante a partir do qual uma ação fica bloqueada. Cutoff de cancelamento = kickoff − 5min. Cutoff de aposta = kickoff.
- **Match Coverage**: north star metric. Percentual médio de jogos da Copa em que cada usuário ativo fez ao menos uma aposta.
- **K-factor**: medida de viralidade. Número médio de novos usuários trazidos por usuário ativo via convite/indicação.
- **DAU/MAU**: usuários ativos diários / mensais. Métrica clássica de engajamento.
- **Ativação**: % de cadastros que executam a ação central do produto (primeira aposta).
- **Retenção D7**: % de usuários novos que voltam ao app exatamente ou em torno do 7º dia após o cadastro.

---

*Documento vivo. Revisar ao final de cada fase do cronograma.*
