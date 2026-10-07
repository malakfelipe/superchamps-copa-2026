-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — Preferências de notificação por user
--
-- Estrutura: jsonb em profiles. Default = todos os tipos "padrão" ativados.
-- Permite o user toggle preferences que ficam persistidas.
--
-- Aplicar APÓS 0018_referral_bonus_related_user.sql.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists notification_prefs jsonb not null default jsonb_build_object(
    'kickoff_reminder', true,
    'bet_settled', true,
    'league_activity', true,
    'daily_summary', false,
    'marketing', false,
    'channel_email', true
  );

comment on column public.profiles.notification_prefs is
  'Preferências de notificação por user. Keys: kickoff_reminder, bet_settled, league_activity, daily_summary, marketing, channel_email. Valores booleanos.';
