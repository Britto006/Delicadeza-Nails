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
});

export type StudioConfigInput = z.infer<typeof studioConfigSchema>;
