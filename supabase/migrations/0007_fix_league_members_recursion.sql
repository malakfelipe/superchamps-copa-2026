-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — Fix de recursão infinita na policy de league_members
--
-- Problema: a policy SELECT consultava a própria tabela league_members,
-- causando "infinite recursion detected in policy for relation".
--
-- Solução: usuário só vê a própria membership via SELECT direto.
-- A visualização de outros membros (ranking) passa por get_league_rankings()
-- que é SECURITY DEFINER (bypassa RLS).
--
-- Aplicar APÓS 0006_league_rankings.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- Remove a policy recursiva antiga (qualquer que seja o nome)
do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'league_members' and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.league_members', v_policy.policyname);
  end loop;
end $$;

-- Policy simples: o user só vê suas próprias memberships
create policy "User vê própria membership"
  on public.league_members for select
  using (user_id = auth.uid());

-- INSERT policy continua igual (user só insere própria membership)
-- (já existe; idempotente)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'league_members' and cmd = 'INSERT'
  ) then
    create policy "User insere própria membership"
      on public.league_members for insert
      with check (user_id = auth.uid());
  end if;
end $$;
