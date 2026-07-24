-- 1. Helper: verifica se o usuário autenticado tem role 'admin' em profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- 2. Escrita em time_slots exige role admin (não basta estar autenticado).
DROP POLICY IF EXISTS "time_slots_insert_admin" ON public.time_slots;
DROP POLICY IF EXISTS "time_slots_update_admin" ON public.time_slots;
DROP POLICY IF EXISTS "time_slots_delete_admin" ON public.time_slots;

CREATE POLICY "time_slots_insert_admin" ON public.time_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "time_slots_update_admin" ON public.time_slots
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "time_slots_delete_admin" ON public.time_slots
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 3. Mesmo padrão para appointments.
DROP POLICY IF EXISTS "appointments_select_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_admin" ON public.appointments;

CREATE POLICY "appointments_select_admin" ON public.appointments
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "appointments_insert_admin" ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "appointments_update_admin" ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "appointments_delete_admin" ON public.appointments
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 4. studio_config: alinha ao padrão TO authenticated + is_admin()
--    (SELECT continua público — o calendário consome blocked_days).
DROP POLICY IF EXISTS "studio_config_insert_admin" ON public.studio_config;
DROP POLICY IF EXISTS "studio_config_update_admin" ON public.studio_config;
DROP POLICY IF EXISTS "studio_config_delete_admin" ON public.studio_config;

CREATE POLICY "studio_config_insert_admin" ON public.studio_config
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "studio_config_update_admin" ON public.studio_config
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "studio_config_delete_admin" ON public.studio_config
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5. Fim do auto-admin: novo usuário do Auth nasce como 'viewer' (sem poderes).
--    Promover a admin é ação manual no banco/dashboard.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'viewer'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Novo usuário'), 'viewer');
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM PUBLIC, anon, authenticated;

-- 6. Trigger de studio_config sem search_path fixo (inconsistência da
--    migration 20260724000001).
CREATE OR REPLACE FUNCTION public.update_studio_config_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_studio_config_updated_at FROM PUBLIC, anon, authenticated;
