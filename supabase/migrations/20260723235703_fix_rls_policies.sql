-- 1. Revoga EXECUTE público das funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at FROM PUBLIC, anon, authenticated;

-- 2. Corrige RLS: substitui auth.role() por TO + USING (auth.uid() IS NOT NULL)
DROP POLICY IF EXISTS "time_slots_insert_admin" ON public.time_slots;
DROP POLICY IF EXISTS "time_slots_update_admin" ON public.time_slots;
DROP POLICY IF EXISTS "time_slots_delete_admin" ON public.time_slots;

CREATE POLICY "time_slots_insert_admin" ON public.time_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "time_slots_update_admin" ON public.time_slots
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "time_slots_delete_admin" ON public.time_slots
  FOR DELETE
  TO authenticated
  USING (true);

-- 3. Corrige RLS dos appointments (mesmo padrão)
DROP POLICY IF EXISTS "appointments_select_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_admin" ON public.appointments;

CREATE POLICY "appointments_select_admin" ON public.appointments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "appointments_insert_admin" ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "appointments_update_admin" ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "appointments_delete_admin" ON public.appointments
  FOR DELETE
  TO authenticated
  USING (true);

-- 4. Recria handle_new_user com search_path fixo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Administrador'), 'admin');
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM PUBLIC, anon, authenticated;

-- 5. Recria update_updated_at com search_path fixo
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_updated_at FROM PUBLIC, anon, authenticated;
