-- Notifica a administradora por e-mail (via Resend) quando um horário vira
-- 'pending' (nova reserva). Dispara direto do banco, assíncrono (pg_net), e
-- NUNCA derruba a reserva (todo o corpo é protegido por exception handler).

create extension if not exists pg_net;

-- Percent-encoding (UTF-8, byte a byte) para montar o link do Google Agenda em SQL.
create or replace function public.url_encode(input text)
returns text language sql immutable set search_path = '' as $$
  select coalesce(string_agg(
    case
      when b between 48 and 57 or b between 65 and 90
        or b between 97 and 122 or b in (45,46,95,126)
      then chr(b)
      else '%' || upper(lpad(to_hex(b), 2, '0'))
    end, ''), '')
  from (
    select get_byte(convert_to(coalesce(input,''),'UTF8'), gs) as b
    from generate_series(0, length(convert_to(coalesce(input,''),'UTF8')) - 1) gs
  ) x;
$$;

create or replace function public.notify_admin_new_booking()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_key text;
  v_to text;
  v_from text := 'Delicadeza Nails <onboarding@resend.dev>';
  v_site text := 'https://delicadeza-nails.vercel.app';
  v_title text := 'Horário — Delicadeza Nails';
  v_stamp_start text; v_stamp_end text;
  v_date_br text; v_time_br text; v_details text;
  v_ics text; v_ics_b64 text; v_gcal text; v_subject text; v_html text;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'RESEND_API_KEY' limit 1;
  if v_key is null then return new; end if;

  select coalesce(nullif(trim(admin_email), ''), 'carolinebizarri1@gmail.com')
    into v_to from public.studio_config limit 1;
  v_to := coalesce(v_to, 'carolinebizarri1@gmail.com');

  v_date_br     := to_char(new.date, 'DD/MM/YYYY');
  v_time_br     := to_char(new.start_time,'HH24:MI') || ' às ' || to_char(new.end_time,'HH24:MI');
  v_stamp_start := to_char(new.date,'YYYYMMDD') || 'T' || to_char(new.start_time,'HH24MISS');
  v_stamp_end   := to_char(new.date,'YYYYMMDD') || 'T' || to_char(new.end_time,'HH24MISS');
  v_details     := 'Reserva de ' || coalesce(new.client_name,'')
                   || ' (' || coalesce(new.client_contact,'') || ')';

  v_ics := concat_ws(E'\r\n',
    'BEGIN:VCALENDAR','VERSION:2.0',
    'PRODID:-//Delicadeza Nails//Agendamento//PT-BR',
    'BEGIN:VEVENT',
    'DTSTART:' || v_stamp_start,
    'DTEND:'   || v_stamp_end,
    'SUMMARY:' || v_title,
    'DESCRIPTION:' || v_details,
    'END:VEVENT','END:VCALENDAR');
  v_ics_b64 := replace(encode(convert_to(v_ics,'UTF8'),'base64'), E'\n', '');

  v_gcal := 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    || '&text='    || public.url_encode(v_title)
    || '&dates='   || v_stamp_start || '/' || v_stamp_end
    || '&details=' || public.url_encode(v_details)
    || '&ctz=America%2FSao_Paulo';

  v_subject := 'Nova reserva: ' || coalesce(new.client_name,'Cliente')
               || ' — ' || v_date_br || ' ' || to_char(new.start_time,'HH24:MI');

  v_html :=
    '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#3a3a3a">'
    || '<h2 style="color:#b76e79;margin:0 0 12px">Nova reserva recebida</h2>'
    || '<p style="margin:0 0 16px">Uma cliente acabou de reservar um horário pelo site.</p>'
    || '<table style="border-collapse:collapse;width:100%;font-size:15px">'
    ||   '<tr><td style="padding:6px 0;color:#888">Cliente</td><td style="padding:6px 0"><b>'
    ||       coalesce(new.client_name,'—') || '</b></td></tr>'
    ||   '<tr><td style="padding:6px 0;color:#888">Contato</td><td style="padding:6px 0">'
    ||       coalesce(new.client_contact,'—') || '</td></tr>'
    ||   '<tr><td style="padding:6px 0;color:#888">Data</td><td style="padding:6px 0">'
    ||       v_date_br || '</td></tr>'
    ||   '<tr><td style="padding:6px 0;color:#888">Horário</td><td style="padding:6px 0">'
    ||       v_time_br || '</td></tr>'
    || '</table>'
    || '<div style="margin:24px 0">'
    ||   '<a href="' || v_gcal || '" style="display:inline-block;background:#b76e79;color:#fff;'
    ||     'text-decoration:none;padding:10px 18px;border-radius:8px;margin-right:8px">Adicionar à agenda</a>'
    ||   '<a href="' || v_site || '/admin/reservas" style="display:inline-block;background:#f2e6e8;'
    ||     'color:#b76e79;text-decoration:none;padding:10px 18px;border-radius:8px">Ver reservas</a>'
    || '</div>'
    || '<p style="font-size:12px;color:#aaa">Delicadeza Nails · notificação automática</p></div>';

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
                 'Authorization', 'Bearer ' || v_key,
                 'Content-Type',  'application/json'),
    body    := jsonb_build_object(
                 'from', v_from,
                 'to',   jsonb_build_array(v_to),
                 'subject', v_subject,
                 'html', v_html,
                 'attachments', jsonb_build_array(
                     jsonb_build_object('filename','reserva.ics','content', v_ics_b64)))
  );

  return new;
exception when others then
  return new;
end;
$$;

revoke execute on function public.notify_admin_new_booking() from public, anon, authenticated;

drop trigger if exists trg_notify_admin_new_booking on public.time_slots;
create trigger trg_notify_admin_new_booking
  after update on public.time_slots
  for each row
  when (new.status = 'pending' and old.status is distinct from 'pending')
  execute function public.notify_admin_new_booking();
