import { z } from "zod";

export const slotStatusSchema = z.enum([
  "available",
  "pending",
  "booked",
  "blocked",
]);

export const createSlotsBatchSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekDays: z.array(z.number().min(0).max(6)).min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  intervalMinutes: z.number().min(15).max(240),
});

export const updateSlotSchema = z.object({
  status: slotStatusSchema.optional(),
  client_name: z.string().max(100).nullable().optional(),
  client_contact: z.string().max(20).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export type CreateSlotsBatchInput = z.infer<typeof createSlotsBatchSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
