-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — Auto-settle de jogos finalizados
--
-- Estratégia dupla:
--   1. Trigger ON UPDATE em matches → chama settle_match imediatamente quando
--      status muda pra 'finished' com placares preenchidos.
--   2. Cron backup a cada 5min → varre jogos finalizados com mercados ainda
--      abertos e tenta liquidar (caso o trigger tenha falhado por algum motivo).
--
-- Aplicar APÓS 0004_competitions_unique_external_id.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Trigger reativo ────────────────────────────────────────────────────

create or replace function public.auto_settle_on_finish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Só dispara na transição PARA 'finished' (não em re-syncs idempotentes)
  if (TG_OP = 'UPDATE'
      and NEW.status = 'finished'
      and (OLD.status is null or OLD.status <> 'finished')
      and NEW.home_score is not null
      and NEW.away_score is not null) then
    begin
      perform public.settle_match(NEW.id);
    exception
      -- Não bloqueia o update se settle falhar (backup cron resolve depois)
      when others then
        raise warning 'auto_settle_on_finish: settle_match falhou para match %: % %',
          NEW.id, sqlstate, sqlerrm;
    end;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_match_finished on public.matches;
create trigger on_match_finished
  after update on public.matches
  for each row execute function public.auto_settle_on_finish();

-- ─── 2. Função de backup pra cron ─────────────────────────────────────────

create or replace function public.auto_settle_pending()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
  v_count int := 0;
begin
  for v_match_id in
    select distinct m.id
    from public.matches m
    join public.bet_markets bm on bm.match_id = m.id and bm.is_settled = false
    where m.status = 'finished'
      and m.home_score is not null
      and m.away_score is not null
  loop
    begin
      perform public.settle_match(v_match_id);
      v_count := v_count + 1;
    exception
      when others then
        raise warning 'auto_settle_pending: settle_match falhou para match %: % %',
          v_match_id, sqlstate, sqlerrm;
    end;
  end loop;
  return v_count;
end;
$$;

grant execute on function public.auto_settle_pending() to postgres;

-- ─── 3. Cron backup a cada 5 minutos ──────────────────────────────────────

select cron.schedule(
  'auto-settle-backup',
  '*/5 * * * *',
  $$ select public.auto_settle_pending(); $$
);
