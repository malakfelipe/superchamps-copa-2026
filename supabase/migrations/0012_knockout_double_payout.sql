-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — Pote dobrado no mata-mata
--
-- Toda aposta vencedora em jogos de mata-mata (R32, R16, QF, SF, 3° lugar,
-- Final) paga DOBRO. O stake é debitado normalmente; o pool é calculado
-- normalmente; mas no payout do vencedor multiplica por 2x.
--
-- Resultado: incentivo extra para apostar no mata-mata e finais mais hype.
--
-- Pool órfão (refund) NÃO multiplica — só vencedor mesmo.
--
-- Aplicar APÓS 0011_league_ranking_joined_at_filter.sql.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.settle_market(
  p_market_id uuid,
  p_winning_outcome text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pool_total int := 0;
  v_pool_winning int := 0;
  v_pool_outcomes jsonb := '{}'::jsonb;
  v_odds jsonb := '{}'::jsonb;
  v_winner_count int := 0;
  v_total_payout int := 0;
  v_bet record;
  v_odd numeric(8,4);
  v_payout int;
  v_new_balance int;
  v_stage text;
  v_payout_multiplier numeric := 1.0;
begin
  -- 0. Detecta stage do match → mata-mata paga 2x
  select m.stage into v_stage
  from public.bet_markets bm
  join public.matches m on m.id = bm.match_id
  where bm.id = p_market_id;

  if v_stage in ('round_of_32', 'round_of_16', 'quarter', 'semi', 'third', 'final') then
    v_payout_multiplier := 2.0;
  end if;

  -- 1. Calcular pools por outcome (somente apostas open)
  select coalesce(jsonb_object_agg(outcome, total), '{}'::jsonb), coalesce(sum(total), 0)
    into v_pool_outcomes, v_pool_total
    from (
      select outcome, sum(stake)::int as total
      from public.bets
      where market_id = p_market_id and status = 'open'
      group by outcome
    ) g;

  -- Se ninguém apostou nada, só marca settled e sai
  if v_pool_total = 0 then
    update public.bet_markets
      set is_settled = true,
          winning_outcome = p_winning_outcome,
          settled_at = now()
      where id = p_market_id;
    return jsonb_build_object('pool_total', 0, 'winners', 0, 'payout', 0);
  end if;

  v_pool_winning := coalesce((v_pool_outcomes ->> p_winning_outcome)::int, 0);

  -- 2. Calcular odds finais (snapshot)
  select jsonb_object_agg(key, round(v_pool_total::numeric / nullif(value::numeric, 0), 4))
    into v_odds
    from jsonb_each(v_pool_outcomes);

  insert into public.bet_market_snapshots (market_id, taken_at, pools, odds)
    values (p_market_id, now(), v_pool_outcomes, v_odds);

  -- 3. Caso especial — pool órfão (ninguém acertou): refund de todas
  --    (NÃO multiplica por 2 — só vencedor paga dobro)
  if v_pool_winning = 0 then
    for v_bet in
      select * from public.bets where market_id = p_market_id and status = 'open' for update
    loop
      update public.bets
        set status = 'refunded',
            settled_at = now()
        where id = v_bet.id;

      update public.profiles
        set balance = balance + v_bet.stake
        where id = v_bet.user_id
        returning balance into v_new_balance;

      insert into public.wallet_transactions (
        user_id, amount, reason, related_bet_id, balance_after
      ) values (
        v_bet.user_id, v_bet.stake, 'bet_refunded', v_bet.id, v_new_balance
      );
    end loop;

    update public.bet_markets
      set is_settled = true,
          winning_outcome = p_winning_outcome,
          settled_at = now()
      where id = p_market_id;

    return jsonb_build_object(
      'pool_total', v_pool_total,
      'winners', 0,
      'orphan_refund', true,
      'refund_count', (select count(*) from public.bets where market_id = p_market_id and status = 'refunded')
    );
  end if;

  -- 4. Caminho normal — paga ganhadores (com multiplier), marca perdedores
  v_odd := v_pool_total::numeric / v_pool_winning;

  for v_bet in
    select * from public.bets where market_id = p_market_id and status = 'open' for update
  loop
    if v_bet.outcome = p_winning_outcome then
      -- AQUI: multiplica payout por v_payout_multiplier (2x em knockout, 1x em grupos)
      v_payout := floor(v_bet.stake * v_odd * v_payout_multiplier)::int;
      v_total_payout := v_total_payout + v_payout;
      v_winner_count := v_winner_count + 1;

      update public.bets
        set status = 'won',
            odd_at_settle = v_odd,
            payout = v_payout,
            settled_at = now()
        where id = v_bet.id;

      update public.profiles
        set balance = balance + v_payout
        where id = v_bet.user_id
        returning balance into v_new_balance;

      insert into public.wallet_transactions (
        user_id, amount, reason, related_bet_id, balance_after
      ) values (
        v_bet.user_id, v_payout, 'bet_won', v_bet.id, v_new_balance
      );
    else
      update public.bets
        set status = 'lost',
            odd_at_settle = v_odd,
            payout = 0,
            settled_at = now()
        where id = v_bet.id;
    end if;
  end loop;

  update public.bet_markets
    set is_settled = true,
        winning_outcome = p_winning_outcome,
        settled_at = now()
    where id = p_market_id;

  return jsonb_build_object(
    'pool_total', v_pool_total,
    'pool_winning', v_pool_winning,
    'odd', v_odd,
    'payout_multiplier', v_payout_multiplier,
    'winners', v_winner_count,
    'total_payout', v_total_payout
  );
end;
$$;
