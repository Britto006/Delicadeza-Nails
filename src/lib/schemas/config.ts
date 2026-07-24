import { z } from "zod";

const timeRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const dayConfigSchema = z.object({
  open: z.boolean(),
  start: z.string().regex(timeRegex, "Horário inválido"),
  end: z.string().regex(timeRegex, "Horário inválido"),
});

export const workingHoursSchema = z.record(z.string(), dayConfigSchema);

export const blockedDaySchema = z.object({
  date: z.string().regex(dateRegex, "Data inválida"),
  reason: z.string().max(200),
});

export const studioConfigSchema = z.object({
  working_hours: workingHoursSchema,
  blocked_days: z.array(blockedDaySchema),
  slot_interval_minutes: z
    .number()
    .int()
    .refine((v) => [30, 60, 90, 120].includes(v), "Duração inválida"),
  weeks_ahead: z.number().int().min(1, "Mínimo 1 semana").max(12, "Máximo 12 semanas"),
  admin_email: z.string().trim().email("E-mail inválido"),
});

export type StudioConfigInput = z.infer<typeof studioConfigSchema>;
