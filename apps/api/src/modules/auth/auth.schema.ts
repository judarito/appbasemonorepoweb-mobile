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

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Formato de email inválido." }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "El token de recuperación es requerido." }),
  password: z.string().min(8, { message: "La nueva contraseña debe tener al menos 8 caracteres." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
