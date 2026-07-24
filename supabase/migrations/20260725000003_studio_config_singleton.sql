-- Garante que studio_config sempre tenha exatamente uma linha.
-- (O saveConfig atualizava id=1 fixo; com a tabela vazia, o update afetava
-- 0 linhas e "salvava" silenciosamente nada.)
INSERT INTO public.studio_config (working_hours, blocked_days)
SELECT '{}'::jsonb, '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.studio_config);

CREATE UNIQUE INDEX IF NOT EXISTS studio_config_singleton
  ON public.studio_config ((true));
