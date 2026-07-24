-- Endurece a RPC book_slot:
--  #5: valida FORMATO do telefone (10 a 13 dígitos) em vez de só comprimento.
--  #4: rejeita reserva em dia bloqueado (studio_config.blocked_days) — antes o
--      bloqueio só filtrava no calendário; a RPC permitia reservar via link/cache.
-- Mantém a lógica atômica de disponibilidade e o retorno sem PII.

CREATE OR REPLACE FUNCTION public.book_slot(
  p_slot_id uuid,
  p_client_name text,
  p_client_contact text
)
RETURNS TABLE (slot_date date, slot_start time, slot_end time)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Nome: 2 a 100 caracteres.
  IF p_client_name IS NULL
     OR length(trim(p_client_name)) < 2
     OR length(trim(p_client_name)) > 100 THEN
    RAISE EXCEPTION 'INVALID_INPUT';
  END IF;

  -- Telefone: 10 a 13 dígitos (DDD+número, com ou sem DDI 55).
  IF p_client_contact IS NULL
     OR length(regexp_replace(p_client_contact, '\D', '', 'g')) < 10
     OR length(regexp_replace(p_client_contact, '\D', '', 'g')) > 13 THEN
    RAISE EXCEPTION 'INVALID_INPUT';
  END IF;

  -- Dia bloqueado nas configurações não pode ser reservado.
  IF EXISTS (
    SELECT 1
    FROM public.studio_config sc,
         jsonb_array_elements(sc.blocked_days) AS b
    WHERE (b->>'date')::date = (SELECT date FROM public.time_slots WHERE id = p_slot_id)
  ) THEN
    RAISE EXCEPTION 'DAY_BLOCKED';
  END IF;

  RETURN QUERY
  UPDATE public.time_slots
     SET status = 'pending',
         client_name = trim(p_client_name),
         client_contact = trim(p_client_contact)
   WHERE id = p_slot_id
     AND status = 'available'
     AND (date > (now() AT TIME ZONE 'America/Sao_Paulo')::date
          OR (date = (now() AT TIME ZONE 'America/Sao_Paulo')::date
              AND start_time > (now() AT TIME ZONE 'America/Sao_Paulo')::time))
  RETURNING date, start_time, end_time;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SLOT_UNAVAILABLE';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.book_slot FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_slot TO anon, authenticated;
