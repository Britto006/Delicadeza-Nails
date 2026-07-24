-- Bloqueia leitura de dados pessoais (client_name, client_contact, notes) pelo
-- público: anon passa a enxergar apenas as colunas necessárias ao calendário.
-- O front público deve selecionar colunas explícitas (select("*") deixa de
-- funcionar para anon — comportamento intencional).
REVOKE SELECT ON public.time_slots FROM anon;
GRANT SELECT (id, date, start_time, end_time, status) ON public.time_slots TO anon;

-- Recria a policy de SELECT apenas para anon (linhas todas visíveis; a
-- restrição de PII é feita pelo grant de colunas acima). Para authenticated,
-- a leitura passa a exigir role admin — policy na migration seguinte —
-- senão um usuário comum logado leria as colunas de PII.
DROP POLICY IF EXISTS "time_slots_select_public" ON public.time_slots;

CREATE POLICY "time_slots_select_public" ON public.time_slots
  FOR SELECT
  TO anon
  USING (true);
