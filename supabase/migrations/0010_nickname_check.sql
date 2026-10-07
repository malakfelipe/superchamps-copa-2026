-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — RPC pra checar disponibilidade de nickname
--
-- Necessária pra validar nickname ANTES do signUp (senão o trigger
-- handle_new_user falha com 23505 unique violation e o user vê erro genérico
-- "Database error saving new user").
--
-- SECURITY DEFINER pra bypassar RLS (anonymous role pode chamar).
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.is_nickname_available(p_nickname text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1 from public.profiles
    where lower(nickname) = lower(trim(p_nickname))
  );
$$;

grant execute on function public.is_nickname_available(text) to anon, authenticated;
