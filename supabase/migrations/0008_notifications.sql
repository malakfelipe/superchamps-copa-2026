-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — Sistema de notificações
--
-- Tabela + RLS + trigger automático ao liquidar bet (bet_won/bet_lost/refunded)
-- + RPC mark_notifications_read pra Action de marcar como lida.
--
-- Aplicar APÓS 0007_fix_league_members_recursion.sql.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'bet_won', 'bet_lost', 'bet_refunded', 'league_invite',
    'referral_joined', 'low_balance_boost', 'kickoff_reminder',
    'competition_end'
  )),
  title text not null,
  message text not null,
  link text,
  unread boolean not null default true,
  related_bet_id uuid references public.bets(id) on delete cascade,
  related_league_id uuid references public.leagues(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, unread, created_at desc);

alter table public.notifications enable row level security;

-- ─── RLS ──────────────────────────────────────────────────────────────────

drop policy if exists "User vê próprias notificações" on public.notifications;
create policy "User vê próprias notificações"
  on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "User atualiza próprias notificações" on public.notifications;
create policy "User atualiza próprias notificações"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Trigger: cria notificação ao liquidar bet ────────────────────────────

create or replace function public.create_bet_settled_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_home text;
  v_away text;
  v_match_id uuid;
  v_home_score int;
  v_away_score int;
  v_title text;
  v_message text;
  v_link text;
  v_type text;
begin
  -- Só dispara quando muda DE 'open' PARA estados finais
  if not (TG_OP = 'UPDATE'
      and OLD.status = 'open'
      and NEW.status in ('won', 'lost', 'refunded')) then
    return NEW;
  end if;

  -- Busca info do match via market
  select m.home_team, m.away_team, m.id, m.home_score, m.away_score
    into v_home, v_away, v_match_id, v_home_score, v_away_score
  from public.bet_markets bm
  join public.matches m on m.id = bm.match_id
  where bm.id = NEW.market_id;

  v_link := '/jogos/' || v_match_id::text;

  if NEW.status = 'won' then
    v_type := 'bet_won';
    v_title := 'Você acertou ' || v_home || ' × ' || v_away;
    v_message := 'Levou ' || coalesce(NEW.payout, 0) || ' pts com odd '
                  || round(coalesce(NEW.odd_at_settle, 1.0), 2) || 'x';
  elsif NEW.status = 'lost' then
    v_type := 'bet_lost';
    v_title := 'Não foi dessa: ' || v_home || ' × ' || v_away;
    v_message := 'Aposta de ' || NEW.stake || ' pts encerrada'
                  || case when v_home_score is not null
                    then ' · placar ' || v_home_score || '-' || v_away_score
                    else '' end;
  else
    v_type := 'bet_refunded';
    v_title := 'Aposta reembolsada';
    v_message := 'Você recebeu de volta ' || NEW.stake || ' pts em '
                  || v_home || ' × ' || v_away;
  end if;

  insert into public.notifications (
    user_id, type, title, message, link, related_bet_id
  ) values (
    NEW.user_id, v_type, v_title, v_message, v_link, NEW.id
  );

  return NEW;
end;
$$;

drop trigger if exists on_bet_settled on public.bets;
create trigger on_bet_settled
  after update on public.bets
  for each row execute function public.create_bet_settled_notification();

-- ─── RPC: marca notificações como lidas ───────────────────────────────────

create or replace function public.mark_notifications_read(
  p_notification_ids uuid[] default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  if p_notification_ids is null or array_length(p_notification_ids, 1) is null then
    -- null = marca TODAS as não lidas do user como lidas
    with upd as (
      update public.notifications
        set unread = false
      where user_id = auth.uid() and unread = true
      returning 1
    )
    select count(*)::int into v_count from upd;
  else
    with upd as (
      update public.notifications
        set unread = false
      where user_id = auth.uid()
        and unread = true
        and id = any(p_notification_ids)
      returning 1
    )
    select count(*)::int into v_count from upd;
  end if;
  return v_count;
end;
$$;

grant execute on function public.mark_notifications_read(uuid[]) to authenticated;
