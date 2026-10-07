-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — Constraint unique em competitions.external_id
--
-- Necessária para upsert via Edge Functions (sync-competition-fixtures usa
-- onConflict: "external_id"). O equivalente já existe em matches.external_id
-- mas faltava em competitions.
--
-- Aplicar APÓS 0003_auto_create_markets.sql.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.competitions
  drop constraint if exists competitions_external_id_unique;

alter table public.competitions
  add constraint competitions_external_id_unique
  unique (external_id);
