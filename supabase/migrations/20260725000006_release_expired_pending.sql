-- Libera reservas "pending" não confirmadas após 24h. Sem isto, uma cliente
-- que reserva pelo site mas nunca confirma no WhatsApp deixa o horário preso
-- indefinidamente (invisível para outras clientes e nunca confirmado).
-- updated_at é setado no momento da reserva pelo trigger set_updated_at_time_slots.

create extension if not exists pg_cron;

-- Janela de expiração num só lugar: troque '24 hours' para ajustar (ex.: '6 hours').
create or replace function public.release_expired_pending()
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  affected integer;
begin
  update public.time_slots
     set status = 'available',
         client_name = null,
         client_contact = null
   where status = 'pending'
     and updated_at < now() - interval '24 hours';
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Só o cron (postgres) executa; nunca anon/authenticated.
revoke execute on function public.release_expired_pending from public, anon, authenticated;

-- cron.schedule faz upsert pelo nome do job: re-rodar a migration não duplica.
select cron.schedule(
  'release-expired-pending',
  '*/30 * * * *',
  $$select public.release_expired_pending();$$
);
