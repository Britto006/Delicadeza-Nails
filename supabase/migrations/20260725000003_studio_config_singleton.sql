-- Garante que studio_config sempre tenha exatamente uma linha.
-- (O saveConfig atualizava id=1 fixo; com a tabela vazia, o update afetava
-- 0 linhas e "salvava" silenciosamente nada.)
INSERT INTO public.studio_config (working_hours, blocked_days)
SELECT
  '{
    "monday":    {"open": true,  "start": "09:00", "end": "18:00"},
    "tuesday":   {"open": true,  "start": "09:00", "end": "18:00"},
    "wednesday": {"open": true,  "start": "09:00", "end": "18:00"},
    "thursday":  {"open": true,  "start": "09:00", "end": "18:00"},
    "friday":    {"open": true,  "start": "09:00", "end": "18:00"},
    "saturday":  {"open": true,  "start": "09:00", "end": "13:00"},
    "sunday":    {"open": false, "start": "09:00", "end": "13:00"}
  }'::jsonb,
  '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.studio_config);

-- Linha existente com working_hours vazio (estado antigo) ganha o default.
UPDATE public.studio_config
SET working_hours = '{
    "monday":    {"open": true,  "start": "09:00", "end": "18:00"},
    "tuesday":   {"open": true,  "start": "09:00", "end": "18:00"},
    "wednesday": {"open": true,  "start": "09:00", "end": "18:00"},
    "thursday":  {"open": true,  "start": "09:00", "end": "18:00"},
    "friday":    {"open": true,  "start": "09:00", "end": "18:00"},
    "saturday":  {"open": true,  "start": "09:00", "end": "13:00"},
    "sunday":    {"open": false, "start": "09:00", "end": "13:00"}
  }'::jsonb
WHERE working_hours = '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS studio_config_singleton
  ON public.studio_config ((true));
