import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Insira um email válido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
