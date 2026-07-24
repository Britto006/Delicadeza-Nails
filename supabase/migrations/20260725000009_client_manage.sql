-- #11: área da cliente sem login. Cada reserva ganha um manage_token (uuid
-- impossível de adivinhar). Com ele, a cliente vê/cancela/remarca sozinha por
-- um link — sem conta, sem expor PII de outras reservas.

ALTER TABLE public.time_slots ADD COLUMN IF NOT EXISTS manage_token uuid;

-- book_slot passa a gerar e RETORNAR o token (muda o tipo de retorno → DROP+CREATE).
DROP FUNCTION IF EXISTS public.book_slot(uuid, text, text);
CREATE FUNCTION public.book_slot(
  p_slot_id uuid,
  p_client_name text,
  p_client_contact text
)
RETURNS TABLE (slot_date date, slot_start time, slot_end time, manage_token uuid)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_token uuid := gen_random_uuid();
BEGIN
  IF p_client_name IS NULL
     OR length(trim(p_client_name)) < 2
     OR length(trim(p_client_name)) > 100 THEN
    RAISE EXCEPTION 'INVALID_INPUT';
  END IF;

  IF p_client_contact IS NULL
     OR length(regexp_replace(p_client_contact, '\D', '', 'g')) < 10
     OR length(regexp_replace(p_client_contact, '\D', '', 'g')) > 13 THEN
    RAISE EXCEPTION 'INVALID_INPUT';
  END IF;

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
         client_contact = trim(p_client_contact),
         manage_token = v_token
   WHERE id = p_slot_id
     AND status = 'available'
     AND (date > (now() AT TIME ZONE 'America/Sao_Paulo')::date
          OR (date = (now() AT TIME ZONE 'America/Sao_Paulo')::date
              AND start_time > (now() AT TIME ZONE 'America/Sao_Paulo')::time))
  RETURNING date, start_time, end_time, manage_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SLOT_UNAVAILABLE';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.book_slot FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_slot TO anon, authenticated;

-- Consulta a reserva pelo token (só a própria linha; nome da própria cliente ok).
CREATE OR REPLACE FUNCTION public.get_booking_by_token(p_token uuid)
RETURNS TABLE (slot_date date, slot_start time, slot_end time, slot_status public.slot_status, client_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT date, start_time, end_time, status, client_name
  FROM public.time_slots
  WHERE manage_token = p_token
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_booking_by_token FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_by_token TO anon, authenticated;

-- Cancela a reserva pelo token: libera o horário e limpa PII + token.
CREATE OR REPLACE FUNCTION public.cancel_booking_by_token(p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.time_slots
     SET status = 'available',
         client_name = null,
         client_contact = null,
         manage_token = null
   WHERE manage_token = p_token
     AND status IN ('pending', 'booked');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_booking_by_token FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking_by_token TO anon, authenticated;

-- Expiração de pendências também limpa o token.
CREATE OR REPLACE FUNCTION public.release_expired_pending()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
declare
  affected integer;
begin
  update public.time_slots
     set status = 'available',
         client_name = null,
         client_contact = null,
         manage_token = null
   where status = 'pending'
     and updated_at < now() - interval '24 hours';
  get diagnostics affected = row_count;
  return affected;
end;
$$;

REVOKE EXECUTE ON FUNCTION public.release_expired_pending FROM PUBLIC, anon, authenticated;
