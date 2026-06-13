import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Formato de email inválido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
  tenantId: z.string().uuid().optional(),
  accessChannel: z.enum(["WEB", "MOBILE", "DESKTOP", "API"]).default("WEB"),
  deviceName: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(), // Puede ser enviado en body o leido de cookie
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
