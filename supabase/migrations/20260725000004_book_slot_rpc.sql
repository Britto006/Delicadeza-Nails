-- Reserva pública de horário: única operação de escrita permitida a anon.
-- UPDATE condicional (status = 'available') é atômico — se duas clientes
-- tentarem o mesmo horário, apenas a primeira ganha; a outra recebe
-- SLOT_UNAVAILABLE. Retorno não inclui PII.
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
  -- Validação no banco: anon chama esta função direto pela API REST.
  IF p_client_name IS NULL OR length(trim(p_client_name)) < 2 OR length(trim(p_client_name)) > 100
     OR p_client_contact IS NULL OR length(trim(p_client_contact)) < 8 OR length(trim(p_client_contact)) > 20 THEN
    RAISE EXCEPTION 'INVALID_INPUT';
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
