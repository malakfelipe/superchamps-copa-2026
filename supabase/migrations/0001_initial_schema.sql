-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — Schema Inicial
-- Referência: SPEC.md §6.2
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Aplicar:
--   1. Abrir Supabase Dashboard → seu projeto → SQL Editor → "New query"
--   2. Colar todo o conteúdo deste arquivo
--   3. Run (Ctrl+Enter)
--
-- Ordem das tabelas: dependências mais simples → mais complexas
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- Estende auth.users do Supabase Auth com campos do produto.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text unique not null,
  avatar_url text,
  country_code text,                                     -- ISO 2 letras: 'BR', 'AR'
  balance int not null default 1000 check (balance >= 0),
  referral_code text unique not null,                    -- ex: 'JOAO-A8B3'
  referred_by_user_id uuid references public.profiles(id),
  age_confirmed_at timestamptz not null,                 -- checkbox 18+ no cadastro
  terms_accepted_at timestamptz not null,                -- checkbox termos no cadastro
  public_bets_consent_at timestamptz not null,           -- checkbox LGPD-específico (transparência)
  onboarded_at timestamptz,
  email_verified_at timestamptz,
  nickname_last_changed_at timestamptz,
  bets_publicly_visible boolean not null default true,   -- kill switch admin (LGPD)
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_profiles_referral_code on public.profiles(referral_code);
create index idx_profiles_nickname on public.profiles(nickname);

-- ─── LEAGUES ─────────────────────────────────────────────────────────────────

create table public.leagues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  banner_url text,
  visibility text not null check (visibility in ('public', 'private', 'global')),
  invite_code text unique,                                -- null para liga global
  owner_id uuid not null references public.profiles(id),
  rules_text text,                                        -- regras adicionais do owner (texto livre)
  created_at timestamptz not null default now()
);

create index idx_leagues_visibility on public.leagues(visibility);
create index idx_leagues_invite_code on public.leagues(invite_code);

-- ─── LEAGUE_MEMBERS ──────────────────────────────────────────────────────────
-- Histórico de pertencimento: suporta entrar, sair, voltar.

create table public.league_members (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,                                    -- null = membership ativa
  exit_reason text check (exit_reason in ('voluntary', 'kicked', 'banned')),
  kicked_by_user_id uuid references public.profiles(id)
);

-- Apenas 1 membership ativa por (liga, usuário)
create unique index one_active_membership_per_user
  on public.league_members(league_id, user_id)
  where left_at is null;

create index idx_league_members_user on public.league_members(user_id) where left_at is null;
create index idx_league_members_league on public.league_members(league_id) where left_at is null;

-- ─── COMPETITIONS ────────────────────────────────────────────────────────────

create table public.competitions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,                                     -- 'Copa do Mundo 2026'
  external_id text,                                       -- id na API esportiva (football-data.org)
  external_source text not null default 'football-data', -- provedor
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'ongoing', 'finished', 'cancelled')),
  created_at timestamptz not null default now()
);

create index idx_competitions_status on public.competitions(status);

-- ─── MATCHES ─────────────────────────────────────────────────────────────────

create table public.matches (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references public.competitions(id),
  external_id text unique,
  home_team text not null,
  home_team_code text,                                    -- ISO 2 letras
  away_team text not null,
  away_team_code text,
  starts_at timestamptz not null,                         -- kickoff oficial
  status text not null check (status in ('scheduled', 'live', 'finished', 'cancelled', 'postponed')),
  stage text,                                             -- 'group_a', 'round_of_16', 'final', etc.
  venue text,
  home_score int,
  away_score int,
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_matches_status on public.matches(status);
create index idx_matches_starts_at on public.matches(starts_at);
create index idx_matches_competition on public.matches(competition_id);

-- ─── BET_MARKETS ─────────────────────────────────────────────────────────────
-- Polimórfico: pode ser de jogo (match_id preenchido) ou de grupo (match_id null).

create table public.bet_markets (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references public.competitions(id),
  match_id uuid references public.matches(id),            -- nullable: null para mercados de grupo
  market_type text not null check (market_type in ('1x2', 'exact_score', 'group_winner')),
  market_scope text not null,                             -- 'match:{match_id}' ou 'group:GROUP_A'
  closes_at timestamptz not null,                         -- kickoff do jogo OU 1º jogo do grupo
  is_settled boolean not null default false,
  winning_outcome text,
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_bet_markets_match on public.bet_markets(match_id);
create index idx_bet_markets_competition on public.bet_markets(competition_id);
create index idx_bet_markets_closes_at on public.bet_markets(closes_at);
create index idx_bet_markets_is_settled on public.bet_markets(is_settled);

-- ─── BETS ────────────────────────────────────────────────────────────────────

create table public.bets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  market_id uuid not null references public.bet_markets(id),
  outcome text not null,                                  -- 'home', 'draw', 'away', '2-1', team_id
  stake int not null check (stake >= 10),
  odd_at_settle numeric(8,4),                             -- preenchido no kickoff
  status text not null default 'open' check (status in ('open', 'won', 'lost', 'refunded', 'cancelled')),
  payout int,                                             -- preenchido no settle (ou 0 se perdeu)
  placed_at timestamptz not null default now(),
  cancelled_at timestamptz,
  settled_at timestamptz
);

-- Nota: hedging permitido → SEM unique constraint em (user_id, market_id, outcome).
create index idx_bets_user on public.bets(user_id);
create index idx_bets_market on public.bets(market_id);
create index idx_bets_status on public.bets(status);
create index idx_bets_placed_at on public.bets(placed_at);

-- ─── BET_MARKET_SNAPSHOTS ────────────────────────────────────────────────────
-- Snapshot dos pools/odds no momento do kickoff (audit trail + base do settle).

create table public.bet_market_snapshots (
  id uuid primary key default uuid_generate_v4(),
  market_id uuid not null references public.bet_markets(id),
  taken_at timestamptz not null default now(),
  pools jsonb not null,                                   -- {'home': 1200, 'draw': 800, 'away': 500}
  odds jsonb not null                                     -- {'home': 2.08, 'draw': 3.12, 'away': 5.00}
);

create index idx_snapshots_market on public.bet_market_snapshots(market_id);

-- ─── WALLET_TRANSACTIONS ─────────────────────────────────────────────────────

create table public.wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null,                                    -- positivo ou negativo
  reason text not null check (reason in (
    'signup_bonus',                                       -- +1000 no cadastro
    'bet_placed',                                         -- débito ao apostar
    'bet_won',                                            -- crédito ao acertar
    'bet_refunded',                                       -- refund (cancelamento / pool órfão)
    'referral_bonus',                                     -- +100 ao indicar amigo
    'low_balance_boost',                                  -- +50 daily se saldo < 10
    'competition_end_reset',                              -- ajuste para voltar a 1000
    'admin_adjust'                                        -- ajuste manual via painel admin
  )),
  related_bet_id uuid references public.bets(id),
  related_competition_id uuid references public.competitions(id),
  balance_after int not null,
  created_at timestamptz not null default now()
);

