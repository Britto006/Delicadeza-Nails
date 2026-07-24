import { z } from "zod";

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
