-- Corrige ambiguidade em book_slot: a coluna de SAÍDA chamava-se manage_token,
-- igual à coluna da tabela, quebrando o RETURNING ("column reference is
-- ambiguous"). Renomeia a saída para slot_token.

DROP FUNCTION IF EXISTS public.book_slot(uuid, text, text);
CREATE FUNCTION public.book_slot(
  p_slot_id uuid,
  p_client_name text,
  p_client_contact text
)
RETURNS TABLE (slot_date date, slot_start time, slot_end time, slot_token uuid)
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

NOTIFY pgrst, 'reload schema';
