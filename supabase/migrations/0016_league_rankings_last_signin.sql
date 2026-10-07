-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — Adicionar last_signed_in_at ao ranking de liga
--
-- Permite ordenar membros por "atividade recente" na aba Membros e renderizar
-- apenas os top N mais ativos por padrão (com search pra encontrar os outros).
--
-- Aplicar APÓS 0015_global_league_only.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- DROP necessário porque CREATE OR REPLACE não muda return type
drop function if exists public.get_league_rankings(uuid);

create or replace function public.get_league_rankings(p_league_id uuid)
returns table (
  user_id uuid,
  nickname text,
  country_code text,
  avatar_url text,
  joined_at timestamptz,
  last_signed_in_at timestamptz,
  role text,
  net_points bigint,
  bets_total bigint,
  bets_won bigint,
  matches_bet_in bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    lm.user_id,
    p.nickname,
    p.country_code,
    p.avatar_url,
    lm.joined_at,
    u.last_sign_in_at as last_signed_in_at,
    lm.role,
    coalesce(sum(case
      when b.status = 'won' then b.payout - b.stake
      when b.status = 'lost' then -b.stake
      else 0
    end), 0)::bigint as net_points,
    count(b.id) filter (where b.status in ('won', 'lost'))::bigint as bets_total,
    count(b.id) filter (where b.status = 'won')::bigint as bets_won,
    count(distinct bm.match_id) filter (where bm.match_id is not null)::bigint as matches_bet_in
  from public.league_members lm
  join public.profiles p on p.id = lm.user_id
  left join auth.users u on u.id = lm.user_id
  left join public.bets b
    on b.user_id = lm.user_id
   and b.status in ('won', 'lost')
   and b.placed_at >= lm.joined_at
  left join public.bet_markets bm on bm.id = b.market_id
  where lm.league_id = p_league_id
    and lm.left_at is null
  group by lm.user_id, p.nickname, p.country_code, p.avatar_url,
           lm.joined_at, u.last_sign_in_at, lm.role
  order by net_points desc, lm.joined_at asc;
$$;

grant execute on function public.get_league_rankings(uuid) to authenticated, anon;
