-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — Business Functions (place_bet, cancel_bet, settle_match,
--                                    apply_low_balance_boost, etc.)
--
-- Aplicar APÓS 0001_initial_schema.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── EXTENSÕES NECESSÁRIAS ──────────────────────────────────────────────────

-- pg_cron pra agendar jobs (já vem habilitado em projetos Supabase Pro;
-- em Free precisa habilitar via Dashboard → Database → Extensions)
-- create extension if not exists pg_cron;

-- pg_net pra fazer HTTP calls a partir do banco (necessário pros cron jobs
-- invocarem Edge Functions)
-- create extension if not exists pg_net;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. place_bet — Cria uma aposta de forma atômica
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.place_bet(
  p_market_id uuid,
  p_outcome text,
  p_stake int
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance int;
  v_market record;
  v_bet_id uuid;
  v_new_balance int;
  v_last_bet_ts timestamptz;
begin
  if v_user_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  -- 1. Validar stake mínimo
  if p_stake < 10 then
    raise exception 'stake_below_minimum (mínimo 10 pts)' using errcode = '22023';
  end if;

  -- 2. Lock no profile pra evitar race condition com saldo
  select balance into v_balance from public.profiles
    where id = v_user_id for update;
  if v_balance is null then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  -- 3. Validar saldo + stake máximo de 50% do saldo
  if p_stake > v_balance then
    raise exception 'insufficient_balance' using errcode = '22023';
  end if;
  if p_stake > floor(v_balance * 0.5) then
    raise exception 'stake_above_50_percent' using errcode = '22023';
  end if;

  -- 4. Validar mercado aberto
  select * into v_market from public.bet_markets where id = p_market_id;
  if not found then
    raise exception 'market_not_found' using errcode = 'P0002';
  end if;
  if v_market.is_settled then
    raise exception 'market_already_settled' using errcode = '22023';
  end if;
  if v_market.closes_at <= now() then
    raise exception 'market_closed (after kickoff)' using errcode = '22023';
  end if;

  -- 5. Cooldown anti double-click (1 segundo no mesmo mercado)
  select max(placed_at) into v_last_bet_ts
    from public.bets
    where user_id = v_user_id and market_id = p_market_id;
  if v_last_bet_ts is not null and v_last_bet_ts > now() - interval '1 second' then
    raise exception 'cooldown_active' using errcode = '22023';
  end if;

  -- 6. Tudo OK — em transação: debita saldo, insere bet, insere wallet_tx
  v_new_balance := v_balance - p_stake;

  update public.profiles set balance = v_new_balance where id = v_user_id;

  insert into public.bets (user_id, market_id, outcome, stake, status, placed_at)
    values (v_user_id, p_market_id, p_outcome, p_stake, 'open', now())
    returning id into v_bet_id;

  insert into public.wallet_transactions (
    user_id, amount, reason, related_bet_id, balance_after
  ) values (
    v_user_id, -p_stake, 'bet_placed', v_bet_id, v_new_balance
  );

  return v_bet_id;
end;
$$;

grant execute on function public.place_bet(uuid, text, int) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. cancel_bet — Cancela aposta até 5 min antes do kickoff
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.cancel_bet(p_bet_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_bet record;
  v_market record;
  v_new_balance int;
begin
  if v_user_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  -- 1. Lock na bet
  select * into v_bet from public.bets where id = p_bet_id for update;
  if not found then
    raise exception 'bet_not_found' using errcode = 'P0002';
  end if;
  if v_bet.user_id <> v_user_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_bet.status <> 'open' then
    raise exception 'bet_not_open' using errcode = '22023';
  end if;

  -- 2. Validar cutoff: até 5 min antes do kickoff (closes_at do market)
  select * into v_market from public.bet_markets where id = v_bet.market_id;
  if v_market.closes_at - interval '5 minutes' <= now() then
    raise exception 'cancellation_cutoff_passed' using errcode = '22023';
  end if;

  -- 3. Refund: marca bet como cancelled, credita saldo, registra tx
  update public.bets
    set status = 'cancelled', cancelled_at = now()
    where id = p_bet_id;

  update public.profiles
    set balance = balance + v_bet.stake
    where id = v_user_id
    returning balance into v_new_balance;

  insert into public.wallet_transactions (
    user_id, amount, reason, related_bet_id, balance_after
  ) values (
    v_user_id, v_bet.stake, 'bet_refunded', p_bet_id, v_new_balance
  );
end;
$$;

grant execute on function public.cancel_bet(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. settle_market — Liquida UM mercado (interno, chamado por settle_match)
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
begin
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

  -- 4. Caminho normal — paga ganhadores, marca perdedores
  v_odd := v_pool_total::numeric / v_pool_winning;

  for v_bet in
    select * from public.bets where market_id = p_market_id and status = 'open' for update
  loop
    if v_bet.outcome = p_winning_outcome then
      v_payout := floor(v_bet.stake * v_odd)::int;
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
      -- Nenhuma wallet_transaction — stake já foi debitado no place_bet
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
    'winners', v_winner_count,
    'total_payout', v_total_payout
  );
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. settle_match — Liquida TODOS os mercados de um jogo finalizado
-- ═══════════════════════════════════════════════════════════════════════════

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

  -- Itera todos os mercados não-settled deste jogo
  for v_market in
    select * from public.bet_markets where match_id = p_match_id and is_settled = false
  loop
    -- Determina winning_outcome por tipo de mercado
    if v_market.market_type = '1x2' then
      v_winning_outcome := case
        when v_match.home_score > v_match.away_score then 'home'
        when v_match.home_score < v_match.away_score then 'away'
        else 'draw'
      end;
    elsif v_market.market_type = 'exact_score' then
      v_winning_outcome := concat(v_match.home_score, '-', v_match.away_score);
    else
      -- Outros mercados (group_winner etc.): pula, requer settle manual
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

  return jsonb_build_object('match_id', p_match_id, 'markets_settled', v_results);
end;
$$;

grant execute on function public.settle_match(uuid) to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. apply_low_balance_boost — Daily cron job
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.apply_low_balance_boost(
  p_threshold int default 10,
  p_amount int default 50
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_new_balance int;
  v_count int := 0;
begin
  for v_profile in
    select id from public.profiles
    where balance < p_threshold and is_banned = false
    for update
  loop
    update public.profiles
      set balance = balance + p_amount
      where id = v_profile.id
      returning balance into v_new_balance;

    insert into public.wallet_transactions (
      user_id, amount, reason, balance_after
    ) values (
      v_profile.id, p_amount, 'low_balance_boost', v_new_balance
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.apply_low_balance_boost(int, int) to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. reset_competition_balances — Final de cada competição (24h após a final)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.reset_competition_balances(
  p_competition_id uuid,
  p_new_balance int default 1000
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_delta int;
  v_count int := 0;
  v_competition record;
begin
  select * into v_competition from public.competitions where id = p_competition_id;
  if not found then
    raise exception 'competition_not_found' using errcode = 'P0002';
  end if;
  if v_competition.status <> 'finished' then
    raise exception 'competition_not_finished' using errcode = '22023';
  end if;

  -- Verifica se todos os jogos estão settled
  if exists (
    select 1 from public.matches
    where competition_id = p_competition_id
      and status not in ('finished', 'cancelled')
  ) then
    raise exception 'matches_still_pending' using errcode = '22023';
  end if;

  for v_profile in
    select id, balance from public.profiles where is_banned = false for update
  loop
    v_delta := p_new_balance - v_profile.balance;
    if v_delta = 0 then continue; end if;

    update public.profiles
      set balance = p_new_balance
      where id = v_profile.id;

    insert into public.wallet_transactions (
      user_id, amount, reason, related_competition_id, balance_after
    ) values (
      v_profile.id, v_delta, 'competition_end_reset', p_competition_id, p_new_balance
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.reset_competition_balances(uuid, int) to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. CRON JOBS (descomente após habilitar pg_cron + pg_net no Dashboard)
-- ═══════════════════════════════════════════════════════════════════════════

-- Pré-requisito: configurar settings com URL e service_role do projeto
--   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://SEU_REF.supabase.co';
--   ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJ...';
-- Depois recarregar com: SELECT pg_reload_conf();

-- Helper pra invocar Edge Function via pg_net
create or replace function public.invoke_edge_function(p_name text, p_body jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
as $$
declare
  v_url text;
  v_key text;
  v_request_id bigint;
begin
  v_url := current_setting('app.settings.supabase_url', true);
  v_key := current_setting('app.settings.service_role_key', true);
  if v_url is null or v_key is null then
    raise notice 'app.settings.supabase_url ou app.settings.service_role_key não configurados';
    return null;
  end if;
  select net.http_post(
    url := v_url || '/functions/v1/' || p_name,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_key,
      'Content-Type', 'application/json'
    ),
    body := p_body
  ) into v_request_id;
  return v_request_id;
end;
$$;

-- Agendamentos (descomente após configurar settings + extensões)

-- Daily: sync de fixtures da Copa às 06:00 BRT (09:00 UTC)
-- select cron.schedule(
--   'sync-competition-fixtures',
--   '0 9 * * *',
--   $$ select public.invoke_edge_function('sync-competition-fixtures'); $$
-- );

-- A cada 60s durante a Copa: sync de placares ao vivo
-- (idealmente filtrar pra janelas onde há jogo — esse é o caso simples)
-- select cron.schedule(
--   'sync-live-scores',
--   '* * * * *',  -- a cada 1 min
--   $$ select public.invoke_edge_function('sync-live-scores'); $$
-- );

-- Daily 06:00 BRT (09:00 UTC): boost de saldo baixo
-- select cron.schedule(
--   'low-balance-boost',
--   '0 9 * * *',
--   $$ select public.invoke_edge_function('low-balance-boost'); $$
-- );

-- ═══════════════════════════════════════════════════════════════════════════
-- FIM
-- ═══════════════════════════════════════════════════════════════════════════
