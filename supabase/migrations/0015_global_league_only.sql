-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — G1: Eliminar criação de ligas públicas + Liga Global única
--
-- Decisão de produto:
--   - User só cria ligas PRIVADAS (com invite_code).
--   - Existe UMA "Liga Global SuperChamps" (visibility='global').
--   - Todo signup vira member automático da Global.
--
-- Mudanças:
--   1. Converte ligas existentes com visibility='public' → 'private'
--   2. Drop o check antigo, recria sem 'public'
--   3. Constraint: apenas uma liga 'global' pode existir
--   4. Cria a Liga Global (owner = primeiro user; se não tem user, pula)
--   5. Atualiza handle_new_user pra auto-add member na Global
--   6. Backfill: todos os users existentes viram members da Global
--
-- Aplicar APÓS 0014_knockout_winner_outcome.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Converte ligas públicas existentes pra privadas (preserva owners + members)
update public.leagues set visibility = 'private' where visibility = 'public';

-- 2. Drop o check antigo
alter table public.leagues drop constraint if exists leagues_visibility_check;

-- 3. Adiciona check novo (apenas private e global)
alter table public.leagues add constraint leagues_visibility_check
  check (visibility in ('private', 'global'));

-- 4. Apenas UMA liga global pode existir (partial unique index)
create unique index if not exists one_global_league
  on public.leagues ((visibility)) where visibility = 'global';

-- 5. Cria a Liga Global (idempotente — só se ainda não existe)
do $$
declare
  v_owner_id uuid;
  v_global_id uuid;
begin
  -- Já existe?
  select id into v_global_id from public.leagues where visibility = 'global' limit 1;
  if v_global_id is not null then
    raise notice 'Liga Global já existe (id=%)', v_global_id;
    return;
  end if;

  -- Pega o owner: primeiro user disponível. Em prod com seed: substituir por user
  -- de sistema dedicado (admin@superchamps.com.br por exemplo).
  select id into v_owner_id from public.profiles order by created_at limit 1;
  if v_owner_id is null then
    raise notice 'Sem users no banco. Liga Global não criada — vai ser criada quando o primeiro user assinar.';
    return;
  end if;

  insert into public.leagues (
    name, slug, description, visibility, owner_id, invite_code, rules_text
  ) values (
    'Liga Global SuperChamps',
    'global',
    'Liga padrão com todos os usuários. Ranking universal — você compete com a comunidade inteira.',
    'global',
    v_owner_id,
    null,
    'Todo usuário cadastrado entra automaticamente. Não tem como sair desta liga. Saldo e cap de aposta seguem as regras gerais do app.'
  );

  raise notice 'Liga Global criada com owner=%', v_owner_id;
end $$;

-- 6. Backfill: adiciona todos os users existentes como members da Global
do $$
declare
  v_global_id uuid;
  v_count int := 0;
begin
  select id into v_global_id from public.leagues where visibility = 'global' limit 1;
  if v_global_id is null then
    raise notice 'Backfill pulado: Liga Global não existe ainda';
    return;
  end if;

  insert into public.league_members (league_id, user_id, role, joined_at)
  select v_global_id, p.id, 'member', p.created_at
  from public.profiles p
  where not exists (
    select 1 from public.league_members lm
    where lm.league_id = v_global_id
      and lm.user_id = p.id
      and lm.left_at is null
  )
  on conflict do nothing;

  get diagnostics v_count = row_count;
  raise notice 'Backfill: % users adicionados à Liga Global', v_count;
end $$;

-- 7. Atualiza handle_new_user pra auto-add na Liga Global
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nickname text;
  v_ref_code text;
  v_referral_input text;
  v_referrer_id uuid;
  v_global_id uuid;
begin
  v_nickname := coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1));
  v_ref_code := public.generate_referral_code(v_nickname);

  -- Resolve referrer pelo código
  v_referral_input := upper(trim(coalesce(new.raw_user_meta_data->>'referral_code', '')));
  if v_referral_input <> '' then
    select id into v_referrer_id
    from public.profiles
    where upper(referral_code) = v_referral_input
    limit 1;
  end if;

  insert into public.profiles (
    id, nickname, referral_code, referred_by_user_id,
    age_confirmed_at, terms_accepted_at, public_bets_consent_at
  )
  values (
    new.id, v_nickname, v_ref_code, v_referrer_id,
    now(), now(), now()
  )
  on conflict (id) do nothing;

  -- Auto-join na Liga Global (se ela existe)
  select id into v_global_id from public.leagues where visibility = 'global' limit 1;
  if v_global_id is not null then
    insert into public.league_members (league_id, user_id, role)
    values (v_global_id, new.id, 'member')
    on conflict do nothing;
  end if;

  return new;
end;
$$;
