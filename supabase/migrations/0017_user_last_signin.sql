-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — RPC pra ler last_sign_in_at de auth.users
--
-- auth.users é protegido por RLS. Pra exibir "Último login: há 2h" no perfil
-- público, criamos um helper SECURITY DEFINER (não vaza outros dados sensíveis).
--
-- Aplicar APÓS 0016_league_rankings_last_signin.sql.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_user_last_sign_in(p_user_id uuid)
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select last_sign_in_at from auth.users where id = p_user_id;
$$;

grant execute on function public.get_user_last_sign_in(uuid) to authenticated, anon;
