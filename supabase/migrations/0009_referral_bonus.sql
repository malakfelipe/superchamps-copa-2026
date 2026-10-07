-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — Sistema de indicação (referral) completo
--
-- Regra: convidado se cadastra usando o código do referrer → referrer ganha
-- 50 pts. Limite: 5 indicações premiadas por user (max 250 pts).
--
-- 1. handle_new_user agora resolve referral_code → referred_by_user_id
-- 2. handle_referral_bonus credita 50 pts ao referrer ao criar profile
-- 3. Backfill: tenta resolver referrals já passados que ficaram pendentes
--
-- Aplicar APÓS 0008_notifications.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Update handle_new_user: resolve referrer ─────────────────────────

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
begin
  v_nickname := coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1));
  v_ref_code := public.generate_referral_code(v_nickname);

  -- Resolve referrer pelo código (case-insensitive, com trim)
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

  return new;
end;
$$;

-- ─── 2. Trigger de bônus ao criar profile com referrer ───────────────────

create or replace function public.handle_referral_bonus()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_awarded int;
  v_new_balance int;
begin
  if NEW.referred_by_user_id is null then
    return NEW;
  end if;

  -- Quantas indicações esse referrer JÁ recebeu bônus por?
  -- (conta via wallet_transactions pra evitar race condition)
  select count(*) into v_already_awarded
  from public.wallet_transactions
  where user_id = NEW.referred_by_user_id
    and reason = 'referral_bonus';

  if v_already_awarded >= 5 then
    -- Atingiu o limite. Cria notificação informativa sem premiar.
    insert into public.notifications (user_id, type, title, message, link)
    values (
      NEW.referred_by_user_id,
      'referral_joined',
      'Outro amigo se cadastrou!',
      'Limite de 5 indicações premiadas atingido. Obrigado por trazer a galera.',
      '/perfil/indicar'
    );
    return NEW;
  end if;

  -- Credita 50 pts no referrer
  update public.profiles
  set balance = balance + 50
  where id = NEW.referred_by_user_id
  returning balance into v_new_balance;

  insert into public.wallet_transactions (user_id, amount, reason, balance_after)
  values (NEW.referred_by_user_id, 50, 'referral_bonus', v_new_balance);

  -- Notifica
  insert into public.notifications (user_id, type, title, message, link)
  values (
    NEW.referred_by_user_id,
    'referral_joined',
    'Alguém entrou usando seu código! 🎉',
    'Você ganhou 50 pts. Indicações premiadas: ' || (v_already_awarded + 1) || '/5',
    '/perfil/indicar'
  );

  return NEW;
end;
$$;

drop trigger if exists on_referral_signup on public.profiles;
create trigger on_referral_signup
  after insert on public.profiles
  for each row execute function public.handle_referral_bonus();

-- ─── 3. Backfill: tenta resolver indicações passadas ─────────────────────
-- (a) Atualiza profiles que tinham referral_code no auth.users mas
--     ficaram com referred_by_user_id null por causa do bug antigo
update public.profiles p
set referred_by_user_id = referrer.id
from auth.users u
join public.profiles referrer
  on upper(referrer.referral_code) = upper(trim(u.raw_user_meta_data->>'referral_code'))
where p.id = u.id
  and p.referred_by_user_id is null
  and u.raw_user_meta_data->>'referral_code' is not null
  and trim(u.raw_user_meta_data->>'referral_code') <> ''
  and referrer.id <> p.id;  -- não pode ser self-referral

-- (b) Pra cada profile com referrer mas sem bonus registrado, credita agora
--    (respeitando cap de 5)
do $$
declare
  v_profile record;
  v_count int;
  v_balance int;
begin
  for v_profile in
    select p.id, p.referred_by_user_id
    from public.profiles p
    where p.referred_by_user_id is not null
      and not exists (
        select 1 from public.wallet_transactions wt
        where wt.user_id = p.referred_by_user_id
          and wt.reason = 'referral_bonus'
          and wt.created_at >= p.created_at
      )
    order by p.created_at
  loop
    select count(*) into v_count
    from public.wallet_transactions
    where user_id = v_profile.referred_by_user_id
      and reason = 'referral_bonus';

    if v_count < 5 then
      update public.profiles
      set balance = balance + 50
      where id = v_profile.referred_by_user_id
      returning balance into v_balance;

      insert into public.wallet_transactions (user_id, amount, reason, balance_after)
      values (v_profile.referred_by_user_id, 50, 'referral_bonus', v_balance);

      insert into public.notifications (user_id, type, title, message, link)
      values (
        v_profile.referred_by_user_id,
        'referral_joined',
        'Indicação confirmada! 🎉',
        'Você ganhou 50 pts retroativos. Indicações: ' || (v_count + 1) || '/5',
        '/perfil/indicar'
      );
    end if;
  end loop;
end $$;
