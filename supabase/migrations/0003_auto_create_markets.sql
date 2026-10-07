-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — Auto-criar bet_markets quando um match é inserido
--
-- Toda vez que um novo jogo entra (via sync-competition-fixtures ou manual),
-- cria automaticamente 2 mercados: 1X2 e placar exato.
--
-- Aplicar APÓS 0002_business_functions.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Garantir unicidade (match_id, market_type) — evita duplicatas em re-syncs
alter table public.bet_markets
  drop constraint if exists bet_markets_match_type_unique;

alter table public.bet_markets
  add constraint bet_markets_match_type_unique unique (match_id, market_type);

-- 2. Função que cria os 2 mercados padrão
create or replace function public.create_match_markets()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Apenas para jogos (não para mercados de competição como "campeão do grupo")
  insert into public.bet_markets (competition_id, match_id, market_type, market_scope, closes_at)
  values
    (new.competition_id, new.id, '1x2',         'match:' || new.id, new.starts_at),
    (new.competition_id, new.id, 'exact_score', 'match:' || new.id, new.starts_at)
  on conflict (match_id, market_type) do nothing;
  return new;
end;
$$;

-- 3. Trigger
drop trigger if exists on_match_inserted on public.matches;
create trigger on_match_inserted
  after insert on public.matches
  for each row execute function public.create_match_markets();

-- 4. Backfill: cria mercados pra jogos que já existem sem mercado
insert into public.bet_markets (competition_id, match_id, market_type, market_scope, closes_at)
select m.competition_id, m.id, '1x2', 'match:' || m.id, m.starts_at
from public.matches m
where not exists (
  select 1 from public.bet_markets bm
  where bm.match_id = m.id and bm.market_type = '1x2'
)
on conflict do nothing;

insert into public.bet_markets (competition_id, match_id, market_type, market_scope, closes_at)
select m.competition_id, m.id, 'exact_score', 'match:' || m.id, m.starts_at
from public.matches m
where not exists (
  select 1 from public.bet_markets bm
  where bm.match_id = m.id and bm.market_type = 'exact_score'
)
on conflict do nothing;
