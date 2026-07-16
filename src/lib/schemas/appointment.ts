import { z } from "zod";

export const createAppointmentSchema = z.object({
  slot_id: z.string().uuid(),
  client_name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
  client_contact: z
    .string()
    .min(8, "Telefone inválido")
    .max(20),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
