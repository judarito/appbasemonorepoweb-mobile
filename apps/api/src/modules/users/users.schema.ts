import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email({ message: "Formato de email inválido." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  firstName: z.string().min(1, { message: "El nombre es requerido." }),
  lastName: z.string().min(1, { message: "El apellido es requerido." }),
  displayName: z.string().optional(),
  phone: z.string().optional(),
  locale: z.string().default("es-CO"),
  timezone: z.string().default("America/Bogota"),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  displayName: z.string().optional(),
  phone: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  status: z.enum(["ACTIVE", "LOCKED", "SUSPENDED", "DISABLED"]).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
