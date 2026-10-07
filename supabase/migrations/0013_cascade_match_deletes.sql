-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — ON DELETE CASCADE nas FKs ligadas a matches
--
-- Permite `delete from matches` limpar bet_markets + bets + snapshots
-- automaticamente. Sem isso, cada limpeza requer ordem manual.
--
-- Idempotente: pode aplicar mesmo se as constraints já existem.
--
-- Aplicar APÓS 0012_knockout_double_payout.sql.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.bet_markets
  drop constraint if exists bet_markets_match_id_fkey,
  add constraint bet_markets_match_id_fkey
    foreign key (match_id) references public.matches(id) on delete cascade;

alter table public.bets
  drop constraint if exists bets_market_id_fkey,
  add constraint bets_market_id_fkey
    foreign key (market_id) references public.bet_markets(id) on delete cascade;

alter table public.bet_market_snapshots
  drop constraint if exists bet_market_snapshots_market_id_fkey,
  add constraint bet_market_snapshots_market_id_fkey
    foreign key (market_id) references public.bet_markets(id) on delete cascade;
