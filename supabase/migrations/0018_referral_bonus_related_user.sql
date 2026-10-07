-- ═══════════════════════════════════════════════════════════════════════════
-- SuperChamps — wallet_transactions: referência ao user indicado
--
-- Pra mostrar "@nickname" no extrato quando o user recebe bônus de indicação,
-- precisamos armazenar o id do user indicado na transação.
--
-- Aplicar APÓS 0017_user_last_signin.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Nova coluna (pode ser NULL pra transações antigas/outras razões)
alter table public.wallet_transactions
  add column if not exists related_user_id uuid
    references public.profiles(id) on delete set null;

create index if not exists idx_wallet_tx_related_user
  on public.wallet_transactions(related_user_id)
  where related_user_id is not null;

-- 2. Atualiza o trigger handle_referral_bonus pra preencher related_user_id
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
  select count(*) into v_already_awarded
  from public.wallet_transactions
  where user_id = NEW.referred_by_user_id
    and reason = 'referral_bonus';

  if v_already_awarded >= 5 then
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

  update public.profiles
  set balance = balance + 50
  where id = NEW.referred_by_user_id
  returning balance into v_new_balance;

  -- Insere com related_user_id = NEW.id (o user recém-indicado)
  insert into public.wallet_transactions (
    user_id, amount, reason, balance_after, related_user_id
  )
  values (NEW.referred_by_user_id, 50, 'referral_bonus', v_new_balance, NEW.id);

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

-- 3. Backfill: pra cada transação referral_bonus antiga sem related_user_id,
--    tenta achar o user indicado pelo profiles.referred_by_user_id + timing.
update public.wallet_transactions wt
set related_user_id = sub.referred_id
from (
  select distinct on (wt2.id)
    wt2.id as wt_id,
    p.id as referred_id
  from public.wallet_transactions wt2
  join public.profiles p
    on p.referred_by_user_id = wt2.user_id
   and p.created_at <= wt2.created_at + interval '5 seconds'
   and p.created_at >= wt2.created_at - interval '5 seconds'
  where wt2.reason = 'referral_bonus'
    and wt2.related_user_id is null
  order by wt2.id, abs(extract(epoch from (p.created_at - wt2.created_at)))
) sub
where wt.id = sub.wt_id;
