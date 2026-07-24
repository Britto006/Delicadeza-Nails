import { z } from "zod";
import { isValidBrPhone } from "@/lib/utils/phone";

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
    .refine(isValidBrPhone, "Telefone inválido — informe DDD + número (ex: 31999998888)"),
});

export type BookSlotInput = z.infer<typeof bookSlotSchema>;
