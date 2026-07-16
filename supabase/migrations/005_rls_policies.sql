-- Habilitar RLS
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Time slots: público pode SELECT, apenas admin autenticated pode INSERT/UPDATE/DELETE
CREATE POLICY "time_slots_select_public"
  ON public.time_slots FOR SELECT
  USING (true);

CREATE POLICY "time_slots_insert_admin"
  ON public.time_slots FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "time_slots_update_admin"
  ON public.time_slots FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "time_slots_delete_admin"
  ON public.time_slots FOR DELETE
  USING (auth.role() = 'authenticated');

-- Appointments: apenas admin autenticated
CREATE POLICY "appointments_select_admin"
  ON public.appointments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "appointments_insert_admin"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "appointments_update_admin"
  ON public.appointments FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "appointments_delete_admin"
  ON public.appointments FOR DELETE
  USING (auth.role() = 'authenticated');
