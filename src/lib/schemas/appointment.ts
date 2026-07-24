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

// Reserva pública de horário (RPC book_slot) — mesmos limites validados no banco.
export const bookSlotSchema = z.object({
  client_name: z
    .string()
    .trim()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(100, "Nome muito longo"),
  client_contact: z
    .string()
    .trim()
    .min(8, "Telefone inválido")
    .max(20, "Telefone inválido"),
});

export type BookSlotInput = z.infer<typeof bookSlotSchema>;