create index idx_wallet_user_created on public.wallet_transactions(user_id, created_at desc);
create index idx_wallet_reason on public.wallet_transactions(reason);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — Políticas básicas
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.competitions enable row level security;
alter table public.matches enable row level security;
alter table public.bet_markets enable row level security;
alter table public.bets enable row level security;
alter table public.bet_market_snapshots enable row level security;
alter table public.wallet_transactions enable row level security;

-- PROFILES: leitura pública dos campos não sensíveis (transparência), update só do próprio
create policy "Profiles são visíveis publicamente"
  on public.profiles for select using (true);

create policy "Usuário pode criar próprio profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Usuário só atualiza próprio perfil"
  on public.profiles for update using (auth.uid() = id);

-- LEAGUES: públicas e globais visíveis a todos; privadas só a membros
create policy "Ligas públicas/globais são visíveis"
  on public.leagues for select
  using (visibility in ('public', 'global') or owner_id = auth.uid()
         or exists (select 1 from public.league_members lm
                    where lm.league_id = id and lm.user_id = auth.uid() and lm.left_at is null));

create policy "Usuário cria suas próprias ligas"
  on public.leagues for insert with check (owner_id = auth.uid());

create policy "Owner atualiza própria liga"
  on public.leagues for update using (owner_id = auth.uid());

-- LEAGUE_MEMBERS: visível para outros membros da mesma liga
create policy "Membros visíveis na própria liga"
  on public.league_members for select
  using (
    exists (select 1 from public.league_members self
            where self.league_id = league_id
            and self.user_id = auth.uid()
            and self.left_at is null)
  );

create policy "Usuário se cadastra em liga"
  on public.league_members for insert with check (user_id = auth.uid());

-- COMPETITIONS, MATCHES: leitura pública
create policy "Competições visíveis a todos" on public.competitions for select using (true);
create policy "Jogos visíveis a todos" on public.matches for select using (true);

-- BET_MARKETS: leitura pública
create policy "Mercados visíveis a todos" on public.bet_markets for select using (true);

-- BETS: visível ao próprio usuário sempre; aos outros apenas quando finalizada
create policy "Bets próprias sempre visíveis"
  on public.bets for select using (user_id = auth.uid());

create policy "Bets finalizadas são públicas (transparência)"
  on public.bets for select
  using (
    status in ('won', 'lost', 'refunded', 'cancelled')
    and exists (
      select 1 from public.profiles p
      where p.id = bets.user_id and p.bets_publicly_visible = true
    )
  );

-- Insert/update de bets: SOMENTE via Edge Function com service_role.
-- (não criar policy de insert/update — bloqueado por default com RLS)

-- BET_MARKET_SNAPSHOTS: leitura pública (audit)
create policy "Snapshots visíveis a todos" on public.bet_market_snapshots for select using (true);

-- WALLET_TRANSACTIONS: só o próprio usuário lê
create policy "Wallet só visível ao próprio usuário"
  on public.wallet_transactions for select using (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- HELPERS — Funções utilitárias
-- ═══════════════════════════════════════════════════════════════════════════

-- Gera um referral_code curto e único (formato: NAME-XXXX)
create or replace function public.generate_referral_code(nickname_input text)
returns text
language plpgsql
as $$
declare
  prefix text;
  suffix text;
  candidate text;
  counter int := 0;
begin
  prefix := upper(regexp_replace(nickname_input, '[^a-zA-Z0-9]', '', 'g'));
  if length(prefix) < 3 then
    prefix := lpad(prefix, 3, 'X');
  end if;
  prefix := substring(prefix from 1 for 8);

  loop
    -- 4 chars alfanuméricos
    suffix := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 4));
    candidate := prefix || '-' || suffix;

    -- check uniqueness
    if not exists (select 1 from public.profiles where referral_code = candidate) then
      return candidate;
    end if;

    counter := counter + 1;
    if counter > 10 then
      raise exception 'Não foi possível gerar referral_code único';
    end if;
  end loop;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIM
-- ═══════════════════════════════════════════════════════════════════════════
