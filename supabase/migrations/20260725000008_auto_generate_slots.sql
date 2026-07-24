-- #9: geração automática de horários. Um cron semanal cria slots conforme o
-- horário de funcionamento (working_hours), pulando dias fechados e bloqueados.
-- Só preenche dias COMPLETAMENTE VAZIOS — não mistura com horários criados à
-- mão e não recria horários avulsos apagados. Para folga do dia inteiro: bloquear.

ALTER TABLE public.studio_config
  ADD COLUMN IF NOT EXISTS slot_interval_minutes integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS weeks_ahead integer NOT NULL DEFAULT 6;

-- Valores escolhidos pela dona.
UPDATE public.studio_config SET slot_interval_minutes = 90, weeks_ahead = 6;

CREATE OR REPLACE FUNCTION public.generate_weekly_slots()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  cfg public.studio_config;
  d date;
  end_date date;
  day_cfg jsonb;
  t_end time;
  cur time;
  step interval;
  created integer := 0;
  today_sp date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  dow_keys text[] := ARRAY['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
BEGIN
  SELECT * INTO cfg FROM public.studio_config LIMIT 1;
  IF NOT FOUND THEN RETURN 0; END IF;

  step := (COALESCE(cfg.slot_interval_minutes, 90) || ' minutes')::interval;
  end_date := today_sp + (COALESCE(cfg.weeks_ahead, 6) * 7);

  d := today_sp;
  WHILE d <= end_date LOOP
    -- Dia bloqueado nas configurações: pula.
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(cfg.blocked_days) b WHERE (b->>'date')::date = d
    ) THEN
      d := d + 1; CONTINUE;
    END IF;

    -- Respeita curadoria manual: se o dia já tem QUALQUER horário, não mexe.
    IF EXISTS (SELECT 1 FROM public.time_slots WHERE date = d) THEN
      d := d + 1; CONTINUE;
    END IF;

    day_cfg := cfg.working_hours -> dow_keys[extract(dow from d)::int + 1];

    IF day_cfg IS NOT NULL AND (day_cfg->>'open')::boolean THEN
      t_end := (day_cfg->>'end')::time;
      cur := (day_cfg->>'start')::time;
      WHILE cur + step <= t_end LOOP
        INSERT INTO public.time_slots (date, start_time, end_time, status)
        VALUES (d, cur, cur + step, 'available')
        ON CONFLICT (date, start_time) DO NOTHING;
        IF FOUND THEN created := created + 1; END IF;
        cur := cur + step;
      END LOOP;
    END IF;

    d := d + 1;
  END LOOP;

  RETURN created;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_weekly_slots FROM PUBLIC, anon, authenticated;

-- Popula agora (só dias vazios) e agenda semanalmente: segundas 06:00 UTC
-- (= 03:00 America/Sao_Paulo). cron.schedule faz upsert pelo nome do job.
SELECT public.generate_weekly_slots();
SELECT cron.schedule(
  'generate-weekly-slots',
  '0 6 * * 1',
  $$SELECT public.generate_weekly_slots();$$
);
