-- Título do evento de agenda no e-mail da administradora passa a ser
-- "Horário - <primeiro nome da cliente>", para a Caroline identificar de quem
-- é o horário direto na agenda dela. Recria a função de notificação.

create or replace function public.notify_admin_new_booking()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_key text;
  v_to text;
  v_from text := 'Delicadeza Nails <onboarding@resend.dev>';
  v_site text := 'https://delicadeza-nails.vercel.app';
  v_title text;
  v_stamp_start text; v_stamp_end text;
  v_date_br text; v_time_br text; v_details text;
  v_ics text; v_ics_b64 text; v_gcal text; v_subject text; v_html text;
  v_first text; v_cli_digits text; v_cli_wa text; v_wa_msg text; v_wa_url text;
begin
  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'RESEND_API_KEY' limit 1;
  if v_key is null then return new; end if;

  select coalesce(nullif(trim(admin_email), ''), 'carolinebizarri1@gmail.com')
    into v_to from public.studio_config limit 1;
  v_to := coalesce(v_to, 'carolinebizarri1@gmail.com');

  v_first := split_part(coalesce(new.client_name,''), ' ', 1);
  v_title := 'Horário - ' || coalesce(nullif(v_first, ''), 'Cliente');

  v_date_br     := to_char(new.date, 'DD/MM/YYYY');
  v_time_br     := to_char(new.start_time,'HH24:MI') || ' às ' || to_char(new.end_time,'HH24:MI');
  v_stamp_start := to_char(new.date,'YYYYMMDD') || 'T' || to_char(new.start_time,'HH24MISS');
  v_stamp_end   := to_char(new.date,'YYYYMMDD') || 'T' || to_char(new.end_time,'HH24MISS');
  v_details     := 'Reserva de ' || coalesce(new.client_name,'')
                   || ' (' || coalesce(new.client_contact,'') || ')';

  v_cli_digits := regexp_replace(coalesce(new.client_contact,''), '\D', '', 'g');
  v_cli_wa := case when length(v_cli_digits) in (10,11) then '55' || v_cli_digits else v_cli_digits end;

  v_wa_msg := 'Oi' || case when v_first <> '' then ', ' || v_first else '' end
    || '! Aqui é do Delicadeza Nails. Estou confirmando o seu horário em '
    || v_date_br || ' às ' || to_char(new.start_time,'HH24:MI') || '. '
    || 'Qual serviço você deseja fazer? Assim já deixo tudo prontinho pra você!';
  v_wa_url := 'https://wa.me/' || v_cli_wa || '?text=' || public.url_encode(v_wa_msg);

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
    || '<div style="margin:24px 0 8px">'
    ||   '<a href="' || v_wa_url || '" style="display:inline-block;background:#25D366;color:#fff;'
    ||     'text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">'
    ||     'Falar com a cliente no WhatsApp</a>'
    || '</div>'
    || '<p style="font-size:13px;color:#888;margin:0 0 20px">'
    ||   'Abre a conversa com a cliente já com a mensagem de confirmação pronta — é só enviar.</p>'
    || '<div style="margin:0 0 24px">'
    ||   '<a href="' || v_gcal || '" style="display:inline-block;background:#f2e6e8;'
    ||     'color:#b76e79;text-decoration:none;padding:9px 16px;border-radius:8px;margin-right:8px">Adicionar à agenda</a>'
    ||   '<a href="' || v_site || '/admin/reservas" style="display:inline-block;background:#f2e6e8;'
    ||     'color:#b76e79;text-decoration:none;padding:9px 16px;border-radius:8px">Ver reservas</a>'
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
