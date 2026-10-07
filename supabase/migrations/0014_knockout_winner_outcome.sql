-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — G6: Mata-mata sem empate
--
-- Contexto: jogos do mata-mata SEMPRE têm vencedor (após prorrogação/penaltis).
-- A football-data.org retorna `score.winner` = HOME_TEAM | AWAY_TEAM | DRAW.
-- Pra knockout o winner reflete o vencedor final (incluindo penaltis).
--
-- Mudanças:
-- 1. Nova coluna `winner_outcome` em matches (home/away/draw/null)
-- 2. settle_match prefere winner_outcome quando setado (cobre penaltis)
-- 3. Pra knockout, se winner_outcome não foi setado e o jogo terminou empatado,
--    raise exception (não dá pra decidir vencedor)
-- 4. UI usa flag pra esconder opção "Empate" em jogos de mata-mata
--
-- Aplicar APÓS 0013_cascade_match_deletes.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Coluna pra armazenar vencedor real (após prorrogação/penaltis)
alter table public.matches
  add column if not exists winner_outcome text
    check (winner_outcome in ('home', 'away', 'draw') or winner_outcome is null);

comment on column public.matches.winner_outcome is
  'Vencedor final (após prorrogação/penaltis). Vem do score.winner da football-data. Em knockout, sempre home ou away. Em grupos, pode ser draw.';

-- 2. settle_match atualizado: prefere winner_outcome quando disponível
create or replace function public.settle_match(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match record;
  v_market record;
  v_result jsonb;
  v_results jsonb := '[]'::jsonb;
  v_winning_outcome text;
  v_is_knockout boolean;
begin
  select * into v_match from public.matches where id = p_match_id;
  if not found then
    raise exception 'match_not_found' using errcode = 'P0002';
  end if;
  if v_match.status <> 'finished' then
    raise exception 'match_not_finished (status=%)', v_match.status using errcode = '22023';
  end if;
  if v_match.home_score is null or v_match.away_score is null then
    raise exception 'scores_missing' using errcode = '22023';
  end if;

  v_is_knockout := v_match.stage in (
    'round_of_32', 'round_of_16', 'quarter', 'semi', 'third', 'final'
  );

  -- Itera todos os mercados não-settled deste jogo
  for v_market in
    select * from public.bet_markets where match_id = p_match_id and is_settled = false
  loop
    -- Determina winning_outcome por tipo de mercado
    if v_market.market_type = '1x2' then
      -- Prioriza winner_outcome (cobre penaltis em knockout)
      if v_match.winner_outcome is not null then
        v_winning_outcome := v_match.winner_outcome;
      else
        v_winning_outcome := case
          when v_match.home_score > v_match.away_score then 'home'
          when v_match.home_score < v_match.away_score then 'away'
          else 'draw'
        end;
      end if;

      -- Knockout: nunca pode ter draw. Se ainda assim, raise (dado inconsistente)
      if v_is_knockout and v_winning_outcome = 'draw' then
        raise exception 'knockout_draw_undecidable: match %, scores %-%, winner_outcome %',
          p_match_id, v_match.home_score, v_match.away_score, v_match.winner_outcome
          using errcode = '22023';
      end if;
    elsif v_market.market_type = 'exact_score' then
      v_winning_outcome := concat(v_match.home_score, '-', v_match.away_score);
    else
      continue;
    end if;

    v_result := public.settle_market(v_market.id, v_winning_outcome);
    v_results := v_results || jsonb_build_object(
      'market_id', v_market.id,
      'market_type', v_market.market_type,
      'winning_outcome', v_winning_outcome,
      'result', v_result
    );
  end loop;

  return jsonb_build_object(
    'match_id', p_match_id,
    'is_knockout', v_is_knockout,
    'markets_settled', v_results
  );
end;
$$;
